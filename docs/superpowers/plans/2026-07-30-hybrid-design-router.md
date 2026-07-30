# Hybrid Design Router Implementation Plan

> Execute this plan in the current task. Preserve the v1-v3 artifacts as historical evidence and keep `AGENTS.md` byte-identical.

**Goal:** Replace the prescriptive design/frontend skill contract with the approved hybrid contract, then evaluate native implicit routing without adding a deterministic dispatcher or mandatory receipt.

**Architecture:** Keep one discoverable `joewrks-design-frontend` skill. Treat UI UX Pro Max and Apple Design as local, non-discoverable references. Add one focused current-contract test and one independent hybrid evaluator; do not create an old-contract pair-v4 or modify historical result JSON.

**Tech Stack:** Markdown, Node.js standard library, PowerShell, Codex App Server helpers already in the repository.

---

### Task 1: Make the current skill contract hybrid

**Files:**
- Create: `tests/design-frontend-hybrid-routing.tests.mjs`
- Modify: `skills/joewrks-design-frontend/SKILL.md`
- Modify: `tests/design-frontend-routing.tests.mjs`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `vendor/source-manifest.json`

1. Add focused assertions for broad implicit discovery, explicit invocation, non-activation boundaries, both local design sources, conditional Figma/browser use, actual contrast verification, and the absence of a deterministic checklist.
2. Run the focused test and confirm it fails against the v3 skill.
3. Rewrite only the active skill instructions to express the approved hybrid contract concisely.
4. Bind the new active skill hash in integrity metadata while preserving the v1-v3 behavior evidence as immutable history.
5. Update historical tests only enough to stop treating the current skill bytes and retired matrix as the v3 snapshot.
6. Run the focused and historical structural tests.

### Task 2: Add the native-routing release check

**Files:**
- Create: `evals/design-frontend/collect-hybrid-router-evaluation.mjs`
- Extend: `tests/design-frontend-hybrid-routing.tests.mjs`
- Create on execution: `evals/design-frontend/router-hybrid-v1.json`

1. Add failing tests for the fixed five-case selection, three fresh implicit repetitions, tri-state evidence, prose rejection, explicit/control separation, two outcome comparisons, hard safety failures, and absence of retired synthetic operations.
2. Reuse the existing App Server environment and collection helpers; do not add dependencies or a dispatcher.
3. Implement the smallest collector/scorer that records native or exact-path evidence, marks unavailable evidence `unknown`, and reports `implicit-unverified` when the runtime exposes no activation signal.
4. Run the focused tests, then collect one bounded hybrid artifact.

### Task 3: Verify and record

**Files:**
- Modify only if required by observed evidence: `vendor/source-manifest.json`

1. Run all repository tests and manifest validation.
2. Verify `AGENTS.md` length and SHA-256 are unchanged and `README.md` remains untracked and untouched.
3. Have an independent read-only reviewer check the diff against the approved specification and P0/P1 criteria.
4. Fix only evidenced gaps, rerun affected checks, and commit the scoped changes.
