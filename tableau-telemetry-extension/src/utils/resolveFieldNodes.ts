import type { TreeNode, FieldNode } from '../models/fieldHierarchy'

/**
 * Resolves saved dotted-path strings back to FieldNode objects
 * by walking the TreeNode hierarchy.
 */
export function resolveFieldNodes(
  paths: string[],
  hierarchy: TreeNode,
): FieldNode[] {
  const result: FieldNode[] = []
  const pathSet = new Set(paths)

  function walk(node: TreeNode): void {
    if (node.isField && node.children.length === 0 && pathSet.has(node.dottedPath)) {
      result.push({
        shortName: node.name,
        dottedPath: node.dottedPath,
        messageType: node.messageType,
        dataType: 'string',
      })
    }
    for (const child of node.children) walk(child)
  }

  walk(hierarchy)
  return result
}
