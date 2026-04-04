#!/usr/bin/env python3
"""
Generate a SQLite database with 10 telemetry message tables.
Each table has 5-10 fields with nested (dotted-path) column names,
10,000+ rows, and timestamps spaced 1-100ms apart.

Usage:
    python generate_test_data.py [output_path]
    Default output: telemetry_test_data.sqlite
"""

import sqlite3
import random
import math
import sys
from datetime import datetime, timedelta

OUTPUT_PATH = sys.argv[1] if len(sys.argv) > 1 else "telemetry_test_data.sqlite"
ROWS_PER_TABLE = 10_000
BASE_TIME = datetime(2026, 4, 3, 14, 30, 0)
SEED = 42

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


def sanitize_col_name(name: str) -> str:
    """SQLite column names: replace dots with underscores, wrap in quotes."""
    return f'"{name}"'


def create_table(conn: sqlite3.Connection, table_name: str, generator, rng: random.Random):
    """Create a table and populate it with ROWS_PER_TABLE rows."""
    # Generate one sample row to discover columns
    sample = generator(rng, 0)
    fields = list(sample.keys())

    # Determine SQL types
    def sql_type(val):
        if isinstance(val, int):
            return "INTEGER"
        if isinstance(val, float):
            return "REAL"
        return "TEXT"

    col_defs = ['"timestamp" TEXT NOT NULL', '"messageType" TEXT NOT NULL']
    for field in fields:
        col_defs.append(f'{sanitize_col_name(field)} {sql_type(sample[field])}')

    col_defs_str = ",\n  ".join(col_defs)
    create_sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n  {col_defs_str}\n)'
    conn.execute(create_sql)

    # Build insert SQL
    all_cols = ["timestamp", "messageType"] + fields
    placeholders = ", ".join(["?"] * len(all_cols))
    col_names = ", ".join(sanitize_col_name(c) for c in all_cols)
    insert_sql = f'INSERT INTO "{table_name}" ({col_names}) VALUES ({placeholders})'

    # Generate rows with 1-100ms intervals
    current_time = BASE_TIME
    batch = []
    message_type = table_name.replace("_", ".")

    for i in range(ROWS_PER_TABLE):
        interval_ms = rng.randint(1, 100)
        current_time += timedelta(milliseconds=interval_ms)
        timestamp = current_time.isoformat(timespec="milliseconds") + "Z"

        row_data = generator(rng, i)
        values = [timestamp, message_type]
        for field in fields:
            val = row_data[field]
            # Convert None → None (SQL NULL), bool → int
            if isinstance(val, bool):
                val = int(val)
            values.append(val)

        batch.append(values)

        # Insert in batches of 1000
        if len(batch) >= 1000:
            conn.executemany(insert_sql, batch)
            batch = []

    if batch:
        conn.executemany(insert_sql, batch)

    conn.commit()


def main():
    rng = random.Random(SEED)

    print(f"Creating SQLite database: {OUTPUT_PATH}")
    print(f"  Tables: {len(MESSAGE_TYPES)}")
    print(f"  Rows per table: {ROWS_PER_TABLE:,}")
    print()

    conn = sqlite3.connect(OUTPUT_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")

    for table_name, generator in MESSAGE_TYPES.items():
        create_table(conn, table_name, generator, rng)

        # Get column count
        cursor = conn.execute(f'PRAGMA table_info("{table_name}")')
        cols = cursor.fetchall()

        # Get time range
        cursor = conn.execute(f'SELECT MIN("timestamp"), MAX("timestamp") FROM "{table_name}"')
        t_min, t_max = cursor.fetchone()

        print(f"  {table_name}: {len(cols)} columns, {ROWS_PER_TABLE:,} rows")
        print(f"    Time range: {t_min} → {t_max}")

    # Create a combined view that unions all tables for Tableau-style flat access
    union_parts = []
    all_fields = set()
    table_fields = {}
    for table_name, generator in MESSAGE_TYPES.items():
        sample = generator(random.Random(0), 0)
        table_fields[table_name] = list(sample.keys())
        all_fields.update(sample.keys())

    all_fields_sorted = sorted(all_fields)

    for table_name in MESSAGE_TYPES:
        cols = ['"timestamp"', '"messageType"']
        for field in all_fields_sorted:
            if field in table_fields[table_name]:
                cols.append(sanitize_col_name(field))
            else:
                cols.append(f'NULL AS {sanitize_col_name(field)}')
        union_parts.append(f'SELECT {", ".join(cols)} FROM "{table_name}"')

    view_sql = f'CREATE VIEW IF NOT EXISTS "all_messages" AS\n' + "\nUNION ALL\n".join(union_parts)
    conn.execute(view_sql)
    conn.commit()

    # Summary
    cursor = conn.execute("SELECT COUNT(*) FROM all_messages")
    total_rows = cursor.fetchone()[0]

    conn.close()

    print()
    print(f"  all_messages (view): {len(all_fields_sorted) + 2} columns, {total_rows:,} rows")
    print()
    print(f"Database created: {OUTPUT_PATH}")
    print(f"Total rows: {total_rows:,}")
    print(f"Unique fields: {len(all_fields_sorted)} (+ timestamp, messageType)")


if __name__ == "__main__":
    main()
