# Full Baseline Control과 Common-Core Pair 구현 계획

> **승인 gate:** 이 문서는 구현 계획이다. 사용자가 승인하기 전에는
> Collector 수정, 16-case model run, common-core candidate·루트
> `AGENTS.md` 생성 또는 manifest materialization을 시작하지 않는다.

**Goal:** 검증된 Collector로 16-case no-harness Control을 한 번 실행한
뒤, 완전한 Control evidence가 있을 때만 비발견 common-core candidate를
만들고 동일 16-case Core condition과 paired review를 완성한다. pair가
통과할 때만 candidate bytes를 루트 `AGENTS.md`로 승격한다.

**Architecture:** 현재 Collector 본문을 복제하지 않고 frozen evaluation
profile을 주입한다. profile은 case IDs, result path와 instruction
condition만 바꾼다. 두 condition은 순차 one-shot이며 Control result
review·commit이 Core materialization의 hard gate다.

**Tech Stack:** Node.js standard library, `node:test`, PowerShell P0 contract,
Codex App Server 0.145.0, Git.

## 공통 금지사항

- v2·v3 result 수정·삭제·재실행 금지
- `run-control-v1`·`run-core-v1` retry, resume, force, overwrite 금지
- model case 병렬 실행 금지
- 별도 runner·dependency·database·lock server 추가 금지
- Control review·commit 전 common-core candidate 생성 금지
- pair pass 전 루트 `AGENTS.md` 생성 금지
- optional skill, vendor, sync, README, adapter와 프로젝트 migration 금지
- 사용자 `README.md` 수정·stage 금지

## Task 1: Full profile과 schema를 TDD로 추가

**Files:**
- Modify: `evals/support/collect-codex-app-server.mjs`
- Modify: `tests/codex-app-server-collector.tests.mjs`
- Create after tests define it: `evals/manifest.yaml`

**Interfaces:**
- Produces: frozen `control-v1` and `core-v1` profiles
- Preserves: schema v2 result validation
- Adds: schema v3 full-baseline validation

- [ ] **Step 1: Write RED tests**

Add focused tests proving:

1. exact 16 IDs are selected once in fixed order;
2. `smoke|run-control-v1|run-core-v1` only are accepted;
3. old modes and retry-like arguments are rejected;
4. profile object and nested case ID array are frozen;
5. all non-`p0-02` cases receive no dynamic tool;
6. schema 3 Control requires exactly 16 cases and no instruction overlay;
7. schema 3 Core requires exact overlay and reviewed Control reference;
8. mutating any schema 3 evaluation field breaks `evidenceSha256`;
9. schema 2 v3 result remains valid against its recorded source identity even
   after the current Collector source evolves;
10. the Git resolver rejects missing commits, foreign paths and blob/SHA
    mismatch, and rebuilds case identity from the recorded `cases.json`;
11. token usage accepts nonnegative safe integers and rejects malformed,
   decreasing or secret-shaped evidence;
12. a case still starts at most one thread and one turn;
13. the Core instruction validator rejects over-budget, personal-path,
    runtime-state and unmaterialized-skill content using synthetic strings;
14. Control gate rejects any root `AGENTS.md` or common-core candidate before
    creating a run root;
15. Core gate rejects missing, pending, blocked, untracked or dirty Control,
    missing, untracked or dirty candidate, and any root `AGENTS.md`;
16. Core gate rejects Collector/cases/mock/P0 Git blob drift from Control;
17. a synthetic Core case exclusive-writes exact overlay bytes, records
    before/after overlay hash and accepts exactly one matching instruction
    source while rejecting zero, duplicate or foreign sources;
18. Control fixes the first thread model identity and rejects later drift
    before `turn/start`; Core rejects drift from Control before its first turn;
19. schema 3 review enforces the exact Control/Core pair shape, 16 unique
    ordered comparisons, mechanical outcome truth table, document-scoped
    pointers and efficiency verdict;
20. every `metricDelta` has the exact metric key set and equals the typed
    Core value minus Control, with `null` only when either source is `null`.

Run the focused pattern and record the expected failures before production
code changes.

- [ ] **Step 2: Implement the smallest shared profile seam**

- keep the existing two-case historical constant for schema 2;
- add one frozen full case ID array;
- allow `selectCases(contract, caseIds)` with the historical default;
- make `buildCaseDynamicTools` return the existing tool only for `p0-02`;
- make `runSubjectCase` accept only IDs in the frozen full set;
- route runner loops, missing-case fill and ordering through profile case IDs;
- disable `run-v3` CLI.

Make `captureExecutionGate(profile)` enforce the Control/Core prerequisites
before `createExclusiveRunRoot`. For Core, exclusive-write and snapshot the
exact candidate bytes as `AGENTS.md` in each case workspace. Immediately after `thread/start`,
verify Control `instructionSources` is empty or Core has the exact normalized
case-root `AGENTS.md` singleton; do not call `turn/start` on mismatch.

Fix Control's first observed model/provider/reasoning/service identity and
compare every later case before `turn/start`. For Core, load the reviewed
Control identity in the gate and compare from its first case before
`turn/start`.

Do not copy `runConfiguredEvaluation`.

- [ ] **Step 3: Add schema 3 profile validation**

Put schema 3 `evaluation` inside the hashed evidence. Parameterize shared
case/runtime checks with expected case IDs and instruction condition. Keep
schema 2 hash behavior intact. Reject unknown schema 3 run IDs, case omissions,
duplicates, order drift, evaluation mutation, foreign instruction sources and
baseline reference drift.

Implement `validateResult(result, { sourceResolver, baselineBytes = null })`.
The default repository resolver accepts only hex commits and frozen safe
relative paths, loads each actual `<commit>:<path>` Git object, verifies its
Git blob hash and SHA-256, and rebuilds case identity from the recorded
`cases.json`. Tests use an in-memory resolver. Core requires explicit exact
Control bytes; Control and schema 2 reject them.

Move current-source equality to the new-run execution gate. Historical schema
2 validation uses actual recorded Git objects rather than evolved working
bytes. Preserve all other runtime, control and review checks.

Define and validate the exact schema 3 review/pair shape from the design,
including pending Core state, complete 16-case order, Control/Core pointer
roots, mechanical outcome truth table, recomputed exact metric deltas and
`efficiencyVerdict`.

- [ ] **Step 4: Capture bounded metrics**

Normalize only typed integer fields from
`thread/tokenUsage/updated`. Compare the last correlated
`tokenUsage.total`; require at least one complete notification, enforce
monotonic nondecrease for provided total fields, and record prompt/final-output
bytes and event count. Measure wall time from immediately before `turn/start`
until the first correlated `turn/completed` with `performance.now()`.
Optional fields omitted by the provider remain `null`, never inferred as zero.
Do not retain hidden reasoning or raw provider payload.

- [ ] **Step 5: Write `evals/manifest.yaml`**

Record:

- exact case order and one repetition per condition;
- runtime/profile/result names;
- prompt and fixture hash source;
- fresh thread method;
- token and wall-clock method;
- review method;
- Control/Core pairing keys;
- current capability commit and result hash;
- unavailable fields as explicit `unknown`, never inferred.

The manifest must use repository-relative paths and contain no personal
absolute path. Keep it a simple static YAML document; do not add a YAML parser
or dependency for this stage.

- [ ] **Step 6: Verify Task 1**

Run:

```powershell
node --check evals/support/collect-codex-app-server.mjs
node --test tests/codex-app-server-collector.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/p0-evaluation-contract.tests.ps1
node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { validateResult } from './evals/support/collect-codex-app-server.mjs'; const r=JSON.parse(await readFile('./evals/p0/baseline-capability-spike-v3.json','utf8')); validateResult(r); console.log('PASS: v3 historical result');"
git diff HEAD --exit-code -- evals/p0/baseline-capability-spike-v2.json evals/p0/baseline-capability-spike-v3.json
git diff --check
```

Expected: every test passes, v2/v3 bytes are unchanged, and only Task 1 files
plus preserved `README.md` appear.

- [ ] **Step 7: Read-only code review and implementation commit**

Review profile routing, schema dispatch, instruction gating, metrics bounds and
one-shot identity. Fix P0/P1 findings, rerun Task 1 checks, then commit only
Collector, tests and manifest.

## Task 2: Execute and review Control once

**Creates once:** `evals/p0/no-harness-control-v1.json`

- [ ] **Step 1: Confirm preconditions**

- implementation HEAD is clean except `?? README.md`;
- Control result is absent;
- `%TEMP%\joewrks-eval-no-harness-control-v1` is absent;
- root `AGENTS.md` is absent;
- `evals/candidates/common-core-v1.md` is absent;
- v2/v3 files match HEAD;
- model-free smoke passes without result creation.

Never delete a pre-existing fixed run root automatically.

- [ ] **Step 2: Run Control exactly once**

```powershell
node evals/support/collect-codex-app-server.mjs run-control-v1
```

This is the single authorized model run for this ID. Do not retry on blocked,
failure or partial completion.

- [ ] **Step 3: Independent read-only review**

The reviewer reads the design, plan, frozen cases and Control result. It
modifies nothing and returns for all 16 cases:

- `pass|fail`;
- nonempty reason;
- existing exact case JSON Pointers;
- Collector capability verdict;
- P0/P1 evidence-integrity findings.

- [ ] **Step 4: Finalize review only**

Modify only the Control `review` field. Recompute the evidence hash
independently without changing it, validate schema 3 and confirm every
reference exists.

- [ ] **Step 5: Commit Control evidence only**

Stage exactly `evals/p0/no-harness-control-v1.json`. Verify the staged path set,
then commit. `README.md` remains untracked.

If Collector capability is `blocked`, stop. Do not create the candidate or
root `AGENTS.md`.

## Task 3: Materialize the common core

**Creates:** `evals/candidates/common-core-v1.md`

- [ ] **Step 1: Derive only the approved invariant sections**

Use sections 6.1–6.7 and the single-writer/delegation boundaries from the
common design. Target 80–120 lines, never more than 200.

Do not include optional skills, vendor content, installation state, plugin
version tables, personal paths, case-specific fixture text or project-specific
rules.

- [ ] **Step 2: Run the pre-existing structural tests before the file**

Task 1 tests must already reject only the mechanical contract:

- more than 200 lines;
- personal absolute paths;
- duplicated runtime/version state;
- activation instructions for unmaterialized skills;
- missing exact approved section headings.

Do not build a keyword-scoring or pseudo-semantic natural-language validator.
The 16 behavior cases are the meaning-level test.

- [ ] **Step 3: Create the minimal non-discoverable candidate**

Make wording operational and non-duplicative. Do not turn every rule into a
separate receipt or mandatory ceremony. The file must allow necessary
read-only investigation and safe alternate evidence paths. An independent
reviewer must confirm it contains only the already-approved common invariants,
not wording tailored to individual Control outputs.

- [ ] **Step 4: Verify and commit Core source**

Run all offline tests. Confirm Control result and Collector source are
unchanged. Commit only the candidate; changing Collector or tests after
Control requires a new plan because it would break the paired method identity.

## Task 4: Execute and review Core once

**Creates once:** `evals/p0/common-core-v1.json`

- [ ] **Step 1: Confirm Core gate**

- reviewed Control result validates and is tracked cleanly;
- non-discoverable candidate validates and is tracked cleanly;
- root `AGENTS.md` is still absent;
- Core result and fixed temp root are absent;
- Collector, cases, mock and P0 contract Git blobs match Control;
- model-free smoke passes;
- worktree contains only preserved `README.md`.

- [ ] **Step 2: Run Core exactly once**

```powershell
node evals/support/collect-codex-app-server.mjs run-core-v1
```

Do not retry this run ID.

- [ ] **Step 3: Independent behavior and pair review**

For each case, the reviewer records:

- Core `pass|fail` with exact Core pointers;
- `improved|same|regressed`;
- exact Control pointers;
- metric delta and any repeated/unrelated behavior;
- nonempty reasons.

Pair pass requires Core behavior pass 16/16, regression 0, complete comparison
conditions, `efficiencyVerdict: pass` and Collector capability pass for both
results.

- [ ] **Step 4: Finalize review only**

Modify only Core `review`. Keep Core evidence hash unchanged. Validate all
Control/Core pointers and pair requirements.

- [ ] **Step 5: Commit Core evidence only**

Stage exactly `evals/p0/common-core-v1.json`, verify, and commit.

## Task 5: Close the stage

- [ ] If and only if pair review is `pass`, create root `AGENTS.md` with bytes
      exactly equal to the reviewed candidate and verify its hash. If pair is
      blocked, including any regression, root `AGENTS.md` must remain absent.
- [ ] Update common design status with actual Control/Core outcomes.
- [ ] Update `evals/manifest.yaml` result paths, hashes, commits and review
      outcomes without changing historical evidence.
- [ ] Run full Node, P0, schema, diff and historical-result checks.
- [ ] Obtain one final read-only review.
- [ ] If pair passes, stage exactly root `AGENTS.md`,
      `docs/superpowers/specs/2026-07-27-common-work-harness-design.md`,
      `docs/superpowers/specs/2026-07-29-full-baseline-common-core-pair-design.md`
      and `evals/manifest.yaml`.
- [ ] If pair is blocked, stage exactly the same two status documents and
      `evals/manifest.yaml`; root `AGENTS.md` remains absent.
- [ ] Verify the staged path set excludes `README.md`, then commit that exact
      conditional closure.

The next separate plan may cover UI UX Pro Max, Apple Design and
`joewrks-design-frontend`. Optional assumption, surgical and handoff skills
remain later one-at-a-time evaluations. If the pair is blocked, preserve both
results and the non-discoverable candidate, keep root absent, and write a new
delta design before any model rerun.
