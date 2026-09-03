# JOENESS Design Foundation vNext — Architecture Spec

**Status:** P0 architecture candidate for PM review  
**Date:** 2026-09-03  
**Scope:** JOENESS `$design` orchestration, design capability provisioning, project `DESIGN.md` lifecycle, and visual proof/verification.  
**Base:** `main@1d867465cc2f99788a0b478d5fba4eb090fcde83`

## 0. Decision summary

JOENESS Design Foundation vNext is not a one-off `DESIGN.md` authoring task. It is the design execution subsystem for JOENESS.

The architecture has two normative design layers only:

1. `skills/design/SKILL.md` — the single JOENESS-wide design **process/orchestration contract**.
2. `<project-root>/DESIGN.md` — at most one project-owned **durable visual contract**, created from the JOENESS canonical template and developed per project.

Do **not** split JOENESS design behavior across additional normative files such as `design-stage-gates.md`, `design-tool-routing.md`, `design-md-contract.md`, or `visual-acceptance.md`. Vendor documentation, source manifests, evidence, QA, and templates may exist separately, but they are not competing rule authorities.

The current `$design` → `$visual-check` responsibility boundary remains. `$design` decides design intent, stage, capability routing, and pre-render Visual Claims. `$visual-check` verifies the exact produced result. Internal verification never self-upgrades user acceptance.

Open Design is excluded.

---

## 1. Problem being solved

BIO/02 demonstrated that extensive implementation, testing, screenshots, QA, and reviewer separation can still converge on the wrong visual architecture when:

- implementation-friendly structures are chosen before strong visual proof;
- design truth is distributed across many specs, plans, QA files, and current code;
- external capabilities are available but used at the wrong stage or not used at all;
- the implementation itself retroactively defines its own acceptance criteria;
- semantic identity is mistaken for perceptual identity;
- technical PASS is over-interpreted as visual acceptance;
- repeated visual rejection leads to local patching instead of returning to direction/proof.

JOENESS already has useful protections in `$design` and `$visual-check`; vNext must extend them without creating a second design orchestrator or bloating Common Core.

---

## 2. Goals

### G1 — One design entry point

Users normally need to know only `$design` for visual/UI design work. External tools are capabilities routed underneath it, not additional art directors the user must coordinate manually.

### G2 — Stage-aware routing with no required-call omissions

`$design` classifies the current design stage first, then applies the stage's `MUST`, `WHEN NEEDED`, and `FORBIDDEN` responsibilities. Required proof or verification must not be skipped merely because an agent chooses a different implementation path.

### G3 — Pre-provisioned design capability stack

Capability installation/readiness is a JOENESS setup/update responsibility, not a per-agent ad hoc decision. Agents decide whether a ready capability is needed for the current stage; they do not repeatedly rediscover or install the stack.

### G4 — One project visual authority

Each project may have at most one root `DESIGN.md` that owns durable visual decisions. It starts from a JOENESS canonical template but evolves independently per project.

### G5 — Proof before production

Material visual decisions are proven at the smallest useful scale before dependent production expansion. A Visual Claim is defined before rendering and verified against the exact output.

### G6 — User acceptance remains distinct

`ㄱㄱ`, `진행`, implementation authorization, test PASS, visual-check PASS, or tool output do not automatically mean the user accepted a material visual direction.

---

## 3. Non-goals

This project does not:

- create a second top-level design skill/router;
- add a global visual aesthetic or global `DESIGN.md`;
- make BIO/02's visual language a JOENESS default;
- rewrite `$visual-check` into a design generator;
- make external tools authoritative over user/product/project design;
- install every component library into every project;
- install project motion runtimes globally;
- make Hallmark or Impeccable autonomous redesign authorities;
- install the full oh-my-design orchestration bundle by default;
- integrate Open Design;
- redesign BIO/02 production Home during foundation implementation.

---

## 4. Normative file model

### 4.1 JOENESS global normative source

`skills/design/SKILL.md`

It owns:

- trigger and design/visual-defect boundary;
- authority and safety;
- project `DESIGN.md` discovery/lifecycle rules;
- design-stage classification;
- stage `MUST / WHEN NEEDED / FORBIDDEN` responsibilities;
- Visual Claim preflight;
- capability routing and capability authority limits;
- product-definition re-entry boundary;
- user gates;
- rejection/architecture stop behavior;
- exact-result handoff to `$visual-check`;
- completion/readiness wording constraints.

`skills/design/agents/openai.yaml` remains metadata/default-prompt configuration, not a second normative rule source.

### 4.2 Project visual source

`<project-root>/DESIGN.md`

It owns the project's durable visual DNA, such as:

- Visual North Star / experience character;
- durable visual principles;
- legitimate surface modes;
- typography roles;
- color/surface semantics;
- composition/spatial hierarchy;
- imagery/artwork treatment;
- component/control grammar;
- motion/interaction language;
- responsive translation;
- accessibility/legibility decisions that are genuinely visual-design-specific;
- project-specific anti-patterns;
- reference relationships;
- durable visual acceptance anchors;
- amendment metadata.

It must not duplicate product truth, tool installation instructions, JOENESS stage routing, eval instructions, or generic workflow rules.

### 4.3 Non-normative supporting material

The following may exist but do not become additional design-rule authorities:

- vendor documentation;
- source manifest / notices;
- reference research and matrices;
- screenshots/keyframes/renders;
- QA/evidence;
- temporary task briefs;
- failed experiments and postmortems;
- tool receipts and provenance.

Approved exact visual output is scoped evidence/preservation target for the named surface/state. It does not silently create a new project-wide design rule.

---

## 5. Canonical `DESIGN.md` template

JOENESS provides one canonical seed at:

`skills/design/templates/DESIGN.md`

The template is not global visual authority and must not encode a JOENESS aesthetic. It standardizes the structure and lifecycle of project contracts.

Recommended initial structure:

1. Contract metadata (`Status`, `Revision`, product authority pointer)
2. Visual North Star
3. Experience / Brand Character
4. Durable Visual Principles
5. Surface Modes
6. Typography
7. Color / Surface Semantics
8. Composition / Spatial Hierarchy
9. Imagery / Artwork
10. Component / Control Grammar
11. Motion / Interaction
12. Responsive Translation
13. Accessibility / Legibility
14. Project-specific Anti-patterns
15. Reference Relationships
16. Visual Acceptance Anchors
17. Amendment Rule

Lifecycle:

`ABSENT → DRAFT → APPROVED`

Material revision:

`APPROVED Rev N → DRAFT Rev N+1 → explicit user approval → APPROVED Rev N+1`

A generated DRAFT may guide bounded proof work when the user authorized that proof, but it does not self-promote to approved project-wide authority.

---

## 6. Authority model

Use domain and scope, not a CSS-style specificity cascade.

1. Current explicit user instruction.
2. Product / UX authority for behavior, flow, route, data, role, policy, and meaning.
3. Approved project `DESIGN.md` for durable visual decisions.
4. Approved exact visual evidence for its named surface/state as evidence/preservation target.
5. Accepted existing implementation where not superseded.
6. External references, tools, vendor guidance, component defaults.

Rules:

- A temporary brief cannot silently create a durable visual rule.
- External capability output is candidate/advice/evidence, never automatic authority.
- Rejected implementation is negative evidence only.
- If a local visual request materially changes the durable project system, enter the `DESIGN.md` amendment route rather than preserving contradictory live rules.
- If a design proposal changes product meaning/flow/state/route/policy, route to product definition and return after that decision is resolved.

---

## 7. Stage router and mandatory responsibilities

The labels below are orchestration stages, not a required waterfall. Use only the stages relevant to the current task, but do not omit a stage responsibility that the task actually requires.

### S0 — Context / Authority

**Use for:** every design-intent task before generating or changing a material design.

**MUST**
- identify user scope and target;
- locate product/UX authority;
- locate and read project `DESIGN.md` if present;
- identify approved/rejected exact visual evidence relevant to the target;
- classify whether the requested change is visual-only or changes product meaning;
- classify the next required design stage.

**WHEN NEEDED**
- route product ambiguity to `joewrks-product-definition`.

**FORBIDDEN**
- starting a redesign solely from current implementation appearance;
- treating a DRAFT or tool output as approved authority.

### S1 — Direction / Reference

**Use for:** absent/unresolved visual direction, material `DESIGN.md` amendment, or return after repeated rejection.

**MUST**
- analyze references as relationships, not component recipes;
- distinguish `TAKE / DO NOT TAKE / WHY / APPLIES TO` where references materially affect the decision;
- produce or amend a DRAFT project design contract when durable direction is required;
- keep production implementation out of the role of direction proof.

**WHEN NEEDED**
- Refero reference research;
- UI UX Pro Max;
- Apple Design guidance;
- oh-my-design reference/DESIGN.md evidence;
- Hallmark `study` as advisory reference analysis.

**FORBIDDEN**
- running all reference tools by default;
- letting an external tool silently rewrite approved project design.

### S2 — Static Visual Proof

**Use for:** composition, typography, imagery, hierarchy, identity, key visual, signature screen.

**MUST before rendering**
- define the smallest sourced Visual Claim set;
- name surface/state/target dimensions when relevant;
- name expected observables and evidence method.

**WHEN NEEDED**
- Impeccable critique/layout/typeset/polish/variants;
- Image generation;
- Figma when actually useful/authorized;
- browser rendering.

**MUST after rendering**
- hand the exact produced artifact/result to `$visual-check`;
- keep user visual acceptance separate from internal verdict.

**USER GATE**
- material keyframe / materially different final visual variant.

### S3 — Motion / Interaction Proof

**Use for:** signature motion, spatial continuity, gesture, structural reorganization, state choreography.

**MUST**
- define meaningful start / midpoint / end;
- define reverse behavior when it is part of the interaction;
- define interruption/user-control expectations when applicable;
- define reduced-motion behavior;
- identify the semantic information gained from the motion;
- prove the motion in a bounded prototype before broad integration when it is material/signature.

**WHEN NEEDED**
- Apple Design guidance;
- project runtime such as Anime.js;
- Componentry as implementation-pattern research;
- optimize-web-animations only after semantic choreography exists.

**MUST after rendering**
- `$visual-check` exact motion result/evidence.

**USER GATE**
- signature motion architecture/final material motion direction.

### S4 — Production Implementation

**Use for:** implementing sufficiently accepted direction/proof.

**MUST**
- preserve approved intent and protected behavior;
- avoid inventing a new visual system inside production implementation;
- preserve relevant responsive, keyboard, focus, loading/empty/error behavior.

**WHEN NEEDED**
- existing project component system;
- Watermelon for product/utility primitives;
- Componentry for advanced implementation patterns;
- Cult UI for selective components/effects.

**FORBIDDEN**
- adding a component because it looks impressive without an already-defined need;
- installing a new project dependency without authority.

### S5 — Responsive / State Translation

**Use for:** translating an accepted experience across viewport/state families.

**MUST**
- preserve design intent rather than literal coordinates;
- detect when width alone is insufficient and height/aspect/container context materially affects composition;
- verify required target surfaces/states with `$visual-check`;
- preserve approved identity while allowing legitimate recomposition.

**FORBIDDEN**
- treating mobile as desktop scaled down;
- using fluid scaling as a substitute for necessary recomposition.

### S6 — Acceptance

Report separate status layers when applicable:

- Technical
- Responsive
- Accessibility
- Performance
- Visual Internal
- User Acceptance

Rules:

- internal PASS cannot upgrade User Acceptance;
- build/test/DOM/console/performance success cannot upgrade a failed visual claim;
- installed/invoked tool success is not design success.

---

## 8. Visual Claim contract

Before material visual production, define only the claims needed by the current task.

Each claim should minimally bind:

- source;
- claim;
- surface;
- state;
- target dimensions when material;
- expected observable;
- evidence method;
- semantics: `acceptance` or `boundary`.

Do not turn the claim system into a universal checklist. Candidate output cannot retroactively define acceptance criteria.

`$design` creates/owns the sourced claim. `$visual-check` verifies the exact produced result against it.

---

## 9. Design Capability Stack

The user should not need to remember installation or invocation details for the stack.

### 9.1 Managed Core — always ready

- `$design`
- `$visual-check`
- UI UX Pro Max vendor guidance
- Apple Design vendor guidance

These are existing JOENESS capabilities and remain part of the managed distribution.

### 9.2 Managed Extensions — pre-provisioned/verified, bounded authority

#### Impeccable

Role:
- rendered UI critique;
- layout/typeset/polish/refine;
- candidate variation/live iteration where supported.

Provisioning target:
- project-scoped or otherwise non-global-conflicting installation;
- automatic hooks OFF initially;
- exact version/source pinned and installed files/readiness verified.

Authority:
- may refine under existing authority;
- material new direction or materially distinct final variant requires user gate;
- may not silently rewrite project `DESIGN.md` or product truth.

#### Hallmark

Role:
- independent anti-AI-slop audit;
- reference study when useful.

Provisioning target:
- ready before individual agents need it;
- exact source/version and installed path verified.

Automatic permission:
- `audit` only by default.

Conditional:
- `study`.

Not automatic:
- build;
- redesign;
- project design lock/write.

### 9.3 Reference Sources — ready as sources, not necessarily installed

#### Refero
- real-world screen/flow/design relationship evidence;
- web/reference access is sufficient initially;
- optional MCP only if independently justified later.

#### oh-my-design
- DESIGN.md/reference/anti-slop evidence source;
- full orchestration bundle is **not** a default prerequisite because it introduces competing skills/agents/routing;
- any future managed integration must be selectively scoped and collision-tested first.

### 9.4 On-demand implementation sources

- Watermelon UI — product/utility primitives first when appropriate;
- Componentry — advanced interaction implementation research/patterns;
- Cult UI OSS — selective component/effect source.

They are not design authorities and are not globally installed into every project. Access/registry knowledge may be provisioned; project source/dependencies are added only when needed and authorized.

### 9.5 Project runtime

- Anime.js or another runtime belongs to the project, not the JOENESS global design stack.
- `$design` may route to the runtime based on the actual motion problem.
- presence of a runtime does not justify adding animation.

### 9.6 Explicit exclusion

- Open Design.

### 9.7 Deferred/non-core sources

Skiper UI, GetLayers, MotionSites and paid/proprietary sources remain non-core unless a later project creates independent evidence for their adoption. They must not expand P0/P1 scope.

---

## 10. Capability provisioning contract

Capability installation/readiness is owned by JOENESS setup/update/check logic, not by individual project agents.

Distinguish readiness states such as:

- `READY_MANAGED`
- `READY_REFERENCE`
- `AVAILABLE_ON_DEMAND`
- `PROJECT_RUNTIME`
- `BLOCKED`

A managed external capability is not considered ready merely because an install command returned success. For a managed extension, completion requires as applicable:

1. official upstream identity verified;
2. exact version/commit pin recorded;
3. license/notices reviewed;
4. isolated or bounded install method established;
5. installed file inventory/readback verified;
6. collision/implicit-trigger/hook behavior checked;
7. `$design` routing and authority limits integrated;
8. uninstall/rollback path verified;
9. no unintended global/personal config or project production mutation.

The current JOENESS `vendor/source-manifest.json` remains the provenance/pinning location when material is intentionally vendored or managed there; do not create redundant source registries without need.

---

## 11. User gates

The agent may make reversible bounded draft decisions under delegated design judgment, but the following do not self-approve:

- new Visual North Star;
- material project `DESIGN.md` revision;
- final choice among materially different visual variants;
- replacement of an accepted exact keyframe/preservation target;
- signature interaction architecture/final material motion direction;
- disposal of an approved composition/identity.

`ㄱㄱ`, `진행`, `구현해`, or similar continuation authorization means the user authorizes the next action within current authority. It is not exact rendered visual acceptance unless the context explicitly makes that acceptance clear.

---

## 12. Failure / return behavior

### Repeated visual rejection

If the same visual direction is materially rejected twice:

- do not make a third local polish pass by default;
- stop dependent production expansion;
- return to S1/S2;
- compare exact failed evidence against project design and approved references;
- reconsider composition/object ownership rather than only CSS values.

This is a `$design` visual-stage rule, not a universal Common Core retry rule.

### Cross-component symptoms

If different failures repeatedly emerge from components that share the same visual architecture, inspect the shared architecture rather than continuing independent local patches.

### Existing coverage vs missing mechanism

A project failure does not automatically justify a JOENESS rule change. Before promoting a new global mechanism, classify whether the failure was:

- already covered but not executed;
- project-specific;
- or a repeated/common missing mechanism.

---

## 13. BIO/02 dogfood role

BIO/02 is the primary complex dogfood fixture, not the source of JOENESS's global aesthetic.

During foundation implementation:

- preserve BIO/02 product/IA/data foundation;
- keep old Home V1–V7 visual grammar as rejected historical evidence;
- freeze new production Home redesign;
- maintain `BIO02_DESIGN.md` only as a stable DRAFT fixture until explicit approval;
- use it to test DRAFT discovery, authority handling, stage routing, Visual Claims, product boundary, tool routing, and user-gate semantics.

After the foundation passes its own regression and readiness gates, BIO/02 resumes as real dogfood:

1. static proof(s), including the named keyframes required by its project contract;
2. exact `$visual-check`;
3. user static acceptance;
4. one bounded signature motion prototype;
5. reverse/reduced-motion/performance checks;
6. user motion acceptance;
7. only then dependent production expansion.

BIO/02 must not be the only eval shape. Simple polish, operate UI, nonvisual negative-routing, and other project contexts are also required so the harness does not overfit BIO/02.

---

## 14. Dororong relation

Dororong remains an independent project-validation track. Its current recovery/verification work does not block Design Foundation implementation.

Dororong findings may become JOENESS evidence only after classification:

- already-covered nonexecution → no new global rule;
- project-specific → remain local;
- independently repeated missing mechanism → candidate for the relevant JOENESS layer.

Do not use Dororong to expand `$design` merely because it also contains visual assets.

---

## 15. Required implementation surfaces

The implementation plan may refine exact file paths after a fresh repository audit, but the expected surface is:

### Core source
- modify `skills/design/SKILL.md`;
- modify `skills/design/agents/openai.yaml` only as needed for discovery/default prompt;
- create `skills/design/templates/DESIGN.md`.

### Capability distribution/readiness
- inspect and minimally update installer/check/manifest logic required to provision managed extensions and report readiness;
- reuse `vendor/source-manifest.json` for pinned vendored/managed source metadata when appropriate;
- preserve the current six public JOENESS skills; external managed capabilities do not become new JOENESS public top-level entry points by default.

### Evaluation
Extend existing design/skill-contract evaluation rather than creating an unrelated evaluation framework.

Required behavior cases include at least:

1. no project `DESIGN.md` + durable new direction → DRAFT proposal, not approved authority;
2. approved `DESIGN.md` + bounded implementation → follows it without unnecessary redesign;
3. DRAFT `DESIGN.md` → correctly bounded use, no self-promotion;
4. external tool conflicts with project design → project design wins;
5. user requests material persistent visual change → amendment/user gate;
6. known rejected implementation → negative evidence only;
7. S1 reference task → relevant references only, no tool fan-out;
8. S2 static proof → pre-render Visual Claim + exact `$visual-check`;
9. S3 signature motion → start/mid/end/reverse/reduced-motion semantics + exact proof;
10. S4 production → no new visual system invented in implementation;
11. responsive translation → recomposition when necessary, not blind scaling;
12. Hallmark automatic route → audit only;
13. Impeccable refinement under authority → allowed; material variant choice → gated;
14. product/flow/state change disguised as visual change → product-definition re-entry;
15. two material visual rejections → return to S1/S2, no third local polish by default;
16. `ㄱㄱ` after a candidate → continuation authority only, not automatic exact visual acceptance;
17. nonvisual task → `$design` remains inactive;
18. missing optional capability → fallback/UNVERIFIED as appropriate without fake verification.

---

## 16. Acceptance criteria for Foundation vNext

Foundation vNext is ready for real dogfood only when all of the following are evidenced on the exact implementation revision:

1. `$design` remains the single JOENESS design entry point.
2. Global normative design workflow is not split across competing reference rule files.
3. No global visual aesthetic/`DESIGN.md` is introduced.
4. Canonical project `DESIGN.md` template exists and contains no forced project aesthetic.
5. Project `DESIGN.md` lifecycle distinguishes ABSENT/DRAFT/APPROVED/revision.
6. Stage routing has `MUST / WHEN NEEDED / FORBIDDEN` behavior and required-call omissions are covered by evals.
7. Visual Claims are defined before material visual output.
8. Exact visual output still routes to `$visual-check`.
9. User Acceptance is not inferred from internal/tool/technical PASS or simple continuation commands.
10. Product/UX changes re-enter product definition instead of being silently solved as visual design.
11. Impeccable readiness is bounded and hooks are OFF unless separately authorized.
12. Hallmark readiness is audit-first and cannot auto-redesign/write project design.
13. Refero/oh-my-design remain reference sources unless a later controlled integration is separately justified.
14. Watermelon/Componentry/Cult remain on-demand sources, not global project dependencies.
15. Project motion runtime remains project-owned.
16. Open Design is absent from required routing/provisioning.
17. Existing `$design` authority/safety and `$visual-check` gates are not weakened.
18. Existing non-design/public-skill routing behavior does not regress.
19. Managed capability installation has exact source/version/readback/collision/rollback evidence rather than install-command success alone.
20. BIO/02 fixture can exercise DRAFT/stage/claim/gate behavior without modifying production Home during foundation work.

---

## 17. Delivery sequence

### P0 — Architecture Lock
This spec. No production implementation.

### P1 — Core `$design` Foundation
- consolidate vNext orchestration into `SKILL.md`;
- update `openai.yaml` only as needed;
- add canonical `DESIGN.md` template;
- extend routing/contract evals.

### P2 — Capability Provisioning
- verify exact current upstreams/licenses/install semantics;
- provision Impeccable bounded + hooks OFF;
- provision Hallmark audit-first;
- register/reference ready sources;
- integrate installer/check/readiness with rollback evidence.

### P3 — Full Regression / Readiness
- existing design and non-design regressions;
- stage/router/user-gate cases;
- capability collision/readiness checks;
- fresh-agent/manual smoke where existing JOENESS methodology requires it.

### P4 — BIO/02 Dogfood
- use stable BIO/02 project design fixture;
- static proof and motion proof only before production expansion;
- user acceptance remains external to agent self-verification.

### P5 — Independent second-project validation
Use a materially different design context before treating BIO/02-derived mechanisms as broadly validated.

---

## 18. PM review questions

Before implementation planning, PM review should confirm:

1. The two normative design layers (`$design/SKILL.md` global process + one project `DESIGN.md` visual contract) are accepted.
2. The previous plan to create multiple normative `$design` reference files is superseded.
3. Capability installation is a JOENESS provisioning responsibility, while per-task usage remains `$design` routing responsibility.
4. Impeccable + Hallmark are the only initial managed external extensions; Refero/oh-my-design are reference-ready; Watermelon/Componentry/Cult remain on-demand; Anime.js remains project runtime.
5. BIO/02 production Home stays frozen until foundation readiness, while its design DRAFT remains a fixture/dogfood input.
6. Dororong remains independent and contributes only classified evidence.

Implementation must not start until this written P0 architecture is reviewed and accepted.