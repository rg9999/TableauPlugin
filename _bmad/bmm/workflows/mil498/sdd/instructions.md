# Generate Software Design Description (SDD)

> MIL-STD-498 Data Item Description: DI-IPSC-81435

## Objective

Generate a compliant SDD document by mapping the CSCI's software design to the MIL-STD-498 Software Design Description template structure. The SDD describes the design of a single CSCI (Computer Software Configuration Item) — its internal architecture, components (CSCs), interfaces, and detailed unit design.

**Critical principle**: The SDD is a **per-CSCI document**. It designs the internal structure of ONE CSCI as defined in the SSDD. The primary inputs are the SRS (what this CSCI must do), the Architecture document (how it's built), and the Epics/Stories (detailed behavioral specifications and acceptance criteria).

## Step 1 — Discover Project Artifacts

Search the project for the following artifacts. Communicate in {communication_language}. Inform {user_name} which artifacts were found and which are missing.

| Priority | Artifact | Search Pattern |
|----------|----------|----------------|
| Required | Architecture | `**/architecture.md`, `**/architecture-*.md` |
| Required | Epics | `**/epics*.md`, `**/epic-*.md` |
| Required | User Stories | `**/stories/*.md`, `**/story-*.md`, `**/user-stories*.md` |
| Recommended | PRD | `**/prd.md`, `**/prd-*.md` |
| Optional | UX Designs | `**/ux-design*.md`, `**/ux-*.md` |
| Optional | Product Brief | `**/product-brief*.md` |

If **required** artifacts are missing, warn the user and ask whether to proceed with available data or stop.

### Document Dependencies

The SDD is a **per-CSCI document** that designs the internal structure of a CSCI against its requirements. It MUST be generated after the SRS (which defines what the CSCI must do) and the SSDD (which defines the CSCI boundaries).

| Predecessor | Relationship | Search Pattern |
|-------------|-------------|----------------|
| SRS (Software Requirements Specification) | **Required** — provides the CSCI requirements this SDD designs against | `**/SRS.md`, `**/SRS-*.md` |
| SSDD (System/Subsystem Design Description) | **Required** — defines CSCI boundaries, system-wide design decisions, and allocated requirements | `**/SSDD.md` |
| SSS (System/Subsystem Specification) | Optional — provides system-level requirements context | `**/SSS.md` |

If the SRS has NOT been generated yet, **alert {user_name}**: "The SRS has not been generated yet. The SDD designs the internal structure of a CSCI against the requirements defined in its SRS. Would you like to proceed without the SRS, or generate the SRS first?"

If the SSDD has NOT been generated yet, **alert {user_name}**: "The SSDD has not been generated yet. The SDD needs the SSDD to understand CSCI boundaries and system-wide design decisions. Would you like to proceed without the SSDD, or generate the SSDD first?"

If predecessor documents exist, they MUST be loaded and used as primary inputs. The SDD should reference them in Section 2 and trace design decisions to SRS requirements.

### CSCI Scoping

Ask {user_name}: **"Which CSCI is this SDD for?"**

If the SSDD exists, present the list of CSCIs defined in it and ask the user to select one. The SDD will describe the design of ONLY the selected CSCI — its internal CSCs (Computer Software Components) and software units.

If generating SDD documents for multiple CSCIs, generate them one at a time, each as a separate document.

### Source Mapping

For the selected CSCI, the agent must:
1. From the **SSDD**: Extract the CSCI's allocated system requirements, its CSCs, and the system-wide design decisions that constrain it
2. From the **SRS**: Extract all CSCI requirements (capabilities, interfaces, quality factors, constraints) — these are what the SDD must design against
3. From the **Architecture**: Extract the internal structure, technology stack, patterns, and integration approach for this CSCI's components
4. From **Epics/Stories**: Extract detailed behavioral specifications, acceptance criteria, algorithms, business rules, and processing logic that inform the detailed design (Section 5)

## Step 2 — Load Template

Read the SDD template from:
`{template}`

This defines the required DID sections and content expectations for each paragraph.

## Step 3 — Generate Document

Write the document in {document_output_language}, populating each template section.

### Revision History

Before writing any content, add a **Revision History table** immediately after the document title. If this is a new document, create the table with version `1.0`. If updating an existing document, read the existing revision history and add a new row with an incremented version number and a summary of all changes made in this session. See the `document-revision-history` skill for full formatting rules.

```markdown
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {date} | Agent ({model}) | Initial document generation |
```

### Section 1: Scope
- **1.1 Identification**: Identify the CSCI by name, version, and project-unique identifier (as assigned in the SSDD)
- **1.2 System overview**: Summarize the system and this CSCI's role within it, referencing the SSDD
- **1.3 Document overview**: Describe this SDD document's purpose and contents

### Section 2: Referenced documents
- List all predecessor MIL-STD-498 documents (SSDD, SRS, SSS) and project artifacts used. Include number, title, revision, and date

### Section 3: CSCI-wide design decisions

**CRITICAL BEHAVIORAL GUIDANCE**: Like the SSDD, this section describes the CSCI's behavioral design — how it will behave from a user's point of view, ignoring internal implementation. Follow these rules:

1. **Requirements-driven**: Every design decision MUST cite the specific SRS requirement(s) it satisfies
2. **Behavioral, not implementation**: Describe patterns and approaches first, then technology choices parenthetically if essential
3. **State-dependent decisions**: If a design decision depends on CSCI states or modes, indicate this dependency

Document the following CSCI-wide design decisions (items a through e per the DID):

- **a. CSCI behavioral design**: How the CSCI behaves in response to inputs and conditions — actions, response times, algorithms/rules, error handling. Describe from the user's perspective. Reference SRS capability requirements (3.2.x)
- **b. Database/data file design**: How databases and data files within this CSCI appear to users and external systems. Reference SRS internal data requirements (3.5). If Database Design Descriptions (DBDDs) exist, they may be referenced
- **c. Safety, security, privacy**: Selected approaches to meeting safety, security, and privacy requirements for this CSCI. Place in **separate subparagraphs** for critical requirements. Reference SRS sections 3.7, 3.8
- **d. Other CSCI-wide design decisions**: Flexibility, availability, maintainability approaches. Rationale for architectural patterns selected. Reference SRS quality factors (3.11) and design constraints (3.12)
- **e. Design and implementation standards**: Standards to be followed for design, coding, testing (reference SDP if available)

### Section 4: CSCI architectural design

- **4.1 CSCI components** (items a through f — all are required):

  **a.** Identify all CSCs (Computer Software Components) within this CSCI — modules, packages, services, libraries. Each CSC shall have a project-unique identifier. Also identify software units within CSCs where applicable.

  **b.** Show static ("consists of") relationships using component/class/package diagrams. Multiple relationship views may be presented.

  **c.** State each CSC's purpose and the SRS requirements allocated to it. (Alternatively, allocation may be provided in Section 6.a.)

  **d.** Identify each CSC's development status: new development, existing reuse as-is, existing design reuse, reengineering, etc. For existing components, provide identifying information.

  **e.** Describe **resource utilization** — allocation of computer hardware resources (processor capacity, memory, I/O, storage) to each CSC. State conditions under which utilization will be measured. (This differs from SSDD 4.1.e which describes hardware; here it's about utilization allocation.)

  **f.** Describe the CSCI's **program library** — contents including computer files, data files, program files, and their relationships.

- **4.2 Concept of execution**:
  - Describe dynamic relationships between CSCs — how they interact during operation
  - Include: execution flow, data flow, state transitions, timing/sequencing, priorities, interrupt handling, concurrent execution, dynamic allocation/deallocation, exception handling
  - Use sequence diagrams, state transition diagrams, or timing diagrams where helpful

- **4.3 Interface design**:
  - **4.3.1 Interface identification and diagrams**: List all interfaces (between CSCs and with external entities) with project-unique identifiers. Identify fixed vs. developing interfaces. Provide interface diagrams.
  - **4.3.x (per interface)**: For each interface, document as applicable:
    - **a.** Priority assigned to the interface
    - **b.** Type of interface (real-time data transfer, storage-and-retrieval, etc.)
    - **c.** Data elements: names/identifiers, data types, sizes/formats, units, ranges, accuracy/precision, timing/frequency constraints, security constraints, sources and recipients
    - **d.** Data element assemblies: records, messages, data structures — names, structure, medium, relationships, constraints
    - **e.** Communication methods: links/media, message formatting, flow control, data transfer rates, routing
    - **f.** Protocols: priority/layer, packeting, error control/recovery, synchronization
    - **g.** Physical compatibility considerations

### Section 5: CSCI detailed design

**This is the most important section of the SDD.** For each software unit identified in Section 4.1, provide a detailed design description. Organize as subsections (5.x per CSC, or 5.x per software unit):

For each software unit (5.x), document the following items (a through f per the DID):

- **a. Unit design decisions**: Design decisions specific to this unit, including algorithms, processing logic, data transformations, and business rules. **Extract from Epics and User Stories** — map Story acceptance criteria to specific processing logic. Reference the SRS requirements this unit satisfies.
- **b. Design constraints**: Any constraints on the unit's design imposed by the CSCI-wide decisions, standards, or external interfaces
- **c. Programming language**: If different from the CSCI-wide language specified in Section 3.e
- **d. Control flow / logic description**: Describe the unit's control logic — how it processes inputs, makes decisions, handles conditions. Use flowcharts, pseudocode, or decision tables where helpful. Map from Story acceptance criteria and business rules.
- **e. Data elements and structures**: Internal data elements, record layouts, data structures, file formats used by the unit
- **f. Restrictions and limitations**: Any restrictions on the unit's use, dependencies, known limitations, or assumptions

### Section 6: Requirements traceability
- **6.a**: Map each CSC/software unit to the SRS requirements it addresses
- **6.b**: Map each SRS requirement to the CSCs/units that implement it
- Ensure every SRS requirement allocated to this CSCI is accounted for in both directions

### Section 7: Notes
- Alphabetical listing of all acronyms, abbreviations, and their meanings
- Glossary of design terms and definitions

### Appendix A
- Include any supplementary material (detailed algorithms, data dictionaries, message format specifications) that supports the main body

## Step 4 — Validate

Before presenting to the user, verify:
- All template sections (1-7 and Appendix A) are populated or marked "Not applicable" with justification
- This SDD covers exactly ONE CSCI as defined in the SSDD
- Every CSC has a project-unique identifier
- CSCI-wide design decisions (Section 3) are framed as behavioral responses to SRS requirements
- Section 5 (detailed design) has entries for every software unit, with algorithms and logic extracted from Epics/Stories
- Resource utilization (4.1.e) and program library (4.1.f) are documented
- Interface descriptions (4.3.x) cover all seven aspects (a through g) where applicable
- Requirements traceability (Section 6) covers all SRS requirements in both directions
- Document is written in {document_output_language}

## Step 5 — Review

Present the complete document to {user_name} for review.
Highlight any sections where information was inferred or assumptions were made.
Specifically ask about:
- Is the CSC decomposition correct for this CSCI?
- Are the algorithms and processing logic in Section 5 accurately extracted from the Stories?
- Are there design decisions not captured in the Architecture or Epics?
- Is the resource utilization allocation realistic?

Offer to refine any section based on feedback.

## Step 6 — Save

Write the final document to:
`{output_folder}/planning-artifacts/SDD.md`

(If this is not the first CSCI's SDD, save as `SDD-{CSCI-identifier}.md`)

Confirm the file was saved and display a summary of:
- CSCI identifier and name
- Number of CSCs identified
- Number of software units with detailed design
- Number of interfaces documented
- Number of SRS requirements traced
- Requirements coverage percentage
- Any sections marked "Not applicable"
