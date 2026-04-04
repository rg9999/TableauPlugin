# Dev Epic Workflow

**Goal:** Develop every story in a single epic from start to finish — create, implement, and review — without user intervention.

**Your Role:** Autonomous epic executor. You orchestrate the full development lifecycle for each story in sequence: create the story context, implement it, review the code, and move on to the next. You stop exactly when the epic is complete.

- Communicate all responses in {communication_language} and generate all documents in {document_output_language}
- This workflow is **fully autonomous** — do NOT ask for user input, do NOT halt for decisions, do NOT pause between stories
- The ONLY reason to stop is: all stories in the epic are done, OR an unrecoverable error occurs
- Treat code review findings as follows: apply all patches automatically, defer anything ambiguous, never halt for decisions
- Each story cycle runs in the CURRENT context — do NOT suggest opening fresh context windows

---

## INITIALIZATION

### Configuration Loading

Load config from `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `project_name`, `user_name`
- `communication_language`, `document_output_language`
- `user_skill_level`
- `planning_artifacts`, `implementation_artifacts`
- `date` as system-generated current datetime

### Paths

- `sprint_status` = `{implementation_artifacts}/sprint-status.yaml`
- `epics_file` = `{planning_artifacts}/epics.md` (or sharded equivalent)
- `project_context` = `**/project-context.md` (load if exists)

---

## EXECUTION

<workflow>

<critical>This workflow is FULLY AUTONOMOUS — do NOT ask for user input at any point</critical>
<critical>Do NOT halt for "milestones", "significant progress", or "session boundaries"</critical>
<critical>Do NOT suggest opening fresh context windows between stories — execute continuously</critical>
<critical>Stop ONLY when all stories in the target epic are done OR an unrecoverable error occurs</critical>

<step n="1" goal="Determine target epic and build story queue">
  <check if="user provided an epic number (e.g., 'epic 2', '2', 'dev epic 2')">
    <action>Set {{epic_num}} from user input</action>
  </check>

  <check if="no epic number provided">
    <action>Load the FULL {{sprint_status}} file</action>
    <action>Find the FIRST epic where status is "backlog" or "in-progress" (reading top to bottom)</action>
    <action>Extract {{epic_num}} from the epic key (e.g., "epic-2" → 2)</action>
    <check if="no backlog or in-progress epic found">
      <output>All epics are done. No work remaining.</output>
      <action>HALT — nothing to do</action>
    </check>
  </check>

  <action>Load the FULL {{sprint_status}} file</action>
  <action>Read ALL development_status entries for epic {{epic_num}}</action>
  <action>Build {{story_queue}}: ordered list of all story keys matching pattern {{epic_num}}-*-* (excluding epic-* and *-retrospective entries)</action>
  <action>Filter {{story_queue}} to include ONLY stories with status: "backlog" or "ready-for-dev"</action>
  <action>Also include stories with status "in-progress" or "review" (resume incomplete work)</action>
  <action>Exclude stories with status "done"</action>
  <action>Preserve original ordering from sprint-status.yaml (top to bottom)</action>

  <check if="{{story_queue}} is empty">
    <output>All stories in Epic {{epic_num}} are already done.</output>
    <action>GOTO step 5 (epic completion)</action>
  </check>

  <action>Set {{total_stories}} = count of {{story_queue}}</action>
  <action>Set {{current_story_index}} = 0</action>

  <check if="epic-{{epic_num}} status is 'backlog'">
    <action>Update epic-{{epic_num}} status to "in-progress" in {{sprint_status}}</action>
    <action>Update last_updated to current date</action>
  </check>

  <output>
    **Epic {{epic_num}} Development Started**

    Stories to process: {{total_stories}}
    Queue: {{story_queue}}

    Beginning autonomous development cycle...
  </output>
</step>

<step n="2" goal="Story cycle — Create Story">
  <action>Set {{story_key}} = {{story_queue}}[{{current_story_index}}]</action>
  <action>Set {{story_file}} = {implementation_artifacts}/{{story_key}}.md</action>
  <action>Extract {{story_num}} from {{story_key}} (second number segment)</action>

  <action>Load {{sprint_status}} and check current status of {{story_key}}</action>

  <!-- Skip create-story if story file already exists with ready-for-dev or later status -->
  <check if="status is 'ready-for-dev' or 'in-progress' or 'review'">
    <output>[{{current_story_index + 1}}/{{total_stories}}] Story {{story_key}} — already created, skipping to implementation</output>
    <action>GOTO step 3</action>
  </check>

  <!-- Run create-story phase -->
  <output>[{{current_story_index + 1}}/{{total_stories}}] Story {{story_key}} — CREATING STORY CONTEXT</output>

  <action>Execute the create-story workflow inline for this story:

    1. Load all input artifacts (epics, architecture, UX, PRD) using the discover-inputs protocol
    2. Extract Epic {{epic_num}} context and Story {{epic_num}}.{{story_num}} requirements from epics file
    3. If {{story_num}} > 1, load the previous story file for intelligence
    4. Analyze architecture for story-relevant requirements
    5. Analyze recent git commits for patterns and conventions
    6. Create comprehensive story file at {{story_file}} using the create-story template
    7. Set story status to "ready-for-dev"
    8. Update {{sprint_status}}: set {{story_key}} = "ready-for-dev"
    9. Update last_updated to current date
  </action>

  <action>Validate story file was created and contains: Story section, Acceptance Criteria, Tasks/Subtasks, Dev Notes</action>
  <action if="story file creation failed">Log error, skip this story, GOTO step 4 (advance queue)</action>
</step>

<step n="3" goal="Story cycle — Implement and Review">

  <!-- DEV-STORY PHASE -->
  <output>[{{current_story_index + 1}}/{{total_stories}}] Story {{story_key}} — IMPLEMENTING</output>

  <action>Execute the dev-story workflow inline for {{story_file}}:

    1. Load the COMPLETE story file
    2. Parse: Story, Acceptance Criteria, Tasks/Subtasks, Dev Notes
    3. Load project context if available
    4. Update {{sprint_status}}: set {{story_key}} = "in-progress"
    5. For EACH incomplete task/subtask (in order):
       a. Write failing tests (RED phase)
       b. Implement minimal code to pass tests (GREEN phase)
       c. Refactor while keeping tests green (REFACTOR phase)
       d. Run all tests — fix any failures before proceeding
       e. Mark task [x] in story file
       f. Update File List and Completion Notes in story file
    6. After all tasks complete:
       a. Run full regression test suite
       b. Validate ALL acceptance criteria are satisfied
       c. Update story status to "review"
       d. Update {{sprint_status}}: set {{story_key}} = "review"
  </action>

  <action if="dev-story encounters 3 consecutive implementation failures on same task">
    Log the failure, add a Dev Notes entry about the blocker, mark story as "blocked" in sprint status, GOTO step 4 (advance queue)
  </action>

  <!-- CODE-REVIEW PHASE (autonomous — no halts) -->
  <output>[{{current_story_index + 1}}/{{total_stories}}] Story {{story_key}} — CODE REVIEW</output>

  <action>Execute the code-review workflow inline for {{story_file}} in AUTONOMOUS mode:

    1. Gather context:
       a. Identify the story_key and spec_file ({{story_file}})
       b. Collect git diff for all changes made during this story's implementation
       c. Load story acceptance criteria and architecture constraints
    2. Review — run three parallel analysis layers:
       a. Blind Hunter: scan for bugs, logic errors, security issues, performance problems
       b. Edge Case Hunter: walk every branching path and boundary condition
       c. Acceptance Auditor: verify each AC is actually satisfied by the implementation
    3. Triage findings into categories:
       - "patch": clear fix, no ambiguity → AUTO-APPLY immediately
       - "defer": pre-existing issue or out-of-scope → log to deferred-work.md and check off
       - "noise": false positive or style preference → dismiss silently
       - "decision-needed": ambiguous fix → treat as "defer" (log reason: "deferred — autonomous mode, needs human review")
    4. Apply all "patch" fixes automatically — do NOT halt for confirmation
    5. Re-run tests after applying patches to ensure no regressions
    6. If patches introduced test failures, revert the failing patch and defer it instead
    7. Write review findings to story file under "### Review Findings" in Tasks/Subtasks
    8. Determine story status:
       - If all issues resolved or deferred: set status = "done"
       - If unresolved HIGH severity issues remain: set status = "in-progress", log the issue
    9. Update {{sprint_status}}: set {{story_key}} to the determined status
    10. Update last_updated to current date
  </action>

  <check if="story status is 'done'">
    <output>Story {{story_key}} — DONE</output>
  </check>

  <check if="story status is NOT 'done'">
    <output>Story {{story_key}} — completed with unresolved issues (logged in story file)</output>
  </check>
</step>

<step n="4" goal="Advance to next story or complete epic">
  <action>Set {{current_story_index}} = {{current_story_index}} + 1</action>

  <check if="{{current_story_index}} < {{total_stories}}">
    <output>
      --- Story cycle complete. Moving to next story ---
    </output>
    <action>GOTO step 2</action>
  </check>

  <check if="{{current_story_index}} >= {{total_stories}}">
    <action>GOTO step 5</action>
  </check>
</step>

<step n="5" goal="Epic completion">
  <action>Load the FULL {{sprint_status}} file</action>
  <action>Read ALL story statuses for epic {{epic_num}}</action>
  <action>Count stories by status: done, in-progress, blocked, other</action>

  <check if="ALL stories are 'done'">
    <action>Update epic-{{epic_num}} status to "done" in {{sprint_status}}</action>
    <action>Update last_updated to current date</action>

    <output>
      **Epic {{epic_num}} COMPLETE**

      All {{total_stories}} stories developed, reviewed, and done.

      **Summary:**
      {{For each story in queue: story_key — status}}

      **Next Steps:**
      - Run `bmad-retrospective` on Epic {{epic_num}} (recommended)
      - Run `bmad-dev-epic` again for the next epic
    </output>
  </check>

  <check if="NOT all stories are 'done'">
    <action>Leave epic-{{epic_num}} status as "in-progress" in {{sprint_status}}</action>
    <action>Update last_updated to current date</action>

    <output>
      **Epic {{epic_num}} — Partially Complete**

      **Story Results:**
      {{For each story in queue: story_key — final status}}

      **Blocked/Incomplete stories require manual attention.**

      **Next Steps:**
      - Review blocked stories and resolve issues
      - Re-run `bmad-dev-epic {{epic_num}}` to retry incomplete stories
      - Or run `bmad-dev-story` on specific stories manually
    </output>
  </check>

  <action>STOP — epic development cycle complete</action>
</step>

</workflow>
