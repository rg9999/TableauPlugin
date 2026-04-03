---
name: modify-sprint
description: Guided workflow to modify an existing sprint — add/remove items, change capacity, update metadata
type: skill
triggers:
  - "modify sprint"
  - "edit sprint"
---

<!-- PARTIALLY REWORKED: Item assignment is handled by /add-to-sprint (Story 17.4).
     Item removal is handled by /remove-from-sprint (Story 17.5).
     Sprint activation (planning -> active) is handled below (Step 3e).
     The legacy workflow below still references old sprint-plan-{n}.yaml paths for
     other operations. A full rework of modify-sprint is planned for a future story. -->

> **Note:** Item assignment and removal are now handled by `/add-to-sprint` and `/remove-from-sprint`. Use the **Activate Sprint** option below to transition a sprint from `planning` to `active`.

# Modify Sprint Workflow

Guided workflow to modify an existing sprint — add/remove items, change capacity, update metadata.

<workflow>

<step n="3e" goal="Activate a sprint (planning -> active)">
  <action>Glob `_bmad-output/implementation-artifacts/sprints/sprint-*.yaml` to discover all sprint files</action>
  <check if="no sprint files found">
    <output>No sprints found. Run `/add-sprint` first.</output>
    <action>Exit workflow</action>
  </check>
  <action>Read each sprint file; extract: id, name, status, capacity, items count</action>
  <action>Display sprints table</action>
  <output>
## Available Sprints

| # | ID | Name | Status | Items | Capacity |
|---|---|---|---|---|---|
{{#each sprints}}
| {{@index+1}} | {{id}} | {{name}} | {{status}} | {{items_count}} | {{capacity}} |
{{/each}}
  </output>
  <ask>Which sprint to activate? (enter number, or 'q' to cancel):</ask>
  <check if="user enters 'q'">
    <output>Cancelled.</output>
    <action>Exit workflow</action>
  </check>
  <action>Store selected sprint as {{target_sprint}}</action>

  <!-- Validate transition -->
  <check if="target_sprint.status != 'planning'">
    <output>Only sprints in `planning` status can be activated. Sprint "{{target_sprint.name}}" is currently `{{target_sprint.status}}`.</output>
    <action>Exit workflow</action>
  </check>

  <!-- Check single-active constraint -->
  <action>Check if any other sprint has status `active`</action>
  <check if="another sprint is already active">
    <output>Cannot activate "{{target_sprint.name}}" — sprint "{{active_sprint.name}}" ({{active_sprint.id}}) is already active. Close it first before activating another sprint.</output>
    <action>Exit workflow</action>
  </check>

  <ask>Activate "{{target_sprint.name}}" ({{target_sprint.id}})? This will set status to `active`. [y] Yes / [n] Cancel:</ask>
  <check if="user selects 'n'">
    <output>Cancelled.</output>
    <action>Exit workflow</action>
  </check>

  <action>Set target_sprint.status = "active"</action>
  <action>Update `last_modified` to current ISO timestamp</action>
  <action>Write updated sprint file to `_bmad-output/implementation-artifacts/sprints/{{target_sprint.id}}.yaml`</action>
  <output>
Sprint "{{target_sprint.name}}" is now **active**.

**Next Steps:**
- Use `/add-to-sprint` to assign backlog items
- Use `/sprint-status-view` to see sprint progress
  </output>
</step>

<step n="1" goal="List available sprints and select one to modify">
  <action>Glob `_bmad-output/implementation-artifacts/sprint-plan-*.yaml` to discover all sprint artifact files</action>
  <check if="no sprint files found">
    <output>❌ No sprint plans found. Run `/add-sprint` first to create a sprint.</output>
    <action>Exit workflow</action>
  </check>
  <action>For each sprint file found, read and extract: sprint_number, sprint_name, capacity, assigned_items, status, last_modified</action>
  <output>
## 🏃 Available Sprints

| # | Sprint | Status | Capacity | Assigned | Remaining | Last Modified |
|---|---|---|---|---|---|---|
{{#each sprints}}
| {{@index+1}} | {{sprint_name}} (Sprint {{sprint_number}}) | {{status}} | {{capacity}} | {{assigned_count}} | {{remaining}} | {{last_modified}} |
{{/each}}
  </output>
  <ask>Select sprint to modify (enter number):</ask>
  <action>Store selected sprint as {{target_sprint}}</action>
  <action>Store {{session_last_modified}} = {{target_sprint.last_modified}} for later concurrency guard check</action>
</step>

<step n="2" goal="Display current sprint state">
  <action>Initialize {{working_assigned_items}} = copy of {{target_sprint.assigned_items}} — this working list accumulates all add/remove changes made during this session before the final save</action>
  <action>Calculate remaining capacity: {{remaining}} = {{target_sprint.capacity}} - length({{working_assigned_items}})</action>
  <output>
## Sprint: {{target_sprint.sprint_name}} (Sprint {{target_sprint.sprint_number}})

- **Status:** {{target_sprint.status}}
- **Capacity:** {{target_sprint.capacity}} items
- **Assigned Items:** {{assigned_count}} / {{target_sprint.capacity}} ({{remaining}} remaining)
- **Start Context:** {{target_sprint.start_context}}
- **End Context:** {{target_sprint.end_context}}
- **Last Modified:** {{target_sprint.last_modified}}

### Assigned Items
{{#if assigned_items_empty}}
*(No items assigned yet)*
{{else}}
{{#each target_sprint.assigned_items}}
- {{this}}
{{/each}}
{{/if}}
  </output>
</step>

<step n="3" goal="Present modification menu">
  <ask>What would you like to modify?

1. **Add item** — assign a new backlog item to this sprint
2. **Remove item** — remove an assigned item from this sprint
3. **Change capacity** — update the sprint's maximum item capacity
4. **Update metadata** — change sprint name, start/end context, or status
5. **Done** — save all changes and exit

Choice:</ask>
  <check if="choice == 5 or 'done'">
    <goto step="5" />
  </check>
</step>

<step n="3a" goal="Add item" if="choice == 1">
  <action>Read `_bmad-output/implementation-artifacts/sprint-status.yaml` to get all user story keys and statuses</action>
  <action>Glob `_bmad-output/implementation-artifacts/bug-*.md` for bug stories; parse YAML frontmatter for type, severity, title</action>
  <action>Read ALL `_bmad-output/implementation-artifacts/sprint-plan-*.yaml` files to build {{all_assigned_items}} — flat set of every item identifier assigned to any sprint (including the current sprint's {{working_assigned_items}})</action>
  <action>Filter user stories: exclude items whose key is in {{all_assigned_items}} (already assigned to any sprint)</action>
  <action>Filter bug stories: exclude items whose file basename is in {{all_assigned_items}} (already assigned to any sprint)</action>
  <action>Build {{unassigned_items}} from the filtered stories and bugs, with: id, title, type (Story/Bug), status</action>
  <output>
## Unassigned Backlog Items

| # | ID / File | Title | Type | Status |
|---|---|---|---|---|
{{#each unassigned_items}}
| {{@index+1}} | {{id}} | {{title}} | {{type}} | {{status}} |
{{/each}}
  </output>
  <ask>Select item to add (enter number):</ask>
  <action>Store selected item as {{item_to_add}}</action>
  <action>Calculate: {{new_assigned_count}} = current assigned count + 1</action>
  <check if="{{new_assigned_count}} > {{target_sprint.capacity}}">
    <output>⚠️ **Capacity Warning:** Adding "{{item_to_add.title}}" would bring assigned items to {{new_assigned_count}}/{{target_sprint.capacity}} — exceeding capacity by {{overage}}.</output>
    <ask>Options:
- [a] Add anyway (over-capacity acknowledged)
- [s] Skip — do not add this item
- [c] Change capacity first (select option 3 from menu)

Choice:</ask>
    <check if="choice == 's'">
      <goto step="3" />
    </check>
    <check if="choice == 'c'">
      <goto step="3c" />
    </check>
  </check>
  <action>Add {{item_to_add}} identifier to {{working_assigned_items}} list</action>
  <action>Calculate remaining: {{remaining}} = {{target_sprint.capacity}} - length({{working_assigned_items}})</action>
  <output>✅ Added "{{item_to_add.title}}" to sprint. Updated capacity: {{length(working_assigned_items)}}/{{target_sprint.capacity}} items ({{remaining}} remaining)</output>
  <goto step="3" />
</step>

<step n="3b" goal="Remove item" if="choice == 2">
  <check if="{{working_assigned_items}} is empty">
    <output>ℹ️ No items are currently assigned to this sprint.</output>
    <goto step="3" />
  </check>
  <action>Resolve each identifier in {{working_assigned_items}} to its display name and type:
    - For story identifiers (matching pattern `^\d+-\d+-.+`): infer title from key by converting kebab segments to title case (e.g., `12-1-add-sprint-workflow` → "Add Sprint Workflow"); type = "Story"; look up status in sprint-status.yaml if available
    - For bug identifiers (matching pattern `^bug-.+`): look up in bug-*.md frontmatter (re-glob if not already loaded this step) for title and severity; type = "Bug"
    - If resolution fails for any identifier, display the raw identifier as title with type "Unknown"
  </action>
  <output>
## Currently Assigned Items

| # | ID / File | Title | Type |
|---|---|---|---|
{{#each working_assigned_items}}
| {{@index+1}} | {{id}} | {{title}} | {{type}} |
{{/each}}
  </output>
  <ask>Select item to remove (enter number):</ask>
  <action>Remove selected item from {{working_assigned_items}} list</action>
  <action>Calculate remaining: {{remaining}} = {{target_sprint.capacity}} - length({{working_assigned_items}})</action>
  <output>✅ Removed item from sprint. Updated capacity: {{length(working_assigned_items)}}/{{target_sprint.capacity}} items ({{remaining}} remaining)</output>
  <goto step="3" />
</step>

<step n="3c" goal="Change capacity" if="choice == 3">
  <ask>Enter new capacity (positive integer — current: {{target_sprint.capacity}}):</ask>
  <action>Validate input is a positive integer (greater than zero)</action>
  <check if="input is NOT a positive integer">
    <output>❌ Invalid capacity. Must be a positive integer greater than zero.</output>
    <goto step="3c" />
  </check>
  <action>Store {{new_capacity}} = validated integer input</action>
  <action>Calculate: {{new_remaining}} = {{new_capacity}} - length({{working_assigned_items}})</action>
  <output>✅ Capacity updated: {{target_sprint.capacity}} → {{new_capacity}} ({{new_remaining}} slots remaining with current {{length(working_assigned_items)}} assigned items)</output>
  <action>Update {{target_sprint.capacity}} = {{new_capacity}} in working state</action>
  <goto step="3" />
</step>

<step n="3d" goal="Update metadata" if="choice == 4">
  <ask>Which metadata to update?
1. Sprint name (current: "{{target_sprint.sprint_name}}")
2. Start context (current: "{{target_sprint.start_context}}")
3. End context (current: "{{target_sprint.end_context}}")
4. Status (current: {{target_sprint.status}} — options: planning / active / completed)
5. Back to menu

Choice:</ask>
  <check if="choice == 1">
    <ask>New sprint name:</ask>
    <action>Update {{target_sprint.sprint_name}} in working state</action>
    <output>✅ Sprint name updated.</output>
  </check>
  <check if="choice == 2">
    <ask>New start context (date or milestone):</ask>
    <action>Update {{target_sprint.start_context}} in working state</action>
    <output>✅ Start context updated.</output>
  </check>
  <check if="choice == 3">
    <ask>New end context (date or milestone):</ask>
    <action>Update {{target_sprint.end_context}} in working state</action>
    <output>✅ End context updated.</output>
  </check>
  <check if="choice == 4">
    <ask>New status (planning / active / completed):</ask>
    <action>Validate input is one of: planning, active, completed</action>
    <check if="invalid status">
      <output>❌ Invalid status. Choose: planning, active, or completed.</output>
    </check>
    <action>Update {{target_sprint.status}} in working state</action>
    <output>✅ Sprint status updated.</output>
  </check>
  <check if="choice == 5">
    <goto step="3" />
  </check>
  <goto step="3" />
</step>

<step n="4" goal="Concurrency guard — re-read before writing">
  <action>Re-read the sprint artifact file: `_bmad-output/implementation-artifacts/sprint-plan-{{target_sprint.sprint_number}}.yaml`</action>
  <action>Extract the current `last_modified` timestamp from the file</action>
  <check if="current file last_modified != {{session_last_modified}}">
    <output>
⚠️ **Conflict Detected:** The sprint artifact was modified externally since this session started.

**Session started with:** `last_modified: {{session_last_modified}}`
**Current file has:** `last_modified: {{current_file_last_modified}}`

**Current sprint state (re-read from file):**
    </output>
    <action>Display the full current state of the sprint artifact (re-read content)</action>
    <ask>The file has changed. Review the current state above and confirm how to proceed:
- [o] Overwrite with your changes from this session (your modifications will replace current file content)
- [m] Merge — restart modifications from the current file state
- [x] Cancel — discard all session changes

Choice:</ask>
    <check if="choice == 'x'">
      <output>❌ Changes discarded. Sprint file not modified.</output>
      <action>Exit workflow</action>
    </check>
    <check if="choice == 'm'">
      <action>Reload {{target_sprint}} from current file content</action>
      <action>Update {{session_last_modified}} to current file's last_modified</action>
      <action>Reset {{working_assigned_items}} to current file's assigned_items</action>
      <output>🔄 Reloaded sprint from current state. Please re-apply your modifications.</output>
      <goto step="3" />
    </check>
    <!-- if 'o', proceed to write with session changes -->
  </check>
</step>

<step n="5" goal="Persist changes to sprint artifact">
  <action>Invoke concurrency guard (Step 4) before writing</action>
  <action>Get current ISO timestamp for last_modified</action>
  <action>Write updated sprint data back to `_bmad-output/implementation-artifacts/sprint-plan-{{target_sprint.sprint_number}}.yaml`:
    - Update `sprint_name` if changed
    - Update `capacity` if changed
    - Update `assigned_items` with final working list
    - Update `status` if changed
    - Update `start_context` if changed
    - Update `end_context` if changed
    - Update `last_modified` to current ISO timestamp
    - Preserve `sprint_number`, `created_date` unchanged
  </action>
  <action>**Do NOT modify sprint-status.yaml** — sprint membership is exclusively in sprint-plan-{n}.yaml. sprint-status.yaml is read-only from this workflow.</action>
  <action>Calculate final remaining capacity</action>
  <output>
## ✅ Sprint Updated Successfully

**Sprint:** {{target_sprint.sprint_name}} (Sprint {{target_sprint.sprint_number}})
**File:** `_bmad-output/implementation-artifacts/sprint-plan-{{target_sprint.sprint_number}}.yaml`
**Capacity:** {{final_capacity}} items ({{final_remaining}} remaining)
**Assigned Items:** {{final_assigned_count}}
**Status:** {{target_sprint.status}}

**Next Steps:**
- Use `/add-to-sprint` to assign more backlog items
- Use `/sprint-status-view` to view full sprint progress
  </output>
</step>

</workflow>
