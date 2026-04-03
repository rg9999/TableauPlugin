---
name: add-to-sprint
description: Guided workflow to assign backlog items to a sprint from the flat prioritized backlog
type: skill
triggers:
  - "add to sprint"
  - "assign to sprint"
---

# Add-to-Sprint Workflow

Guided workflow to assign unassigned backlog items to a sprint from the flat prioritized backlog.

<workflow>

<step n="1" goal="Load backlog and identify unassigned items">
  <action>Read `_bmad-output/implementation-artifacts/backlog.yaml`</action>
  <action>Parse the `backlog` array. Filter items where `sprint` is `null` (unassigned).</action>
  <action>Sort filtered items by `priority` ascending (lowest number = highest priority).</action>
  <action>Store as {{unassigned_items}} list.</action>
  <check if="no unassigned items remain">
    <output>All backlog items are already assigned to sprints. Nothing to assign.</output>
    <action>Exit workflow</action>
  </check>
</step>

<step n="2" goal="Load sprints and select target">
  <action>Glob `_bmad-output/implementation-artifacts/sprints/sprint-*.yaml` to discover all sprint files</action>
  <check if="no sprint files found">
    <output>No sprints exist. Run `/add-sprint` first to create a sprint before assigning items.</output>
    <action>Exit workflow</action>
  </check>
  <action>Read each sprint file; extract: id, name, status, capacity, items (array length = assigned count)</action>
  <action>Sort sprints by status: `active` first, then `planning`, then `closed`</action>
  <action>Display sprints table (closed sprints shown but marked as not selectable):</action>
  <output>
## Available Sprints

| # | ID | Name | Status | Capacity | Assigned | Remaining |
|---|---|---|---|---|---|---|
{{#each sprints}}
| {{@index+1}} | {{id}} | {{name}} | {{status}} | {{capacity}} | {{assigned_count}} | {{remaining}} |
{{/each}}

*Closed sprints are shown for reference but cannot be selected.*
  </output>
  <check if="exactly one active sprint exists">
    <output>Auto-selecting active sprint: {{active_sprint.name}} ({{active_sprint.id}})</output>
    <ask>Proceed with this sprint? [y] Yes / [n] Choose a different sprint:</ask>
    <check if="user selects 'y'">
      <action>Set {{target_sprint}} = the active sprint</action>
    </check>
    <check if="user selects 'n'">
      <ask>Select target sprint by number (active or planning only):</ask>
      <action>Validate selection is not a closed sprint</action>
      <action>Store as {{target_sprint}}</action>
    </check>
  </check>
  <check if="no active sprint exists OR multiple active/planning sprints">
    <ask>Select target sprint by number (active or planning only):</ask>
    <action>Validate selection is not a closed sprint</action>
    <check if="user selected a closed sprint">
      <output>Closed sprints cannot receive new items. Select an active or planning sprint.</output>
      <goto step="2" />
    </check>
    <action>Store as {{target_sprint}}</action>
  </check>
</step>

<step n="3" goal="Display sprint capacity and unassigned backlog items">
  <action>Calculate: {{assigned_count}} = length of {{target_sprint.items}}</action>
  <action>Calculate: {{remaining_capacity}} = {{target_sprint.capacity}} - {{assigned_count}}</action>
  <output>
## Sprint Capacity: {{target_sprint.name}} ({{target_sprint.id}})

[{{capacity_bar}}] {{assigned_count}}/{{target_sprint.capacity}} items ({{remaining_capacity}} remaining)

{{#if remaining_capacity <= 0}}
Warning: This sprint is at or over capacity. Adding items will exceed the limit.
{{/if}}
  </output>

  <action>Take the top 20 items from {{unassigned_items}} (or all if fewer than 20)</action>
  <output>
## Unassigned Backlog Items

| # | ID | Title | Type | Priority | Severity |
|---|---|---|---|---|---|
{{#each displayed_items}}
| {{@index+1}} | {{id}} | {{title}} | {{type}} | {{priority}} | {{severity_or_na}} |
{{/each}}

*Showing {{displayed_count}} of {{total_unassigned}} unassigned items.*
  </output>
</step>

<step n="4" goal="Prompt for item selection">
  <ask>Select items to add (comma-separated numbers, 'all' for all shown, or 'q' to cancel):</ask>
  <check if="user enters 'q'">
    <output>Assignment cancelled -- no changes made.</output>
    <action>Exit workflow</action>
  </check>
  <check if="user enters 'all'">
    <action>Set {{selected_items}} = all displayed items from step 3</action>
  </check>
  <check if="user enters comma-separated numbers">
    <action>Parse and validate each number is within the displayed list range</action>
    <check if="any number is invalid or out of range">
      <output>Invalid selection: {{invalid_numbers}}. Enter numbers from the list above.</output>
      <goto step="4" />
    </check>
    <action>Set {{selected_items}} = the items corresponding to the entered numbers</action>
  </check>
</step>

<step n="5" goal="Capacity check and assignment">
  <action>For each item in {{selected_items}}, in order:</action>
  <action>Re-calculate current assigned count (accounts for items already added in this session)</action>
  <check if="adding this item would exceed capacity">
    <output>Capacity Warning: Adding "{{item.title}}" ({{item.id}}) would bring assigned items to {{new_count}}/{{target_sprint.capacity}} -- exceeding sprint capacity by {{overage}}.</output>
    <ask>Options:
- [a] Add anyway (over-capacity acknowledged)
- [s] Skip this item
- [q] Quit (stop assigning, keep items already assigned this session)

Choice:</ask>
    <check if="user selects 's'">
      <action>Skip this item -- do not add to sprint. Continue to next item.</action>
    </check>
    <check if="user selects 'q'">
      <action>Stop processing remaining items. Proceed to step 6 with items confirmed so far.</action>
    </check>
    <check if="user selects 'a'">
      <action>Proceed with adding this item despite over-capacity.</action>
    </check>
  </check>
  <action>For each confirmed item:
    - Add item ID to {{target_sprint}}.items array
    - Set item's `sprint` field in backlog.yaml to {{target_sprint.id}}
    - Update {{target_sprint}}.last_modified to current ISO timestamp
  </action>
  <action>Store all confirmed items as {{assigned_items}} for the summary.</action>
</step>

<step n="6" goal="Persist changes and display summary">
  <check if="no items were confirmed for assignment">
    <output>No items were assigned. No files modified.</output>
    <action>Exit workflow</action>
  </check>
  <action>**Dual-write — both files must be updated for consistency:**</action>
  <action>Write updated `_bmad-output/implementation-artifacts/backlog.yaml`:
    - Preserve all existing fields on all items
    - Only the `sprint` field changes on assigned items (set to {{target_sprint.id}})
  </action>
  <check if="backlog.yaml write fails">
    <output>**Error:** Failed to write backlog.yaml. No changes persisted. Sprint file NOT modified.</output>
    <action>Exit workflow</action>
  </check>
  <action>Write updated `_bmad-output/implementation-artifacts/sprints/{{target_sprint.id}}.yaml`:
    - Append confirmed item IDs to the `items` array
    - Update `last_modified` to current ISO timestamp
    - Preserve all other fields unchanged
  </action>
  <check if="sprint file write fails">
    <output>**Warning: Inconsistent state!** backlog.yaml was updated but sprint file write failed. The `sprint` field in backlog.yaml now references {{target_sprint.id}} but the sprint file's `items` array is stale. Re-run `/add-to-sprint` or manually fix `sprints/{{target_sprint.id}}.yaml`.</output>
  </check>
  <action>**Do NOT read or write sprint-plan-*.yaml or sprint-status.yaml**</action>
  <output>
## Assignment Complete

**Sprint:** {{target_sprint.name}} ({{target_sprint.id}})
**Items assigned this session:** {{assigned_count_this_session}}

| # | ID | Title | Type | Priority |
|---|---|---|---|---|
{{#each assigned_items}}
| {{@index+1}} | {{id}} | {{title}} | {{type}} | {{priority}} |
{{/each}}

**Capacity Usage:** {{new_assigned_total}}/{{target_sprint.capacity}} items ({{new_remaining}} remaining)

**Next Steps:**
- Use `/add-to-sprint` again to assign more items
- Use `/modify-sprint` to adjust capacity or remove items
- Use `/sprint-status-view` to view the full sprint with all assigned items
  </output>
</step>

</workflow>
