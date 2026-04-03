# Generate System/Subsystem Design Description (SSDD)

> MIL-STD-498 Data Item Description: DI-IPSC-81432

## Objective

Generate a compliant SSDD document by extracting and organizing system architectural design decisions from existing project artifacts into the MIL-STD-498 SSDD template structure. The SSDD describes the system-level design — how the system is organized into components (HWCIs, CSCIs, and manual operations) and how they interact.

**Critical principle**: The SSDD describes design decisions from the user's point of view, ignoring internal implementation details. Design decisions must be framed as responses to specific requirements — not as technology selections.

## Step 1 — Discover Project Artifacts

Search the project for the following artifacts. Communicate in {communication_language}. Inform {user_name} which artifacts were found and which are missing.

| Priority | Artifact | Search Pattern |
|----------|----------|----------------|
| Required | PRD | `**/prd.md`, `**/prd-*.md` |
| Required | Architecture | `**/architecture.md`, `**/architecture-*.md` |
| Recommended | Product Brief | `**/product-brief*.md` |
| Recommended | SSS | `**/SSS.md` |
| Optional | UX Designs | `**/ux-design*.md`, `**/ux-*.md` |
| Optional | Epics | `**/epics*.md`, `**/epic-*.md` |
| Optional | Any client documentation | Ask {user_name} if there are additional documents to consider |

If **required** artifacts are missing, warn the user and ask whether to proceed with available data or stop.

### Document Dependencies

The SSDD is best generated after the following MIL-STD-498 predecessor documents:

| Predecessor | Relationship | Search Pattern |
|-------------|-------------|----------------|
| SSS (System/Subsystem Specification) | Recommended — provides the system requirements the SSDD designs against | `**/SSS.md` |
| OCD (Operational Concept Description) | Optional — provides operational context | `**/OCD.md` |

If predecessor documents exist, they MUST be loaded and used as primary inputs. The SSDD should reference them in Section 2 and trace design decisions to their requirements.

If recommended predecessors have NOT been generated yet, **alert {user_name}**: "The SSS has not been generated yet. The SSDD is typically produced after the SSS, since it designs against system requirements defined there. Would you like to proceed without it, or generate the SSS first?"

## Step 2 — Load Template

Read the SSDD template from:
`{template}`

This defines the required DID sections and content expectations for each paragraph.

## Step 2.5 — CSCI Discovery Interview

Before generating the document, you must establish the correct CSCI decomposition through an interactive interview with {user_name}. **Do NOT map repositories, microservices, or deployment units 1:1 to CSCIs.** A CSCI is a configuration item — a logically cohesive unit that is independently specified, designed, tested, and managed.

### Phase A: Initial Analysis

Analyze the Architecture document and identify:
- All services, modules, repositories, and deployment units mentioned
- Functional domains they belong to (e.g., detection, alerting, user management, frontend)
- Shared release cycles, shared teams, shared test suites
- Data coupling between components (which services share databases or communicate frequently?)

### Phase B: Propose CSCI Hypothesis

Present {user_name} with a proposed CSCI decomposition that groups related services/modules into logically cohesive CSCIs. For each proposed CSCI:
- Give it a descriptive name and project-unique identifier
- List the services/modules/components it contains (these become CSCs — Computer Software Components — within the CSCI)
- State the functional rationale for the grouping
- Identify the system requirements allocated to it

### Phase C: Guided Questions

Ask {user_name} the following questions to validate and refine the decomposition:

1. **Release boundaries**: "Which of these services/modules share a release cycle and are always deployed together?"
2. **Team boundaries**: "Which components are developed and maintained by the same team?"
3. **Test boundaries**: "Which components are always tested together as a unit?"
4. **Delivery boundaries**: "What are your contractual or organizational delivery boundaries — what does the customer/stakeholder receive as distinct deliverables?"
5. **Configuration management**: "Which components are independently baselined and version-controlled as a unit?"

### Phase D: Refine and Confirm

Based on {user_name}'s answers:
- Merge or split CSCIs as needed
- Ensure each CSCI has clear functional cohesion
- Assign final project-unique identifiers (e.g., CSCI-SA for Situational Awareness, CSCI-FE for Frontend)
- Get explicit approval from {user_name} before proceeding to document generation

**Do NOT proceed to Step 3 until {user_name} approves the CSCI decomposition.**

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
- **1.1 Identification**: Extract system name, version, and project-unique identifiers from PRD/Product Brief
- **1.2 System overview**: Summarize system purpose, history, stakeholders, and operating sites from Product Brief and PRD
- **1.3 Document overview**: Describe this SSDD document's purpose, contents, and any security/privacy considerations

### Section 2: Referenced documents
- List all project artifacts, standards, and external references used as inputs. Include number, title, revision, and date for each

### Section 3: System-wide design decisions

**CRITICAL BEHAVIORAL GUIDANCE**: This section describes the system's behavioral design — how it will behave from a user's point of view in meeting its requirements, ignoring internal implementation. Follow these rules strictly:

1. **Requirements-driven**: Every design decision MUST cite the specific requirement(s) it satisfies (e.g., "To satisfy NFR-P2 (< 1s detection latency)...")
2. **Behavioral, not implementation**: Describe patterns and approaches, NOT specific tools or products. Write "An asynchronous message distribution pattern is selected..." NOT "RabbitMQ serves as the message broker..."
3. **Technology names belong in the Architecture document**, not here. If a technology choice is essential context, mention it parenthetically after the behavioral description
4. **State-dependent decisions**: If a design decision depends on system states or modes, indicate this dependency explicitly

For each of the following subsections, document the design decisions and reference their driving requirements:

- **a. Input/output design**: What the system accepts and produces. Describe system inputs, outputs, and user/external interfaces from the user's perspective. If Interface Design Descriptions (IDDs) exist, they may be referenced
- **b. Behavioral design**: How the system behaves in response to inputs and conditions — actions, response times, performance characteristics, selected algorithms/rules, and handling of invalid inputs or error conditions. Describe behavioral patterns (event-driven processing, request-response cycles, etc.) without naming specific tools
- **c. Database/data design**: How databases and data files appear to users and external systems. Describe data models, storage approaches, and data lifecycle from the user's perspective. If Database Design Descriptions (DBDDs) exist, they may be referenced
- **d. Safety, security, privacy**: Selected approaches to meeting safety, security, and privacy requirements. Place these in **separate subparagraphs** as the DID requires special treatment for critical requirements
- **e. Hardware/physical design choices**: Physical characteristics if applicable (for hardware-software systems) — size, color, shape, weight, materials, markings
- **f. Other system-wide decisions**: Flexibility, availability, maintainability approaches. Describe the rationale for architectural patterns selected (e.g., "A service-isolation pattern is selected to satisfy NFR-A1 availability requirement, enabling independent failure recovery")

### Section 4: System architectural design

- **4.1 System components** (items a through f — all are required):

  **a.** Identify all system components using the approved CSCI decomposition from Step 2.5. Each CSCI shall have a project-unique identifier. For each CSCI, list the CSCs (services, modules) it contains. Also identify HWCIs and manual operations as applicable. Note: a database may be treated as a CSCI or as part of a CSCI.

  **b.** Show the static ("consists of") relationships using component/block diagrams. Multiple relationship views may be presented (structural, deployment, data ownership).

  **c.** State each component's purpose and the system requirements allocated to it. (Alternatively, allocation may be provided in Section 5.a.)

  **d.** Identify each component's development status: new development, existing reuse as-is, existing design reuse, reengineering, planned for a specific build, etc. For existing components, provide identifying information (name, version, documentation references, location).

  **e.** For each computer system or hardware aggregate, describe computer hardware resources: processors, memory, I/O devices, auxiliary storage, communications/network equipment. Include:
    - Manufacturer, model, speed/capacity for processors
    - Type, size, speed, configuration for memory
    - Type, speed/capacity for I/O devices
    - Type, amount, speed for auxiliary storage
    - Data transfer rates, topologies, protocols for network equipment
    - Growth capabilities and diagnostic capabilities
    - Resource utilization allocation per CSCI (e.g., "20% of resource capacity allocated to CSCI-SA")

  **f.** Present a **specification tree** — a diagram that identifies and shows the relationships among the planned specifications for the system components. This is a tree showing which specification documents (SSS, SRS, SDD, IRS, etc.) apply to which components.

- **4.2 Concept of execution**:
  - Describe dynamic relationships between components — how they interact during system operation
  - Include: execution flow, data flow, dynamically controlled sequencing, state transitions, timing/sequencing, priorities, interrupt handling, concurrent execution, dynamic allocation/deallocation, exception handling
  - Use sequence diagrams, timing diagrams, or state transition diagrams where helpful

- **4.3 Interface design**:
  - **4.3.1 Interface identification and diagrams**: List all interfaces with project-unique identifiers. Identify interfacing entities by name, number, version. State which entities have fixed interface characteristics vs. developing ones. Provide interface diagrams.
  - **4.3.x (per interface)**: For each interface, document the following as applicable:
    - **a.** Priority assigned to the interface
    - **b.** Type of interface (real-time data transfer, storage-and-retrieval, etc.)
    - **c.** Data elements: names/identifiers (project-unique, natural-language, technical), data types, sizes/formats, units, ranges, accuracy/precision, timing/frequency/volume constraints, security/privacy constraints, sources and recipients
    - **d.** Data element assemblies: records, messages, files, displays — their names, structure, medium, visual/auditory characteristics, relationships, constraints, sources and recipients
    - **e.** Communication methods: links/media, message formatting, flow control, data transfer rates, routing/addressing, transmission services, safety/security considerations
    - **f.** Protocols: priority/layer, packeting/fragmentation, error control/recovery, synchronization, status/reporting
    - **g.** Physical compatibility considerations (dimensions, tolerances, loads, voltages, plug compatibility)

### Section 5: Requirements traceability
- **5.a**: Map each system component to the system requirements it satisfies
- **5.b**: Map each system requirement to the components that address it
- Ensure every system requirement is accounted for in both directions

### Section 6: Notes
- Alphabetical listing of all acronyms, abbreviations, and their meanings
- Glossary of terms and definitions needed to understand this document
- Background information to aid understanding

### Appendix A
- Include any supplementary material (charts, detailed data, classified information) that supports the main body
- Reference each appendix from the main body where the data would normally appear

## Step 4 — Validate

Before presenting to the user, verify:
- All template sections (1-6 and Appendix A) are populated or marked "Not applicable" with justification
- Every CSCI has a project-unique identifier and represents a logically cohesive grouping (not a 1:1 service mapping)
- The specification tree (4.1.f) is present and shows relationships among planned specifications
- System-wide design decisions (Section 3) are framed as behavioral responses to requirements — **no tool/product names appear as primary descriptions**
- Interface descriptions (4.3.x) cover all seven aspects (a through g) where applicable
- Requirements traceability (Section 5) covers all system requirements in both directions
- Document is written in {document_output_language}

## Step 5 — Review

Present the complete document to {user_name} for review.
Highlight any sections where information was inferred or assumptions were made.
Specifically ask about:
- Is the CSCI decomposition correct? Are there components that should be merged or split?
- Are the interface descriptions accurate and complete?
- Are there additional design decisions not captured in the Architecture?
- Does Section 3 correctly describe behavioral design without leaking implementation details?
- Is the specification tree in 4.1.f accurate?

Offer to refine any section based on feedback.

## Step 6 — Save

Write the final document to:
`{output_folder}/planning-artifacts/SSDD.md`

Confirm the file was saved and display a summary of:
- Number of CSCIs identified (with their identifiers)
- Number of CSCs per CSCI
- Number of interfaces documented
- Number of system-wide design decisions captured
- Specification tree completeness
- Any sections marked "Not applicable"
