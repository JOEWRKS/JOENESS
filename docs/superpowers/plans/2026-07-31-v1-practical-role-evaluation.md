# Common Core V1 Practical Role Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동일한 실제 프로젝트 과제에서 Control과 V1 personal-pilot bundle을 PM·기획·디자인·개발 역할별로 실행하여, 결과 품질·범위 통제·검증 신뢰성·토큰 비용을 비교할 수 있는 재현 가능한 실무 평가를 수행한다.

**Architecture:** 기존 P0 수집기의 App Server transport, 해시, 토큰 정규화, 격리 홈 유틸리티만 재사용한다. 새 역할 전용 runner 하나가 고정 case catalog를 읽어 원본 Git object 또는 선별 포트폴리오 snapshot으로 서로 분리된 arm을 만들고, 역할별 최소 도구 정책 아래 한 세션씩 수집한다. 순수 evaluator 하나가 raw receipt를 검증·익명화·집계한다. 원본 프로젝트와 raw transcript는 Git에 넣지 않는다.

**Tech Stack:** Node.js built-ins and `node:test`, Git CLI, Codex App Server, PowerShell 5.1, existing Figma plugin. 새 npm package와 범용 평가 프레임워크는 추가하지 않는다.

## Global Constraints

- 기준 설계는 `docs/superpowers/specs/2026-07-31-v1-practical-role-evaluation-design.md`이다. 이 계획은 설계를 축소하거나 변경하지 않고 실행 단위로 구체화한다.
- 비교 대상 명칭은 항상 **V1 personal-pilot bundle**이다. 결과를 Common Core 한 문장이나 특정 skill 하나의 인과 효과로 과장하지 않는다.
- 원본은 읽기 전용 사실 원장이다.
  - harness: `D:\JOEWRKS\작업하네스`
  - app source repository: `D:\JOEWRKS\JOEWRKS-TestProject-01`
  - portfolio Git root: `D:\JOEWRKS\JOEWRKS-Portfolio`
  - portfolio bounded source: `D:\JOEWRKS\JOEWRKS-Portfolio\recovered-portfolio`
- 모든 평가 쓰기는 새 run root `D:\JOEWRKS\.harness-evals\<run-id>` 아래에서만 수행한다. 구현 자체는 별도 harness worktree에서 한다.
- 앱 평가 snapshot은 working tree를 복사하지 않는다. `git archive <exact-sha>`로 commit tree만 꺼내고 `.git` 없는 파일을 새 no-remote 저장소의 단일 `fixture-base` commit으로 초기화한다.
- 앱 원본의 현재 unrelated change `src/screens/DungeonRunScreen.tsx`는 읽거나 수정할 평가 입력이 아니다.
- portfolio snapshot은 전체 477 MB tree를 복사하지 않는다. case catalog의 allowlist에 있는 파일과 실제 import로 필요한 파일·선별 asset만 복사하고, 두 arm에 같은 per-file SHA-256 manifest를 사용한다.
- Control에는 프로젝트 규칙과 두 조건에 공통으로 허용한 third-party tool/plugin만 제공한다. Common Core와 JOEWRKS skills는 제공하지 않는다.
- V1에는 Control과 같은 프로젝트·runtime·tool/plugin에 더해 정확한 Common Core bytes를 **workspace 파일이 아닌 controlled instruction channel**로 제공하고, 현재 `skills/joewrks-design-frontend`, `skills/joewrks-project-setup`, `vendor/ui-ux-pro-max`, `vendor/apple-design` bytes를 arm-local identity home의 대응 경로에 제공한다. 프로젝트 snapshot의 `AGENTS.md`는 두 조건에서 byte-identical하게 유지한다. 시작 시 각 파일 hash와 aggregate hash를 기록한다.
- subject runtime은 `gpt-5.6-sol`, reasoning effort `low`, service tier `default`로 고정한다. App Server가 exact model revision을 노출하지 않으면 revision comparability는 `unknown`으로 기록하고 해당 pair를 시작하지 않으며, 동일하다고 꾸미지 않는다.
- 다른 조건, hidden grader, 알려진 fix commit/diff, source `.git`, source remote, sibling arm, controller catalog는 subject의 readable root 밖에 둔다.
- external write timeout 또는 응답 유실은 성공/실패로 추정하지 않고 `application-state-unknown`으로 **전체 run을 즉시 중단**한다. 새 key로 blind retry하지 않는다.
- Figma는 original과 두 arm duplicate가 서로 다른 file key임을 확인한 뒤 각 arm에 자기 duplicate key만 제공한다. 원본 또는 sibling key를 모델 입력에 넣지 않는다. exact duplicate를 준비할 안전한 경로가 없으면 designer pair만 `infrastructure-blocked`다.
- pilot이 설계의 hard gate를 통과하기 전 chain을 실행하지 않는다.
- raw transcript, arm map, workspace, hidden grader result, Figma key는 run root에만 둔다. 저장소에는 민감 경로와 원문을 제거한 compact report와 hash만 넣는다.
- 테스트는 생산 코드보다 먼저 작성하고 예상 이유로 실패하는 것을 확인한다. 각 task reviewer는 brief·report·diff package로 spec compliance와 code quality를 모두 검토한다.
- 작업 도중 기존 P0 schemas, coding runner, V1/V2 evaluator, active `AGENTS.md`, README, 설치 스크립트를 변경하지 않는다.

---

## Task 1: Freeze the executable case catalog and app graders

**Files:**

- Create: `evals/practical-roles/cases.json`
- Create: `evals/practical-roles/visible/max-hp-settlement.visible.mjs`
- Create: `evals/practical-roles/hidden/max-hp-settlement.hidden.mjs`
- Create: `tests/v1-practical-role-ab.tests.mjs`

- [ ] **Step 1: Write failing catalog tests**

In `tests/v1-practical-role-ab.tests.mjs`, add behavior tests that load the catalog and prove:

1. roles are exactly `pm`, `planner`, `designer`, `developer`;
2. pilot order is frozen and balanced as `pm/control`, `pm/v1`, `planner/v1`, `planner/control`, `designer/control`, `designer/v1`, `developer/v1`, `developer/control`;
3. calibration order is `calibration/control`, `calibration/v1`;
4. caps are `20_000`, `70_000`, `75_000`, `600_000`, `1_200_000`;
5. PM snapshot is `6fc6d35ab2bc85bec7e99288f7a8cd8427cf496b` with tree `630aae002a6388ae35f3786aef81ead0943a5e30` and 114 files;
6. planner/developer snapshot is `2cde701b70a82f3d715f2e2182baf5f69bdb2496` with tree `b5e5bd7aca12d3194c100b0e99dbb8853da40a54` and 114 files;
7. developer allowed changes are exactly `src/domain/runPlayerProjection.ts` and `src/domain/runSettlement.ts`;
8. fixed answer commit identifiers, answer source, helper name, and hidden grader path do not appear in the fully serialized planner/developer subject surface: prompt, environment, visible files, tool configuration, and synthetic Git history;
9. every role defines output contract, rubric keys, protected scope, allowed tools, and pair token cap;
10. designer requires original node `73:2`, widths `320`, `390`, `430`, and explicit duplicate-key preflight.

Run:

```powershell
node --test tests/v1-practical-role-ab.tests.mjs
```

Expected RED: module or catalog not found.

- [ ] **Step 2: Add the smallest frozen catalog**

Put prompts, output JSON schemas, objective rubric keys, snapshot metadata, role tool policies, protected/allowed paths, and exact run order in one `cases.json`. Do not split schema files.

PM prompt contract:

- inspect only `TICKET-059-0.4`, `DIAG-059-04`, `TICKET-059-0.41`, and required source/contracts;
- return one of `PROCEED`, `HOLD`, `NEEDS EVIDENCE` plus basis, included/excluded scope, dependencies, risks, acceptance, unknowns, and handoff;
- expected decision is `PROCEED`, but it must resume only `0.4`, require fresh full `0.4` evidence, and must not claim `0.41` or `TICKET-059` closed.

Planner prompt contract:

- visible reproduction is `220 -> run 240 -> settlement 240 -> next run 260`, expected `settlement 220` and every run projection `240`;
- trace creation, ownership settlement, and compatibility settlement;
- return authorities, call paths, shared root cause, exact files/symbols, unchanged siblings, test matrix, commands, rollback, unknowns;
- no product writes, repository history, hidden patch inference, caller-by-caller compensation, or unrelated redesign.

Developer prompt contract:

- fix the repeated max-HP equipment application at its root cause and cover both ownership-aware and compatibility settlement;
- preserve the stated current HP, armor, equipment, currency, status-cleanup, and lifecycle behavior;
- run `node ..\visible\max-hp-settlement.visible.mjs`, build, and lint;
- change only the two allowed domain files and add no dependency.

Designer prompt contract:

- in the assigned duplicate only, produce mobile detail-first category flow at 320×844, 390×844, and 430×932;
- cover default, sheet-open, project-selected, and focus-return states, keyboard/focus/Escape/reduced-motion contracts, existing brand tokens, and file/node read-back;
- original Figma, original code, new library/font/icon package, browser implementation claim, or full-site redesign are forbidden.

- [ ] **Step 3: Write visible and hidden behavioral graders**

The visible script lives at `<arm>\subject\visible`, accepts `<arm>\subject\project` as its only argument, and exports one test-only `withViteSsr(projectRoot, callback)` loader. The loader resolves the arm workspace's own Vite, uses middleware mode and a run-root cache, and closes the server in `finally`. It asserts only the public sequence `220 -> 240 -> 220 -> 240`; the hidden grader imports this loader without exposing hidden cases to the subject.

The hidden script takes `<arm>\project` as its only argument and is materialized only by the controller after the model finishes. It grades behavior, not helper names or patch text, and reports every rubric group instead of aborting on the first failed group:

- no modifier, positive, negative, mixed, and equipment swap;
- three repeated returns;
- returned/dead/abandoned, standard/hardcore, ownership and compatibility settlement;
- upper/in-range/lower current HP clamp;
- projection armor and persistent `canCarryArmorBetweenTurns` authority;
- hardcore death cleanup unchanged;
- historically inflated persistent value preserved as a low-weight, unprompted scope-regression check;
- exact changed-path and protected-file integrity.

- [ ] **Step 4: Prove grader sensitivity against both historical trees**

Restore exact lockfile dependencies in disposable controller copies. Use workspace-local Vite SSR resolution, an external run-root cache directory, and `server.close()` in `finally`. The visible and hidden graders must fail for the expected max-HP reason on `2cde701…` and pass on `6fc6d35…`. A crash, missing import, or early abort is not the expected RED.

- [ ] **Step 5: Verify GREEN and commit**

```powershell
node --test tests/v1-practical-role-ab.tests.mjs
```

Expected: all Task 1 tests pass with no hidden answer leakage.

Commit message:

```text
test: freeze practical role evaluation cases
```

---

## Task 2: Add isolated snapshot and arm preflight

**Files:**

- Modify: `tests/v1-practical-role-ab.tests.mjs`
- Create: `evals/support/run-v1-practical-role-ab.mjs`

- [ ] **Step 1: Write failing isolation tests**

Test exported pure/materialization functions for:

- run root creation is exclusive and remains below the exact configured evaluation parent;
- arm roots, project roots, identity homes, and Codex homes are pairwise disjoint;
- path traversal, symlink, junction, and reparse-point inputs are rejected;
- `git archive` materialization verifies commit, tree, tracked-file count, and creates a one-commit no-remote repo without alternates;
- the app source working tree and its `.git` are never copied;
- a sorted per-file SHA-256 manifest is identical between paired arms;
- portfolio allowlist copy rejects files outside the bounded source and rejects missing imports/assets;
- Control overlay contains no Core/JOEWRKS bytes;
- V1 overlay contains the exact Core plus both current JOEWRKS skills and records their hashes;
- original HEAD, exact porcelain `-z` bytes, selected-file manifest, package files, and original Figma node identity can be captured and compared before/after;
- receipt writes use exclusive creation and cannot overwrite an existing result;
- the synthetic base commit, HEAD, complete tracked/untracked manifest, and history length are frozen, so committing a protected change cannot hide it from grading.

Expected RED: runner module not found.

- [ ] **Step 2: Implement only the required isolation helpers**

Reuse these existing exports instead of copying them:

- collector: `sha256`, `stableStringify`, `boundUtf8`, `runBuffered`, `removeIsolatedCodexHome`, `hashRepositoryFiles`;
- coding runner: `assertSafeRelativePath`, `assertNoSymlinks`, `copyIsolatedCodexHome`, `writeExclusiveJson`.

Add only:

- catalog validation;
- root containment and disjointness checks;
- `git archive` extraction plus neutral repo initialization;
- allowlisted portfolio copy and sorted manifest;
- arm overlay construction;
- before/after original integrity receipt.

Do not add a lock server, queue, generic snapshot framework, dependency manager, or automatic rollback.

- [ ] **Step 3: Verify RED→GREEN and commit**

```powershell
node --test tests/v1-practical-role-ab.tests.mjs
```

Commit message:

```text
feat: isolate practical role evaluation arms
```

---

## Task 3: Extend event normalization with an exact optional tool policy

**Files:**

- Modify: `evals/support/collect-codex-app-server.mjs`
- Modify: `tests/codex-app-server-collector.tests.mjs`

- [ ] **Step 1: Write one failing policy-aware event test**

Prove that the current default remains fail-closed, while an explicitly supplied policy can accept and preserve bounded evidence for one exact `commandExecution`, `fileChange`, or `mcpToolCall` target. The policy must reject unexpected item type, tool, server, operation, target alias, original/sibling Figma key, web, collab, and create-new-file calls.

Name the break: a broadened role runtime must never turn unknown tool activity into accepted evidence.

- [ ] **Step 2: Add the smallest backward-compatible hook**

Extend `normalizeEvent(notification, options)` with one optional, serializable exact `toolPolicy` object. If absent, preserve all current blockers byte-for-byte. If present:

- normalize only bounded non-secret identifiers, argument hash, status, returned item/node identifiers, exit code, duration, and output hash/bounded output;
- let the policy decide allow/deny from normalized evidence;
- keep unknown notifications/items blocked;
- do not embed role-specific paths or Figma logic in the shared collector.

- [ ] **Step 3: Run focused and existing collector tests**

```powershell
node --test tests/codex-app-server-collector.tests.mjs tests/v1-practical-role-ab.tests.mjs
```

Commit message:

```text
feat: allow exact tool policies in collector events
```

---

## Task 4: Collect one bounded role session per arm

**Files:**

- Modify: `evals/support/run-v1-practical-role-ab.mjs`
- Modify: `tests/v1-practical-role-ab.tests.mjs`

- [ ] **Step 1: Write failing runtime and receipt tests**

Use synthetic App Server events and fake filesystem/tool boundaries to prove:

- Control/V1 runtime identity, model, reasoning effort, service tier, project snapshot, and third-party capability inventory must match before `turn/start`;
- source config cannot inject extra instructions, skills, hooks, MCP servers, or remote control;
- each role gets one thread/turn and only its workspace root;
- PM/planner have read-only project files and final-output-only artifacts, with deterministic JSON-pointer/set checks for required decisions, ticket IDs, paths/symbols, commands, and immutability; prose quality stays with blind reviewers;
- developer can write only two domain paths and use shell only inside its arm;
- designer can call only read metadata/screenshot and scoped `use_figma` against its assigned alias/key; `create_new_file`, browser, web, other plugins, original/sibling keys are blocked **before dispatch** by the exposed capability set or a target-clamping proxy;
- all correlated token updates are retained; total never decreases; five token fields and response-cycle count are recorded;
- missing/decreasing token evidence blocks the arm;
- cap produces `budget-exhausted` without inventing a result;
- duplicate tool call fingerprints are counted, but only repeated side effects or uncertain blind retries are hard failures;
- timeout/lost external response records `application-state-unknown` and stops the pair;
- raw events, transcript, final answer, command hashes, diff, grader result, and receipt are exclusively written inside the arm.

- [ ] **Step 2: Build role runtime without reusing incompatible wrappers**

Reuse `openAppServer`, `classifyEventScope`, and the extended `normalizeEvent`; `openAppServer` already owns its JSONL client. Event normalization is evidence validation after a call and is not treated as permission enforcement. Do **not** call unchanged `prepareRuntime`, `buildThreadStartRequest`, or `runSubjectCase`: they intentionally disable required capabilities or enforce P0-only cases.

The new runtime builder must:

- copy only authentication/sandbox identity with `copyIsolatedCodexHome`, then generate a minimal arm-local config instead of copying the user `config.toml`;
- set arm-local `HOME`, `USERPROFILE`, `TEMP`, and `TMP` so global JOEWRKS skills and temporary artifacts cannot leak across arms;
- materialize the same selected third-party plugin/config in both conditions;
- add the frozen Core and JOEWRKS skill trees only in V1;
- disable all capabilities not listed by the current role;
- deny approval and user-input requests;
- pin and record the observed Codex CLI/App Server version, model/provider, reasoning effort, and service tier;
- write an immutable failure receipt when preflight or collection fails.

For Figma, the runner must expose only pre-approved operations and clamp the target to the assigned duplicate before the plugin call. If the current runtime cannot enforce that boundary, the designer pair is `infrastructure-blocked`; a post-call rejection is not a safe substitute.

Exact CLI modes:

```text
smoke
preflight --run-root <new-absolute-path> --app-repo <absolute-path> --portfolio-root <absolute-path> --portfolio-source <absolute-path> [--figma-preflight-receipt <absolute-path>]
run-calibration <run-root> <attempt:1|2>
run-pair <run-root> pilot <pm|planner|designer|developer> <attempt:1|2>
run-pair <run-root> chain <pm|planner|designer|developer> <attempt:1|2>
```

Each non-smoke mode refuses a missing preflight, a completed target receipt, an out-of-order role, or attempt `2` without a paired attempt-1 infrastructure-failure receipt. `run-pair` executes both conditions sequentially in catalog order and completes the paired arm after a valid `budget-exhausted` result.

- [ ] **Step 3: Add model-free smoke mode**

`node evals/support/run-v1-practical-role-ab.mjs smoke` must perform zero model/Figma calls and prove paired snapshot equality, overlay delta, isolated homes, synthetic token receipt handling, tool-policy enforcement, and exclusive artifacts.

- [ ] **Step 4: Verify and commit**

```powershell
node --test tests/v1-practical-role-ab.tests.mjs tests/codex-app-server-collector.tests.mjs
node evals/support/run-v1-practical-role-ab.mjs smoke
```

Commit message:

```text
feat: collect practical role evaluation evidence
```

---

## Task 5: Validate, blind, score, and decide the pilot

**Files:**

- Create: `evals/support/evaluate-v1-practical-role-ab.mjs`
- Modify: `tests/v1-practical-role-ab.tests.mjs`

- [ ] **Step 1: Write failing evaluator tests**

With literal fixture receipts, prove:

- invalid source/runtime comparability, original drift, cross-arm access, protected changes, false check claims, unauthorized external writes, irrelevant skill/tool forcing, and blind retry become hard failures;
- `not observed` never becomes `did not occur`;
- reviewer bundle removes condition, candidate hash, run order, token/tool counts, file keys, local paths, and activation evidence;
- arm map stays private and opaque labels are stable for the run;
- objective developer/design graders outrank prose scores;
- primary reviewer and fact auditor are separate inputs;
- disagreement routes the same blinded evidence to a third adjudicator and never reruns the subject;
- one pair may rerun once only for an unrecoverable collection infrastructure failure;
- calibration subtraction is allowed only when runtime/model identity matches;
- pass gates and categories exactly match the approved design;
- pilot decision permits chain only for a valid pass;
- compact report contains checks actually run, unverified items, risks, unknowns, tokens, and claim scope without raw/private fields.

- [ ] **Step 2: Implement pure evaluator and CLI**

The evaluator reads immutable run-root receipts and reviewer JSON, validates before scoring, and writes new exclusive artifacts. It does not call a model, mutate workspaces, edit the harness, or retry arms.

CLI modes:

```text
prepare-review <run-root>
evaluate-pilot <run-root>
prepare-chain-review <run-root>
evaluate-chain <run-root>
```

Use the approved five 0–4 dimensions and these decisions:

- `regression`
- `unnecessary-overhead`
- `effective-but-too-heavy`
- `blocked-or-invalid`
- `practically-effective`

- [ ] **Step 3: Verify and commit**

```powershell
node --test tests/v1-practical-role-ab.tests.mjs
```

Commit message:

```text
feat: evaluate practical role pilot evidence
```

---

## Task 6: Preflight the real environment without starting a subject

**Files:**

- Runtime output only: `D:\JOEWRKS\.harness-evals\<run-id>\preflight\**`
- No tracked file changes expected.

- [ ] **Step 1: Create the isolated run root and freeze inputs**

Run preflight with explicit source paths. It must record source commit/tree/count, exact original status bytes, selected portfolio manifest, Core/skill hashes, installed runtime identity, and capability inventory. Do not put raw paths or Figma keys in tracked files.

- [ ] **Step 2: Verify app arm comparability**

Materialize paired PM/planner/developer snapshots and run zero-subject checks. Record exact `node --version` and `npm --version`; restore dependencies where required with `npm ci --ignore-scripts --no-audit --no-fund --cache <run-root>\npm-cache`, the frozen lockfile, and identical environment variables. Hash `package.json`, `package-lock.json`, and `node_modules\.package-lock.json` before subject turns. Reject source drift, package/lock drift, install-result asymmetry, symlinks, config contamination, runtime revision unknown/asymmetric, or capability asymmetry.

Exercise the **real subject sandbox**, not only synthetic policy code: from each role profile, prove the allowed subject root can be read, its authorized write target behaves as declared, and absolute paths plus planted junctions to the original app, harness, sibling arm, controller files, and hidden grader are denied. Any readable forbidden target invalidates the pair before a subject turn.

- [ ] **Step 3: Verify designer feasibility**

An operator first creates two whole-file duplicates through the Figma UI's native duplicate operation; `create_new_file` is not equivalent and is forbidden. Record the operation time, original key alias, two opaque duplicate aliases/keys, observed result, and recovery state in one exclusive untracked receipt. Never retry a lost/unknown duplicate operation blindly.

Before any design subject, confirm:

- original and two duplicate file keys are distinct;
- original node `73:2` exists and each duplicate has a verified mapped node identity; do not assume node IDs are preserved;
- duplicate node type, name, bounds, and screenshot SHA-256 are equal at baseline; if screenshot bytes are nondeterministic or differ, require a recorded manual visual comparison and label it manual evidence;
- each arm runtime exposes the same Figma plugin inventory and only the assigned key;
- original/sibling keys and `create_new_file` are rejected by policy.

If metadata/screenshot/read-back cannot be invoked controller-side, use one clearly labeled **unscored preflight session** and record its tokens separately. Never report a model-mediated preflight as zero-token automation. Prove one assigned-duplicate write and read-back works without interactive approval under the exact unattended policy, then restore/use fresh duplicates for subjects.

If exact duplicates cannot be prepared or scoped writes cannot be enforced/observed, write a paired `infrastructure-blocked` receipt and continue only with the other valid role pairs. Do not create a fake browser or static-image substitute.

- [ ] **Step 4: Re-run the model-free smoke and inspect receipts**

```powershell
node evals/support/run-v1-practical-role-ab.mjs smoke
node --test tests/*.tests.mjs
```

Record exact command, exit code, counts, and bounded output hash.

---

## Task 7: Run calibration and the eight-role pilot

**Files:**

- Runtime output only: `D:\JOEWRKS\.harness-evals\<run-id>\pilot\**`
- No tracked file changes until the sanitized report.

- [ ] **Step 1: Run the fixed calibration pair**

Use identical no-project prompt and runtime except the frozen V1 overlay. The exact prompt is `Return exactly {"status":"ready"}. Do not call tools.` Stop at 20,000 tokens per arm. Calibration affects only fixed-context token accounting, never role quality.

Before starting any pair, verify the aggregate remainder can fund both per-arm ceilings. If an arm reaches its ceiling, finish its paired arm at the same cap, then stop before the next pair when the 600,000 pilot or 1,200,000 full-run cap cannot fund it. Never compare an unpaired arm.

- [ ] **Step 2: Run role arms sequentially in the frozen order**

Run all eight arms exactly once unless the approved infrastructure-rerun rule applies. Before replacing or rerunning any arm, inspect its exclusive receipt and external state. Never run two writers against the same logical target.

- [ ] **Step 3: Apply objective graders and integrity checks**

For developer, materialize the hidden grader only after the model turn; then run hidden test, `npm run build`, `npm run lint`, `git diff --check`, changed-path and protected-hash checks. For designer, perform metadata/screenshot/read-back checks on only the assigned duplicate. For PM/planner, validate schema and project-tree immutability.

- [ ] **Step 4: Prepare blinded review packages**

```powershell
node evals/support/evaluate-v1-practical-role-ab.mjs prepare-review <run-root>
```

Dispatch two independent reviewers in isolated read-only review workspaces. The primary reads only `<run-root>\review\<opaque-pair>\primary-input.json` and writes `primary-output.json` with `{artifactLabel, dimensions:[{name,score:0..4,evidenceRefs,rationale}], total, unknowns}`. After that output is immutable, the fact auditor reads `audit-input.json` and writes `audit-output.json` with `{comparability, hardFailures, objectiveChecks, tokenChecks, claimScope, discrepancies}`. Reviewer prompts and schemas are frozen in `cases.json`; neither reviewer can read arm workspaces, arm map, tokens excluded from its role, or write subject artifacts. A third adjudicator receives only the same blinded evidence, the conflicting findings, and the same schema; it never reruns a subject.

- [ ] **Step 5: Evaluate the pilot**

```powershell
node evals/support/evaluate-v1-practical-role-ab.mjs evaluate-pilot <run-root>
```

Do not start chain unless the receipt explicitly says `practically-effective` and `chainEligible: true`.

---

## Task 8: Conditionally run the handoff chain and publish compact evidence

**Files:**

- Runtime output: `D:\JOEWRKS\.harness-evals\<run-id>\chain\**`
- Create only after evaluation: `docs/evaluations/2026-07-31-v1-practical-role-ab.md`

- [ ] **Step 1: Gate chain execution**

If pilot is not eligible, skip chain and record the exact gate failure. If eligible, run Control and V1 chains with separate initial snapshots, workspaces, Codex homes, Figma duplicates, and role outputs. Each role sees only the immediately preceding final artifact and fixed project evidence.

The frozen chain catalog uses the same portfolio mobile detail-first objective and these exact handoff boundaries:

- PM returns only a scoped product contract JSON: outcome, included/excluded scope, acceptance, risks, unknowns, next-role contract;
- planner receives that JSON plus the fixed snapshot and returns only files/symbols, ordered implementation steps, design states, validation commands, rollback, unknowns;
- designer receives the planner artifact plus the assigned Figma duplicate and returns only mapped frame/node identities, state/interaction/accessibility contracts, read-back evidence, unknowns;
- developer receives the designer artifact plus its isolated portfolio project, may change only catalog-approved frontend/test paths, and validates at 320/390/430 with build, tests, and a browser bound only to its assigned localhost preview;
- every chain arm has the same declarative tool policy as its pilot role plus the minimum handoff consumer capability, a 75,000-token ceiling, and a schema-validated final artifact.

- [ ] **Step 2: Review and evaluate chain evidence**

Use the same blinding, fact audit, objective graders, hard failures, and token ceilings. Do not reuse pilot scores as chain scores.

- [ ] **Step 3: Write the sanitized Korean/English report**

The tracked report must include:

- frozen run/runtime/model identities that are safe to share;
- roles completed, blocked, or skipped;
- objective grader results and blind scores;
- raw/fixed/additional token accounting and response/tool cycles;
- hard failures, duplicate effects, irrelevant activations, and false-claim findings;
- exact tests/checks actually run and their results;
- checks not run, unknowns, and original-integrity claim limits;
- Control/V1 decision and whether V1 needs revision.

Do not include raw transcripts, personal absolute paths, Figma keys, credentials, private project text, hidden grader source, or arm map.

- [ ] **Step 4: Fresh verification before completion**

```powershell
node --test tests/*.tests.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File tests/p0-evaluation-contract.tests.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tests/project-setup.tests.ps1
git diff --check
git status --short
```

Also compare all original HEAD/status/manifests and observed original Figma node identity against preflight. Report only what those checks directly support.

- [ ] **Step 5: Final review and integration**

Run a whole-branch review using the SDD review package. Resolve one final fix wave at most, re-run affected checks, then use `superpowers:finishing-a-development-branch` to leave a locally verified branch. Push, PR update, merge, release, or publication remains outside this evaluation's authority.
