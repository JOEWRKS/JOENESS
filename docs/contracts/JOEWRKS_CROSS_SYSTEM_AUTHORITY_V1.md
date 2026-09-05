# JOEWRKS Cross-System Authority Contract v1

**Status:** ACTIVE shared contract  
**Scope:** JOEFLOW, Product Definition, JOEDESIGN, implementation agents, verification evidence, and user acceptance  
**Repository role:** shared contract hosting only; this document does **not** reactivate JOENESS runtime behavior

## 1. Purpose

This contract exists only to prevent cross-system authority drift. It defines who owns which kind of truth, when a task must hand off or re-enter another domain, and what kind of evidence is required before lifecycle progression.

It does **not** define how JOEFLOW, JOEDESIGN, Product Definition, or any implementation agent should perform their internal work. Each system keeps its own internal process in its own repository or project authority.

## 2. Canonical system roles

### JOEFLOW — lifecycle control plane

JOEFLOW preserves user intent and approved authority across agents, tools, repositories, and development phases by controlling:

- current workflow/lifecycle state;
- active authority pointers;
- phase ownership;
- unresolved dependencies;
- gates and required evidence;
- handoffs and re-entry;
- progression and promotion;
- recoverability and next action.

JOEFLOW owns progression, **not domain truth**.

### Product Definition — product meaning authority

Product Definition owns what the product is and how it must behave, including:

- intent and scope;
- functional requirements;
- roles, permissions, and policy;
- information architecture and routes;
- journeys and flows;
- screen purpose;
- state semantics and transitions;
- data meaning;
- loading, empty, error, failure, and recovery behavior;
- material edge cases;
- functional acceptance semantics.

`CLOSED / APPROVED` means product meaning is sufficiently resolved for the authorized next phase. It does not mean design, implementation, verification, or release is complete.

### JOEDESIGN — visual meaning authority

JOEDESIGN owns how approved product truth is visually expressed, explored, proven, refined, and preserved, including:

- Visual North Star and experience/brand character;
- visual direction and alternatives;
- composition and visual hierarchy;
- typography;
- color and surface language;
- imagery and artwork treatment;
- spacing and density;
- visual component/control grammar;
- motion expression;
- responsive visual translation;
- bounded visual proof;
- refinement;
- actual rendered appearance review;
- project `DESIGN.md`.

JOEDESIGN may interpret product truth visually, but may not silently create, remove, or change material product meaning.

### Implementation agents — authorized artifact production

Implementation agents own the actual implementation result inside the currently approved product and visual authorities. They may choose technical implementation details that do not alter higher-level meaning, but may not redefine Product Definition or approved visual authority for convenience.

### Verification evidence — claim proof

Tests, audits, runtime observations, browser/visual evidence, and other checks can prove or fail claims. Evidence does not create authority by itself.

### User — acceptance authority

Only the user can provide user acceptance where user acceptance is required. Technical, product, or visual PASS does not imply user acceptance.

## 3. Source-of-truth ownership

| Truth | Canonical owner |
| --- | --- |
| Final user intent / acceptance | User |
| Product meaning | Product Definition |
| Lifecycle state / progression | JOEFLOW |
| Visual meaning | Project `DESIGN.md` / JOEDESIGN |
| Implemented source | Current repository/source state |
| Actual executed behavior | Current runtime |
| Verification result | Applicable current evidence |

Do not duplicate one domain's canonical truth into another domain's authority file. Cross-system handoffs should point to the authoritative source and carry only the minimum scope/boundary information needed for the next system.

## 4. Responsibility matrix

| Decision | JOEFLOW | Product Definition | JOEDESIGN | Implementation |
| --- | --- | --- | --- | --- |
| What phase are we in? | **OWNER** | reports readiness | reports readiness | reports readiness |
| What must the product do? | routes/gates | **OWNER** | preserve | preserve |
| Roles, permissions, policy | routes/gates | **OWNER** | preserve | preserve |
| UX flow and state semantics | routes/gates | **OWNER** | express | implement |
| Visual North Star | tracks gate | constraint input only | **OWNER** | implement |
| Composition / hierarchy | tracks gate | meaning constraints only | **OWNER** | implement |
| Typography / color / imagery | tracks gate | — | **OWNER** | implement |
| Motion state semantics | tracks gate | **OWNER** | visual expression only | implement |
| Responsive behavioral differences | tracks gate | **OWNER** | preserve | implement |
| Responsive visual recomposition | tracks gate | constraints only | **OWNER** | implement |
| Technical implementation details | tracks progress | constraints only | visual constraints only | **OWNER** |
| Product conformance verdict | consumes evidence | defines expected meaning | — | produces target artifact/evidence |
| Visual conformance verdict | consumes evidence | — | **OWNER** | produces target artifact/evidence |
| User acceptance | manages required gate | cannot self-grant | cannot self-grant | cannot self-grant |

## 5. JOEFLOW ↔ JOEDESIGN contract

### JF-JD-01 — Product authority preservation

JOEDESIGN may visually interpret approved product truth but must not silently create, remove, or alter material product meaning.

Examples that require Product Definition re-entry:

- removing a required CTA;
- changing who may perform an action;
- removing or merging a meaningful state;
- changing failure/recovery semantics;
- changing a required navigation path;
- introducing a new material product behavior during design.

### JF-JD-02 — Visual authority independence

JOEFLOW and Product Definition may constrain design through approved product meaning, but they do not own art direction, composition, typography, imagery, color, spacing, visual motion expression, or other visual truth.

JOEFLOW may require visual evidence before progression, but it does not decide what the visual solution should be.

### JF-JD-03 — Bounded re-entry

When a downstream system discovers a material ambiguity owned by another domain, return only the affected scope to the owning domain.

- design discovers product ambiguity → JOEFLOW routes the affected scope to Product Definition;
- implementation discovers product ambiguity → JOEFLOW routes the affected scope to Product Definition;
- implementation discovers material visual ambiguity → JOEFLOW routes the affected scope to JOEDESIGN;
- ordinary implementation defect with no authority ambiguity → fix inside implementation; no higher-level re-entry.

Do not restart the whole lifecycle when a bounded dependency can be resolved locally.

### JF-JD-04 — Evidence-based progression

Keep the following distinct:

```text
Technical PASS
!= Product Conformance PASS
!= Visual Conformance PASS
!= User Acceptance
```

JOEFLOW may advance the project only when the current lifecycle state has the domain evidence and user approval that state actually requires.

### JF-JD-05 — No workflow inheritance

Reading this shared contract does not cause JOEFLOW to inherit JOEDESIGN's workflow, or JOEDESIGN to inherit JOEFLOW's workflow. Each system remains free to implement its own internal method as long as it respects the authority and handoff boundaries in this document.

## 6. Handoff boundaries

### Product Definition → JOEDESIGN

A design handoff should point to, rather than duplicate, the current Product Definition authority and identify only what JOEDESIGN needs to act safely:

- approved Product Definition pointer/revision;
- current design scope and named surfaces/states/platforms;
- locked product truths that must be preserved;
- any unresolved product boundaries that design must not invent;
- areas intentionally left open for visual judgment.

### JOEDESIGN → Implementation

A visual handoff should point to:

- approved project `DESIGN.md` revision;
- exact approved visual evidence when applicable;
- named surface/state and target dimensions when material;
- visual invariants that implementation must preserve;
- explicitly allowed variation;
- unresolved visual decisions that implementation must not invent;
- visual verification targets.

JOEFLOW tracks that the handoff exists and whether it satisfies the current gate. JOEFLOW does not duplicate the visual authority into its own state.

## 7. Boundary examples

### Motion

Product Definition owns semantic states and transitions, for example:

`Idle → Submit → Loading → Success / Error`

JOEDESIGN owns how those transitions look and feel: timing, easing, spatial continuity, visual feedback, and expressive treatment. JOEDESIGN may not remove a required state because a simpler animation looks better.

### Responsive behavior

- responsive visual recomposition → JOEDESIGN;
- responsive product/behavior difference → Product Definition.

JOEDESIGN may change layout, crop, visual hierarchy, density, and composition across viewports while preserving approved behavior and required information.

### Accessibility

Product Definition owns required user capability and semantic behavior. JOEDESIGN owns visual legibility, contrast, focus treatment, visual motion restraint, and spatial clarity. Implementation owns the actual semantic/runtime implementation. JOEFLOW tracks whether the evidence required by the current gate exists.

### Exploratory visual probe during Product Definition

JOEFLOW may request a bounded JOEDESIGN probe when a user needs visual evidence to resolve a product Unknown Known. That probe is decision evidence only; it does not become Product Definition or approved visual authority until the normal domain approval occurs.

## 8. Verification model

### Product conformance

Question: does the implementation preserve approved product meaning and behavior?

Authority: Product Definition.

### Visual conformance

Question: does the actual rendered output preserve approved visual intent?

Authority: JOEDESIGN.

Minimum JOEDESIGN observation logic:

`expected observable → actual observed fact → PASS / FAIL / UNVERIFIED`

Code, DOM structure, build success, or screenshots existing on disk do not by themselves prove visual appearance.

### Technical verification

Question: does the implementation satisfy the applicable build/test/runtime technical contract?

Authority: current technical evidence.

### User acceptance

Question: has the user accepted the material result when such acceptance is required?

Authority: user only.

## 9. Read / loading policy

This shared contract is intentionally small and is **not** an always-on workflow payload.

Read or refresh it when at least one of these is true:

- a new system or project is being connected to the shared lifecycle;
- a cross-system handoff is being created or consumed;
- an authority conflict or domain ambiguity appears;
- a re-entry decision must be routed;
- the referenced contract version changed.

A normal bounded JOEFLOW-only, JOEDESIGN-only, or implementation-only task does not need to reload this document when the current handoff already identifies the applicable authority and contract version.

Consumers should reference this file/version rather than copying the full contract into their own normative files.

## 10. JOENESS repository boundary

This file is hosted in the former JOENESS repository for shared physical storage only.

It does not:

- reactivate JOENESS runtime;
- install a Common Core or behavioral overlay;
- reactivate historical JOENESS skills or vendors;
- make JOENESS a control plane above JOEFLOW;
- make this repository the owner of Product Definition or visual truth.

Current Astra execution remains:

`Bare Astra + applicable domain system + project-local authority`

Historical JOENESS `skills/**`, `vendor/**`, evals, and compatibility material remain historical/reference evidence unless explicitly reactivated by a separate, evidence-based decision.

## 11. Change policy

Add material to this shared area only when **two or more systems must agree on the same cross-system boundary**. Domain-internal workflow, prompts, stages, routing, design rules, state-machine implementation, or project-specific policy belongs in the owning system/project, not here.

Prefer revising this single contract over creating many overlapping shared policy files. If future needs exceed a small number of true cross-system contracts, review whether the shared layer itself is becoming unnecessary framework overhead.

## Canonical rule

> **JOEFLOW owns progression, not domain truth. Product Definition owns product meaning. JOEDESIGN owns visual meaning. Implementation agents own the authorized implementation result. Verification evidence proves claims but does not create authority, and only the user can provide user acceptance. JOEFLOW coordinates these authorities, prevents one domain from silently redefining another, and advances the project only when the evidence and approval required by the current state are satisfied.**
