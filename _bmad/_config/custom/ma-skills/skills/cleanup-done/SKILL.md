---
name: cleanup-done
description: Archive done stories and bugs — move files to done/ subfolder and remove from sprint/backlog
type: skill
triggers:
  - "cleanup done"
  - "archive done items"
---

# Cleanup-Done Workflow

Archive done stories and bugs — move files to the `done/` subfolder and remove from sprint/backlog tracking.

<workflow>

<step n="1" goal="Identify all done items across data sources">
  <action>Read `_bmad-output/implementation-artifacts/sprint-status.yaml` — collect all story keys where status is `done`</action>
  <action>Read `_bmad-output/implementation-artifacts/backlog.yaml` — collect all items where status is `done`</action>
  <action>Glob `_bmad-output/implementation-artifacts/bug-*.md` — for each bug file, parse YAML frontmatter and collect those with `status: done`</action>
  <action>Deduplicate across all three sources — build {{done_items}} as a unified list with: id, title, type (story/bug), source_file</action>
  <check if="no done items found">
    <output>No items with status `done` found across sprint-status.yaml, backlog.yaml, or bug files. Nothing to archive.</output>
    <action>Exit workflow</action>
  </check>
</step>

<step n="2" goal="Display done items and confirm archival scope">
  <output>
## Done Items Ready for Archival

| # | ID | Title | Type | Source |
|---|---|---|---|---|
{{#each done_items}}
| {{@index+1}} | {{id}} | {{title}} | {{type}} | {{source}} |
{{/each}}

*Total: {{done_items.length}} items*
  </output>
  <ask>Options:
- [a] Archive all
- [s] Select specific items (enter item numbers)
- [q] Cancel

Choice:</ask>
  <check if="user selects 'q'">
    <output>Cancelled. No changes made.</output>
    <action>Exit workflow</action>
  </check>
  <check if="user selects 'a'">
    <action>Set {{items_to_archive}} = all {{done_items}}</action>
  </check>
  <check if="user selects 's'">
    <ask>Enter item numbers to archive (comma-separated):</ask>
    <action>Resolve entered numbers against the table above</action>
    <action>Set {{items_to_archive}} = selected items</action>
  </check>
</step>

<step n="3" goal="Ensure done/ directory exists">
  <action>Check if `_bmad-output/implementation-artifacts/done/` directory exists</action>
  <action>If not, create it</action>
</step>

<step n="4" goal="Move files to done/ directory">
  <action>For each item in {{items_to_archive}}:

    **Stories** (type == story):
    - Source: `_bmad-output/implementation-artifacts/{id}.md`
    - Destination: `_bmad-output/implementation-artifacts/done/{id}.md`
    - Use rename/move operation
    - Skip if source file does not exist (log warning)
    - Skip if destination file already exists (log warning — do not overwrite)

    **Bugs** (type == bug):
    - Source: `_bmad-output/implementation-artifacts/bug-{slug}.md`
    - Destination: `_bmad-output/implementation-artifacts/done/bug-{slug}.md`
    - Use rename/move operation
    - Skip if source file does not exist (log warning)
    - Skip if destination file already exists (log warning — do not overwrite)
  </action>
  <action>Track results: {{moved}}, {{skipped_missing}}, {{skipped_exists}}</action>
</step>

<step n="5" goal="Remove done IDs from sprint files">
  <action>Glob `_bmad-output/implementation-artifacts/sprints/sprint-*.yaml` to find all sprint files</action>
  <action>For each sprint file:
    - Read the sprint's `items` array
    - Check if any item IDs in the array match {{items_to_archive}}
    - If NO matches found: skip this sprint file entirely (no modification needed)
    - If matches found:
      - Remove the matching item IDs from the array
      - If items array becomes empty AND sprint status is `active`: auto-close the sprint by setting status to `closed`
      - Update `last_modified` to current ISO timestamp
      - Write the updated sprint file
  </action>
</step>

<step n="6" goal="Remove done items from backlog.yaml">
  <action>Read `_bmad-output/implementation-artifacts/backlog.yaml`</action>
  <action>Remove all entries whose ID is in {{items_to_archive}}</action>
  <action>Re-number remaining item priorities sequentially: 1, 2, 3, ..., N</action>
  <action>Write updated `_bmad-output/implementation-artifacts/backlog.yaml`</action>
</step>

<step n="7" goal="Remove done entries from sprint-status.yaml">
  <action>Read `_bmad-output/implementation-artifacts/sprint-status.yaml`</action>
  <action>In the `development_status` section:
    - Remove done story keys that are in {{items_to_archive}}
    - Remove done bug keys that are in {{items_to_archive}}
    - Do NOT remove epic keys (keys matching `epic-*`)
    - Do NOT remove retrospective keys (keys ending with `-retrospective`)
    - If all stories belonging to an epic have been removed: set that epic's status to `done`
    - Preserve YAML comments where possible
  </action>
  <action>Write updated `_bmad-output/implementation-artifacts/sprint-status.yaml`</action>
</step>

<step n="8" goal="Report summary">
  <output>
## Archival Complete

**Files moved to `done/`:** {{moved_count}}
{{#each moved_items}}
- {{id}} ({{type}}) -> done/
{{/each}}

{{#if skipped_missing.length}}
**Skipped (source missing):** {{skipped_missing.length}}
{{#each skipped_missing}}
- {{id}} — source file not found
{{/each}}
{{/if}}

{{#if skipped_exists.length}}
**Skipped (already in done/):** {{skipped_exists.length}}
{{#each skipped_exists}}
- {{id}} — destination already exists
{{/each}}
{{/if}}

**Sprint updates:**
{{#each updated_sprints}}
- {{sprint_id}}: removed {{removed_count}} item(s){{#if auto_closed}} — auto-closed (no remaining items){{/if}}
{{/each}}

**Backlog:** {{backlog_removed_count}} items removed, priorities renumbered 1..{{backlog_remaining_count}}

**Sprint-status.yaml:** {{status_removed_count}} entries removed
{{#if epics_marked_done.length}}
- Epics marked done: {{#each epics_marked_done}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

**Next Steps:**
- Use `/sprint-status-view` to verify updated sprint state
- Use `/prioritize-backlog` to reorder remaining backlog items
  </output>
</step>

</workflow>
