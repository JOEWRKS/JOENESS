# JOENESS 0.2 Astra Judgment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans to implement this plan task-by-task. Use test-first changes for runtime behavior and verify release claims from current evidence only.

**Goal:** Reopen JOENESS for GPT-6 Astra with one active managed behavior, Independent Judgment, while preserving the zero-skill/zero-vendor architecture and exact GPT-5.6 Control removal compatibility.

**Architecture:** Keep the current manifest-driven installer and existing managed `AGENTS.md` block transaction machinery. Add one new LF-bound active source file, change the active distribution identity from zero runtime to one Common Core block, remove only the zero-runtime gates from `scripts/sync-harness.ps1`, and preserve all historical broad Core/skill/vendor material as inactive evidence. Add new current-release tests rather than reclassifying historical evidence.

**Tech stack:** PowerShell 5.1 installer/tests, Node.js `node:test`, JSON manifest/evaluation plan, Markdown documentation, GitHub Actions Windows release gate.

## Global constraints

- Working branch: `codex/joeness-v0.2-astra-judgment`.
- Base decision: `docs/superpowers/specs/2026-09-08-joeness-astra-independent-judgment-design.md`.
- Preserve the GPT-5.6 Control compatibility identity exactly.
- Do not reactivate `common-core.md`, the Lean Kernel, public skills, vendors, plugin routing, JOEFLOW routing, or JOEDESIGN routing.
- Active runtime must contain exactly one behavioral source: `astra-judgment-core.md`.
- `publicSkills`, `defaultVendors`, and `managedRuntimeFiles` remain empty; `pluginRouting` remains null.
- Keep evaluation records outside the active distribution identity.
- Check must remain read-only. Apply/Remove must remain byte-preserving outside JOENESS-owned state and fail closed on ambiguous ownership.
- Do not claim behavioral superiority from static contract tests. The Astra A/B artifact remains `NOT-RUN` until independently executed.

---

## Task 1 — Write the new release contracts first and confirm RED

**Files:**
- Modify: `tests/astra-native-closure.tests.mjs`
- Create: `tests/astra-judgment-sync.tests.ps1`
- Modify: `.github/workflows/windows-ci.yml`

### Step 1: Change the Node identity contract before production files

Update the current-release identity test to require:

- `release.version === "0.2-astra-judgment"`;
- target `gpt-6-astra / xhigh`;
- `runtimeMode === "common-core"`;
- active core path `astra-judgment-core.md`;
- active core SHA equals actual committed bytes;
- active core contains the four Independent Judgment invariants;
- zero public skills/default vendors/managed whole-file runtime payload;
- null plugin routing;
- historical TrackB and Lean evidence remains exact.

### Step 2: Add an isolated PowerShell lifecycle contract

`tests/astra-judgment-sync.tests.ps1` must cover at minimum:

1. clean target `Check -> ready / changesRequired:true`;
2. `Apply -> current`;
3. exact post-Apply `Check -> current`;
4. repeat Apply idempotence;
5. exact managed block contains only the current `astra-judgment-core.md` content between existing JOENESS markers;
6. no public skill/vendor runtime files are created;
7. user bytes surrounding the block are preserved;
8. exact current Remove restores the original `AGENTS.md` bytes and removes state/owned manifest;
9. post-Remove Check returns `ready`;
10. drifted owned block blocks Check/Remove;
11. unowned marker blocks rather than claiming ownership;
12. simulated write failure rolls back completely;
13. exact historical GPT-5.6 Control can still be detected/removed using full Git history, and after removal current v0.2 is `ready`, not auto-installed.

Use repository history to materialize the exact Control fixture; do not invent a self-consistent fake legacy identity.

### Step 3: Wire the current Windows gate to run the new lifecycle contract

Add a dedicated CI step for `tests/astra-judgment-sync.tests.ps1`. Keep the old sync suite only for still-valid fail-closed/race tests; do not let stale zero-runtime assertions define the current release.

### Step 4: Push the tests-only contract and observe RED

Expected RED causes before production changes:

- manifest still says `0.1-astra-native` / `runtimeMode:none`;
- active core file is missing;
- Apply is still an explicit zero-runtime no-op.

Do not weaken tests to make the old runtime pass.

---

## Task 2 — Add the minimal active payload and manifest identity

**Files:**
- Create: `astra-judgment-core.md`
- Modify: `.gitattributes`
- Modify: `vendor/source-manifest.json`

### Step 1: Add the exact active rule

Create LF-only `astra-judgment-core.md` with the approved canonical text:

```markdown
# JOENESS — Independent Judgment

Treat user questions, challenges, concerns, and preferences as evidence to evaluate, not automatic corrections.

Do not change a prior conclusion merely because the user pushes back. Re-evaluate it against the goal, available evidence, constraints, authority, and trade-offs. If the prior judgment still holds, say so and explain why; if the challenge exposes better evidence or a mistaken assumption, revise the judgment.

Distinguish a challenge from an explicit decision or instruction. Explicit user decisions control where the user has authority; disagreement, uncertainty, or preference alone does not automatically replace an evidence-based conclusion.

Do not optimize for agreement. Surface material downsides, contradictions, invalid assumptions, and unnecessary work even when that means recommending against the user's proposal.
```

Add `/astra-judgment-core.md text eol=lf` to `.gitattributes`.

### Step 2: Hash-bind the active manifest

Set:

- release version `0.2-astra-judgment`;
- runtime mode `common-core`;
- active core path/hash to the exact committed source;
- keep `managedRuntimeFiles: []`;
- keep `publicSkills: []`;
- keep `defaultVendors: []`;
- keep `pluginRouting: null`;
- preserve the complete `compatibility.installIdentities.controlSixSkill` object unchanged.

### Step 3: Run the static identity contract

Expected: Node current-release identity test becomes GREEN while PowerShell lifecycle remains RED until installer gates are changed.

---

## Task 3 — Re-enable only the existing managed-block installer path

**Files:**
- Modify: `scripts/sync-harness.ps1`

### Step 1: Replace zero-runtime manifest gating with minimal active-Core gating

Require:

- `runtimeMode === "common-core"`;
- target remains Astra/xhigh;
- active core exists, path is safe, hash is valid and matches source bytes;
- public skills/vendors/managed runtime files remain empty;
- plugin routing remains null.

Populate `$sourceCore` from the exact active source.

### Step 2: Preserve current-state trust in addition to exact Control trust

A schema-v2 installation whose owned manifest hash equals the current source manifest and whose common-core identity matches the installed manifest is a trusted current install.

Do not retain the zero-runtime rule that invalidates every non-Control state.

Still reject:

- unknown historical identities;
- forged/self-consistent ownership not anchored to current or exact Control source identity;
- drifted block/manifest/state;
- root identity mismatch.

### Step 3: Generalize managed-block Remove verification

For current v0.2 state, accept only the exact block hash already bound in owned state and anchored to the current manifest/core identity. For exact legacy Control, keep the pinned Control-core check.

Do not let a state file alone legitimize arbitrary block content.

### Step 4: Remove the Astra zero-runtime Apply early return

Allow existing transaction code to perform Check/Apply/Remove for the active block and state. Keep the exact-Control `legacy` early return so Apply never silently overwrites/migrates Control.

### Step 5: Run focused lifecycle tests until GREEN

Required result:

`Check -> Apply -> Check -> Apply -> Remove -> Check`

with exact surrounding-byte preservation, rollback, and zero skills/vendors.

---

## Task 4 — Synchronize current documentation and decision history

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `TASKS.md`
- Create: `docs/handoff/2026-09-08-joeness-astra-judgment-reopen-handoff.md`
- Create: `evals/experiments/joeness-astra-independent-judgment-ab-plan-v1.json`
- Update: design spec implementation status only after code lands

### README

Document in Korean first and concise English:

- what changed from 0.1 to 0.2;
- observed reason for reopening;
- exact rule purpose;
- challenge vs explicit decision distinction;
- what remains inactive;
- Check/Apply/Remove commands;
- exact legacy Control behavior;
- version history;
- evidence gate for future additions;
- removal/rollback semantics.

### AGENTS

State that current Astra runtime contains exactly one narrow Common Core behavior and no skills/vendors/plugin routing. Keep the evidence gate for any future additions.

### TASKS

Replace the terminal zero-runtime header with a new active milestone section for `0.2-astra-judgment`; leave the historical ledger below intact.

### Handoff

Do not rewrite the September 5 transition handoff. Add a new dated handoff that records why the valid zero-runtime decision was reopened, exact release identity, verification results, intentionally inactive surfaces, and rollback/revisit criteria.

### A/B plan

Record eight frozen judgment cases as a `NOT-RUN` plan separate from the release manifest. It must not claim comparative success before actual execution.

---

## Task 5 — Full verification and branch release

### Focused checks

Run on Windows CI:

```powershell
node .\scripts\run-node-test-group.mjs --check
node .\scripts\run-node-test-group.mjs current-release
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\astra-judgment-sync.tests.ps1
```

Run the still-valid legacy/fail-closed PowerShell cases selected from `tests/sync-harness.tests.ps1`.

### Full gate

Require the repository Windows deterministic release workflow to pass:

- test taxonomy;
- current-release Node suite;
- historical-integrity Node suite;
- current Astra judgment lifecycle;
- retained legacy/fail-closed sync cases;
- project setup;
- P0 evaluation contract;
- vendor Python tests;
- `git diff --check`.

### Release identity readback

After GREEN:

1. fetch the branch versions of core, manifest, README, AGENTS, plan, handoff, and installer;
2. verify active core bytes/hash from the branch;
3. verify compatibility object unchanged from base;
4. compare branch against `main` and inspect the complete changed-file list;
5. confirm no historical skill/vendor/eval source was accidentally modified;
6. create/merge into `main` only after all required checks are GREEN;
7. read back `main` HEAD and key files after merge.

### Completion report

Report:

- release version;
- branch commit/tree;
- main integration SHA/tree;
- active core bytes/SHA-256;
- exact files changed;
- CI/check results actually observed;
- legacy compatibility status;
- A/B plan status (`NOT-RUN` unless separately executed);
- installation commands and rollback command.

Do not claim Independent Judgment is universally superior; claim only that the requested minimal overlay is implemented and verified against its repository contract.
