---
name: prioritize-backlog
description: Reprioritize backlog items using multiple criteria — severity, business value, dependencies, type, age
type: skill
triggers:
  - "prioritize backlog"
  - "reorder backlog"
  - "reprioritize"
---

# Prioritize-Backlog Workflow

Reprioritize backlog items using multiple criteria — severity, business value, dependencies, type, and age.

<workflow>

<step n="1" goal="Load backlog and dependency data">
  <action>Read `_bmad-output/implementation-artifacts/backlog.yaml`</action>
  <check if="file missing or empty (no items)">
    <output>No backlog found or backlog is empty. Nothing to prioritize.</output>
    <action>Exit workflow</action>
  </check>
  <action>Store all backlog items as {{backlog_items}}</action>
  <action>Infer implicit dependencies: stories belonging to the same epic are assumed to be sequential (lower story number before higher)</action>
  <action>Read `_bmad-output/implementation-artifacts/epics.md` (or equivalent epics source) for any explicitly declared dependencies</action>
  <action>Build {{dependency_map}} — for each item, list the IDs it depends on (must be completed before it can start)</action>
</step>

<step n="2" goal="Display current backlog ordering">
  <output>
## Current Backlog

| # | Priority | ID | Title | Type | Epic | Status | Sprint | Severity | Dependencies |
|---|---|---|---|---|---|---|---|---|---|
{{#each backlog_items}}
| {{@index+1}} | {{priority}} | {{id}} | {{title}} | {{type}} | {{epic}} | {{status}} | {{sprint}} | {{severity}} | {{dependencies}} |
{{/each}}

*Total: {{backlog_items.length}} items*
  </output>
</step>

<step n="3" goal="Choose prioritization mode">
  <ask>Choose prioritization mode:
1. **Full reprioritization** — enter items in desired order, remaining appended at end
2. **Quick adjust** — move individual items up/down
3. **Auto-suggest** — AI analysis with weighted criteria
4. **Cancel**

Choice:</ask>
  <check if="choice == 4">
    <output>Cancelled. No changes made.</output>
    <action>Exit workflow</action>
  </check>
</step>

<step n="3a" goal="Full reprioritization" if="choice == 1">
  <ask>Enter item numbers in your desired priority order (comma-separated). Items not listed will be appended in their current relative order:</ask>
  <action>Resolve entered numbers against the backlog table from step 2</action>
  <action>Build {{new_order}}: user-specified items first (in given order), then remaining items appended in their original relative order</action>
  <goto step="4" />
</step>

<step n="3b" goal="Quick adjust" if="choice == 2">
  <action>Initialize {{new_order}} as a copy of the current {{backlog_items}} list (preserving current ordering)</action>
  <ask>Select item number to move:</ask>
  <action>Store selected item as {{item_to_move}}</action>
  <ask>Move to:
- Enter a position number (1 = top, N = bottom)
- Or enter 'u' to move up one position, 'd' to move down one position

Target:</ask>
  <action>Move {{item_to_move}} to the specified position in {{new_order}}</action>
  <output>Moved "{{item_to_move.title}}" to position {{new_position}}.</output>
  <ask>Continue? [m] Move another item / [d] Done adjusting:</ask>
  <check if="user selects 'm'">
    <action>Display current ordering</action>
    <goto step="3b" />
  </check>
  <check if="user selects 'd'">
    <goto step="4" />
  </check>
</step>

<step n="3c" goal="Auto-suggest prioritization" if="choice == 3">
  <action>Analyze all backlog items using weighted criteria:
    1. **Blocking dependencies** (highest weight) — items that block other items should come first
    2. **Severity** (bugs only) — critical > high > medium > low
    3. **Business value** — infer from epic priority, item description, and type
    4. **Type priority** — bugs generally before stories of equal value
    5. **Age** — older items (lower story numbers, earlier creation) get slight priority boost
  </action>
  <action>Generate {{suggested_order}} with rationale for each item's position</action>
  <output>
## Auto-Suggested Priority Order

| New # | ID | Title | Type | Rationale |
|---|---|---|---|---|
{{#each suggested_order}}
| {{@index+1}} | {{id}} | {{title}} | {{type}} | {{rationale}} |
{{/each}}
  </output>
  <ask>Options:
- [a] Accept this ordering
- [m] Modify (switch to full reprioritization with this as starting point)
- [r] Reject (return to mode selection)

Choice:</ask>
  <check if="user selects 'a'">
    <action>Set {{new_order}} = {{suggested_order}}</action>
    <goto step="4" />
  </check>
  <check if="user selects 'm'">
    <action>Set current backlog display to {{suggested_order}}</action>
    <goto step="3a" />
  </check>
  <check if="user selects 'r'">
    <goto step="3" />
  </check>
</step>

<step n="4" goal="Dependency validation">
  <action>For each item in {{new_order}}, check if it appears before any item it depends on</action>
  <check if="dependency violations found">
    <output>
**Dependency Warning:** The following items appear before their dependencies:

{{#each violations}}
- **{{item.id}}** (position {{item.position}}) depends on **{{dependency.id}}** (position {{dependency.position}})
{{/each}}
    </output>
    <ask>How to proceed?
- [o] Override — keep current order despite dependency warnings
- [f] Fix — automatically reorder to satisfy dependencies
- [c] Cancel — return to mode selection

Choice:</ask>
    <check if="user selects 'f'">
      <action>Reorder {{new_order}} to satisfy dependency constraints (move dependency items before their dependents, preserving relative order otherwise)</action>
      <output>Dependencies fixed. Updated ordering applied.</output>
    </check>
    <check if="user selects 'c'">
      <goto step="3" />
    </check>
    <!-- if 'o', proceed with current order -->
  </check>
</step>

<step n="5" goal="Confirm and persist new ordering">
  <output>
## Old vs New Priority Order

| Position | Old | New |
|---|---|---|
{{#each comparison}}
| {{position}} | {{old_id}} — {{old_title}} | {{new_id}} — {{new_title}} |
{{/each}}
  </output>
  <ask>Provide a brief reason for this reprioritization:</ask>
  <action>Store as {{reason}}</action>
  <ask>Confirm? [y] Apply / [n] Cancel / [e] Edit order:</ask>
  <check if="user selects 'n'">
    <output>Cancelled. No changes made.</output>
    <action>Exit workflow</action>
  </check>
  <check if="user selects 'e'">
    <goto step="3" />
  </check>
  <check if="user input is not 'y', 'n', or 'e'">
    <output>Unrecognized option: "{{user_input}}". Please enter [y], [n], or [e].</output>
    <goto step="5" />
  </check>

  <action>Update `_bmad-output/implementation-artifacts/backlog.yaml`:
    - Rewrite items in {{new_order}} sequence
    - Set priority fields sequentially: 1, 2, 3, ..., N
    - Add or update header comment: `# Reprioritized: {{current_date}} — {{reason}}`
    - Preserve all other item fields unchanged
  </action>
  <output>
## Reprioritization Complete

**Items reordered:** {{new_order.length}}
**Reason:** {{reason}}
**Date:** {{current_date}}

Updated priorities written to `_bmad-output/implementation-artifacts/backlog.yaml`.

**Next Steps:**
- Use `/sprint-status-view` to review sprint assignments
- Use `/add-to-sprint` to assign top-priority items to a sprint
  </output>
</step>

</workflow>
