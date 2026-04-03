---
name: create-bug-story
description: Guided workflow to create a structured bug story from a detected defect
type: skill
triggers:
  - "create bug story"
  - "report bug"
---

# Create Bug Story Workflow

Guided workflow to create a structured bug story from a detected defect and add it to the backlog as a standalone item.

<workflow>

<step n="1" goal="Gather bug title and severity">
  <action>Explain: This workflow creates a structured bug story file that enters the backlog alongside user stories.</action>
  <ask>What is the bug title? (short, descriptive — e.g., "Login fails with empty password field")</ask>
  <action>Store as {{bug_title}}</action>
  <action>Validate {{bug_title}} is not empty</action>
  <check if="{{bug_title}} is empty">
    <output>❌ Bug title cannot be empty.</output>
    <goto step="1" />
  </check>

  <output>
**Severity levels:**
- `critical` — Data loss, security breach, or system crash in normal usage
- `high` — Core feature broken or serious security risk; blocks users
- `medium` — Feature partially broken or degraded; workaround exists
- `low` — Minor issue, cosmetic defect, or edge case with minimal user impact
  </output>
  <ask>What is the severity? [critical / high / medium / low]</ask>
  <action>Store as {{severity}}</action>
  <action>Normalize to lowercase</action>
  <check if="{{severity}} is not one of: critical, high, medium, low">
    <output>❌ Severity must be one of: critical, high, medium, low.</output>
    <goto step="1" />
  </check>
</step>

<step n="2" goal="Gather affected component and reproduction steps">
  <ask>What is the affected component? (e.g., "auth module", "login page", "installer pipeline")</ask>
  <action>Store as {{affected_component}}</action>

  <ask>What are the reproduction steps? (numbered steps to reproduce the bug — describe them one at a time or as a list)</ask>
  <action>Store as {{reproduction_steps}}</action>
</step>

<step n="3" goal="Gather expected vs actual behavior">
  <ask>What is the expected behavior? (what should happen when working correctly)</ask>
  <action>Store as {{expected_behavior}}</action>

  <ask>What is the actual behavior? (what actually happens — the defect)</ask>
  <action>Store as {{actual_behavior}}</action>
</step>

<step n="4" goal="Gather version and bug type">
  <ask>What version was this bug found in? (optional — press Enter to skip; e.g., "2.3.1", "v1.0.0-rc2")</ask>
  <action>Store as {{version_found}} (empty string if skipped)</action>

  <output>
**Bug type classifications:**
- `regression` — Previously working feature now broken
- `functional` — Feature does not work as specified
- `performance` — Unacceptable latency, throughput, or resource usage
- `security` — Vulnerability or authentication/authorization flaw
- `ui` — Visual or interaction defect
- `data` — Data corruption, loss, or incorrect transformation
- `integration` — Failure at system/service boundaries
- `other` — Does not fit the above categories
  </output>
  <ask>What is the bug type? [regression / functional / performance / security / ui / data / integration / other] (default: functional)</ask>
  <action>Store as {{bug_type}}</action>
  <action>If empty or blank, default to "functional"</action>
  <action>Normalize to lowercase</action>
  <check if="{{bug_type}} is not one of: regression, functional, performance, security, ui, data, integration, other">
    <output>❌ Bug type must be one of: regression, functional, performance, security, ui, data, integration, other.</output>
    <goto step="4" />
  </check>
</step>

<step n="5" goal="Gather root cause hypothesis and affected files">
  <ask>What is your root cause hypothesis? (optional — press Enter to skip; e.g., "Null check missing in validateUser()")</ask>
  <action>Store as {{root_cause}} (empty string if skipped)</action>

  <ask>What files are affected? (optional — comma-separated paths relative to repo root, press Enter to skip)</ask>
  <action>Store as {{affected_files}} (empty string if skipped)</action>
  <action>If provided, split by comma and trim whitespace to form a list of file paths</action>

  <ask>Is there a suggested fix? (optional — brief description or press Enter to skip)</ask>
  <action>Store as {{suggested_fix}} (empty string if skipped)</action>
</step>

<step n="6" goal="Confirm all bug details before writing">
  <action>Derive {{title_slug}} by converting {{bug_title}} to lowercase kebab-case:
    - Convert to lowercase
    - Replace spaces and underscores with hyphens
    - Remove characters that are not alphanumeric or hyphens
    - Collapse consecutive hyphens into one
    - Trim leading/trailing hyphens
  </action>
  <action>Set {{output_file}} = `_bmad-output/implementation-artifacts/bug-{{title_slug}}.md`</action>

  <output>
## Bug Story Summary — Please Confirm

- **Title:** {{bug_title}}
- **Severity:** {{severity}}
- **Bug Type:** {{bug_type}}
- **Version Found:** {{version_found}} *(empty if skipped)*
- **Affected Component:** {{affected_component}}
- **Reproduction Steps:** {{reproduction_steps}}
- **Expected Behavior:** {{expected_behavior}}
- **Actual Behavior:** {{actual_behavior}}
- **Root Cause Hypothesis:** {{root_cause}} *(empty if skipped)*
- **Affected Files:** {{affected_files}} *(empty if skipped)*
- **Suggested Fix:** {{suggested_fix}} *(empty if skipped)*
- **Output File:** `{{output_file}}`
  </output>
  <ask>Confirm creation? [y] Yes / [n] Cancel / [e] Edit a field:</ask>
  <check if="user selects 'e'">
    <ask>Which field to edit? (title / severity / component / steps / expected / actual / version / bug-type / root-cause / files / fix)</ask>
    <check if="field == 'title' OR field == 'severity'"><goto step="1" /></check>
    <check if="field == 'component' OR field == 'steps'"><goto step="2" /></check>
    <check if="field == 'expected' OR field == 'actual'"><goto step="3" /></check>
    <check if="field == 'version' OR field == 'bug-type'"><goto step="4" /></check>
    <check if="field == 'root-cause' OR field == 'files' OR field == 'fix'"><goto step="5" /></check>
    <check if="none of the above matched">
      <output>❌ Unrecognized field. Valid options: title / severity / component / steps / expected / actual / version / bug-type / root-cause / files / fix</output>
      <goto step="6" />
    </check>
  </check>
  <check if="user selects 'n'">
    <output>❌ Bug story creation cancelled.</output>
    <action>Exit workflow</action>
  </check>
</step>

<step n="7" goal="Write bug story file">
  <action>Check if {{output_file}} already exists</action>
  <check if="file already exists">
    <output>⚠️ A bug story already exists at `{{output_file}}`.</output>
    <ask>Overwrite? [y] Yes — overwrite existing / [n] Cancel / [s] Save with unique suffix (e.g. bug-{{title_slug}}-2.md):</ask>
    <check if="user selects 's'">
      <action>Find the next available suffix: try bug-{{title_slug}}-2.md, -3.md, etc. until a filename that does not exist is found. Set {{output_file}} to that path.</action>
    </check>
    <check if="user selects 'n'">
      <output>❌ Bug story creation cancelled to preserve existing file.</output>
      <action>Exit workflow</action>
    </check>
  </check>

  <action>Write bug story to {{output_file}} using the template below.
    CRITICAL: The YAML frontmatter block MUST be the very first content in the file — no blank lines, no title, nothing before the opening `---`.
    Format optional fields (root_cause, affected_files, suggested_fix) as follows:
      - If {{root_cause}} is empty, write: `_Not identified_`
      - If {{affected_files}} is empty, write: `_Unknown_`; otherwise list each file as a `- path/to/file` bullet
      - If {{suggested_fix}} is empty, omit the Suggested Fix section entirely
  </action>

  <action>Write file with this exact structure:

```
---
type: bug
status: backlog
severity: {{severity}}
bug_type: {{bug_type}}
version_found: {{version_found}}
title: {{bug_title}}
---

# Bug: {{bug_title}}

**Severity:** {{severity}}
**Affected Component:** {{affected_component}}

## Reproduction Steps

{{reproduction_steps}}

## Expected Behavior

{{expected_behavior}}

## Actual Behavior

{{actual_behavior}}

## Root Cause Hypothesis

{{root_cause or "_Not identified_"}}

## Affected Files

{{affected_files list or "_Unknown_"}}

## Suggested Fix

{{suggested_fix — omit section if empty}}

## Notes

- Created via `create-bug-story` workflow
- Discoverable by sprint workflows via glob: `_bmad-output/implementation-artifacts/bug-*.md`
- To add to a sprint, run `/add-to-sprint`
```
  </action>

  <output>
✅ **Bug story created successfully!**

- **File:** `{{output_file}}`
- **Title:** {{bug_title}}
- **Severity:** {{severity}}
- **Bug Type:** {{bug_type}}
- **Component:** {{affected_component}}
  </output>
</step>

<step n="8" goal="Add bug entry to backlog.yaml">
  <action>Check if `_bmad-output/implementation-artifacts/backlog.yaml` exists</action>

  <check if="backlog.yaml exists">
    <action>Read `_bmad-output/implementation-artifacts/backlog.yaml`</action>
    <action>Determine the next priority number by finding the highest existing priority value and adding 1</action>
    <action>Append a new entry at the end of the backlog items list with the following format:
```yaml
- id: "BUG-{{title_slug}}"
  type: bug
  epic: null
  title: "{{bug_title}}"
  priority: N
  status: backlog
  sprint: null
  severity: {{severity}}
```
    Where N is the next priority number.
    </action>
    <action>Re-number all priorities sequentially (1, 2, 3, ...) from top to bottom to ensure no gaps</action>
    <action>Write the updated backlog.yaml back to disk</action>
    <output>
📋 **Backlog updated!** Added `BUG-{{title_slug}}` to `_bmad-output/implementation-artifacts/backlog.yaml` with priority {{N}}.
    </output>
  </check>

  <check if="backlog.yaml does not exist">
    <output>
ℹ️ No `backlog.yaml` found at `_bmad-output/implementation-artifacts/backlog.yaml`.
Run `/generate-backlog` to create a backlog that will include this bug story.
    </output>
  </check>

  <output>
**Next Steps:**
- Use `/add-to-sprint` to assign this bug to the current sprint
- Use `/sprint-status-view` to see all sprint items including this bug
- To detect more bugs, ensure the `auto-bug-detection` skill is loaded in your session
  </output>
</step>

</workflow>
