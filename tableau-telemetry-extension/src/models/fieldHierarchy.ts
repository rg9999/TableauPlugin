/** A node in the message type / field hierarchy tree */
export interface TreeNode {
  /** Short display name (leaf segment of dotted path) */
  name: string
  /** Full dotted path (e.g., "navigation.gps.position.latitude") */
  dottedPath: string
  /** Child nodes */
  children: TreeNode[]
  /** True if this is a leaf field (selectable for grid display) */
  isField: boolean
  /** Message type this field belongs to (top-level category) */
  messageType: string
}

/** A leaf field node selected for grid display */
export interface FieldNode {
  /** Short display name */
  shortName: string
  /** Full dotted path */
  dottedPath: string
  /** Message type this field belongs to */
  messageType: string
  /** Data type hint (string, number, boolean, array, object) */
  dataType: string
}

/** A top-level message type category */
export interface MessageType {
  /** Message type name (e.g., "Navigation", "FlightControl") */
  name: string
  /** All fields in this message type */
  fields: FieldNode[]
  /** Nesting depth of deepest field */
  maxDepth: number
}
