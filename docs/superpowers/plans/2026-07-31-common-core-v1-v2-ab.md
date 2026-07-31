# Common Core v1/v2 Direct A/B Evaluation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compare active Common Core v1 and candidate v2 under the same frozen tasks, runtime, source revision, and review gates without activating v2.

**Architecture:** Extend the existing validated collector only with new immutable run identities. Collect one neutral technical Control, then collect four v1 and four v2 policy arms from one clean HEAD in the predeclared order `A B | B A | B A | A B`. Run three small patch-only code cases twice per candidate with shell, network, browser, plugins, and external tools disabled; the controller runs independent tests afterward. A pure set validator reads the executable JSON contract and rejects missing arms, order/source/runtime drift, undefined aggregation, or unsupported promotion claims. Keep raw evidence and direct A/B judgment separate from the active manifest.

**Tech Stack:** Node.js built-ins, Codex App Server collector, PowerShell contract tests, Git worktree isolation.

## Global Constraints

- Active production Core remains v1 throughout the evaluation and after any blocked or inconclusive result.
- Candidate bytes are fixed at v1 SHA-256 `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495` and v2 SHA-256 `a17e6f056fdf89373c3e726b326922241fc76f196c6f576028ded2b687912d3f`.
- Use the existing frozen 16 policy cases, `gpt-5.6-sol`, reasoning `low`, default service tier, and Codex CLI `0.145.0`. Keep the policy collector read-only. For the three coding cases, expose only the internal file-change tool over an isolated workspace-write sandbox; disable shell and every other read/execute surface.
- The neutral Control starts from clean preparation HEAD H0. After its reviewed artifact alone is committed, all eight candidate arms and four coding arms start from the resulting clean HEAD H1 in separate dedicated worktrees. Evaluation-critical source blobs must be identical across H0/H1. A generated result remains at its exclusive path until the complete artifact set is validated; do not delete a result to make a run ID reusable.
- Execution order is fixed before collection: `v1-r1, v2-r1, v2-r2, v1-r2, v2-r3, v1-r3, v1-r4, v2-r4`.
- Coding order and all formulas are frozen in `evals/experiments/common-core-v1-v2-v8.json`; the set validator must read that file rather than a manually restated threshold list.
- Quality and trust are hard gates. Token savings never compensate for a behavior regression, incomplete evidence, unsupported claim, or duplicate effect.
- Primary cost measure is direct `v2 - v1` `inputTokens`; report cached, output, reasoning, total tokens, events, output bytes, and wall clock separately.
- Do not remove statistical or structural outliers. A v2 input win is decided from each case's candidate median across repetitions; ties are not wins and null metrics block the result.
- The policy suite measures rule-following and planning proxies. The coding suite measures three small first-pass patch implementations with controller-run tests; it does not measure autonomous test iteration or prove broad production-code, visual-fidelity, or Figma quality parity.
- Do not modify `evals/manifest.yaml`; it remains the active v1 identity.

---

### Task 1: Preserve evaluation bytes on Windows

**Files:**
- Modify: `.gitattributes`
- Modify: `tests/codex-app-server-collector.tests.mjs`

**Interfaces:**
- Consumes: tracked LF Git blobs under `evals/p0/`
- Produces: LF-identical working files on `core.autocrlf=true` checkouts

- [ ] **Step 1: Strengthen the existing checkout test**

Replace the three-file assertion with one assertion for:

```text
/evals/p0/*.json text eol=lf
```

and verify every checked-out `evals/p0/*.json` file contains no CRLF.

- [ ] **Step 2: Verify the test fails for the existing fresh worktree**

Run:

```powershell
node --test tests/codex-app-server-collector.tests.mjs
```

Expected: the existing historical v1 baseline hash test fails, or the strengthened LF test fails, because fresh Windows checkout bytes are CRLF.

- [ ] **Step 3: Add the minimum repository-wide P0 JSON rule**

Add:

```text
/evals/p0/*.json text eol=lf
```

Remove redundant per-generation P0 JSON rules. Mechanically normalize only `evals/p0/*.json` working bytes from CRLF to LF; Git blobs must remain unchanged.

- [ ] **Step 4: Verify the focused suite**

Run:

```powershell
node --test tests/codex-app-server-collector.tests.mjs
git diff --check
```

Expected: all collector tests pass and no whitespace error is reported.

### Task 2: Freeze the v8 A/B contract

**Files:**
- Create: `evals/experiments/common-core-v1-v2-v8.json`
- Modify: `tests/codex-app-server-collector.tests.mjs`
- Modify: `evals/support/collect-codex-app-server.mjs`

**Interfaces:**
- Consumes: frozen candidates and existing full case order
- Produces: one neutral Control mode and eight candidate Core modes with exclusive result paths

- [ ] **Step 1: Write failing configuration and CLI tests**

Require these exact modes:

```text
run-control-ab-v8
run-core-v1-ab-v8-r1
run-core-v2-ab-v8-r1
run-core-v1-ab-v8-r2
run-core-v2-ab-v8-r2
run-core-v1-ab-v8-r3
run-core-v2-ab-v8-r3
run-core-v1-ab-v8-r4
run-core-v2-ab-v8-r4
```

Every Core mode uses the shared baseline `evals/p0/no-harness-control-ab-v8.json`, its exact frozen v1 or v2 candidate SHA, the full frozen case order, and a unique result path.

- [ ] **Step 2: Verify the new tests fail**

Run:

```powershell
node --test tests/codex-app-server-collector.tests.mjs
```

Expected: new v8 modes are unsupported.

- [ ] **Step 3: Add only the required immutable configurations**

Reuse the existing `runConfiguredEvaluation`, source gate, result writer, and validator. Do not add a second collector, new lock service, or a new result schema.

- [ ] **Step 4: Verify syntax and contracts**

Run:

```powershell
node --check evals/support/collect-codex-app-server.mjs
node --test tests/codex-app-server-collector.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/p0-evaluation-contract.tests.ps1
git diff --check
```

Expected: all commands exit zero.

### Task 3: Prepare the uncontaminated evaluation revision

**Files:**
- Delete temporarily on the evaluation branch: `AGENTS.md`

**Interfaces:**
- Consumes: active v1 file that is byte-identical to the v1 candidate
- Produces: a clean evaluation-only revision with no discoverable root instruction

- [ ] **Step 1: Verify identities before removal**

Run:

```powershell
Get-FileHash -Algorithm SHA256 AGENTS.md,evals/candidates/common-core-v1.md,evals/candidates/common-core-v2.md
```

Expected: `AGENTS.md` equals v1 and v2 differs by the frozen hashes above.

- [ ] **Step 2: Commit the evaluation-only root removal and v8 configuration**

The commit must contain the plan, v8 contract, tests, collector configuration, LF rule, and root `AGENTS.md` removal. Candidate bytes must not change.

- [ ] **Step 3: Run baseline verification**

Run the commands from Task 2 Step 4 plus:

```powershell
node evals/support/collect-codex-app-server.mjs smoke
```

Expected: collector capability smoke passes with no result artifact.

### Task 4: Collect and freeze the neutral technical Control

**Files:**
- Create: `evals/p0/no-harness-control-ab-v8.json`

**Interfaces:**
- Consumes: clean evaluation revision and the frozen v1 reference used only for schema identity
- Produces: one reviewed no-instruction baseline required by the existing Core validator

- [ ] **Step 1: Run the Control once in a dedicated clean worktree**

```powershell
node evals/support/collect-codex-app-server.mjs run-control-ab-v8
```

- [ ] **Step 2: Review every case against the frozen rubric**

Complete `review.caseJudgments`, record exact evidence pointers, set Collector capability independently from subject pass/fail, recompute `evidenceSha256`, and validate with `validateResult`.

- [ ] **Step 3: Freeze the exact reviewed artifact**

Commit the Control. Verify LF-only working bytes and its file SHA-256 before starting any candidate arm. The Control contains no candidate instruction; reusing it saves 16 irrelevant model turns.

### Task 5: Collect the eight direct candidate arms

**Files:**
- Create in dedicated fixed-HEAD worktrees, then copy byte-for-byte together:
  - `evals/p0/common-core-v1-ab-v8-r1.json`
  - `evals/p0/common-core-v2-ab-v8-r1.json`
  - `evals/p0/common-core-v1-ab-v8-r2.json`
  - `evals/p0/common-core-v2-ab-v8-r2.json`
  - `evals/p0/common-core-v1-ab-v8-r3.json`
  - `evals/p0/common-core-v2-ab-v8-r3.json`
  - `evals/p0/common-core-v1-ab-v8-r4.json`
  - `evals/p0/common-core-v2-ab-v8-r4.json`

**Interfaces:**
- Consumes: one fixed clean HEAD containing the reviewed Control
- Produces: eight immutable raw arm artifacts

- [ ] **Step 1: Record the fixed HEAD and source hashes**

Record Git HEAD, collector/case/P0-contract blobs, candidate SHA-256 values, model identity, and runtime identity.

- [ ] **Step 2: Execute the predeclared order**

Run exactly:

```text
v1-r1, v2-r1, v2-r2, v1-r2, v2-r3, v1-r3, v1-r4, v2-r4
```

Use one dedicated clean worktree per arm. Keep the generated result at its exclusive path, record its SHA-256, and do not reuse that worktree or run ID.

- [ ] **Step 3: Restore all eight exact files together**

Copy the preserved files into the evaluation worktree without changing bytes. Verify every artifact reports the same source HEAD and evaluation-critical Git blobs.

### Task 6: Run the real-code probe

**Files:**
- Create: `evals/coding/cases.json`
- Create: `evals/support/run-common-core-coding-ab.mjs`
- Create: `tests/common-core-coding-ab.tests.mjs`
- Create: four exclusive coding arm JSON files containing 12 isolated case turns

**Interfaces:**
- Consumes: three synthetic repositories and frozen candidate bytes
- Produces: independently graded feature, maintenance, and frontend-functional implementations

- [ ] **Step 1: Verify the runner without a model call**

Run its unit suite and smoke path. Confirm hidden graders are absent from the subject workspace, path escapes and symlinks are rejected, candidate instructions remain unchanged, and independent grading detects both a known failure and known success.

- [ ] **Step 2: Execute the frozen four-arm order**

Use one clean worktree per arm and one fresh synthetic repository per case. Run the four-arm `A B | B A` order so each candidate executes every case twice with the internal file-change tool only, no shell, no network, no browser or plugins, isolated authentication, and the exact runtime identity in the JSON contract.

- [ ] **Step 3: Independently grade every result**

Require visible and hidden checks to pass, changed paths to be within the declared mutable set, protected files and candidate instructions to remain byte-identical, and success claims to match the independent check receipts.

### Task 7: Review behavior and compute the direct A/B result

**Files:**
- Create: `evals/support/evaluate-common-core-v1-v2-ab.mjs`
- Create: `tests/common-core-v1-v2-ab.tests.mjs`
- Create: `evals/reviews/common-core-v1-v2-ab-review-audit-v8.json`
- Create: `docs/superpowers/specs/2026-07-31-common-core-v1-v2-ab-evaluation.md`
- Modify: the eight raw Core JSON review sections only

**Interfaces:**
- Consumes: one reviewed Control, eight complete policy arms, four coding arms, and the frozen rubrics
- Produces: reviewed artifacts plus a direct v2-minus-v1 decision

- [ ] **Step 1: Blind the candidate labels for behavior review**

Review final messages, events, state, and tool evidence by case/repetition without showing the reviewer whether the arm is v1 or v2. Independently audit case indexes 0, 5, 10, and 15 for every Core arm, record all 32 judgments, and require 100% raw agreement. Resolve every disagreement against exact rubric text; do not average disagreements away.

- [ ] **Step 2: Complete and validate each raw artifact**

For each arm, complete the existing no-harness pair review only to satisfy its original schema. Do not describe that pair as the direct A/B comparison.

- [ ] **Step 3: Validate the exact artifact set and apply hard gates**

The validator must enforce the exact artifact set, declared chronological order, same fixed source/runtime/model, all v2 policy and coding quality gates, the predeclared case-median formulas, token and latency thresholds, and no outlier removal. Any failed or unavailable gate yields `blocked` or `inconclusive`; it never yields a majority-vote promotion.

- [ ] **Step 4: Report all metrics and limitations**

Report total and per-pair input/cached/output/reasoning/total tokens, events, output bytes, wall clock, case-median win rate, repetition direction, reviewer agreement, coding hidden-test results, changed files/bytes, planning-proxy results, the single synthetic-write result, and the remaining lack of broad production and visual-fidelity coverage.

### Task 8: Restore active v1 and finish

**Files:**
- Restore: `AGENTS.md` from `evals/candidates/common-core-v1.md`

**Interfaces:**
- Consumes: reviewed v8 result and unchanged v1 candidate
- Produces: active v1 unless every approved promotion gate passes and the user separately approves activation

- [ ] **Step 1: Restore v1 byte-for-byte**

Regardless of the A/B outcome, restore root `AGENTS.md` from the frozen v1 bytes for this report-only task.

- [ ] **Step 2: Run full verification**

Run collector, P0 contract, project setup, design routing, vendor Python, sync-harness, syntax, hash, LF, and `git diff --check` verification.

- [ ] **Step 3: Commit, integrate, and update the Draft PR**

Commit the evidence and report, merge into `codex/personal-script-first-harness-design`, push, and update Draft PR #2 with the direct A/B verdict. Do not mark the PR ready solely because the evaluation completed.
