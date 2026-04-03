import type { ColumnInfo, FlatRowData } from '../models/tableauTypes'

/** Message type definitions with realistic dotted-path field names */
export const MESSAGE_TYPES = {
  'navigation.gps.position': {
    fields: [
      'navigation.gps.position.latitude',
      'navigation.gps.position.longitude',
      'navigation.gps.position.altitude_msl',
      'navigation.gps.position.altitude_agl',
      'navigation.gps.position.hdop',
      'navigation.gps.position.num_satellites',
      'navigation.gps.position.fix_type',
    ],
  },
  'navigation.ins': {
    fields: [
      'navigation.ins.roll',
      'navigation.ins.pitch',
      'navigation.ins.yaw',
      'navigation.ins.heading_true',
      'navigation.ins.heading_magnetic',
      'navigation.ins.ground_speed',
      'navigation.ins.vertical_speed',
      'navigation.ins.drift_angle',
    ],
  },
  'navigation.baro': {
    fields: [
      'navigation.baro.pressure_altitude',
      'navigation.baro.qnh',
      'navigation.baro.qfe',
      'navigation.baro.vertical_rate',
      'navigation.baro.temperature',
    ],
  },
  'flightcontrol.actuator': {
    fields: [
      'flightcontrol.actuator.cmd_position',
      'flightcontrol.actuator.feedback',
      'flightcontrol.actuator.rate',
      'flightcontrol.actuator.saturation_flag',
      'flightcontrol.actuator.current_draw',
      'flightcontrol.actuator.temperature',
    ],
  },
  'flightcontrol.mode': {
    fields: [
      'flightcontrol.mode.autopilot_engaged',
      'flightcontrol.mode.flight_phase',
      'flightcontrol.mode.control_law',
      'flightcontrol.mode.stick_priority',
      'flightcontrol.mode.trim_state',
    ],
  },
  'flightcontrol.surfaces': {
    fields: [
      'flightcontrol.surfaces.aileron_left',
      'flightcontrol.surfaces.aileron_right',
      'flightcontrol.surfaces.elevator',
      'flightcontrol.surfaces.rudder',
      'flightcontrol.surfaces.flaps',
      'flightcontrol.surfaces.spoilers',
    ],
  },
  'sensors.radar.track': {
    fields: [
      'sensors.radar.track.target_id',
      'sensors.radar.track.range',
      'sensors.radar.track.azimuth',
      'sensors.radar.track.elevation',
      'sensors.radar.track.velocity',
      'sensors.radar.track.rcs',
      'sensors.radar.track.track_quality',
      // Array field
      'sensors.radar.track.history',
    ],
  },
  'sensors.radar.search': {
    fields: [
      'sensors.radar.search.scan_mode',
      'sensors.radar.search.scan_volume_az',
      'sensors.radar.search.scan_volume_el',
      'sensors.radar.search.prf',
      'sensors.radar.search.pulse_width',
      'sensors.radar.search.dwell_time',
    ],
  },
  'sensors.eo': {
    fields: [
      'sensors.eo.fov_horizontal',
      'sensors.eo.fov_vertical',
      'sensors.eo.zoom_level',
      'sensors.eo.pan_angle',
      'sensors.eo.tilt_angle',
      'sensors.eo.mode',
      'sensors.eo.tracking_status',
    ],
  },
  'communications.radio': {
    fields: [
      'communications.radio.frequency',
      'communications.radio.channel',
      'communications.radio.mode',
      'communications.radio.squelch',
      'communications.radio.signal_strength',
    ],
  },
  'communications.datalink': {
    fields: [
      'communications.datalink.link_status',
      'communications.datalink.bandwidth',
      'communications.datalink.latency',
      'communications.datalink.error_rate',
      'communications.datalink.encryption_status',
      'communications.datalink.message_queue_depth',
    ],
  },
  'systemlog': {
    fields: [
      'systemlog.severity',
      'systemlog.source',
      'systemlog.message',
      'systemlog.code',
      'systemlog.details',
    ],
  },
  'power.generator': {
    fields: [
      'power.generator.voltage',
      'power.generator.current',
      'power.generator.frequency',
      'power.generator.load_percent',
      'power.generator.temperature',
      'power.generator.status',
    ],
  },
  'power.battery': {
    fields: [
      'power.battery.voltage',
      'power.battery.current',
      'power.battery.soc_percent',
      'power.battery.temperature',
      'power.battery.health',
    ],
  },
  'payload.status': {
    fields: [
      'payload.status.type',
      'payload.status.weight',
      'payload.status.state',
      'payload.status.release_authority',
      // Array field
      'payload.status.stations',
    ],
  },
} as const

export type MessageTypeName = keyof typeof MESSAGE_TYPES

/** All message type names */
export const ALL_MESSAGE_TYPE_NAMES = Object.keys(MESSAGE_TYPES) as MessageTypeName[]

/** All field paths across all message types */
export const ALL_FIELD_PATHS = Object.values(MESSAGE_TYPES).flatMap((mt) => mt.fields)

/** Full column schema for all mock message types */
export const MOCK_SCHEMA: ColumnInfo[] = [
  { fieldName: 'timestamp', dataType: 'string', role: 'dimension' },
  { fieldName: 'messageType', dataType: 'string', role: 'dimension' },
  ...ALL_FIELD_PATHS.map((fieldName) => ({
    fieldName,
    dataType: fieldName.includes('flag') || fieldName.includes('engaged')
      ? 'boolean'
      : fieldName.includes('message') || fieldName.includes('severity') || fieldName.includes('mode') || fieldName.includes('status') || fieldName.includes('type') || fieldName.includes('source')
        ? 'string'
        : fieldName.includes('history') || fieldName.includes('stations')
          ? 'array'
          : 'float',
    role: 'dimension' as const,
  })),
]

/** Deterministic pseudo-random number generator (seeded) */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/** Generate realistic field values based on field path */
function generateFieldValue(fieldPath: string, rand: () => number): unknown {
  if (fieldPath.includes('latitude')) return 32.7 + rand() * 0.1
  if (fieldPath.includes('longitude')) return -117.2 + rand() * 0.1
  if (fieldPath.includes('altitude')) return 1000 + rand() * 5000
  if (fieldPath.includes('heading') || fieldPath.includes('azimuth')) return rand() * 360
  if (fieldPath.includes('roll') || fieldPath.includes('pitch')) return (rand() - 0.5) * 60
  if (fieldPath.includes('yaw')) return (rand() - 0.5) * 180
  if (fieldPath.includes('speed')) return rand() * 500
  if (fieldPath.includes('rate')) return (rand() - 0.5) * 20
  if (fieldPath.includes('temperature')) return -20 + rand() * 80
  if (fieldPath.includes('pressure')) return 900 + rand() * 200
  if (fieldPath.includes('voltage')) return 20 + rand() * 12
  if (fieldPath.includes('current')) return rand() * 100
  if (fieldPath.includes('frequency')) return 100 + rand() * 400
  if (fieldPath.includes('range')) return rand() * 50000
  if (fieldPath.includes('elevation')) return (rand() - 0.5) * 90
  if (fieldPath.includes('velocity')) return rand() * 1000
  if (fieldPath.includes('rcs')) return rand() * 10
  if (fieldPath.includes('percent')) return rand() * 100
  if (fieldPath.includes('signal_strength')) return -120 + rand() * 80
  if (fieldPath.includes('latency')) return rand() * 100
  if (fieldPath.includes('error_rate')) return rand() * 0.05
  if (fieldPath.includes('bandwidth')) return rand() * 1000
  if (fieldPath.includes('zoom')) return 1 + rand() * 20
  if (fieldPath.includes('fov')) return 10 + rand() * 60
  if (fieldPath.includes('pan') || fieldPath.includes('tilt')) return (rand() - 0.5) * 180
  if (fieldPath.includes('weight')) return 100 + rand() * 500
  if (fieldPath.includes('queue_depth')) return Math.floor(rand() * 50)
  if (fieldPath.includes('num_satellites')) return Math.floor(4 + rand() * 12)
  if (fieldPath.includes('hdop')) return 0.5 + rand() * 3
  if (fieldPath.includes('target_id')) return Math.floor(rand() * 100)
  if (fieldPath.includes('track_quality')) return Math.floor(rand() * 10)
  if (fieldPath.includes('dwell_time') || fieldPath.includes('pulse_width')) return rand() * 0.001
  if (fieldPath.includes('prf')) return Math.floor(1000 + rand() * 9000)
  if (fieldPath.includes('squelch')) return Math.floor(rand() * 10)
  if (fieldPath.includes('channel')) return Math.floor(1 + rand() * 16)
  if (fieldPath.includes('code')) return Math.floor(1000 + rand() * 9000)
  if (fieldPath.includes('load')) return rand() * 100

  // Boolean fields
  if (fieldPath.includes('flag') || fieldPath.includes('engaged')) return rand() > 0.5
  if (fieldPath.includes('authority')) return rand() > 0.7

  // String fields
  if (fieldPath.includes('severity')) return ['INFO', 'WARN', 'ERR'][Math.floor(rand() * 3)]
  if (fieldPath.includes('fix_type')) return ['3D', '2D', 'DGPS', 'RTK'][Math.floor(rand() * 4)]
  if (fieldPath.includes('flight_phase')) return ['TAXI', 'TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH', 'LANDING'][Math.floor(rand() * 7)]
  if (fieldPath.includes('control_law')) return ['NORMAL', 'ALTERNATE', 'DIRECT'][Math.floor(rand() * 3)]
  if (fieldPath.includes('stick_priority')) return ['LEFT', 'RIGHT', 'NONE'][Math.floor(rand() * 3)]
  if (fieldPath.includes('trim_state')) return ['TRIMMED', 'TRIMMING', 'UNTRIMMED'][Math.floor(rand() * 3)]
  if (fieldPath.includes('scan_mode')) return ['RWS', 'TWS', 'ACM', 'GMTI'][Math.floor(rand() * 4)]
  if (fieldPath.includes('tracking_status')) return ['TRACKING', 'SEARCHING', 'IDLE'][Math.floor(rand() * 3)]
  if (fieldPath.includes('link_status')) return ['CONNECTED', 'DEGRADED', 'DISCONNECTED'][Math.floor(rand() * 3)]
  if (fieldPath.includes('encryption_status')) return ['ENCRYPTED', 'PLAIN'][Math.floor(rand() * 2)]
  if (fieldPath.includes('health')) return ['GOOD', 'DEGRADED', 'CRITICAL'][Math.floor(rand() * 3)]
  if (fieldPath.includes('status')) return ['ONLINE', 'OFFLINE', 'STANDBY'][Math.floor(rand() * 3)]
  if (fieldPath === 'systemlog.source') return ['FCS', 'NAV', 'COMM', 'PWR', 'SENSOR'][Math.floor(rand() * 5)]
  if (fieldPath === 'systemlog.message') return [
    'System nominal', 'Actuator rate limit exceeded', 'Sensor calibration complete',
    'Link quality degraded', 'Battery low warning', 'GPS fix acquired',
  ][Math.floor(rand() * 6)]
  if (fieldPath === 'payload.status.type') return ['WEAPON', 'SENSOR', 'FUEL', 'CARGO'][Math.floor(rand() * 4)]
  if (fieldPath === 'payload.status.state') return ['ARMED', 'SAFE', 'RELEASED', 'JETTISONED'][Math.floor(rand() * 4)]
  if (fieldPath.includes('radio.mode')) return ['AM', 'FM', 'USB', 'LSB'][Math.floor(rand() * 4)]
  if (fieldPath.includes('eo.mode')) return ['VISIBLE', 'IR', 'DUAL'][Math.floor(rand() * 3)]

  // Array fields
  if (fieldPath.includes('history')) return [rand() * 50000, rand() * 50000, rand() * 50000]
  if (fieldPath.includes('stations')) return [1, 2, 3].filter(() => rand() > 0.3)

  return rand() * 100
}

/**
 * Generate mixed-line sparse row data with realistic timestamps.
 * Each row belongs to one message type; fields from other types are absent.
 * @param count Total number of rows to generate
 * @param messageTypes Which message types to include (defaults to all)
 * @param seed Deterministic seed for reproducibility
 */
export function generateMockRows(
  count: number,
  messageTypes: MessageTypeName[] = ALL_MESSAGE_TYPE_NAMES,
  seed = 42,
): FlatRowData[] {
  const rand = seededRandom(seed)
  const rows: FlatRowData[] = []
  const baseTime = new Date('2026-04-03T14:30:00.000Z').getTime()

  for (let i = 0; i < count; i++) {
    // Pick a message type (round-robin with jitter)
    const msgType = messageTypes[i % messageTypes.length]
    const fields = MESSAGE_TYPES[msgType].fields

    // Generate timestamp with ~100ms spacing + jitter
    const timestamp = new Date(baseTime + i * 100 + Math.floor(rand() * 50)).toISOString()

    const row: FlatRowData = {
      timestamp,
      messageType: msgType,
    }

    // Only populate fields belonging to this message type
    for (const field of fields) {
      row[field] = generateFieldValue(field, rand)
    }

    rows.push(row)
  }

  return rows
}

/** Pre-built datasets for different test scales */
export const MOCK_ROWS_100 = generateMockRows(100)
export const MOCK_ROWS_1K = generateMockRows(1000)

// 10K is generated lazily to avoid slowing test startup
let _mockRows10K: FlatRowData[] | null = null
export function getMockRows10K(): FlatRowData[] {
  if (!_mockRows10K) {
    _mockRows10K = generateMockRows(10000)
  }
  return _mockRows10K
}
