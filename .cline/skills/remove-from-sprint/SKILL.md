---
name: remove-from-sprint
description: Remove items from a sprint and return them to the unassigned backlog
type: skill
triggers:
  - "remove from sprint"
  - "unassign from sprint"
---

# Remove-from-Sprint Workflow

Remove items from a sprint and return them to the unassigned backlog.

<workflow>

<step n="1" goal="List sprints that have items and select one">
  <action>Glob `_bmad-output/implementation-artifacts/sprints/sprint-*.yaml` to discover all sprint files</action>
  <check if="no sprint files found">
    <output>No sprints found. Run `/add-sprint` first to create a sprint.</output>
    <action>Exit workflow</action>
  </check>
  <action>For each sprint file, read and extract: id, name, status, capacity, items (array), last_modified</action>
  <action>Filter to sprints that have at least 1 item in their items array</action>
  <check if="no sprints have items">
    <output>No sprints contain any items. Nothing to remove.</output>
    <action>Exit workflow</action>
  </check>
  <output>
## Sprints with Items

| # | Sprint | Status | Items | Capacity | Last Modified |
|---|---|---|---|---|---|
{{#each filtered_sprints}}
| {{@index+1}} | {{name}} ({{id}}) | {{status}} | {{items_count}} | {{capacity}} | {{last_modified}} |
{{/each}}
  </output>
  <ask>Select sprint (enter number):</ask>
  <action>Store selected sprint as {{target_sprint}}</action>
  <action>Store {{session_last_modified}} = {{target_sprint.last_modified}} for concurrency guard</action>
</step>

<step n="2" goal="Display sprint items with backlog metadata">
  <action>Read `_bmad-output/implementation-artifacts/backlog.yaml`</action>
  <action>For each item ID in {{target_sprint.items}}, look up metadata from backlog.yaml to get: title, type, status, priority</action>
  <action>If an item is not found in backlog.yaml, infer title from ID (kebab-case to title case) and mark type/status/priority as "unknown"</action>
  <output>
## Items in {{target_sprint.name}}

| # | ID | Title | Type | Status | Priority |
|---|---|---|---|---|---|
{{#each sprint_items}}
| {{@index+1}} | {{id}} | {{title}} | {{type}} | {{status}} | {{priority}} |
{{/each}}
  </output>
</step>

<step n="3" goal="Prompt for items to remove">
  <ask>Which items to remove? Enter item numbers (comma-separated), 'all' to remove all, or 'q' to cancel:</ask>
  <check if="user enters 'q'">
    <output>Cancelled. No changes made.</output>
    <action>Exit workflow</action>
  </check>
  <check if="user enters 'all'">
    <action>Set {{items_to_remove}} = all items in {{target_sprint.items}}</action>
  </check>
  <check if="user enters item numbers">
    <action>Resolve entered numbers against the table from step 2</action>
    <action>Set {{items_to_remove}} = selected items</action>
  </check>
</step>

<step n="4" goal="Confirm removal">
  <output>
## Confirm Removal

The following items will be removed from **{{target_sprint.name}}** and returned to the unassigned backlog:

{{#each items_to_remove}}
- {{id}} — {{title}}
{{/each}}

**Note:** Item status will NOT be changed. Items retain their current status.
  </output>
  <ask>Proceed? [y] Yes / [n] Cancel / [e] Edit selection:</ask>
  <check if="user selects 'n'">
    <output>Cancelled. No changes made.</output>
    <action>Exit workflow</action>
  </check>
  <check if="user selects 'e'">
    <goto step="3" />
  </check>
  <check if="user input is not 'y', 'n', or 'e'">
    <output>Unrecognized option: "{{user_input}}". Please enter [y], [n], or [e].</output>
    <goto step="4" />
  </check>
</step>

<step n="5" goal="Concurrency guard — re-read sprint before writing">
  <action>Re-read the sprint file: `_bmad-output/implementation-artifacts/sprints/{{target_sprint.id}}.yaml`</action>
  <action>Extract the current `last_modified` timestamp from the file</action>
  <check if="current file last_modified != {{session_last_modified}}">
    <output>
**Conflict Detected:** The sprint file was modified since this session started.

**Session started with:** `last_modified: {{session_last_modified}}`
**Current file has:** `last_modified: {{current_file_last_modified}}`
    </output>
    <ask>How to proceed?
- [o] Overwrite with your changes (your modifications replace current file)
- [r] Reload — restart from current file state
- [x] Cancel — discard all changes

Choice:</ask>
    <check if="choice == 'x'">
      <output>Cancelled. Sprint file not modified.</output>
      <action>Exit workflow</action>
    </check>
    <check if="choice == 'r'">
      <action>Reload {{target_sprint}} from current file content</action>
      <action>Update {{session_last_modified}} to current file's last_modified</action>
      <output>Reloaded sprint from current state. Restarting item selection.</output>
      <goto step="2" />
    </check>
    <!-- if 'o', proceed to write with session changes -->
  </check>
</step>

<step n="6" goal="Remove items from sprint and update backlog">
  <action>For each item in {{items_to_remove}}:
    1. Remove the item ID from the sprint's `items` array
    2. In `backlog.yaml`, find the matching backlog entry and set its `sprint` field to null (or remove it)
    3. Do NOT change the item's `status` field — status is preserved as-is
  </action>
  <action>**Dual-write — both files must be updated for consistency:**</action>
  <action>Update `last_modified` in the sprint file to current ISO timestamp</action>
  <action>Write the updated sprint file: `_bmad-output/implementation-artifacts/sprints/{{target_sprint.id}}.yaml`</action>
  <check if="sprint file write fails">
    <output>**Error:** Failed to write sprint file. No changes persisted. Backlog NOT modified.</output>
    <action>Exit workflow</action>
  </check>
  <action>Write the updated `_bmad-output/implementation-artifacts/backlog.yaml`</action>
  <check if="backlog.yaml write fails">
    <output>**Warning: Inconsistent state!** Sprint file was updated but backlog.yaml write failed. Items have been removed from the sprint's `items` array but their `sprint` field in backlog.yaml still references {{target_sprint.id}}. Re-run `/remove-from-sprint` or manually fix backlog.yaml.</output>
  </check>
  <output>
## Removal Complete

**Sprint:** {{target_sprint.name}} ({{target_sprint.id}})

**Removed items:**
{{#each items_to_remove}}
- {{id}} — {{title}} (status unchanged: {{status}})
{{/each}}

**Updated sprint capacity:** {{new_items_count}}/{{target_sprint.capacity}} items ({{new_remaining}} remaining)

**Next Steps:**
- Use `/add-to-sprint` to reassign items to a different sprint
- Use `/sprint-status-view` to view sprint progress
  </output>
</step>

</workflow>
