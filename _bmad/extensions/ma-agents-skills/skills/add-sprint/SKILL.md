---
name: add-sprint
description: Guided workflow to create a new sprint entity with capacity limits, optional ISO dates, and structured YAML schema for sprint planning
type: skill
triggers:
  - "add sprint"
  - "create sprint"
---

# Add Sprint Workflow

Guided workflow to create a new sprint entity with capacity limits, optional ISO dates, and structured YAML schema.

<workflow>

<step n="1" goal="Gather and validate sprint number and name">
  <action>Ask the user for the sprint number</action>
  <ask>What is the sprint number? (positive integer, e.g., 1, 2, 3)</ask>
  <action>Store input as {{sprint_number_input}}</action>
  <action>Validate {{sprint_number_input}} matches `^[1-9]\d*$` (positive integer, no leading zeros, no non-numeric characters)</action>
  <action>Validate {{sprint_number_input}} is <= 9999</action>
  <check if="{{sprint_number_input}} fails validation (zero, negative, non-numeric, leading zeros like '03', or > 9999)">
    <output>❌ Invalid sprint number: "{{sprint_number_input}}". Must be a positive integer (1-9999), no leading zeros.</output>
    <goto step="1" />
  </check>
  <action>Store as {{sprint_number}} (integer)</action>
  <action>Construct {{sprint_id}} = "sprint-{{sprint_number}}"</action>

  <!-- Smart default name: detect naming patterns from existing sprints -->
  <action>Glob `_bmad-output/implementation-artifacts/sprints/sprint-*.yaml` to discover existing sprint files</action>
  <action>If existing sprints found, read the `name` field from the most recent one (highest sprint number)</action>
  <action>Infer a smart default name:
    - If previous name follows a sequential pattern with a numeric suffix (e.g., "app04"), suggest the next increment (e.g., "app05")
    - If previous name follows a date pattern (e.g., "2026-W14"), suggest the next date interval
    - If previous name is "Sprint {n}", suggest "Sprint {{sprint_number}}"
    - If no pattern detected or no existing sprints, default to "Sprint {{sprint_number}}"
  </action>
  <ask>Sprint name? (press Enter for "{{default_name}}", or type a custom name):</ask>
  <action>If user presses Enter or leaves blank, set {{sprint_name}} = "{{default_name}}"</action>
  <action>If user provides input, store as {{sprint_name}}</action>
</step>

<step n="2" goal="Gather capacity as positive integer">
  <action>Explain capacity: the maximum number of items (stories + bugs) that can be assigned to this sprint</action>
  <ask>What is the sprint capacity? (Enter a positive integer — the maximum number of stories/bugs for this sprint)</ask>
  <action>Store input as {{capacity_input}}</action>
  <action>Validate {{capacity_input}} is a positive integer (greater than zero, no decimals, no non-numeric characters)</action>
  <check if="{{capacity_input}} is NOT a positive integer">
    <output>❌ Invalid capacity: "{{capacity_input}}". Capacity must be a positive integer (e.g., 5, 10, 20). Zero and negative values are not allowed.</output>
    <goto step="2" />
  </check>
  <action>Store as {{capacity}} (integer)</action>
</step>

<step n="3a" goal="Gather optional start date (ISO format)">
  <action>Explain: start and end dates are optional ISO dates (YYYY-MM-DD format). Press Enter to skip.</action>
  <ask>Optional — Sprint start date (YYYY-MM-DD, press Enter to skip):</ask>
  <action>Store input as {{start_input}}</action>
  <check if="{{start_input}} is not empty">
    <action>Validate {{start_input}} matches regex `^\d{4}-\d{2}-\d{2}$`</action>
    <action>Verify {{start_input}} resolves to a real calendar date (reject impossible dates like 2026-02-30, 2026-13-45, etc.)</action>
    <check if="{{start_input}} fails date validation">
      <output>❌ Invalid date: "{{start_input}}". Must be a valid date in YYYY-MM-DD format (e.g., 2026-04-01).</output>
      <goto step="3a" />
    </check>
  </check>
  <action>Store as {{start_date}} (valid ISO date string, or empty string "" if skipped)</action>
</step>

<step n="3b" goal="Gather optional end date (ISO format)">
  <ask>Optional — Sprint end date (YYYY-MM-DD, press Enter to skip):</ask>
  <action>Store input as {{end_input}}</action>
  <check if="{{end_input}} is not empty">
    <action>Validate {{end_input}} matches regex `^\d{4}-\d{2}-\d{2}$`</action>
    <action>Verify {{end_input}} resolves to a real calendar date</action>
    <check if="{{end_input}} fails date validation">
      <output>❌ Invalid date: "{{end_input}}". Must be a valid date in YYYY-MM-DD format (e.g., 2026-04-14).</output>
      <goto step="3b" />
    </check>
  </check>
  <action>Store as {{end_date}} (valid ISO date string, or empty string "" if skipped)</action>

  <check if="both {{start_date}} and {{end_date}} are non-empty AND {{start_date}} > {{end_date}}">
    <output>❌ Invalid date range: start date ({{start_date}}) is after end date ({{end_date}}). Start must be on or before end.</output>
    <goto step="3a" />
  </check>
</step>

<step n="4" goal="Confirm and validate all inputs">
  <output>
## Sprint Summary — Please Confirm

- **Sprint ID:** {{sprint_id}}
- **Sprint Name:** "{{sprint_name}}"
- **Status:** planning
- **Capacity (max items):** {{capacity}}
- **Start Date:** {{start_date}} *(empty if skipped)*
- **End Date:** {{end_date}} *(empty if skipped)*
- **Items:** [] *(empty — items assigned via /add-to-sprint)*
- **Output File:** `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml`
  </output>
  <ask>Confirm creation? [y] Yes / [n] Cancel / [e] Edit a field:</ask>
  <check if="user selects 'e'">
    <ask>Which field to edit? (number / name / capacity / start / end)</ask>
    <check if="field == 'number'">
      <ask>New sprint number? (positive integer, 1-9999)</ask>
      <action>Store input as {{sprint_number_input}}</action>
      <action>Validate {{sprint_number_input}} matches `^[1-9]\d*$` and is <= 9999</action>
      <check if="{{sprint_number_input}} fails validation">
        <output>❌ Invalid sprint number: "{{sprint_number_input}}". Must be a positive integer (1-9999), no leading zeros.</output>
        <goto step="4" />
      </check>
      <action>Store as {{sprint_number}} (integer)</action>
      <action>Construct {{sprint_id}} = "sprint-{{sprint_number}}"</action>
      <action>If sprint name was using previous default "Sprint {old_n}", update to "Sprint {{sprint_number}}"</action>
      <action>Check if file exists at `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml`</action>
      <check if="file already exists at new path">
        <output>⚠️ A sprint entity already exists at `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml`. You will be prompted to overwrite at creation.</output>
      </check>
      <goto step="4" />
    </check>
    <check if="field == 'name'">
      <ask>New sprint name (or press Enter to use "Sprint {{sprint_number}}"):</ask>
      <action>If blank, set {{sprint_name}} = "Sprint {{sprint_number}}"; else store user input as {{sprint_name}}</action>
      <goto step="4" />
    </check>
    <check if="field == 'capacity'"><goto step="2" /></check>
    <check if="field == 'start'"><goto step="3a" /></check>
    <check if="field == 'end'"><goto step="3b" /></check>
    <check if="field is not recognized">
      <output>❌ Unrecognized field: "{{field}}". Valid options: number, name, capacity, start, end.</output>
      <goto step="4" />
    </check>
  </check>
  <check if="user selects 'n'">
    <output>❌ Sprint creation cancelled.</output>
    <action>Exit workflow</action>
  </check>
  <check if="user input is not 'y', 'n', or 'e'">
    <output>❌ Unrecognized option: "{{user_input}}". Please enter [y] Yes, [n] Cancel, or [e] Edit a field.</output>
    <goto step="4" />
  </check>
</step>

<step n="5" goal="Generate sprint entity YAML file">
  <action>Determine output path: `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml`</action>
  <action>Ensure directory `_bmad-output/implementation-artifacts/sprints/` exists (create if needed)</action>

  <!-- Overwrite protection for new path -->
  <action>Check if file already exists at `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml`</action>
  <check if="file already exists at new path">
    <anchor id="overwrite_prompt" />
    <output>⚠️ A sprint entity already exists at `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml`.</output>
    <ask>Overwrite existing sprint? [y] Yes / [n] Cancel:</ask>
    <check if="user selects 'n'">
      <output>❌ Sprint creation cancelled to preserve existing sprint.</output>
      <action>Exit workflow</action>
    </check>
    <check if="user input is not 'y' or 'n'">
      <output>❌ Unrecognized option: "{{user_input}}". Please enter [y] Yes or [n] Cancel.</output>
      <goto anchor="overwrite_prompt" />
    </check>
  </check>

  <!-- Advisory check for old-format file -->
  <action>Check if file exists at old path: `_bmad-output/implementation-artifacts/sprint-plan-{{sprint_number}}.yaml`</action>
  <check if="old-format file exists">
    <output>ℹ️ **Note:** An old-format sprint file exists at `_bmad-output/implementation-artifacts/sprint-plan-{{sprint_number}}.yaml`. The new sprint will be created at the new path. The old file is NOT auto-migrated — review or remove it manually if no longer needed.</output>
  </check>

  <action>Get current ISO timestamp for created_date and last_modified</action>
  <action>Write sprint entity YAML to `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml` with this structure:

```yaml
id: {{sprint_id}}
name: "{{sprint_name}}"
status: planning
capacity: {{capacity}}
start: "{{start_date}}"
end: "{{end_date}}"
items: []
created_date: "{{current_iso_timestamp}}"
last_modified: "{{current_iso_timestamp}}"
```

  **YAML output rules:**
  - Always quote the `name` field to handle special characters
  - `start` and `end` are empty string `""` if skipped
  - `items` is always empty array `[]` at creation
  - `status` is always `planning` at creation (never `active` or `closed`)
  </action>
  <output>
✅ **Sprint created successfully!**

- **File:** `_bmad-output/implementation-artifacts/sprints/{{sprint_id}}.yaml`
- **Sprint:** {{sprint_name}}
- **Capacity:** {{capacity}} items
- **Status:** planning

**Next Steps:**
- Use `/add-to-sprint` to assign backlog items to this sprint
- Use `/modify-sprint` to update sprint details later
- Use `/sprint-status-view` to view sprint progress
  </output>
</step>

</workflow>
