---
name: generate-backlog
description: Generate or refresh a flat backlog.yaml from epics and bug stories, preserving existing priority and sprint assignments
type: skill
triggers:
  - "generate backlog"
  - "refresh backlog"
---

# Generate Backlog Workflow

Generate or refresh a flat `backlog.yaml` from epic stories and bug reports. Preserves existing priority and sprint assignments, appends new items, removes stale items, and re-numbers priorities 1..N.

<workflow>

<step n="1" goal="Load sources">
  <action>Read `_bmad-output/planning-artifacts/epics.md` — this is the master list of epics with their stories.</action>
  <check if="epics.md does not exist">
    <output>**Error:** `_bmad-output/planning-artifacts/epics.md` not found. Cannot generate backlog without an epics file.</output>
    <action>Exit workflow</action>
  </check>

  <action>Glob `_bmad-output/implementation-artifacts/bug-*.md` to discover all bug story files.</action>
  <action>Store the list of bug files as {{bug_files}} (may be empty — zero bugs is valid).</action>

  <action>Read `_bmad-output/implementation-artifacts/sprint-status.yaml` if it exists — this provides the current status of each story (done, in-progress, backlog, etc.).</action>
  <action>Store the status map as {{status_map}} (keyed by story id). If the file does not exist, use an empty map.</action>

  <action>Read `_bmad-output/implementation-artifacts/backlog.yaml` if it exists — this is the existing backlog to merge with.</action>
  <action>Store the existing backlog items as {{existing_items}} (list). If the file does not exist, use an empty list.</action>

  <output>
**Sources loaded:**
- epics.md: found
- Bug files: {{bug_files | length}} file(s)
- sprint-status.yaml: {{status_map exists ? "found" : "not found (empty status)"}}
- Existing backlog.yaml: {{existing_items | length}} item(s)
  </output>
</step>

<step n="2" goal="Extract stories from epics">
  <action>Parse `epics.md` to extract every story from every epic. Each epic is a level-2 heading (`## Epic N: ...`) and each story within it is a level-3 heading (`### Story N.M: ...`) or a list item following the pattern `- **Story N.M:** Title` or `- N.M: Title`.</action>

  <action>For each story found:
    - Derive {{story_id}} as a kebab-case slug: `"{epic_number}-{story_number}-{title_slug}"` (e.g., `"5-5-explicit-parameter-passing"`)
      - Title slug: lowercase, replace spaces/underscores with hyphens, remove non-alphanumeric/non-hyphen characters, collapse consecutive hyphens, trim leading/trailing hyphens
    - Set {{epic}} to the epic number (integer)
    - Set {{title}} to the story title text
    - Look up status from {{status_map}} using the story identifier. If found and status is `done`, skip this story (exclude from backlog). If found, use that status. If not found, default to `backlog`.
    - Set {{type}} = `story`
    - Set {{severity}} = `null`
    - Set {{sprint}} = `null`
    - Set {{priority}} = `null` (will be assigned during merge/sort)
  </action>

  <action>Store the extracted stories as {{extracted_stories}} list.</action>
  <output>Extracted {{extracted_stories | length}} active stories from epics (done items excluded).</output>
</step>

<step n="3" goal="Extract bugs">
  <action>For each file in {{bug_files}}:
    - Read the file and parse the YAML frontmatter (between `---` delimiters)
    - Extract `title`, `severity`, and `status` from frontmatter
    - Derive {{bug_id}} from the **filename**, not the title: strip the `bug-` prefix and `.md` extension, then uppercase to `"BUG-{slug}"` (e.g., `bug-login-crash.md` → `BUG-login-crash`)
    - Use `status` from frontmatter directly (bugs track their own status). If `status` is missing, default to `backlog`. If status is `done`, skip this bug (exclude from backlog).
    - Build a backlog item:
      - id: {{bug_id}}
      - type: `bug`
      - epic: `null`
      - title: {{title}}
      - priority: `null` (assigned during merge/sort)
      - status: {{frontmatter_status or "backlog"}}
      - sprint: `null`
      - severity: {{severity}}
  </action>

  <action>Store the extracted bugs as {{extracted_bugs}} list.</action>
  <output>Extracted {{extracted_bugs | length}} active bugs (done items excluded).</output>
</step>

<step n="4" goal="Merge with existing backlog">
  <action>Combine {{extracted_stories}} and {{extracted_bugs}} into {{new_items}} list.</action>

  <action>Build a lookup map from {{existing_items}} keyed by `id`.</action>

  <action>For each item in {{new_items}}:
    - If an item with the same `id` exists in {{existing_items}}:
      - **Preserve** the existing `priority` value
      - **Preserve** the existing `sprint` assignment
      - **Update** `status` from the freshly extracted value (which may reflect sprint-status.yaml changes)
      - **Update** `title`, `type`, `epic`, `severity` from the freshly extracted values (source of truth)
    - If no matching item exists in {{existing_items}}:
      - This is a new item — keep all freshly extracted values
      - Set `priority` to `null` (will be placed at the end during sort)
  </action>

  <action>Identify stale items: any item in {{existing_items}} whose `id` does NOT appear in {{new_items}}. These items no longer exist in the source files and should be removed.</action>

  <action>Store the final merged list as {{merged_items}}.</action>
  <action>Store the count of new items added as {{new_count}}.</action>
  <action>Store the count of stale items removed as {{stale_count}}.</action>
  <action>Store the count of preserved items as {{preserved_count}}.</action>

  <output>
**Merge results:**
- Preserved (existing): {{preserved_count}}
- New items added: {{new_count}}
- Stale items removed: {{stale_count}}
  </output>
</step>

<step n="5" goal="Write backlog.yaml">
  <action>Sort {{merged_items}} for final output:
    1. Items WITH an existing numeric `priority` come first, sorted ascending by priority
    2. Items WITHOUT a priority (`null`) come after, sorted by:
       a. `type`: bugs before stories (bugs get priority attention)
       b. `severity` for bugs: critical > high > medium > low
       c. `epic` number ascending for stories (lower epics first)
       d. `id` alphabetically as final tiebreaker
  </action>

  <action>Re-number priorities sequentially 1..N across all items in the sorted list.</action>

  <action>Get current ISO timestamp as {{generated_at}}.</action>

  <action>Write `_bmad-output/implementation-artifacts/backlog.yaml` with this structure:

```yaml
# Flat Backlog — auto-generated by generate-backlog
# Generated: {{generated_at}}
# Total items: {{merged_items | length}}
#
# Schema per item:
#   id, type, epic, title, priority, status, sprint, severity

backlog:
  - id: "5-5-explicit-parameter-passing"
    type: story
    epic: 5
    title: "Explicit Parameter Passing"
    priority: 1
    status: backlog
    sprint: null
    severity: null
  # ... remaining items ...
```

  **YAML output rules:**
  - Always quote `id` and `title` fields (they contain hyphens and special characters)
  - `epic` is an integer for stories, `null` for bugs
  - `sprint` is a string like `"sprint-3"` if assigned, or `null`
  - `severity` is a string (`critical`, `high`, `medium`, `low`) for bugs, `null` for stories
  - `status` is one of: `backlog`, `ready-for-dev`, `in-progress`, `review` (done items excluded)
  - `priority` is always a positive integer (1 = highest priority)
  - Use 2-space indentation for YAML
  </action>

  <output>Backlog written to `_bmad-output/implementation-artifacts/backlog.yaml` with {{merged_items | length}} items.</output>
</step>

<step n="6" goal="Report summary">
  <output>
## Backlog Generation Complete

| Metric              | Count |
|----------------------|-------|
| Total items          | {{merged_items | length}} |
| Stories              | {{story_count}} |
| Bugs                 | {{bug_count}} |
| New items added      | {{new_count}} |
| Stale items removed  | {{stale_count}} |
| Items preserved      | {{preserved_count}} |

**Output:** `_bmad-output/implementation-artifacts/backlog.yaml`

**Next Steps:**
- Review priorities — new items are appended at the end; reorder as needed
- Use `/add-to-sprint` to assign high-priority items to the current sprint
- Use `/sprint-status-view` to see sprint progress
  </output>
</step>

</workflow>
