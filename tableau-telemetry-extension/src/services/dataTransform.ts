import type { ColumnInfo } from '../models/tableauTypes'
import type { TreeNode } from '../models/fieldHierarchy'

/**
 * Converts flat dotted-path column names into a hierarchical TreeNode structure.
 * Memoized — returns the same reference for the same input array.
 */
let cachedInput: ColumnInfo[] | null = null
let cachedResult: TreeNode | null = null

export function parseFieldHierarchy(columns: ColumnInfo[]): TreeNode {
  if (cachedInput === columns && cachedResult !== null) {
    return cachedResult
  }

  const root: TreeNode = {
    name: 'root',
    dottedPath: '',
    children: [],
    isField: false,
    messageType: '',
  }

  for (const col of columns) {
    const segments = col.fieldName.split('.')
    if (segments.length === 0) continue

    const messageType = segments[0]
    let current = root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const dottedPath = segments.slice(0, i + 1).join('.')
      const isLeaf = i === segments.length - 1

      let child = current.children.find((c) => c.name === segment && c.dottedPath === dottedPath)

      if (!child) {
        child = {
          name: segment,
          dottedPath,
          children: [],
          isField: isLeaf,
          messageType,
        }
        current.children.push(child)
      } else if (isLeaf) {
        // Node existed as a branch but this column makes it a leaf too
        child.isField = true
      }

      current = child
    }
  }

  sortTree(root)

  cachedInput = columns
  cachedResult = root
  return root
}

/** Sort children alphabetically at each level: branches first, then leaves */
function sortTree(node: TreeNode): void {
  node.children.sort((a, b) => {
    // Branches (has children) before leaves
    const aIsBranch = a.children.length > 0
    const bIsBranch = b.children.length > 0
    if (aIsBranch && !bIsBranch) return -1
    if (!aIsBranch && bIsBranch) return 1
    return a.name.localeCompare(b.name)
  })

  for (const child of node.children) {
    sortTree(child)
  }
}

/** Reset memoization cache (for testing) */
export function clearParseCache(): void {
  cachedInput = null
  cachedResult = null
}
