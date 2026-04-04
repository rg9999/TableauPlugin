/**
 * messageTypeColors.ts — Maps message types to the 8-color categorical palette.
 *
 * Uses a deterministic hash of the top-level category name (first segment
 * of the dotted-path message type) to pick a color. Same category always
 * gets the same color across renders and sessions. Results are cached.
 */
import { MESSAGE_TYPE_COLORS } from '../../theme/designTokens'

const colorCache = new Map<string, string>()

/**
 * Returns a consistent color for a message type based on its top-level category.
 * Uses the 8-color categorical palette from design tokens.
 */
export function getMessageTypeColor(messageType: string): string {
  // Extract top-level category (first segment of dotted path)
  const topLevel = messageType.split('.')[0]

  const cached = colorCache.get(topLevel)
  if (cached) return cached

  // Deterministic hash to pick a color from the palette
  let hash = 0
  for (let i = 0; i < topLevel.length; i++) {
    hash = ((hash << 5) - hash + topLevel.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % MESSAGE_TYPE_COLORS.length
  const color = MESSAGE_TYPE_COLORS[index]
  colorCache.set(topLevel, color)
  return color
}
