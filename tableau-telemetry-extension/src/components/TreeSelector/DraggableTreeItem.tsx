import { type ReactNode } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { TreeNode } from '../../models/fieldHierarchy'

interface DraggableTreeItemProps {
  node: TreeNode
  children: ReactNode
}

/**
 * Wraps a tree leaf node to make it draggable via @dnd-kit.
 * Carries field metadata (shortName, dottedPath, messageType) in drag data.
 */
export default function DraggableTreeItem({ node, children }: DraggableTreeItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.dottedPath,
    data: {
      shortName: node.name,
      dottedPath: node.dottedPath,
      messageType: node.messageType,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
    >
      {children}
    </div>
  )
}
