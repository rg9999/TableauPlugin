---
name: sprint-status-view
description: Display sprint progress with capacity, items, and backlog. Regenerates sprint-status.yaml.
type: skill
triggers:
  - "sprint status view"
  - "view sprint status"
---

# Sprint Status View Workflow

Display sprint status with capacity, items, and backlog summary. Regenerates `sprint-status.yaml` from authoritative sources.

<workflow>

<step n="1" goal="Suggest running /cleanup-done first">
  <output>
**Tip:** Consider running `/cleanup-done` before viewing sprint status to archive completed items and free capacity.
  </output>
  <action>Continue to next step (advisory only -- do not auto-invoke /cleanup-done)</action>
</step>

<step n="2" goal="Load data sources">
  <action>Glob `_bmad-output/implementation-artifacts/sprints/sprint-*.yaml` to discover all sprint entity files</action>
  <action>Store discovered sprint files as {{sprint_files}} list</action>

  <action>Read `_bmad-output/implementation-artifacts/backlog.yaml` if it exists</action>
  <action>Store the backlog items list as {{backlog_items}} (or empty list if file not found)</action>

  <action>Glob `_bmad-output/implementation-artifacts/bug-*.md` to discover all bug story files (fallback for bug metadata)</action>
  <action>For each bug file found, parse YAML frontmatter to extract: title, severity, status</action>
  <action>Store as {{bug_metadata_map}} keyed by file basename (e.g., `bug-login-crash`)</action>

  <action>Read `_bmad-output/implementation-artifacts/sprint-status.yaml` if it exists (fallback for story status when backlog.yaml is missing or incomplete)</action>
  <action>Parse development_status section into {{status_fallback_map}} -- key: story key, value: status</action>
  <action>Exclude epic-* keys and *-retrospective keys from the fallback map</action>

  <check if="no sprint files found AND no backlog.yaml exists">
    <output>
**No Sprint Data Found**

No sprint files exist (`sprints/sprint-*.yaml`) and no `backlog.yaml` was found.

**To get started:**
1. Run `/generate-backlog` to create a backlog from your epics
2. Run `/add-sprint` to create your first sprint
3. Run `/add-to-sprint` to assign backlog items to it
    </output>
    <action>Exit workflow</action>
  </check>
</step>

<step n="3" goal="Display each sprint">
  <action>For each sprint in {{sprint_files}}, read the full YAML content</action>
  <action>Sort sprints for display: active first, then planning, then closed</action>
  <action>Initialize {{total_done_in_sprints}} = 0 for step 4</action>

  <action>For each sprint (in sorted order):

    **If sprint.status is "closed":**
    - Count total items in sprint.items
    - Display collapsed summary line only

    **If sprint.status is NOT "closed" (active or planning):**
    - Calculate {{item_count}} = length(sprint.items)
    - For each item identifier in sprint.items, resolve details:
      - Look up item in {{backlog_items}} by matching `id` field
      - If found in backlog: use `type`, `title`, `status`, `severity` from backlog entry
      - If NOT found in backlog and item matches `^bug-`: look up in {{bug_metadata_map}} for title/severity, use status from bug frontmatter or default to "backlog"
      - If NOT found in backlog and item matches a story pattern: look up in {{status_fallback_map}} for status, infer title from key, set type to "story"
      - If item cannot be resolved from any source: display with raw identifier, type "unknown", status "unknown"
    - If resolved item status is "done", increment {{total_done_in_sprints}}
    - Build capacity bar: `[===---]` style where `=` represents filled slots and `-` represents remaining capacity
  </action>

  <action>Display non-closed sprints:</action>
  <output>
{{#each non_closed_sprints}}
---

## {{sprint.name}} ({{sprint.status}}) -- {{item_count}}/{{sprint.capacity}} items

{{#if sprint.start}}**Start:** {{sprint.start}}{{/if}}{{#if sprint.end}} | **End:** {{sprint.end}}{{/if}}

| Item | Type | Status |
|---|---|---|
{{#each resolved_items}}
| {{id}} | {{#if is_story}}[story]{{/if}}{{#if is_bug}}[bug, {{severity}}]{{/if}} | {{status}} |
{{/each}}
{{#if items_empty}}
*(No items assigned)*
{{/if}}

**Capacity:** {{capacity_bar}}
{{/each}}
  </output>

  <action>Display closed sprints:</action>
  <output>
{{#each closed_sprints}}
---
**{{sprint.name}}** (closed) -- {{item_count}} items completed
{{/each}}
  </output>
</step>

<step n="4" goal="Completed items summary">
  <action>Count items with status "done" that are still present in non-closed sprint files (use {{total_done_in_sprints}} from step 3)</action>
  <check if="total_done_in_sprints > 0">
    <output>
---

## Completed Items

{{total_done_in_sprints}} done item(s) are still in sprint files. Run `/cleanup-done` to archive them and free capacity.
    </output>
  </check>
  <check if="total_done_in_sprints == 0">
    <action>Skip this section -- no done items lingering in sprints</action>
  </check>
</step>

<step n="5" goal="Unassigned backlog">
  <action>Filter {{backlog_items}} to find items where sprint is null (unassigned)</action>
  <action>Exclude items with status "done" from the unassigned list</action>
  <action>Sort unassigned items by priority ascending (lowest number = highest priority)</action>
  <action>Store as {{unassigned_items}}</action>
  <action>Store total count as {{unassigned_total}}</action>
  <action>Take top 15 items for display as {{unassigned_display}}</action>

  <check if="unassigned_total > 0">
    <output>
---

## Unassigned Backlog

| # | Item | Type | Priority | Status |
|---|---|---|---|---|
{{#each unassigned_display}}
| {{priority}} | {{id}} | {{type}} | {{priority}} | {{status}} |
{{/each}}
{{#if unassigned_total > 15}}

... and {{unassigned_total - 15}} more
{{/if}}
    </output>
  </check>
  <check if="unassigned_total == 0">
    <output>
---

## Unassigned Backlog

*(All backlog items are assigned to sprints)*
    </output>
  </check>
</step>

<step n="6" goal="Next actions menu">
  <ask>
**Next Actions:**
[1] Full backlog
[2] /add-to-sprint
[3] /remove-from-sprint
[4] /prioritize-backlog
[5] /add-sprint
[6] /cleanup-done
[7] Exit

Choice:
  </ask>
  <check if="choice == 1">
    <action>Display all items from {{backlog_items}} in a table: id, type, priority, status, sprint, severity</action>
    <goto step="6" />
  </check>
  <check if="choice == 2">
    <output>Run `/add-to-sprint` to assign backlog items to a sprint.</output>
  </check>
  <check if="choice == 3">
    <output>Run `/remove-from-sprint` to remove items from a sprint.</output>
  </check>
  <check if="choice == 4">
    <output>Run `/prioritize-backlog` to reorder backlog priorities.</output>
  </check>
  <check if="choice == 5">
    <output>Run `/add-sprint` to create a new sprint.</output>
  </check>
  <check if="choice == 6">
    <output>Run `/cleanup-done` to archive completed items from sprints.</output>
  </check>
  <check if="choice == 7">
    <action>Exit workflow</action>
  </check>
</step>

<step n="7" goal="Regenerate sprint-status.yaml (internal)" internal="true">
  <action>This step runs automatically after display (steps 3-6) completes, before the workflow exits.</action>

  <action>Read existing `_bmad-output/implementation-artifacts/sprint-status.yaml` if it exists</action>
  <action>Preserve the STATUS DEFINITIONS comment block at the top of the file (lines starting with `#` that define status values)</action>
  <action>Preserve any epic-* keys and *-retrospective keys from the existing file</action>

  <action>Build the new development_status section:
    - Source 1: {{backlog_items}} from backlog.yaml -- for each item where status is NOT "done", add an entry: key = item.id, value = item.status
    - Source 2: sprint entity files -- for each sprint, for each item in sprint.items, ensure the item has an entry. If the item was already added from backlog.yaml, the backlog value wins. If the item is NOT in backlog.yaml, look up status from {{bug_metadata_map}} or {{status_fallback_map}}.
    - Exclude items with status "done" -- only non-done items appear in sprint-status.yaml
  </action>

  <action>Collect sprint metadata for header comments:
    - For each sprint: id, name, status, item count, capacity
  </action>

  <action>Get current ISO timestamp as {{generated_at}}</action>

  <action>Write `_bmad-output/implementation-artifacts/sprint-status.yaml` with this structure:

```yaml
# generated: {{original_generated_date or generated_at}}
# updated: {{generated_at}} — regenerated by sprint-status-view
# project: {{project_name from existing file or "unknown"}}
# project_key: {{project_key from existing file or "NOKEY"}}
# tracking_system: file-system
# story_location: _bmad-output/implementation-artifacts
#
# Sprints:
{{#each sprints}}
#   {{sprint.id}}: {{sprint.name}} ({{sprint.status}}) — {{item_count}}/{{sprint.capacity}} items
{{/each}}
#
# STATUS DEFINITIONS:
# ==================
# (preserve the full STATUS DEFINITIONS block from the existing file verbatim)
# If no existing file, use these defaults:
# backlog        — item is in the backlog, not yet started
# ready-for-dev  — story file created, ready for development
# in-progress    — item is actively being worked on
# review         — item is in review
# done           — item is complete (excluded from this file)

{{#if preserved_epic_keys}}
# Epic tracking
{{#each preserved_epic_keys}}
{{key}}: {{value}}
{{/each}}
{{/if}}

development_status:
{{#each active_items}}
  {{id}}: {{status}}
{{/each}}

{{#if preserved_retro_keys}}
# Retrospective tracking
{{#each preserved_retro_keys}}
{{key}}: {{value}}
{{/each}}
{{/if}}
```

  </action>
</step>

</workflow>
