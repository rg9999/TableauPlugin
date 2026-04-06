#!/usr/bin/env python3
"""
Generate Tableau .hyper extract files and a .twb workbook for 10
telemetry message types. Creates one .hyper file per table in an
output directory, plus a ready-to-open .twb workbook alongside it.

Each file has 5-10 fields with nested (dotted-path) column names,
10,000+ rows, and timestamps spaced 1-100ms apart.

Requires: pip install tableauhyperapi

Usage:
    python generate_test_data.py [output_directory]
    Default output directory: telemetry_hyper_data/

Output:
    <output_directory>/              — folder with .hyper files
    <output_directory>.twb           — Tableau workbook linking them all
"""

import os
import random
import math
import sys
import uuid
import textwrap
from datetime import datetime, timedelta

from tableauhyperapi import (
    HyperProcess, Telemetry, Connection, CreateMode,
    TableDefinition, TableName, SqlType, Inserter, Nullability
)

OUTPUT_DIR = sys.argv[1] if len(sys.argv) > 1 else "telemetry_hyper_data"
ROWS_PER_TABLE = 10_000
BASE_TIME = datetime(2026, 4, 3, 14, 30, 0)
SEED = 42
SCHEMA_NAME = "Extract"

# ─── Message type definitions ────────────────────────────────────────
# Each message type defines its fields with dotted-path names and a
# generator function that produces realistic values.

def gps_position(rng, t):
    lat_base = 32.7 + 0.001 * math.sin(t * 0.01)
    lon_base = -117.2 + 0.001 * math.cos(t * 0.01)
    return {
        "navigation.gps.position.latitude": round(lat_base + rng.gauss(0, 0.0001), 7),
        "navigation.gps.position.longitude": round(lon_base + rng.gauss(0, 0.0001), 7),
        "navigation.gps.position.altitude_msl": round(3000 + 200 * math.sin(t * 0.005) + rng.gauss(0, 5), 2),
        "navigation.gps.position.altitude_agl": round(2800 + 200 * math.sin(t * 0.005) + rng.gauss(0, 5), 2),
        "navigation.gps.position.hdop": round(0.8 + rng.random() * 2.0, 2),
        "navigation.gps.position.num_satellites": rng.randint(6, 16),
        "navigation.gps.position.fix_type": rng.choice(["3D", "3D", "3D", "DGPS", "RTK"]),
        "navigation.gps.position.ground_speed_knots": round(250 + rng.gauss(0, 10), 1),
    }

def ins_attitude(rng, t):
    return {
        "navigation.ins.attitude.roll": round(rng.gauss(0, 5), 3),
        "navigation.ins.attitude.pitch": round(2.0 + rng.gauss(0, 1.5), 3),
        "navigation.ins.attitude.yaw": round(45 + 5 * math.sin(t * 0.002) + rng.gauss(0, 0.5), 3),
        "navigation.ins.attitude.heading_true": round((90 + 10 * math.sin(t * 0.002)) % 360, 2),
        "navigation.ins.attitude.heading_magnetic": round((87 + 10 * math.sin(t * 0.002)) % 360, 2),
        "navigation.ins.attitude.vertical_speed_fpm": round(rng.gauss(0, 200), 1),
    }

def baro_altitude(rng, t):
    return {
        "navigation.baro.pressure.altitude_ft": round(3050 + 200 * math.sin(t * 0.005) + rng.gauss(0, 10), 1),
        "navigation.baro.pressure.qnh_hpa": round(1013.25 + rng.gauss(0, 0.5), 2),
        "navigation.baro.pressure.qfe_hpa": round(1010.0 + rng.gauss(0, 0.5), 2),
        "navigation.baro.pressure.vertical_rate_fpm": round(rng.gauss(0, 150), 1),
        "navigation.baro.pressure.static_temp_c": round(-15 + rng.gauss(0, 2), 1),
    }

def flight_control_surfaces(rng, t):
    return {
        "flightcontrol.surfaces.aileron.left_deg": round(rng.gauss(0, 3), 2),
        "flightcontrol.surfaces.aileron.right_deg": round(rng.gauss(0, 3), 2),
        "flightcontrol.surfaces.elevator.position_deg": round(rng.gauss(-1, 2), 2),
        "flightcontrol.surfaces.rudder.position_deg": round(rng.gauss(0, 1.5), 2),
        "flightcontrol.surfaces.flaps.position_pct": rng.choice([0, 0, 0, 10, 20, 30]),
        "flightcontrol.surfaces.spoilers.deployed": rng.choice([0, 0, 0, 0, 1]),
        "flightcontrol.surfaces.trim.elevator_deg": round(rng.gauss(-0.5, 0.3), 2),
    }

def flight_control_mode(rng, t):
    return {
        "flightcontrol.mode.autopilot.engaged": rng.choice([1, 1, 1, 1, 0]),
        "flightcontrol.mode.autopilot.mode_name": rng.choice(["LNAV", "VNAV", "HDG_SEL", "ALT_HOLD", "APP"]),
        "flightcontrol.mode.flight_phase": rng.choice(["CRUISE", "CRUISE", "CRUISE", "CLIMB", "DESCENT"]),
        "flightcontrol.mode.control_law": rng.choice(["NORMAL", "NORMAL", "NORMAL", "ALTERNATE"]),
        "flightcontrol.mode.stick_priority": rng.choice(["NONE", "NONE", "NONE", "LEFT", "RIGHT"]),
    }

def radar_track(rng, t):
    n_targets = rng.randint(0, 5)
    return {
        "sensors.radar.track.target_count": n_targets,
        "sensors.radar.track.primary.range_nm": round(rng.uniform(5, 80), 1) if n_targets > 0 else None,
        "sensors.radar.track.primary.azimuth_deg": round(rng.uniform(-60, 60), 1) if n_targets > 0 else None,
        "sensors.radar.track.primary.elevation_deg": round(rng.uniform(-10, 30), 1) if n_targets > 0 else None,
        "sensors.radar.track.primary.velocity_kts": round(rng.uniform(100, 600), 0) if n_targets > 0 else None,
        "sensors.radar.track.primary.rcs_dbsm": round(rng.uniform(-10, 20), 1) if n_targets > 0 else None,
        "sensors.radar.track.primary.quality": rng.randint(1, 9) if n_targets > 0 else None,
        "sensors.radar.track.scan_mode": rng.choice(["RWS", "TWS", "ACM"]),
    }

def eo_sensor(rng, t):
    return {
        "sensors.eo.camera.fov_horizontal_deg": round(rng.uniform(5, 40), 1),
        "sensors.eo.camera.fov_vertical_deg": round(rng.uniform(3, 30), 1),
        "sensors.eo.camera.zoom_level": round(rng.uniform(1, 20), 1),
        "sensors.eo.gimbal.pan_deg": round(rng.uniform(-180, 180), 1),
        "sensors.eo.gimbal.tilt_deg": round(rng.uniform(-90, 20), 1),
        "sensors.eo.status.mode": rng.choice(["VISIBLE", "IR", "DUAL"]),
        "sensors.eo.status.tracking": rng.choice(["TRACKING", "SEARCHING", "IDLE"]),
        "sensors.eo.status.lock_on": rng.choice([0, 0, 1]),
    }

def comms_radio(rng, t):
    return {
        "communications.radio.vhf.frequency_mhz": round(rng.uniform(118.0, 136.975), 3),
        "communications.radio.vhf.channel": rng.randint(1, 16),
        "communications.radio.vhf.mode": rng.choice(["AM", "FM"]),
        "communications.radio.vhf.squelch_level": rng.randint(0, 9),
        "communications.radio.vhf.signal_strength_dbm": round(-120 + rng.random() * 80, 1),
        "communications.radio.uhf.frequency_mhz": round(rng.uniform(225.0, 399.975), 3),
    }

def power_system(rng, t):
    return {
        "power.generator.primary.voltage_v": round(28 + rng.gauss(0, 0.3), 2),
        "power.generator.primary.current_a": round(rng.uniform(20, 80), 1),
        "power.generator.primary.frequency_hz": round(400 + rng.gauss(0, 2), 1),
        "power.generator.primary.load_pct": round(rng.uniform(30, 85), 1),
        "power.generator.primary.temp_c": round(60 + rng.gauss(0, 5), 1),
        "power.battery.main.voltage_v": round(24 + rng.gauss(0, 0.5), 2),
        "power.battery.main.soc_pct": round(max(10, min(100, 85 - t * 0.001 + rng.gauss(0, 2))), 1),
        "power.battery.main.temp_c": round(25 + rng.gauss(0, 3), 1),
        "power.battery.main.health": rng.choice(["GOOD", "GOOD", "GOOD", "DEGRADED"]),
    }

def system_log(rng, t):
    sources = ["FCS", "NAV", "COMM", "PWR", "SENSOR", "DATALINK", "MISSION"]
    severities = ["INFO", "INFO", "INFO", "INFO", "WARN", "WARN", "ERR"]
    messages = [
        "System nominal",
        "Actuator rate limit exceeded",
        "Sensor calibration complete",
        "Link quality degraded",
        "Battery low warning",
        "GPS fix acquired",
        "Heading reference updated",
        "Filter convergence achieved",
        "Redundancy switchover",
        "BIT check passed",
    ]
    return {
        "systemlog.event.severity": rng.choice(severities),
        "systemlog.event.source": rng.choice(sources),
        "systemlog.event.message": rng.choice(messages),
        "systemlog.event.code": rng.randint(1000, 9999),
        "systemlog.event.subsystem_id": rng.randint(1, 20),
    }


MESSAGE_TYPES = {
    "navigation_gps_position": gps_position,
    "navigation_ins_attitude": ins_attitude,
    "navigation_baro_pressure": baro_altitude,
    "flightcontrol_surfaces": flight_control_surfaces,
    "flightcontrol_mode": flight_control_mode,
    "sensors_radar_track": radar_track,
    "sensors_eo": eo_sensor,
    "communications_radio": comms_radio,
    "power_system": power_system,
    "system_log": system_log,
}


def hyper_type_for_value(val):
    """Map a Python sample value to a Hyper SqlType."""
    if isinstance(val, int):
        return SqlType.big_int()
    elif isinstance(val, float):
        return SqlType.double()
    else:
        return SqlType.text()


def create_hyper_table(hyper_conn, table_name: str, generator, rng: random.Random):
    """Create a Hyper table and populate it with ROWS_PER_TABLE rows."""
    # Generate one sample row to discover columns and types
    sample = generator(rng, 0)
    fields = list(sample.keys())

    # Build column definitions: timestamp + messageType + data fields
    columns = [
        TableDefinition.Column("timestamp", SqlType.text(), Nullability.NOT_NULLABLE),
        TableDefinition.Column("messageType", SqlType.text(), Nullability.NOT_NULLABLE),
    ]
    for field in fields:
        val = sample[field]
        nullability = Nullability.NULLABLE  # allow NULLs for all data fields
        columns.append(TableDefinition.Column(field, hyper_type_for_value(val), nullability))

    table_def = TableDefinition(
        table_name=TableName(SCHEMA_NAME, table_name),
        columns=columns
    )
    hyper_conn.catalog.create_table(table_def)

    # Generate rows with 1-100ms intervals
    current_time = BASE_TIME
    message_type = table_name.replace("_", ".")

    with Inserter(hyper_conn, table_def) as inserter:
        batch = []
        for i in range(ROWS_PER_TABLE):
            interval_ms = rng.randint(1, 100)
            current_time += timedelta(milliseconds=interval_ms)
            timestamp = current_time.isoformat(timespec="milliseconds") + "Z"

            row_data = generator(rng, i)
            row = [timestamp, message_type]
            for field in fields:
                val = row_data[field]
                if isinstance(val, bool):
                    val = int(val)
                row.append(val)
            batch.append(row)

            # Insert in batches of 5000
            if len(batch) >= 5000:
                inserter.add_rows(batch)
                batch = []

        if batch:
            inserter.add_rows(batch)
        inserter.execute()

    return len(columns)


# ─── Pretty caption helper ───────────────────────────────────────────

CAPTIONS = {
    "navigation_gps_position": "Navigation GPS Position",
    "navigation_ins_attitude": "Navigation INS Attitude",
    "navigation_baro_pressure": "Navigation Barometric Pressure",
    "flightcontrol_surfaces": "Flight Control Surfaces",
    "flightcontrol_mode": "Flight Control Mode",
    "sensors_radar_track": "Sensors Radar Track",
    "sensors_eo": "Sensors EO",
    "communications_radio": "Communications Radio",
    "power_system": "Power System",
    "system_log": "System Log",
}


# ─── TWB workbook generation ────────────────────────────────────────

def _uid():
    """Return a short hex string for Tableau internal IDs."""
    return uuid.uuid4().hex[:28]


def _twb_type_info(val):
    """Return (remote-type, local-type, aggregation, extra_xml) for a value."""
    if isinstance(val, int):
        return ("20", "integer", "Sum", "")
    elif isinstance(val, float):
        return ("5", "real", "Sum", "")
    else:
        return ("129", "string", "Count",
                "\n            <collation flag='0' name='binary' />")


def _build_datasource_xml(table_name, generator, hyper_dir_name):
    """Build the <datasource> XML block for one table."""
    caption = CAPTIONS.get(table_name, table_name)
    ds_id = f"federated.{_uid()}"
    conn_id = f"hyper.{_uid()}"
    rel_path = f"{hyper_dir_name}/{table_name}.hyper"

    sample = generator(random.Random(0), 0)
    fields = list(sample.keys())

    # metadata records
    all_cols = [("timestamp", "TEXT"), ("messageType", "TEXT")] + \
               [(f, type(sample[f]).__name__) for f in fields]

    meta_records = []
    for ordinal, (col_name, _) in enumerate(all_cols):
        # Determine type info from actual sample value
        if col_name == "timestamp":
            rt, lt, agg, extra = "129", "string", "Count", \
                "\n            <collation flag='0' name='binary' />"
            null = "false"
        elif col_name == "messageType":
            rt, lt, agg, extra = "129", "string", "Count", \
                "\n            <collation flag='0' name='binary' />"
            null = "false"
        else:
            val = sample[col_name]
            if val is None:
                # Check if any non-None value exists by trying a second sample
                rt, lt, agg, extra = "5", "real", "Sum", ""
            else:
                rt, lt, agg, extra = _twb_type_info(val)
            null = "true"

        meta_records.append(f"""          <metadata-record class='column'>
            <remote-name>{col_name}</remote-name>
            <remote-type>{rt}</remote-type>
            <local-name>[{col_name}]</local-name>
            <parent-name>[{table_name}]</parent-name>
            <remote-alias>{col_name}</remote-alias>
            <ordinal>{ordinal}</ordinal>
            <local-type>{lt}</local-type>
            <aggregation>{agg}</aggregation>
            <contains-null>{null}</contains-null>{extra}
          </metadata-record>""")

    meta_xml = "\n".join(meta_records)

    return f"""    <datasource caption='{caption}' inline='true' name='{ds_id}' version='18.1'>
      <connection class='federated'>
        <named-connections>
          <named-connection caption='{table_name}' name='{conn_id}'>
            <connection authentication='auth-none' author-locale='en_GB' class='hyper' dbname='{rel_path}' default-settings='yes' server='' sslmode='' username='tableau_internal_user' />
          </named-connection>
        </named-connections>
        <relation connection='{conn_id}' name='{table_name}' table='[{SCHEMA_NAME}].[{table_name}]' type='table' />
        <metadata-records>
{meta_xml}
        </metadata-records>
      </connection>
    </datasource>"""


def generate_twb(output_dir, twb_path):
    """Generate a .twb workbook with data sources and worksheets.

    The extension should be added manually in Tableau via:
    New Dashboard → drag Extension object → select manifest.trex
    """
    hyper_dir_name = os.path.basename(output_dir)

    # Track datasource IDs so worksheets can reference them
    ds_entries = []  # list of (ds_id, table_name, caption, generator)
    for table_name, generator in MESSAGE_TYPES.items():
        ds_id = f"federated.{_uid()}"
        caption = CAPTIONS.get(table_name, table_name)
        ds_entries.append((ds_id, table_name, caption, generator))

    # ── Build datasource XML blocks ──
    datasources_xml = []
    for ds_id, table_name, caption, generator in ds_entries:
        conn_id = f"hyper.{_uid()}"
        rel_path = f"{hyper_dir_name}/{table_name}.hyper"
        sample = generator(random.Random(0), 0)
        fields = list(sample.keys())

        all_cols = [("timestamp", "TEXT"), ("messageType", "TEXT")] + \
                   [(f, type(sample[f]).__name__) for f in fields]

        meta_records = []
        for ordinal, (col_name, _) in enumerate(all_cols):
            if col_name in ("timestamp", "messageType"):
                rt, lt, agg, extra = "129", "string", "Count", \
                    "\n            <collation flag='0' name='binary' />"
                null = "false"
            else:
                val = sample[col_name]
                if val is None:
                    rt, lt, agg, extra = "5", "real", "Sum", ""
                else:
                    rt, lt, agg, extra = _twb_type_info(val)
                null = "true"

            meta_records.append(f"""          <metadata-record class='column'>
            <remote-name>{col_name}</remote-name>
            <remote-type>{rt}</remote-type>
            <local-name>[{col_name}]</local-name>
            <parent-name>[{table_name}]</parent-name>
            <remote-alias>{col_name}</remote-alias>
            <ordinal>{ordinal}</ordinal>
            <local-type>{lt}</local-type>
            <aggregation>{agg}</aggregation>
            <contains-null>{null}</contains-null>{extra}
          </metadata-record>""")

        meta_xml = "\n".join(meta_records)

        datasources_xml.append(f"""    <datasource caption='{caption}' inline='true' name='{ds_id}' version='18.1'>
      <connection class='federated'>
        <named-connections>
          <named-connection caption='{table_name}' name='{conn_id}'>
            <connection authentication='auth-none' author-locale='en_GB' class='hyper' dbname='{rel_path}' default-settings='yes' server='' sslmode='' username='tableau_internal_user' />
          </named-connection>
        </named-connections>
        <relation connection='{conn_id}' name='{table_name}' table='[{SCHEMA_NAME}].[{table_name}]' type='table' />
        <metadata-records>
{meta_xml}
        </metadata-records>
      </connection>
    </datasource>""")

    ds_xml = "\n".join(datasources_xml)

    # ── Build one worksheet per data source ──
    worksheets_xml = []
    worksheet_windows_xml = []

    for idx, (ds_id, table_name, caption, generator) in enumerate(ds_entries):
        sheet_name = caption
        ws_uuid = f"{{0000000{idx+1:01x}-0000-0000-0000-000000000001}}"
        win_uuid = f"{{0000000{idx+1:01x}-0000-0000-0000-000000000002}}"

        # Get all columns for this message type so we can add them
        # to datasource-dependencies and the Detail (LOD) mark.
        sample = generator(random.Random(0), 0)
        data_fields = list(sample.keys())

        # Build <column> elements for datasource-dependencies
        # Include timestamp, messageType, and all data fields
        dep_columns = []
        dep_columns.append("            <column datatype='string' name='[timestamp]' role='dimension' type='nominal' />")
        dep_columns.append("            <column datatype='string' name='[messageType]' role='dimension' type='nominal' />")
        for f in data_fields:
            val = sample[f]
            if isinstance(val, int):
                dt, role, tp = "integer", "measure", "quantitative"
            elif isinstance(val, float):
                dt, role, tp = "real", "measure", "quantitative"
            else:
                dt, role, tp = "string", "dimension", "nominal"
            dep_columns.append(f"            <column datatype='{dt}' name='[{f}]' role='{role}' type='{tp}' />")
        dep_xml = "\n".join(dep_columns)

        # Build <lod> encodings to place all data fields on the Detail mark.
        # This forces Tableau to load ALL columns, not just those on rows/cols.
        lod_entries = []
        lod_entries.append(f"              <lod column='[{ds_id}].[messageType]' />")
        for f in data_fields:
            lod_entries.append(f"              <lod column='[{ds_id}].[{f}]' />")
        lod_xml = "\n".join(lod_entries)

        worksheets_xml.append(f"""    <worksheet name='{sheet_name}'>
      <table>
        <view>
          <datasources>
            <datasource caption='{caption}' name='{ds_id}' />
          </datasources>
          <datasource-dependencies datasource='{ds_id}'>
{dep_xml}
          </datasource-dependencies>
          <aggregation value='false' />
        </view>
        <style />
        <panes>
          <pane selection-relaxation-option='selection-relaxation-allow'>
            <view>
              <breakdown value='auto' />
            </view>
            <mark class='Automatic' />
            <encodings>
{lod_xml}
            </encodings>
          </pane>
        </panes>
        <rows>[{ds_id}].[timestamp]</rows>
        <cols />
      </table>
      <simple-id uuid='{ws_uuid}' />
    </worksheet>""")

        maximized = " maximized='true'" if idx == 0 else ""
        worksheet_windows_xml.append(f"""    <window class='worksheet'{maximized} name='{sheet_name}'>
      <cards>
        <edge name='left'>
          <strip size='160'>
            <card type='pages' />
            <card type='filters' />
            <card type='marks' />
          </strip>
        </edge>
        <edge name='top'>
          <strip size='2147483647'>
            <card type='columns' />
          </strip>
          <strip size='2147483647'>
            <card type='rows' />
          </strip>
          <strip size='31'>
            <card type='title' />
          </strip>
        </edge>
      </cards>
      <simple-id uuid='{win_uuid}' />
    </window>""")

    ws_xml = "\n".join(worksheets_xml)
    ws_win_xml = "\n".join(worksheet_windows_xml)

    # ── Assemble the full workbook ──
    twb_content = f"""<?xml version='1.0' encoding='utf-8' ?>

<!-- build 20261.26.0226.1626                               -->
<workbook original-version='18.1' source-build='2026.1.0 (20261.26.0226.1626)' source-platform='win' version='18.1' xmlns:user='http://www.tableausoftware.com/xml/user'>
  <document-format-change-manifest>
    <AnimationOnByDefault />
    <MarkAnimation />
    <SheetIdentifierTracking />
    <WindowsPersistSimpleIdentifiers />
  </document-format-change-manifest>
  <preferences>
    <preference name='ui.encoding.shelf.height' value='24' />
    <preference name='ui.shelf.height' value='26' />
  </preferences>
  <datasources>
{ds_xml}
  </datasources>
  <worksheets>
{ws_xml}
  </worksheets>
  <windows>
{ws_win_xml}
  </windows>
</workbook>
"""

    with open(twb_path, "w", encoding="utf-8") as f:
        f.write(twb_content)


# ─── Main ────────────────────────────────────────────────────────────

def main():
    rng = random.Random(SEED)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Output directory: {OUTPUT_DIR}/")
    print(f"  Files to create: {len(MESSAGE_TYPES)} .hyper + 1 .twb")
    print(f"  Rows per file: {ROWS_PER_TABLE:,}")
    print()

    grand_total = 0
    total_size = 0

    with HyperProcess(telemetry=Telemetry.DO_NOT_SEND_USAGE_DATA_TO_TABLEAU) as hyper:
        for table_name, generator in MESSAGE_TYPES.items():
            file_path = os.path.join(OUTPUT_DIR, f"{table_name}.hyper")

            with Connection(
                endpoint=hyper.endpoint,
                database=file_path,
                create_mode=CreateMode.CREATE_AND_REPLACE
            ) as conn:

                conn.catalog.create_schema_if_not_exists(SCHEMA_NAME)
                col_count = create_hyper_table(conn, table_name, generator, rng)
                grand_total += ROWS_PER_TABLE

                # Query time range for summary
                tbl = TableName(SCHEMA_NAME, table_name)
                t_min = conn.execute_scalar_query(
                    f'SELECT MIN("timestamp") FROM {tbl}')
                t_max = conn.execute_scalar_query(
                    f'SELECT MAX("timestamp") FROM {tbl}')

            file_size = os.path.getsize(file_path)
            total_size += file_size
            size_kb = file_size / 1024

            print(f"  {table_name}.hyper: {col_count} columns, {ROWS_PER_TABLE:,} rows ({size_kb:.0f} KB)")
            print(f"    Time range: {t_min} → {t_max}")

    # Generate .twb workbook next to the output directory
    twb_path = OUTPUT_DIR.rstrip("/\\") + ".twb"
    generate_twb(OUTPUT_DIR, twb_path)

    total_size_mb = total_size / (1024 * 1024)
    print()
    print(f"Created {len(MESSAGE_TYPES)} .hyper files in {OUTPUT_DIR}/")
    print(f"Created workbook: {twb_path}")
    print(f"Total rows: {grand_total:,}")
    print(f"Total size: {total_size_mb:.1f} MB")


if __name__ == "__main__":
    main()
