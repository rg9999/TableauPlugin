# Story 2.4: Tree Search & Filter

Status: done

## Story

As an analyst,
I want to search/filter the tree by field name,
so that I can quickly find fields in a tree of ~200 message types without manual browsing.

## Acceptance Criteria

1. **Given** the TreeSearchInput is visible above the tree, **when** the analyst types a search term (e.g., "altitude"), **then** the tree filters to show only matching nodes and their parent hierarchy
2. **Given** a search is active, **when** non-matching branches exist, **then** they are hidden
3. **Given** a search is active, **when** filtering occurs, **then** it is instant (synchronous, no loading state)
4. **Given** a search is active, **when** the analyst clears the search (X button or empty text), **then** the full tree is restored
5. **Given** a search term, **when** matching, **then** it matches against field short names AND full dotted paths

## Tasks / Subtasks

- [x] Task 1: Create TreeSearchInput component (AC: #1, #4)
  - [x] 1.1: Created `src/components/TreeSelector/TreeSearchInput.tsx` with MUI TextField + SearchIcon + ClearIcon
  - [x] 1.2: Search term managed in TreeSelector local state
  - [x] 1.3: Search term passed to filterTree via useMemo
- [x] Task 2: Implement tree filtering logic (AC: #1, #2, #3, #5)
  - [x] 2.1: Created `filterTree(node, query)` — exported for testing
  - [x] 2.2: Case-insensitive match against node.name AND node.dottedPath
  - [x] 2.3: Preserves ancestor hierarchy for matching leaves
  - [x] 2.4: Excludes branches with no matching descendants
  - [x] 2.5: `forceExpanded` prop auto-expands all visible branches during search
  - [x] 2.6: Synchronous filtering via useMemo — no loading state
- [x] Task 3: Integrate search into TreeSelector (AC: #1, #4)
  - [x] 3.1: TreeSearchInput renders above the tree list
  - [x] 3.2: Filtered tree when search non-empty; full tree when empty
  - [x] 3.3: "No matching fields" message when filter has zero results
- [x] Task 4: Write tests (AC: #1-#5)
  - [x] 4.1: Test search input renders and accepts text
  - [x] 4.2: Test typing a term filters tree to matching nodes only
  - [x] 4.3: Test clearing search restores full tree
  - [x] 4.4: Test search matches against dotted paths
  - [x] 4.5: Test parent hierarchy preserved for matching leaves
  - [x] 4.6: Test "No matching fields" for no-match queries

## Dev Notes

### Architecture Compliance

**Files to create/modify:**
- `src/components/TreeSelector/TreeSearchInput.tsx` — search input (private to TreeSelector)
- `src/components/TreeSelector/TreeSelector.tsx` — integrate search, add filter logic

### Filter Algorithm

```typescript
function filterTree(node: TreeNode, query: string): TreeNode | null {
  const lowerQuery = query.toLowerCase()
  // Check if this node matches
  const nameMatch = node.name.toLowerCase().includes(lowerQuery)
  const pathMatch = node.dottedPath.toLowerCase().includes(lowerQuery)
  const selfMatch = nameMatch || pathMatch

  // Recursively filter children
  const filteredChildren = node.children
    .map((child) => filterTree(child, query))
    .filter((c): c is TreeNode => c !== null)

  // Include this node if it matches OR has matching descendants
  if (selfMatch || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren }
  }
  return null
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns — TreeSelector]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 9 test files, 110 tests, all passing (0 regressions)
- 7 new tests (4 TreeSelector search + 3 filterTree unit tests)

### Completion Notes List

- TreeSearchInput: MUI TextField with search/clear icons, controlled by parent
- filterTree: recursive filter matching name and dottedPath, preserves ancestor hierarchy
- forceExpanded prop auto-expands all tree nodes during active search
- "No matching fields" shown when filter returns empty

### File List

- src/components/TreeSelector/TreeSearchInput.tsx (created)
- src/components/TreeSelector/TreeSelector.tsx (modified — search integration, filterTree, forceExpanded)
- src/components/TreeSelector/TreeSelector.test.tsx (modified — 7 new tests)
