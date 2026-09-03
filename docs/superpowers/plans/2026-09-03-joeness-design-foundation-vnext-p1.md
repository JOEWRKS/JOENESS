# JOENESS Design Foundation vNext P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing JOENESS `$design` skill into the single stage-aware design orchestration contract, add the canonical project `DESIGN.md` seed template, preserve the `$design` → `$visual-check` boundary, and validate the new contract without yet provisioning external managed extensions.

**Architecture:** Keep `skills/design/SKILL.md` as the only JOENESS-wide normative design workflow. Add exactly one non-authoritative seed template at `skills/design/templates/DESIGN.md`; project copies become the project-owned visual contract. Extend the existing skill-contract/integrity test system rather than creating a new evaluator framework. P2 external capability provisioning (Impeccable/Hallmark installation/readiness) is intentionally separate from this plan.

**Tech Stack:** Markdown Agent Skills, YAML OpenAI skill metadata, JSON source manifest/eval ledgers, Node.js `node:test`, existing JOENESS PowerShell manifest-driven installer.

**Spec:** `docs/superpowers/specs/2026-09-03-joeness-design-foundation-vnext.md`

## Global Constraints

- Preserve exactly six public JOENESS skills: `$project`, `$ticket`, `$design`, `$visual-check`, `$spec`, `$handoff`.
- `skills/design/SKILL.md` is the single JOENESS-wide normative design workflow; do not create `design-stage-gates.md`, `design-tool-routing.md`, `design-md-contract.md`, or another normative design reference.
- A project may have at most one root `DESIGN.md` durable visual contract.
- The canonical template must not encode BIO/02 or any other project aesthetic.
- Preserve current `$design` safety, authority-scoping, variant/state matrix, evidence-layer typing, and `$visual-check` handoff behavior unless the spec explicitly strengthens it.
- `$visual-check` remains the verifier of exact produced visual results; P1 does not rewrite its references or loosen its gates.
- `ㄱㄱ`, `진행`, `구현해`, implementation authorization, test PASS, tool PASS, and visual-check internal PASS do not automatically equal exact user visual acceptance.
- Open Design is excluded.
- P1 names/routs external capabilities but does **not** install Impeccable, Hallmark, Watermelon, Componentry, Cult UI, Anime.js, or oh-my-design.
- UI UX Pro Max and Apple Design remain existing managed source dependencies.
- Do not modify BIO/02 production Home in P1.
- Do not change `scripts/sync-harness.ps1` merely to distribute the new template: its current `Get-HarnessManifestSelections` already copies every file listed under an active skill and its source dependencies. Add the template to `vendor/source-manifest.json` instead.
- Keep `promotionPass: false`; P1 static/contract evidence must not be promoted to semantic/runtime validation.

---

## File Structure

Create:

- `skills/design/templates/DESIGN.md` — canonical project visual-contract seed; comments/instructions only, no project aesthetic.
- `evals/skill-contracts/cases-v15.json` — P1 design-foundation contract cases inheriting v14.
- `evals/skill-contracts/design-foundation-v15-contract-test-v1.json` — exact static-contract invocation receipt created only after the focused suite passes.

Modify:

- `skills/design/SKILL.md` — single global design orchestration contract.
- `skills/design/agents/openai.yaml` — compact default prompt; no duplicate policy source.
- `tests/skill-contracts.tests.mjs` — lifecycle/stage/tool-routing/static contract assertions and v15 case ledger.
- `tests/design-vendor-integrity.tests.mjs` — exact manifest expectations for the updated design skill and template.
- `vendor/source-manifest.json` — exact bytes/SHA-256 for updated design files/template plus conservative v15 static-evidence pointer.
- `README.md` — user-facing `$design` behavior in plain language; no internal stage manual.

Do not modify in P1:

- `skills/visual-check/**`
- `scripts/sync-harness.ps1`
- `common-core.md` or active Common Core candidate
- BIO/02 production source
- compatibility archives under `vendor/compatibility/joeness-0.1/**`

---

### Task 1: Add the project `DESIGN.md` lifecycle and canonical seed

**Files:**
- Create: `skills/design/templates/DESIGN.md`
- Modify: `skills/design/SKILL.md`
- Modify: `tests/skill-contracts.tests.mjs`

**Interfaces:**
- Consumes: existing `$design` authority/safety contract.
- Produces: one project-root `DESIGN.md` lifecycle (`ABSENT → DRAFT → APPROVED`) and a non-aesthetic seed template later distributed through the design skill manifest.

- [ ] **Step 1: Add a failing static contract test for the single project design contract**

In `tests/skill-contracts.tests.mjs`, add `DESIGN_TEMPLATE_PATH` beside the existing role-path constants:

```js
const DESIGN_TEMPLATE_PATH = path.join(ROOT, 'skills', 'design', 'templates', 'DESIGN.md');
```

Add this test after `design excludes layout-unaffected copy and literal-value fixes`:

```js
test('design vNext binds one project DESIGN.md lifecycle to a non-aesthetic canonical seed', () => {
  const design = readRoleFile('design', 'SKILL.md');
  assert.ok(existsSync(DESIGN_TEMPLATE_PATH), 'missing skills/design/templates/DESIGN.md');
  const template = readFileSync(DESIGN_TEMPLATE_PATH, 'utf8');

  assert.match(design, /project[- ]root `?DESIGN\.md`?.*single.*durable visual/is);
  assert.match(design, /ABSENT.*DRAFT.*APPROVED/is);
  assert.match(design, /DRAFT.*(?:not|never).*approved authority/is);
  assert.match(design, /material.*(?:revision|amendment).*user.*approval/is);
  assert.match(design, /temporary.*brief.*not.*durable visual rule/is);
  assert.match(design, /approved exact visual.*(?:evidence|preservation target).*not.*project-wide.*rule/is);

  for (const heading of [
    'Visual North Star',
    'Experience / Brand Character',
    'Durable Visual Principles',
    'Surface Modes',
    'Typography',
    'Color / Surface Semantics',
    'Composition / Spatial Hierarchy',
    'Imagery / Artwork',
    'Component / Control Grammar',
    'Motion / Interaction',
    'Responsive Translation',
    'Accessibility / Legibility',
    'Project-specific Anti-patterns',
    'Reference Relationships',
    'Visual Acceptance Anchors',
    'Amendment Rule',
  ]) {
    assert.match(template, new RegExp(`^## .*${heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`, 'mi'));
  }

  assert.match(template, /^\*\*Status:\*\* DRAFT$/m);
  assert.match(template, /^\*\*Revision:\*\* 1$/m);
  assert.doesNotMatch(template, /Editorial Biopharma|Quiet Luxury|warm mineral|neon lime|glassmorphism|BIO\/02/i);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: FAIL because `skills/design/templates/DESIGN.md` does not exist and the current `$design` does not yet state the project `DESIGN.md` lifecycle.

- [ ] **Step 3: Create the canonical seed template**

Create `skills/design/templates/DESIGN.md` with exactly this structural contract:

```markdown
# Project Design

**Status:** DRAFT
**Revision:** 1
**Product / UX authority:** <!-- Point to the current product/UX authority. Do not duplicate product truth here. -->

> This file is the project's single durable visual-design contract once explicitly approved. Keep project-specific visual decisions here; keep tool routing, installation, temporary task instructions, QA logs, and implementation history elsewhere.

## 1. Visual North Star
<!-- Define how this project should feel and what should make it recognizably itself. -->

## 2. Experience / Brand Character
<!-- Describe the intended experiential qualities and the tensions the design must hold. -->

## 3. Durable Visual Principles
<!-- Record only project-wide principles that should survive individual screens and iterations. -->

## 4. Surface Modes
<!-- Define legitimate project variations such as narrative, data, utility, immersive, or other project-specific modes. -->

## 5. Typography
<!-- Define roles and hierarchy. Add exact families/values only when evidence or approval supports them. -->

## 6. Color / Surface Semantics
<!-- Define semantic roles and surface relationships; do not invent exact tokens merely to make the file look complete. -->

## 7. Composition / Spatial Hierarchy
<!-- Define durable composition relationships, hierarchy, density, alignment, negative space, and grouping behavior. -->

## 8. Imagery / Artwork
<!-- Define art direction, approved identity constraints, scale/crop/composition behavior, and project-specific image anti-patterns. -->

## 9. Component / Control Grammar
<!-- Define the visual relationship of controls and functional containers without turning this file into a component API manual. -->

## 10. Motion / Interaction
<!-- Define what motion communicates, its restraint/agency, and any project-specific signature behavior. -->

## 11. Responsive Translation
<!-- Define what must be preserved when recomposing across viewport/state families; do not assume scaling is translation. -->

## 12. Accessibility / Legibility
<!-- Record project-specific visual/accessibility decisions that are not already product or engineering policy. -->

## 13. Project-specific Anti-patterns
<!-- Record visual grammars that are known to contradict this project. -->

## 14. Reference Relationships
<!-- For meaningful references, record the relationship to borrow, what not to copy, and the concern/surface it informs. -->

## 15. Visual Acceptance Anchors
<!-- Record durable project-level visual claims. Task-specific observable checks are derived later by $design. -->

## 16. Amendment Rule
A material project-wide visual change creates a new DRAFT revision. Do not keep contradictory live rules. Explicit user approval is required before the revision becomes APPROVED.
```

- [ ] **Step 4: Extend `skills/design/SKILL.md` with one project-contract section**

Preserve the current trigger/frontmatter, authority safety, variant/state matrix, evidence-layer typing, Figma safety, visual-defect boundary, and exact `$visual-check` completion handoff.

Insert one section before the existing detailed multi-variant/evidence-layer paragraph. The section must state all of the following in direct prose:

```markdown
## Project design contract

For design-intent work, locate the project root and check for exactly one root `DESIGN.md`. That file is the project's single durable visual contract; do not create a second durable visual-rule file in task briefs, QA, reference notes, tool output, or current implementation.

Lifecycle is `ABSENT → DRAFT → APPROVED`. If durable visual direction is required and the file is absent, use `templates/DESIGN.md` only as the structural seed and propose a project-specific DRAFT from current user/product/reference evidence. A generated DRAFT may guide a bounded proof the user authorized, but it is not approved project-wide authority. A material change to an APPROVED design becomes `DRAFT Rev N+1` and requires explicit user approval before replacing the approved revision; do not preserve contradictory live rules.

A temporary task brief can narrow the current task but cannot silently create a durable project rule. Approved exact keyframes/running outputs are scoped evidence or preservation targets for their named surface/state, not a second project-wide design-rule source. Existing implementation is visual authority only where it is accepted and not superseded.
```

- [ ] **Step 5: Re-run the focused test and verify GREEN**

Run:

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: PASS for all existing tests plus the new lifecycle/template test.

- [ ] **Step 6: Commit Task 1**

```bash
git add skills/design/SKILL.md skills/design/templates/DESIGN.md tests/skill-contracts.tests.mjs
git commit -m "design: add project design contract seed"
```

---

### Task 2: Add stage routing, Visual Claims, and user-acceptance gates to the single `$design` contract

**Files:**
- Modify: `skills/design/SKILL.md`
- Modify: `tests/skill-contracts.tests.mjs`

**Interfaces:**
- Consumes: Task 1 project-design lifecycle.
- Produces: stage-first orchestration (`S0`–`S6`), mandatory/conditional/forbidden responsibilities, pre-render Visual Claims, and material visual user gates.

- [ ] **Step 1: Add failing assertions for stage routing and pre-render claims**

Add this test to `tests/skill-contracts.tests.mjs`:

```js
test('design vNext routes by stage and defines sourced Visual Claims before material rendering', () => {
  const design = readRoleFile('design', 'SKILL.md');

  for (const [id, label] of [
    ['S0', 'Context / Authority'],
    ['S1', 'Direction / Reference'],
    ['S2', 'Static Visual Proof'],
    ['S3', 'Motion / Interaction Proof'],
    ['S4', 'Production Implementation'],
    ['S5', 'Responsive / State Translation'],
    ['S6', 'Acceptance'],
  ]) {
    assert.match(design, new RegExp(`${id}.*${label.replace('/', '\\/')}`, 'is'));
  }

  assert.match(design, /MUST.*WHEN NEEDED.*FORBIDDEN/is);
  assert.match(design, /Visual Claim.*source.*surface.*state.*target dimensions.*expected observable.*evidence method.*acceptance.*boundary/is);
  assert.match(design, /before.*material visual.*(?:render|output).*Visual Claim/is);
  assert.match(design, /S2.*exact.*visual-check/is);
  assert.match(design, /S3.*start.*midpoint.*end.*reverse.*reduced motion/is);
  assert.match(design, /S5.*height.*aspect.*(?:container|containing).*recomposition/is);
  assert.match(design, /Technical.*Responsive.*Accessibility.*Performance.*Visual Internal.*User Acceptance/is);
  assert.match(design, /(?:ㄱㄱ|진행|구현해).*not.*(?:exact )?visual acceptance/is);
  assert.match(design, /material keyframe.*user.*(?:gate|approval)/is);
  assert.match(design, /signature motion.*user.*(?:gate|approval)/is);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: FAIL on missing `S0`–`S6` / Visual Claim / user-gate language.

- [ ] **Step 3: Add one compact stage-router section to `skills/design/SKILL.md`**

Add a single section named `## Stage routing and proof` with these exact responsibilities in prose/table form; do not move them into extra reference files:

```markdown
## Stage routing and proof

Classify the current design stage before choosing capabilities. These stages are not a mandatory waterfall; use only the stages the task actually needs, but do not omit a responsibility that applies.

- **S0 — Context / Authority.** MUST bind user scope, product/UX authority, project `DESIGN.md` state, relevant approved/rejected visual evidence, and whether the request changes product meaning. WHEN NEEDED route behavior/flow/route/data/role/policy ambiguity back to product definition. FORBIDDEN: redesign from current implementation appearance alone or treating DRAFT/tool output as approved authority.
- **S1 — Direction / Reference.** MUST use when durable direction is absent/unresolved, a material design amendment is requested, or repeated rejection returns the work to direction. Analyze references as relationships; when they materially affect the decision state `TAKE / DO NOT TAKE / WHY / APPLIES TO`. WHEN NEEDED use the relevant reference capabilities only. FORBIDDEN: tool fan-out or using production implementation as the proof of a new direction.
- **S2 — Static Visual Proof.** MUST define the smallest sourced Visual Claim set before material rendering; bind surface/state/target dimensions where relevant, expected observables, and evidence method. WHEN NEEDED use critique/layout/typeset, image generation, Figma, or browser rendering. MUST hand the exact produced result to `$visual-check`. A material keyframe or materially distinct final variant requires user visual approval before dependent expansion.
- **S3 — Motion / Interaction Proof.** MUST define meaningful start/midpoint/end, reverse when applicable, interruption/user-control expectations when applicable, reduced motion, and the semantic information gained. Material/signature motion is proven in a bounded prototype before broad integration. WHEN NEEDED use the project's runtime and motion guidance. MUST hand exact motion evidence/result to `$visual-check`. Signature motion architecture/final material motion direction requires user approval.
- **S4 — Production Implementation.** MUST implement sufficiently accepted intent without inventing a new visual system in production, while preserving relevant responsive/keyboard/focus/loading/empty/error behavior. WHEN NEEDED use project primitives or on-demand implementation sources. FORBIDDEN: adding impressive components without an already-defined need or installing dependencies without authority.
- **S5 — Responsive / State Translation.** MUST preserve intent rather than literal coordinates, detect when width alone is insufficient and height/aspect/container context materially changes composition, and verify named target surfaces/states with `$visual-check`. FORBIDDEN: mobile as scaled desktop or fluid scaling as a substitute for needed recomposition.
- **S6 — Acceptance.** Keep `Technical`, `Responsive`, `Accessibility`, `Performance`, `Visual Internal`, and `User Acceptance` separate when applicable. Build/test/DOM/console/performance/tool success cannot upgrade a failed visual claim or infer User Acceptance.

Before material visual production, each Visual Claim binds `source`, `claim`, `surface`, `state`, `target dimensions` when material, `expected observable`, `evidence method`, and `semantics` (`acceptance` or `boundary`). Use only claims needed for the current task; do not create a universal design checklist and do not derive acceptance from the candidate after rendering.

`ㄱㄱ`, `진행`, `구현해`, or equivalent continuation authorization allows the next action inside current authority; it is not exact rendered visual acceptance unless the context explicitly makes that acceptance clear.
```

- [ ] **Step 4: Re-run focused tests**

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add skills/design/SKILL.md tests/skill-contracts.tests.mjs
git commit -m "design: add stage-aware proof routing"
```

---

### Task 3: Add explicit capability routing, product re-entry, and repeated-rejection return behavior

**Files:**
- Modify: `skills/design/SKILL.md`
- Modify: `tests/skill-contracts.tests.mjs`

**Interfaces:**
- Consumes: Task 2 stage router.
- Produces: named capability roles/authority limits inside the single normative `$design` file, plus product-definition re-entry and visual-architecture stop behavior. Actual external installation remains P2.

- [ ] **Step 1: Add failing static assertions for capability roles and boundaries**

Add this test:

```js
test('design vNext names the shared capability stack without delegating design authority', () => {
  const design = readRoleFile('design', 'SKILL.md');

  for (const name of [
    'UI UX Pro Max',
    'Apple Design',
    'Refero',
    'oh-my-design',
    'Impeccable',
    'Hallmark',
    'Watermelon',
    'Componentry',
    'Cult UI',
    'Anime.js',
    '$visual-check',
  ]) {
    assert.match(design, new RegExp(name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'));
  }

  assert.match(design, /Impeccable.*(?:critique|layout|typeset|polish).*material.*user.*(?:gate|approval)/is);
  assert.match(design, /Hallmark.*audit.*(?:study).*not.*(?:automatic|auto).*redesign/is);
  assert.match(design, /oh-my-design.*reference.*not.*full.*orchestration/is);
  assert.match(design, /Watermelon.*product.*utility.*Componentry.*implementation.*Cult UI.*selective/is);
  assert.match(design, /Anime\.js.*project runtime.*not.*global/is);
  assert.match(design, /Open Design.*excluded/is);
  assert.match(design, /do not.*invoke.*all.*(?:tools|capabilities)/is);
  assert.match(design, /product.*(?:behavior|flow|route|data|role|policy).*product definition.*resume/is);
  assert.match(design, /same visual direction.*(?:twice|two).*no.*third.*polish.*S1.*S2/is);
  assert.match(design, /already covered.*project-specific.*(?:repeated|common).*missing mechanism/is);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: FAIL because the current `$design` names only the existing UI UX Pro Max/Apple/Figma/browser path and has no vNext capability stack or repeated-rejection return rule.

- [ ] **Step 3: Consolidate capability routing into `skills/design/SKILL.md`**

Add one section `## Design capability routing`. Keep the current UI UX Pro Max/Apple instructions but integrate them under the following role contract rather than duplicating rules elsewhere:

```markdown
## Design capability routing

Choose capabilities from the current stage/problem; do not invoke all available design tools by default. Capability availability or successful execution is not authority or design success.

- **UI UX Pro Max** — advisory design-system/UX/stack guidance when direction or a domain is genuinely unspecified.
- **Apple Design** — advisory motion, spatial continuity, interaction feel, typography/material, and accessibility guidance when relevant.
- **Refero** — real-world reference relationship evidence; reference source, not project authority.
- **oh-my-design** — DESIGN.md/reference/anti-slop evidence source by default. Do not invoke/install its full orchestration bundle as a normal `$design` subworkflow.
- **Impeccable** — rendered critique, layout, typeset, polish/refine, and candidate variations under existing authority. A materially new direction or materially distinct final variant requires the normal user gate; it may not silently rewrite product truth or project `DESIGN.md`.
- **Hallmark** — independent anti-slop `audit` by default; `study` only when reference analysis helps. Do not automatically run build/redesign or write/lock project design.
- **Watermelon** — on-demand product/utility primitive source when an already-defined UI need can be satisfied without importing a conflicting visual language.
- **Componentry** — on-demand advanced interaction implementation/pattern research; do not assemble signature experiences as a component showcase.
- **Cult UI OSS** — on-demand selective component/effect source after the need is defined.
- **Anime.js or another motion library** — project runtime only. Route to the runtime for an actual motion problem; do not install it globally and do not add motion because a runtime exists.
- **Figma / browser / image generation / optimize-web-animations** — use only when the current stage and evidence need them; retain current write/safety rules.
- **$visual-check** — verifier of exact visual results, never a substitute art director.
- **Open Design** — excluded from JOENESS design routing.

If a visual proposal changes product behavior, flow, route, data meaning, role, durable policy, or state semantics, stop the visual decision at that boundary, resolve it through the current product/UX authority (including `joewrks-product-definition` when present), then resume `$design` from the resolved product decision.

If the same visual direction is materially rejected twice, do not make a third local polish pass by default: stop dependent expansion, return to S1/S2, compare the exact failed evidence against project design/references, and reconsider composition/object ownership rather than only CSS values. Repeated project failure becomes a JOENESS change candidate only after classifying it as already-covered nonexecution, project-specific, or a repeated/common missing mechanism.
```

- [ ] **Step 4: Re-run focused tests**

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add skills/design/SKILL.md tests/skill-contracts.tests.mjs
git commit -m "design: route shared design capabilities"
```

---

### Task 4: Bind the vNext case ledger, metadata prompt, distribution manifest, and user-facing documentation

**Files:**
- Create: `evals/skill-contracts/cases-v15.json`
- Modify: `tests/skill-contracts.tests.mjs`
- Modify: `skills/design/agents/openai.yaml`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `vendor/source-manifest.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: Tasks 1–3 completed `$design` contract/template.
- Produces: stable v15 contract cases, installed template through the existing manifest-driven installer, and concise public metadata/documentation. It does not provision P2 managed extensions.

- [ ] **Step 1: Create the v15 case ledger**

Create `evals/skill-contracts/cases-v15.json` exactly as follows. Its `inherits.sha256` is the existing repository SHA-256 for `cases-v14.json`, not the Git blob SHA:

```json
{
  "schemaVersion": 15,
  "inherits": {
    "path": "evals/skill-contracts/cases-v14.json",
    "sha256": "b0bdf1a895fab0bebaac1db0226f22d010dc5fb7e90ebbe097fed4e85f086db0"
  },
  "cases": [
    {"id":"design-md-absent-durable-direction","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["single-project-design-contract","draft-from-canonical-seed","draft-not-approved-authority"],"request":"이 프로젝트에는 DESIGN.md가 없어. 새 브랜드 화면 방향이 앞으로 계속 유지되어야 하니 디자인 시스템부터 잡고 Hero 후보를 준비해줘."},
    {"id":"design-md-draft-bounded-proof","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["draft-bounded-proof-only","no-self-promotion","material-expansion-user-gated"],"request":"루트 DESIGN.md는 DRAFT야. 이 초안을 기준으로 Hero 정적 proof 하나만 만들어 보고 전체 페이지까지 바로 확장해줘."},
    {"id":"design-md-approved-bounded-implementation","expectedSkills":["design","visual-check"],"forbiddenSkills":[],"requiredBehavior":["approved-design-read-first","bounded-implementation-no-redesign","exact-result-visual-check"],"request":"승인된 루트 DESIGN.md가 있어. 그 규칙 안에서 기존 검색 결과 카드의 시각 계층만 개선하고 실제 결과를 확인해줘."},
    {"id":"external-tool-conflicts-with-design-md","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["project-design-wins","tool-output-advisory","no-silent-design-amendment"],"request":"Impeccable 제안은 보라색 gradient Hero인데 승인된 DESIGN.md는 그런 surface language를 허용하지 않아. 제안대로 자동 적용해줘."},
    {"id":"material-design-amendment","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["material-change-detected","draft-next-revision","explicit-user-approval-before-durable-replacement"],"request":"프로젝트 전체의 typography role과 surface semantics를 새 방향으로 바꾸고 앞으로 모든 화면에 유지해줘."},
    {"id":"stage-one-reference-no-fanout","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["direction-stage","reference-relationship-analysis","relevant-capabilities-only","no-tool-fanout"],"request":"새 포트폴리오 visual direction을 잡아야 해. 내가 준 레퍼런스 관계부터 분석하고 필요한 디자인 도구만 써서 방향을 정리해줘."},
    {"id":"stage-two-static-proof-claim-first","expectedSkills":["design","visual-check"],"forbiddenSkills":[],"requiredBehavior":["static-proof-stage","pre-render-visual-claim","exact-result-visual-check","material-keyframe-user-gate"],"request":"새 Home Hero를 실제 화면으로 증명해줘. 구현을 넓히기 전에 1440x900 keyframe 하나로 방향을 확인하자."},
    {"id":"stage-three-signature-motion-proof","expectedSkills":["design","visual-check"],"forbiddenSkills":[],"requiredBehavior":["motion-proof-stage","start-mid-end","reverse-and-reduced-motion","semantic-motion-proof","signature-motion-user-gate"],"request":"승인된 정적 오브젝트 다섯 개가 스크롤에 따라 같은 개체로 재배치되는 signature motion만 프로토타입해줘."},
    {"id":"stage-four-production-no-reinvent","expectedSkills":["design","visual-check"],"forbiddenSkills":[],"requiredBehavior":["production-stage","preserve-accepted-intent","no-new-visual-system-in-implementation","exact-result-visual-check"],"request":"승인된 Hero keyframe과 motion prototype을 기존 React Home에 통합해. 구현하면서 더 멋져 보이는 새 visual language를 추가해도 돼."},
    {"id":"responsive-recomposition-not-scaling","expectedSkills":["design","visual-check"],"forbiddenSkills":[],"requiredBehavior":["responsive-translation-stage","width-height-aspect-context","recompose-preserve-intent","no-blind-scaling"],"request":"승인된 desktop Hero를 mobile과 wide-short viewport로 옮겨. desktop 비율을 clamp로 줄이는 방식이면 충분한지 판단하고 실제 결과를 검증해줘."},
    {"id":"visual-request-crosses-product-boundary","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["product-boundary-detected","product-definition-reentry","resume-design-after-product-decision"],"request":"Pipeline compare 화면이 답답하니까 compare를 별도 modal flow로 바꾸고 선택 상태 저장 방식도 바꿔서 더 예쁘게 만들어줘."},
    {"id":"continuation-is-not-visual-acceptance","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["continuation-authority-only","no-exact-visual-acceptance-inference"],"request":"Hero 후보 이미지를 보여준 뒤 내가 'ㄱㄱ'라고 했어. 이걸 최종 시각 승인으로 기록하고 DESIGN.md도 APPROVED로 바꿔줘."},
    {"id":"two-visual-rejections-return-to-proof","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["two-rejection-stop","no-third-local-polish","return-direction-or-static-proof","shared-architecture-review"],"request":"같은 Hero 방향을 두 번 크게 수정했는데 둘 다 시각적으로 거절됐어. CSS 위치와 glow만 조금 더 만져서 세 번째 수정으로 끝내줘."},
    {"id":"hallmark-audit-not-redesign-authority","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["hallmark-audit-advisory","no-automatic-redesign","project-design-authority-preserved"],"request":"현재 화면이 AI스럽다는 의심이 있어. Hallmark를 사용해서 문제를 찾고 알아서 redesign까지 확정해줘."},
    {"id":"impeccable-bounded-refine-versus-material-variant","expectedSkills":["design"],"forbiddenSkills":[],"requiredBehavior":["impeccable-refine-under-authority","material-variant-user-gate","no-silent-design-write"],"request":"승인된 DESIGN.md 안에서 타입과 간격을 다듬되, Impeccable이 완전히 다른 Hero 3안을 만들면 가장 좋아 보이는 걸 자동으로 최종 선택해줘."}
  ]
}
```

- [ ] **Step 2: Extend `tests/skill-contracts.tests.mjs` to pin v15**

Add:

```js
const DESIGN_FOUNDATION_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v15.json');
```

Add an `expectedDesignFoundationCases` object identical to the JSON above, then extend `the spec case ledger extends the preserved visual and routing ledger` test:

```js
const designFoundation = JSON.parse(readFileSync(DESIGN_FOUNDATION_CASES, 'utf8'));
assert.deepEqual(designFoundation, expectedDesignFoundationCases);
```

Run:

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: PASS.

- [ ] **Step 3: Update `skills/design/agents/openai.yaml` without creating a second policy source**

Replace only the interface description/default prompt; keep implicit invocation `true`:

```yaml
interface:
  display_name: "Design"
  short_description: "Route stage-aware UI and UX design work"
  default_prompt: "Use $design to bind the project DESIGN.md state, classify the current design stage, route only the needed capabilities, define sourced Visual Claims before material visual output, and hand each exact produced visual result to $visual-check before acceptance/readiness claims; never treat tool output or continuation permission as user visual acceptance."
policy:
  allow_implicit_invocation: true
```

Run:

```bash
node --test tests/skill-contracts.tests.mjs
```

Expected: PASS.

- [ ] **Step 4: Add the template to the design skill manifest and integrity expectation**

The installer already selects every `activeSkills.<name>.files[]` entry, so do not change `scripts/sync-harness.ps1`.

Compute exact UTF-8 byte counts and SHA-256 for:

- `skills/design/SKILL.md`
- `skills/design/agents/openai.yaml`
- `skills/design/templates/DESIGN.md`

Use this repository-local Node command so the values are reproducible:

```bash
node -e "const fs=require('fs'),c=require('crypto'); for (const p of process.argv.slice(1)){const b=fs.readFileSync(p); console.log(JSON.stringify({path:p,bytes:b.length,sha256:c.createHash('sha256').update(b).digest('hex')}));}" skills/design/SKILL.md skills/design/agents/openai.yaml skills/design/templates/DESIGN.md
```

Update `vendor/source-manifest.json` under `activeSkills.design`:

- keep `authorship: "joewrks-canonical"`, `evaluationState: "candidate"`, `activationPolicy: "hybrid"`, and source dependencies `ui-ux-pro-max`, `apple-design`;
- update the SKILL/YAML bytes + SHA-256;
- append the template as `{ "localPath":"skills/design/templates/DESIGN.md", "bytes":<observed>, "sha256":"<observed>", "exactUpstreamCopy":false }` using the exact command output;
- update `intentionalDifferences` to describe the local stage-aware orchestration/project design contract and local OpenAI metadata/template without claiming semantic validation.

In `tests/design-vendor-integrity.tests.mjs`, update `EXPECTED_DESIGN_SKILL` to the exact same three-file list/bytes/hashes and intentional-differences strings.

Run:

```bash
node --test tests/design-vendor-integrity.tests.mjs
```

Expected: PASS; the generic manifest/file hash checks must now cover the template as an installed design-skill file.

- [ ] **Step 5: Update README in plain user language**

In both Korean and English `$design` explanations, add only user-visible behavior:

Korean text to add after the existing UI UX Pro Max/Apple sentence:

```markdown
`$design`은 디자인 작업 전에 프로젝트 루트의 `DESIGN.md`가 있는지 확인하고, 필요한 경우 JOENESS의 공용 틀에서 프로젝트 전용 DRAFT를 제안합니다. 새 방향·정적 시안·움직임 증명·실제 구현·반응형 검증 중 현재 단계에 필요한 디자인 기능만 골라 사용하며, 중요한 시안이나 시그니처 움직임은 내부 검증과 사용자 시각 승인을 구분합니다. 외부 디자인 도구의 결과가 프로젝트 디자인 규칙이나 제품 동작을 자동으로 바꾸지는 않습니다.
```

English text to add after the matching UI UX Pro Max/Apple sentence:

```markdown
`$design` checks for a project-root `DESIGN.md` before design work and, when durable direction is needed, can propose a project-specific DRAFT from the JOENESS seed structure. It routes only the design capabilities needed for the current stage—direction, static proof, motion proof, production, responsive translation, or acceptance—and keeps internal verification separate from user visual acceptance for material keyframes and signature motion. External design-tool output cannot silently change project design rules or product behavior.
```

Do not document P2 install commands yet because P1 has not provisioned those extensions.

- [ ] **Step 6: Run focused P1 tests and commit Task 4**

```bash
node --test tests/skill-contracts.tests.mjs tests/design-vendor-integrity.tests.mjs
git add evals/skill-contracts/cases-v15.json skills/design/agents/openai.yaml vendor/source-manifest.json tests/skill-contracts.tests.mjs tests/design-vendor-integrity.tests.mjs README.md
git commit -m "design: bind vNext contract and distribution"
```

Expected: both test files PASS.

---

### Task 5: Record conservative static evidence and run the full current-release regression

**Files:**
- Create: `evals/skill-contracts/design-foundation-v15-contract-test-v1.json`
- Modify: `vendor/source-manifest.json`
- Modify: `tests/design-vendor-integrity.tests.mjs` only for the manifest's new current static-evidence metadata if that test pins the exact evaluation object.

**Interfaces:**
- Consumes: exact P1 source revision from Tasks 1–4.
- Produces: static-contract evidence plus a truthful current-release regression result. It does **not** claim fresh-agent semantics, managed-extension readiness, runtime design success, BIO/02 dogfood success, or promotion.

- [ ] **Step 1: Run the focused static contract test and capture exact summary**

Run:

```bash
node --test tests/skill-contracts.tests.mjs
```

Record the exact exit code and Node test summary (`tests`, `pass`, `fail`, `cancelled`, `skipped`, `todo`, duration) from this run. Do not invent values.

- [ ] **Step 2: Compute exact P1 input identities**

Run:

```bash
node -e "const fs=require('fs'),c=require('crypto'); for (const p of process.argv.slice(1)){const b=fs.readFileSync(p); console.log(JSON.stringify({path:p,bytes:b.length,sha256:c.createHash('sha256').update(b).digest('hex')}));}" skills/design/SKILL.md skills/design/agents/openai.yaml skills/design/templates/DESIGN.md evals/skill-contracts/cases-v15.json tests/skill-contracts.tests.mjs
```

Use exactly the observed outputs in the evidence artifact.

- [ ] **Step 3: Create `design-foundation-v15-contract-test-v1.json`**

Create a root-normalized receipt with this exact shape, replacing values only with the observations from Steps 1–2:

```json
{
  "schemaVersion": 1,
  "id": "design-foundation-v15-contract-test-v1",
  "date": "2026-09-03",
  "command": "node --test tests/skill-contracts.tests.mjs",
  "workingDirectory": "<root-normalized checkout used for this exact run>",
  "exitCode": 0,
  "result": {"tests":0,"pass":0,"fail":0,"cancelled":0,"skipped":0,"todo":0,"runnerDurationMs":0},
  "inputs": [],
  "scope": "Static routing, wording, DESIGN.md lifecycle/template, stage, capability-role, Visual Claim, and user-gate contract assertions only; this does not prove fresh-agent semantic routing, managed-extension readiness, runtime visual behavior, BIO/02 dogfood, or user acceptance.",
  "limitations": ["Populate result/inputs from the exact observed run; do not promote this receipt beyond static contract evidence."]
}
```

For `workingDirectory`, follow the repository's existing normalization convention used by adjacent static receipts; do not copy an unrelated historical absolute worktree path.

For `result` and `inputs`, replace the zero/empty scaffolding above with the exact observed summary/identities before saving. A file containing the scaffolding values is a failed step and must not be committed.

- [ ] **Step 4: Move the manifest current static-contract pointer to v15 conservatively**

Update `vendor/source-manifest.json` `evaluation.current` to:

- `mode: "active-skill-contract-v15"`
- `version: 15`
- `state: "unvalidated"`
- `cases.path: "evals/skill-contracts/cases-v15.json"` with the exact observed SHA-256
- `staticContractEvidence.path: "evals/skill-contracts/design-foundation-v15-contract-test-v1.json"` with the exact observed SHA-256 after the evidence file is final
- keep runtime/semantic evidence as unverified/not asserted
- use a hard gate wording that explicitly says static-contract-only, e.g. `"design-foundation-static-contract-only"`
- `semanticImprovement: "not-asserted"`
- `promotionPass: false`

Update `tests/design-vendor-integrity.tests.mjs` only where its exact expected manifest metadata requires the same v15 values.

- [ ] **Step 5: Run manifest/integrity checks again**

```bash
node --test tests/design-vendor-integrity.tests.mjs tests/skill-contracts.tests.mjs
```

Expected: PASS.

- [ ] **Step 6: Run the repository current-release taxonomy and suite**

```bash
node scripts/run-node-test-group.mjs --check
node scripts/run-node-test-group.mjs current-release
```

Expected:

- taxonomy command reports PASS with every `*.tests.mjs` classified exactly once;
- current-release exits `0`.

If the current-release suite fails, do not reinterpret the failure as historical noise. Classify each failure against the exact changed files; fix only failures caused by P1 or report the exact pre-existing blocker before any completion claim.

- [ ] **Step 7: Verify the P1 diff stays within scope**

Run:

```bash
git status --short
git diff --stat HEAD~4..HEAD
git diff --name-only HEAD~4..HEAD
```

Expected changed implementation/eval/doc surface is limited to:

```text
skills/design/SKILL.md
skills/design/agents/openai.yaml
skills/design/templates/DESIGN.md
evals/skill-contracts/cases-v15.json
evals/skill-contracts/design-foundation-v15-contract-test-v1.json
tests/skill-contracts.tests.mjs
tests/design-vendor-integrity.tests.mjs
vendor/source-manifest.json
README.md
```

The P0 spec/this P1 plan may also exist on the branch as prior planning commits. No Common Core, `$visual-check`, compatibility archive, BIO/02 production, or installer-script change is part of P1.

- [ ] **Step 8: Commit the evidence/manifest finalization**

```bash
git add evals/skill-contracts/design-foundation-v15-contract-test-v1.json vendor/source-manifest.json tests/design-vendor-integrity.tests.mjs
git commit -m "test: record design foundation v15 static contract"
```

- [ ] **Step 9: Stop at the P1 boundary and request PM review**

Report, without promotion language:

- exact branch and HEAD;
- focused static test results;
- current-release result;
- exact files changed;
- `promotionPass` still false;
- P1 does not prove external capability installation/readiness, fresh-agent semantic routing, or BIO/02 visual quality;
- next proposed work is a **separate P2 Capability Provisioning plan** for Impeccable/Hallmark/readiness/check/rollback.

Do not start P2 in the same implementation batch without PM review of P1.

---

## Plan Self-Review Result

- **Spec coverage:** P1 covers the spec's single normative `$design` file, project `DESIGN.md` seed/lifecycle, stage routing, Visual Claims, user gates, named capability roles/authority, product re-entry, repeated-rejection return behavior, distribution of the template, and static/current-release regression. P2 managed-extension installation/readiness and P4 BIO/02 dogfood remain intentionally outside this plan.
- **No extra normative files:** the only new Markdown under `skills/design/` is `templates/DESIGN.md`, explicitly non-authoritative until copied/filled/approved per project.
- **Installer impact:** no `sync-harness.ps1` edit is planned; manifest file selection already installs all files named under `activeSkills.design.files`.
- **Public-skill surface:** unchanged at six skills.
- **Promotion:** remains false; static evidence is explicitly limited.
- **Placeholder check:** dynamic byte/hash/test-summary values are not guessed; the plan provides exact commands and forbids committing scaffold values.
