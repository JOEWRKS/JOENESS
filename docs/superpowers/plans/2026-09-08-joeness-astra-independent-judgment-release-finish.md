# JOENESS 0.2 Astra Judgment Release Finish Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and release JOENESS `0.2-astra-judgment` by preserving the completed minimal Independent Judgment runtime, correcting the pre-existing historical-integrity expectation without weakening current validation, and merging only after fresh deterministic verification.

**Architecture:** Keep the existing 0.2 implementation and installer design unchanged unless verification exposes a direct defect. The only known release blocker is a historical local test whose old artifact no longer passes the current strengthened validator even on the frozen pre-0.2 base; encode that exact historical rejection as an expected historical status instead of weakening the validator or rewriting evidence.

**Tech Stack:** Node.js 26.3.0 `node:test`, PowerShell 5.1 lifecycle tests, GitHub Actions Windows deterministic gate, Markdown/JSON release documentation.

**Spec:** `docs/superpowers/specs/2026-09-08-joeness-astra-independent-judgment-design.md`

## Global Constraints

- Working branch: `codex/joeness-v0.2-astra-judgment`.
- Base: `5e7497bd104527d5e6dbfc36011f0f5ee3668ff5`.
- Preserve `astra-judgment-core.md` as the only active behavioral payload.
- Do not weaken `evals/support/collect-codex-app-server.mjs` to make historical artifacts pass.
- Do not rewrite historical evaluation JSON artifacts.
- Preserve the exact GPT-5.6 Control compatibility identity.
- Keep public skills, managed runtime files, default vendors empty and plugin routing null.
- Behavioral A/B remains `NOT-RUN`; repository contract verification is not behavioral superiority evidence.

---

### Task 1: Reclassify the stale historical expectation with test-first evidence

**Files:**
- Modify: `tests/node-test-group-runner.tests.mjs`
- Modify: `scripts/run-node-test-group.mjs`

**Interfaces:**
- Consumes: `HISTORICAL_LOCAL_CASES`, TAP output from exact named local historical cases.
- Produces: exact per-case expected status, plus optional exact output marker for expected historical failures.

- [ ] **Step 1: Write the failing runner contract**

Require the first historical local case to be represented as `expectedStatus: "fail"` with the exact marker `reviewed pass/fail case lacks complete evidence`, while all other historical local cases default to pass.

- [ ] **Step 2: Push and observe RED**

Expected: current runner data/validation does not satisfy the new test contract.

- [ ] **Step 3: Implement minimal runner support**

Extend `HISTORICAL_LOCAL_CASES` and `validateHistoricalLocalTap` so each case must occur exactly once with its declared expected status. For an expected failure, require the configured output marker to appear in the TAP output. Keep missing, duplicate, renamed, skipped, TODO, wrong-status, or wrong-reason results blocking.

When the historical-local validator accepts an expected nonzero test result, do not propagate the child process exit code as a release failure; only the exact declared expected failure may be absorbed.

- [ ] **Step 4: Verify current-release runner tests and historical-integrity**

Run the branch deterministic gate and require the historical-integrity step to pass without changes to the collector validator or historical JSON.

---

### Task 2: Remove temporary diagnostics and synchronize release ledger

**Files:**
- Delete: `.github/workflows/diagnose-historical-base.yml`
- Modify: `TASKS.md`
- Modify: `docs/handoff/2026-09-08-joeness-astra-judgment-reopen-handoff.md`
- Modify only if needed: `README.md`, `AGENTS.md`

**Interfaces:**
- Consumes: fresh CI results.
- Produces: release-ready repository state and accurate verification claims.

- [ ] **Step 1: Remove the temporary frozen-base diagnostic workflow**

It was created only to prove the historical failure predates 0.2 and must not ship as a permanent release workflow.

- [ ] **Step 2: Update release ledger only from fresh evidence**

Record the historical-integrity root cause, the exact fix boundary, and current verification status. Do not mark release complete until the final gate is green.

- [ ] **Step 3: Keep user-facing docs aligned**

Confirm README and AGENTS still describe exactly one active Independent Judgment rule and no resurrected skills/vendors/plugin routing.

---

### Task 3: Full release verification

**Files:**
- No production changes unless a fresh failing check identifies a direct defect.

**Interfaces:**
- Consumes: final branch SHA.
- Produces: evidence sufficient for merge and release claims.

- [ ] **Step 1: Run deterministic Windows release gate**

Require PASS for taxonomy, current-release, historical-integrity, Astra judgment lifecycle, retained sync fail-closed tests, project setup, P0 evaluation contract, vendor Python tests, and diff whitespace check.

- [ ] **Step 2: Read back key release identities**

Verify manifest version/runtime/core hash, active core bytes, README, AGENTS, A/B plan status, and exact Control compatibility values from branch.

- [ ] **Step 3: Review full PR diff**

Confirm no historical skill/vendor/eval source was accidentally changed except runner/test/documentation necessary for release verification.

---

### Task 4: Finish and integrate

**Files:**
- PR #13 metadata and main branch only after all gates pass.

**Interfaces:**
- Consumes: green branch and review evidence.
- Produces: main integration SHA/tree and final release report.

- [ ] **Step 1: Mark PR ready and merge**

Use the repository-supported merge path only after all required checks are green.

- [ ] **Step 2: Read back `main`**

Verify main HEAD, manifest, active core, README, and installer identity after merge.

- [ ] **Step 3: Report exact completion state**

Report branch SHA/tree, main SHA/tree, active core SHA/bytes, changed files, observed checks, legacy compatibility status, A/B status `NOT-RUN`, install/check/remove commands, and rollback behavior. Do not claim behavioral superiority.
