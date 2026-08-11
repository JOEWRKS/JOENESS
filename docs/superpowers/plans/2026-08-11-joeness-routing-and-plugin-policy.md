# JOENESS Routing And Plugin Policy Implementation Plan

> **For agentic workers:** implement task-by-task with test-first changes and independent review before release.

**Goal:** Make visual/spec routing visible to the always-loaded JOENESS layer, simplify Visual Check execution, and remove external-plugin dependency ambiguity without renaming `spec`.

**Architecture:** Add a new immutable Core candidate and an additive evaluation contract. Keep one public Visual Check skill, with a compact entry document, one always-required evidence reference, and conditional mode references. The manifest remains the single install pointer and the installer remains manifest-driven.

**Tech stack:** Markdown skill contracts, JSON manifest/evaluation artifacts, Node contract tests, PowerShell installer tests.

## Global constraints

- Preserve Core v1-v4, evaluation v1-v6, compatibility sources, and vendor copies byte-for-byte.
- Keep `$spec`, `skills/spec`, and manifest key `spec` unchanged.
- Do not change global plugin configuration.
- Use `apply_patch` for edits and run one smallest relevant test while iterating.

### Task 1: Add failing routing and structure contracts

**Files:**
- Modify: `tests/thin-hybrid-core.tests.mjs`
- Modify: `tests/skill-contracts.tests.mjs`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `tests/sync-harness.tests.ps1`

- [ ] Assert a new Core pointer/title and both completion routes.
- [ ] Assert Visual Check has a compact public body and conditionally required internal references.
- [ ] Assert the README plugin policy and unchanged `Spec` identity.
- [ ] Run focused tests and confirm the expected RED reasons.

### Task 2: Add the Core candidate and compact Visual Check

**Files:**
- Create: `evals/candidates/interaction-safety-core-v5.md`
- Modify: `skills/visual-check/SKILL.md`
- Create: `skills/visual-check/references/concrete-defect.md`
- Create: `skills/visual-check/references/approved-reference.md`
- Create: `skills/visual-check/references/durable-evidence.md`
- Modify: `skills/visual-check/agents/openai.yaml`

- [ ] Write the smallest Core candidate at or below 2 KiB.
- [ ] Retain only common verdict behavior in the public Visual Check body.
- [ ] Move mode-specific details without weakening their existing contracts.
- [ ] Run focused tests until the source contract is GREEN.

### Task 3: Bind installation and user documentation

**Files:**
- Modify: `vendor/source-manifest.json`
- Modify: `.gitattributes`
- Modify: `README.md`
- Add: new evaluation artifacts under `evals/skill-contracts/`

- [ ] Point only `activeCommonCore` and the current additive evaluation to new artifacts.
- [ ] Add Visual Check reference files to the owned install set with exact bytes and SHA-256.
- [ ] Document `JOENESS Core`, truthful model-routing limits, and external-plugin defaults in Korean and English.
- [ ] Keep `Spec` and `$spec` unchanged.

### Task 4: Forward-test and release

**Files:**
- Add: immutable raw and summary evidence for fresh-context routing/behavior samples.
- Modify: exact integrity constants in relevant tests.

- [ ] Run no-guidance/old-contract RED and new-contract GREEN samples in fresh contexts.
- [ ] Score implicit routing separately from verdict quality and check negative cases.
- [ ] Run focused Node and README/installer tests.
- [ ] Run the documented full release suite once.
- [ ] Run personal `Check -> Apply -> Check`, then commit and push if all required evidence passes.
