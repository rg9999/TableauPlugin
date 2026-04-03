# Generate Operational Concept Description (OCD)

> MIL-STD-498 Data Item Description: DI-IPSC-81430

## Objective

Generate a compliant OCD document by describing the system from the user's and stakeholder's perspective, extracting operational concepts from existing project artifacts into the MIL-STD-498 OCD template structure.

## Step 1 — Discover Project Artifacts

Search the project for the following artifacts. Communicate in {communication_language}. Inform {user_name} which artifacts were found and which are missing.

| Priority | Artifact | Search Pattern |
|----------|----------|----------------|
| Required | PRD | `**/prd.md`, `**/prd-*.md` |
| Recommended | Architecture | `**/architecture.md`, `**/architecture-*.md` |
| Recommended | UX Designs | `**/ux-design*.md`, `**/ux-*.md` |
| Optional | Product Brief | `**/product-brief*.md` |
| Optional | Epics & Stories | `**/epics*.md`, `**/stories/*.md` |

If the **PRD** is missing, warn the user and ask whether to proceed with available data or stop.

### Document Dependencies

The OCD is the **first document** in the MIL-STD-498 generation chain. It has no MIL-STD-498 predecessor documents — it draws from project artifacts (PRD, Product Brief, UX Designs) only.

**Note**: The OCD feeds into the SSS and other downstream documents. Ensure the operational scenarios and user descriptions are thorough, as they will be referenced by:
- **SSS** — for deriving system requirements from operational needs
- **SSDD** — for understanding operational context behind design decisions
- **SDP** — for understanding the operational environment

## Step 2 — Load Template

Read the OCD template from:
`{template}`

This defines the required DID sections and content expectations for each paragraph.

## Step 3 — Generate Document

Write the document in {document_output_language}, populating each template section. The OCD should be written in language accessible to users and stakeholders, minimizing technical jargon.

### Revision History

Before writing any content, add a **Revision History table** immediately after the document title. If this is a new document, create the table with version `1.0`. If updating an existing document, read the existing revision history and add a new row with an incremented version number and a summary of all changes made in this session. See the `document-revision-history` skill for full formatting rules.

```markdown
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {date} | Agent ({model}) | Initial document generation |
```

### Section 1: Scope
- **1.1 Identification**: Extract system name, version, identifiers from PRD
- **1.2 System overview**: Summarize the system purpose from the user's perspective
- **1.3 Document overview**: Describe this OCD document's purpose and contents

### Section 2: Referenced documents
- List all project artifacts used as input sources, with number, title, revision, and date

### Section 3: Current system or situation
- **3.1 Background, objectives, and scope**: Describe the problem domain, mission/objectives, and scope from the PRD
- **3.2 Operational policies and constraints**: Current business rules, operational policies, and constraints
- **3.3 Description of current system or situation**: How things work today. Describe differences associated with different states or modes of operation. Include all of the following (items a through h per the DID):
  - **a.** The operational environment and its characteristics
  - **b.** Major system components and the interconnections among them
  - **c.** Interfaces to external systems or procedures
  - **d.** Capabilities/functions of the current system
  - **e.** Charts and descriptions depicting inputs, outputs, data flow, and manual/automated processes sufficient to understand the current system from the user's point of view
  - **f.** Performance characteristics: speed, throughput, volume, frequency
  - **g.** Quality attributes: reliability, maintainability, availability, flexibility, portability, usability, efficiency
  - **h.** Provisions for safety, security, privacy, and continuity of operations in emergencies
- **3.4 Users or involved personnel**: Identify all user types and stakeholders. Include organizational structures, training/skills, responsibilities, activities, and interactions
- **3.5 Support concept**: Current support and maintenance approach — support agencies, facilities, equipment, support software, repair/replacement criteria, maintenance levels and cycles

### Section 4: Justification for and nature of changes
- **4.1 Justification for change**:
  - **a.** New or modified aspects of user needs, threats, missions, objectives, environments, interfaces, personnel, or other factors requiring a new/modified system
  - **b.** Deficiencies or limitations in the current system that make it unable to respond to these factors
- **4.2 Description of needed changes**: New or modified capabilities, functions, processes, interfaces, or other changes needed
- **4.3 Priorities among the changes**: Identify each change as essential, desirable, or optional. Prioritize the desirable and optional changes
- **4.4 Changes considered but not included**: Identify changes that were considered but excluded, with rationale for not including them
- **4.5 Assumptions and constraints**: Any assumptions and constraints applicable to the changes identified

### Section 5: Concept for the new or modified system
- **5.1 Background, objectives, and scope**: Vision, mission/objectives, and scope for the new system from Product Brief/PRD
- **5.2 Operational policies and constraints**: New or changed operational policies and constraints
- **5.3 Description of the new or modified system**: How the new system will work. Describe differences associated with different states or modes. Include all of the following (items a through h, mirroring Section 3.3):
  - **a.** The operational environment and its characteristics
  - **b.** Major system components and the interconnections among them
  - **c.** Interfaces to external systems or procedures
  - **d.** Capabilities/functions of the new or modified system
  - **e.** Charts and descriptions depicting inputs, outputs, data flow, and manual/automated processes from the user's point of view
  - **f.** Performance characteristics: speed, throughput, volume, frequency
  - **g.** Quality attributes: reliability, maintainability, availability, flexibility, portability, usability, efficiency
  - **h.** Provisions for safety, security, privacy, and continuity of operations in emergencies
- **5.4 Users/affected personnel**: How user roles change with the new system — organizational structures, training/skills, responsibilities, and interactions
- **5.5 Support concept**: Planned support approach — support agencies, facilities, equipment, support software, repair/replacement criteria, maintenance levels and cycles

### Section 6: Operational scenarios
- Document one or more operational scenarios that illustrate the role of the new/modified system
- Each scenario should include: the system's interaction with users, interfaces with other systems, and all states/modes identified
- Include: events, actions, stimuli, information, interactions
- Cover both normal operation and exception/error scenarios
- Reference may be made to other media (e.g., videos, mockups) to provide part of this information

### Section 7: Summary of impacts
- **7.1 Operational impacts**: Anticipated operational impacts on user, acquirer, developer, and support agencies. Include: changes in interfaces with operating centers, procedure changes, use of new data sources, changes in data input quantity/type/timing, changes in data retention, new modes of operation
- **7.2 Organizational impacts**: Anticipated organizational impacts. Include: modification of responsibilities, addition/elimination of positions, training/retraining needs, changes in number/skill levels/locations of personnel
- **7.3 Impacts during development**: Anticipated impacts during the development effort. Include: meetings/discussions, database development/modification, training, parallel operation of new and existing systems, testing impacts, monitoring activities

### Section 8: Analysis of the proposed system
- **8.1 Summary of advantages**: Qualitative and quantitative summary of advantages — new capabilities, enhanced capabilities, improved performance, and their relationship to deficiencies identified in 4.1
- **8.2 Summary of disadvantages/limitations**: Qualitative and quantitative summary of disadvantages — degraded/missing capabilities, less-than-desired performance, excessive resource use, undesirable operational impacts, conflicts with user assumptions
- **8.3 Alternatives and trade-offs considered**: Major alternatives considered, trade-offs among them, and rationale for the decisions reached

### Section 9: Notes
- Alphabetical listing of all acronyms, abbreviations, and their meanings
- Glossary of terms and definitions
- Background information to aid understanding

### Appendix A
- Include any supplementary material (charts, detailed data, classified information) that supports the main body
- Reference each appendix from the main body where the data would normally appear

## Step 4 — Validate

Before presenting to the user, verify:
- All template sections (1-9 and Appendix A) are populated or marked "Not applicable" with justification
- Document is written from the user/stakeholder perspective, not the developer perspective
- Sections 3.3 and 5.3 cover all eight items (a through h)
- Section 4 includes all five subsections (4.1-4.5)
- Section 7 (impacts) and Section 8 (analysis) are present and substantive
- Operational scenarios are complete and realistic
- Document is written in {document_output_language}

## Step 5 — Review

Present the complete document to {user_name} for review.
Highlight any sections where information was inferred or assumptions were made.
Specifically ask about:
- Are the current system descriptions (Section 3) accurate?
- Are the operational scenarios (Section 6) complete?
- Are there additional impacts (Section 7) not captured?
- Does the analysis (Section 8) accurately represent advantages and disadvantages?

Offer to refine any section based on feedback.

## Step 6 — Save

Write the final document to:
`{output_folder}/planning-artifacts/OCD.md`

Confirm the file was saved and display a summary of:
- Number of user roles identified
- Number of operational scenarios documented
- Number of changes justified (Section 4)
- Number of impacts identified (Section 7)
- Any sections marked "Not applicable"
