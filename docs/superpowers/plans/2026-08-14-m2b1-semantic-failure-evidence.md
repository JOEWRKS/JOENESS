# M2B1 Semantic Failure Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve exact bounded sample-a semantic failure predicates and the existing path-private process summary in a blocked artifact without retaining raw evaluator output or changing evaluator behavior.

**Architecture:** The visual validator creates one fixed primitive-only `semanticFailureEvidence` object and attaches it non-enumerably to the targeted sample-a error. The visual orchestration validates that marker inside the actual sample-a validator catch, records the exact error identity in an invocation-local `WeakSet`, and adds the existing post-validation process projection only to that proven error. The blocked writer first requires that exact provenance, then independently revalidates, rebuilds, and bounds the semantic projection before persistence. Existing Task 1, event compaction, cleanup, path privacy, retry, and success paths remain unchanged.

**Tech Stack:** Node.js ESM, `node:test`, `node:assert/strict`, PowerShell, Git, existing JOENESS M2B1 runner helpers.

## Global Constraints

- Work only in `D:\JOEWRKS\작업하네스\.worktrees\joeness-interface` on branch `codex/joeness-interface`; start every PowerShell command with `$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface';`.
- Commit this reviewed implementation plan by itself before Task 1. Begin execution only from that plan commit with a clean worktree, and use that commit as the implementation base SHA.
- Follow RED → observed expected failure → minimal GREEN for every production behavior change.
- Do not run any live evaluator session or the v10 command.
- Preserve `evals/skill-contracts/design-visual-m2-b1-v10-blocked.json` exactly at `2504` bytes and SHA-256 `34a1cb1c5fdf7655aeab9f5f6df899c40ae8752cd93edd57061f95c29dcbfcd0`.
- Preserve the v10 plan, v12 receipt, all earlier history, `TASKS.md`, `vendor/source-manifest.json`, evaluator prompts, image inputs, output schemas, candidate outcomes, acceptance criteria, session order, and retry count `0` byte-for-byte.
- Do not modify `evals/support/run-fresh-evaluator-turn.mjs` or `evals/support/collect-codex-app-server.mjs`.
- Keep Task 1 limits exactly `512` events and `128` MCP-after records; do not synthesize `task1Prevalidation` on a semantic validator failure.
- Retain only exact enum, boolean, and safe-integer semantic values. Never retain raw output, checks, `observed` text, staged/private absolute paths or their encodings/digests, credentials, stderr text, or event payloads.
- Bound the rebuilt semantic projection to 2 KiB and keep `rawOutputRetained: false`.
- Generation 11 support, an actual v11 plan, preflight, authorization, live execution, receipt, TASKS update, and manifest decision are separate future work.

---

### Task 1: Pin the historical v10 blocked state

**Files:**
- Modify: `tests/design-visual-m2-b1-runner.tests.mjs:4552-4639`
- Read-only evidence: `evals/skill-contracts/design-visual-m2-b1-v10-blocked.json`

**Interfaces:**
- Consumes: actual v10 plan output paths and the committed v10 blocked artifact.
- Produces: an actual-plan regression that requires all seven success outputs absent and the blocked output present with its exact tuple.

- [ ] **Step 1: Run the current focused historical test and observe the stale expectation**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; node --test --test-name-pattern='M2B1 actual v10 plan pins compacted event evidence' tests/design-visual-m2-b1-runner.tests.mjs
```

Expected: FAIL because the test currently calls `assertPathMissing` for the now-authoritative v10 blocked output.

- [ ] **Step 2: Replace only the stale output-absence loop**

Keep the seven success paths in an explicit allowlist and pin the blocked artifact separately:

```js
for (const key of [
  "designRaw", "designHandoff", "sampleARaw", "sampleAEnvelope",
  "sampleBRaw", "sampleBEnvelope", "summary",
]) {
  await assertPathMissing(path.join(ROOT, ...validated.outputs[key].split("/")));
}
const blockedBytes = await readFile(path.join(ROOT, ...validated.outputs.blocked.split("/")));
assert.equal(blockedBytes.byteLength, 2504);
assert.equal(
  digest(blockedBytes),
  "34a1cb1c5fdf7655aeab9f5f6df899c40ae8752cd93edd57061f95c29dcbfcd0",
);
```

- [ ] **Step 3: Verify the historical test is GREEN and the artifact is unchanged**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; node --test --test-name-pattern='M2B1 actual v10 plan pins compacted event evidence' tests/design-visual-m2-b1-runner.tests.mjs; $p='evals/skill-contracts/design-visual-m2-b1-v10-blocked.json'; $b=[System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $p)); if($b.Length -ne 2504){throw 'v10 blocked bytes drift'}; if((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne '34a1cb1c5fdf7655aeab9f5f6df899c40ae8752cd93edd57061f95c29dcbfcd0'){throw 'v10 blocked hash drift'}; git diff --check
```

Expected: focused test PASS, exact tuple match, diff check exit `0`.

- [ ] **Step 4: Commit the historical test correction**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; git add -- 'tests/design-visual-m2-b1-runner.tests.mjs'; git diff --cached --check; git commit -m 'test(evals): preserve v10 blocked outcome pin'
```

---

### Task 2: Create exact semantic evidence at the validator boundary

**Files:**
- Modify: `evals/support/run-design-visual-m2-b1.mjs:675-753`
- Test: `tests/design-visual-m2-b1-runner.tests.mjs:650-680`

**Interfaces:**
- Consumes: the three already-computed sample-a requirements inside `validateVisualM2B1Output`.
- Produces: a non-enumerable own-data error property named `semanticFailureEvidence` with the exact schema from the design spec.

- [ ] **Step 1: Add RED validator tests for both reachable failure shapes**

Add a helper expectation with this exact object shape:

```js
function expectedSemanticFailure({ complete = "UNVERIFIED" } = {}) {
  return {
    schemaVersion: 1,
    kind: "visual-bounded-outcome",
    candidateId: "sample-a",
    requiredOutcome: "applicable-visible-fail-and-aggregate-fail",
    predicates: {
      applicableVisibleAcceptanceFail: { expected: true, actual: false, matched: false },
      visibleAppearanceOverall: { expected: "FAIL", actual: "UNVERIFIED", matched: false },
      completeContractOverall: {
        expected: "FAIL",
        actual: complete,
        matched: complete === "FAIL",
      },
    },
    failedPredicateCount: complete === "FAIL" ? 2 : 3,
    rawOutputRetained: false,
  };
}
```

Test the ordinary no-defect sample-a fixture and a complete-only failure caused by changing the applicable `artifact-id` acceptance verdict to `FAIL` and `completeContractOverall` to `FAIL`. For each case, capture the thrown error and assert:

```js
assert.equal(error.message, "M2B1 sample-a lacks the bounded defect outcome");
assert.deepEqual(Object.getOwnPropertyDescriptor(error, "semanticFailureEvidence"), {
  configurable: true,
  enumerable: false,
  writable: true,
  value: expected,
});
assert.equal(Object.keys(error).includes("semanticFailureEvidence"), false);
```

Also assert the valid defect fixture returns successfully and has no error path.

- [ ] **Step 2: Run only the new validator tests and verify RED**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; node --test --test-name-pattern='semantic failure evidence at the validator boundary' tests/design-visual-m2-b1-runner.tests.mjs
```

Expected: FAIL because the error has no `semanticFailureEvidence` descriptor.

- [ ] **Step 3: Add the minimal internal evidence creator and attachment**

Near `aggregate`, add fixed constructors that use only local primitive values:

```js
function attachSemanticFailureEvidence(error, evidence) {
  Object.defineProperty(error, "semanticFailureEvidence", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: evidence,
  });
  return error;
}

function sampleASemanticFailureEvidence(applicableFail, visible, complete) {
  const applicableMatched = applicableFail === true;
  const visibleMatched = visible === "FAIL";
  const completeMatched = complete === "FAIL";
  return {
    schemaVersion: 1,
    kind: "visual-bounded-outcome",
    candidateId: "sample-a",
    requiredOutcome: "applicable-visible-fail-and-aggregate-fail",
    predicates: {
      applicableVisibleAcceptanceFail: {
        expected: true,
        actual: applicableFail,
        matched: applicableMatched,
      },
      visibleAppearanceOverall: { expected: "FAIL", actual: visible, matched: visibleMatched },
      completeContractOverall: { expected: "FAIL", actual: complete, matched: completeMatched },
    },
    failedPredicateCount: [applicableMatched, visibleMatched, completeMatched]
      .filter((matched) => !matched).length,
    rawOutputRetained: false,
  };
}
```

Replace the repeated first predicate expression in the sample-a gate with one local boolean and attach the evidence to the existing error:

```js
const applicableVisibleAcceptanceFail = acceptance.some((check) =>
  check.evidenceLayer === "visible-appearance" &&
  check.scopeMatch === "APPLICABLE" &&
  check.verdict === "FAIL");
if (!applicableVisibleAcceptanceFail || visible !== "FAIL" || complete !== "FAIL") {
  throw attachSemanticFailureEvidence(
    new Error("M2B1 sample-a lacks the bounded defect outcome"),
    sampleASemanticFailureEvidence(applicableVisibleAcceptanceFail, visible, complete),
  );
}
```

Do not alter sample-b, earlier validator checks, the returned value, or any exported signature.

- [ ] **Step 4: Verify validator GREEN and focused runner GREEN**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; node --test --test-name-pattern='semantic failure evidence at the validator boundary' tests/design-visual-m2-b1-runner.tests.mjs; node --test tests/design-visual-m2-b1-runner.tests.mjs; node --check evals/support/run-design-visual-m2-b1.mjs; git diff --check
```

Expected: all commands exit `0` with no failed tests.

- [ ] **Step 5: Commit the validator evidence boundary**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; git add -- 'evals/support/run-design-visual-m2-b1.mjs' 'tests/design-visual-m2-b1-runner.tests.mjs'; git diff --cached --check; git commit -m 'feat(evals): attach M2B1 semantic failure evidence'
```

---

### Task 3: Validate and persist semantic evidence in blocked artifacts

**Files:**
- Modify: `evals/support/run-design-visual-m2-b1.mjs:1332-1360, 1545-1650, 2203-2270, 3185-3224, 3296-3337`
- Test: `tests/design-visual-m2-b1-runner.tests.mjs`

**Interfaces:**
- Consumes: Task 2's non-enumerable `error.semanticFailureEvidence` and the existing `attachPostValidationFreshEvidence`, `safeDiagnosticOwnData`, `diagnosticProxy`, `safeBoundedClone`, and `retainEventCompaction` helpers.
- Produces: `retainSemanticFailureEvidence(value): object | null`, invocation-local exact-error provenance for the targeted validator failure, targeted post-validation process evidence, and optional blocked top-level `semanticFailureEvidence` independent of `partialEvidence`, `task1Prevalidation`, and `eventCompaction`.

- [ ] **Step 1: Add a RED full-run semantic failure test**

Wrap `successfulDependencies().runTurn` so the second returned result uses `visualOutput(designOutput(), "sample-a", false)` and recomputes `outputText`. Assert the run rejects with the existing message and the blocked write has:

```js
assert.deepEqual(blocked.semanticFailureEvidence, expectedSemanticFailure());
assert.deepEqual(blocked.eventCompaction, sampleAResult.eventCompaction);
assert.equal(Object.hasOwn(blocked, "task1Prevalidation"), false);
assert.deepEqual(blocked.completedSessions, ["design", "sample-a"]);
assert.equal(blocked.failedSession, 2);
assert.equal(dependencies.calls.length, 2);
assert.equal(dependencies.writes.filter(({ file }) => !file.endsWith("blocked.json")).length, 0);
```

Assert the existing bounded post-validation projection preserves `input.expectedLocalImageInputIndexes` as `[1, 2]`, the approved controller-image summary, App Server exit/stderr/image summaries, and its existing fixed retention/scaffolding fields. Assert it contains no raw events, output text, checks, or `observed` values; assert `eventCompaction` appears only at blocked top-level; and assert serialized blocked JSON omits the raw visual output and synthetic credential/path canaries.

- [ ] **Step 2: Add RED target-provenance and hostile retainer coverage**

Add a non-target malformed visual output case and assert it retains the existing error but gains neither `semanticFailureEvidence` nor post-validation `eventCompaction`.

Exercise `retainSemanticFailureEvidence` directly and table-drive these cases. Keep exact valid rebuilt records covering aggregate `actual` enums `PASS`, `FAIL`, and `UNVERIFIED` and consistent `failedPredicateCount` values `1`, `2`, and `3` as positive controls:

```js
const cases = [
  ["exact", (value) => value, true],
  ["extra", (value) => ({ ...value, rawPath: forbiddenPath }), false],
  ["missing top key", (value) => { delete value.kind; return value; }, false],
  ["missing predicates key", (value) => { delete value.predicates.visibleAppearanceOverall; return value; }, false],
  ["missing entry key", (value) => { delete value.predicates.completeContractOverall.matched; return value; }, false],
  ["wrong schema", (value) => { value.schemaVersion = 2; return value; }, false],
  ["wrong literal", (value) => { value.kind = "other"; return value; }, false],
  ["wrong expected boolean", (value) => { value.predicates.applicableVisibleAcceptanceFail.expected = false; return value; }, false],
  ["wrong expected enum", (value) => { value.predicates.visibleAppearanceOverall.expected = "PASS"; return value; }, false],
  ["wrong boolean", (value) => { value.predicates.applicableVisibleAcceptanceFail.actual = 1; return value; }, false],
  ["wrong enum", (value) => { value.predicates.visibleAppearanceOverall.actual = "NOT_APPLICABLE"; return value; }, false],
  ["wrong matched", (value) => { value.predicates.completeContractOverall.matched = true; return value; }, false],
  ["wrong count", (value) => { value.failedPredicateCount = 1; return value; }, false],
  ["fractional count", (value) => { value.failedPredicateCount = 2.5; return value; }, false],
  ["negative count", (value) => { value.failedPredicateCount = -1; return value; }, false],
  ["unsafe count", (value) => { value.failedPredicateCount = Number.MAX_SAFE_INTEGER + 1; return value; }, false],
  ["raw retained", (value) => { value.rawOutputRetained = true; return value; }, false],
  ["credential", (value) => { value.requiredOutcome = credentialCanary; return value; }, false],
  ["path", (value) => { value.candidateId = forbiddenPath; return value; }, false],
];
```

Add `null`, array, and function container cases plus own-field accessor, live proxy, revoked proxy, symbol-key, and oversized-extra-field cases at every untrusted object boundary: the top-level semantic object, `predicates`, and each of the three predicate entries. Include nested missing-key and extra-symbol cases as well as nested live/revoked proxies and accessors. Every hostile case must return `null` with trap count `0`; every valid result must be a newly rebuilt object; and every serialized result must omit all canaries.

Add a writer integration in which arbitrary `runTurn` code throws an error carrying an exact non-enumerable `semanticFailureEvidence` marker plus an independently valid `eventCompaction`. Assert the blocked artifact omits semantic evidence, preserves the valid event projection, omits `task1Prevalidation`, and contains no canary. This arbitrary-error case is the provenance RED driver: structural validity alone must never authorize persistence.

Add real target-validator blocked integrations for the reachable count-3 and count-2 sample-a outcomes. In the count-3 case, inject a credential canary into a valid `observed` field before rebuilding `outputText` and prove the raw test output contains it while blocked serialization does not. In the count-2 case, make `eventCompaction` invalid and prove the provenance-bound semantic projection survives independently while the event projection is omitted.

- [ ] **Step 3: Run the new integration/projection tests and verify RED**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; node --test --test-name-pattern='blocked semantic failure evidence|semantic failure retainer|non-target visual validator' tests/design-visual-m2-b1-runner.tests.mjs
```

Expected: FAIL because the writer accepts an arbitrary `runTurn` marker without target-validator provenance and the direct retainer test seam is not yet exported.

- [ ] **Step 4: Add exact-key constants and a fail-closed retainer**

Near the existing Task 1 and event-compaction retention constants, define the fixed key lists and enums. Implement `retainSemanticFailureEvidence(value)` using this order:

```js
if (diagnosticProxy(value) || !isObject(value)) return null;
// Reflect.ownKeys in try/catch; require exact top-level keys and no symbols.
// Read each field only through safeDiagnosticOwnData.
// Repeat proxy/exact-key/own-data checks for predicates and each predicate entry.
// Require fixed literals, strict booleans, fixed aggregate enum, matched consistency,
// a safe-integer failedPredicateCount in 1..3 equal to the false-matched count, and raw false.
const retained = { /* rebuild only fixed primitives */ };
try {
  return safeBoundedClone(retained, "semantic failure", 2 * 1024);
} catch {
  return null;
}
```

Do not spread, clone, enumerate, stringify, or hash untrusted semantic input before proxy and own-data validation. Return a newly built literal, never the source object.

- [ ] **Step 5: Bind only a valid target-validator marker to invocation-local provenance**

Wrap only the `validateVisualM2B1Output(parsed, design, candidate.id)` call:

```js
const validatedSemanticFailures = new WeakSet();

let output;
try {
  output = validateVisualM2B1Output(parsed, design, candidate.id);
} catch (error) {
  const semantic = safeDiagnosticOwnData(error, "semanticFailureEvidence");
  if (!semantic.found || retainSemanticFailureEvidence(semantic.value) === null) throw error;
  const validatedError = attachPostValidationFreshEvidence(error, visualResult, visualInput);
  validatedSemanticFailures.add(validatedError);
  throw validatedError;
}
```

Create the `WeakSet` inside each `runDesignVisualM2B1` invocation. Record only the exact error object thrown by the actual sample-a validator, and only after its own-data marker passes the fail-closed retainer. This preserves current propagation for JSON parse, handoff, shape, transfer, aggregate-consistency, sample-b, and arbitrary `runTurn` errors. Do not call `retainTask1Evidence` earlier and do not synthesize `task1Prevalidation`.

- [ ] **Step 6: Project only provenance-bound semantic evidence independently**

Immediately before building `blocked`, require the exact error identity in the invocation-local provenance set before reading its marker, then independently revalidate and rebuild it:

```js
const semanticFailureProperty = validatedSemanticFailures.has(error)
  ? safeDiagnosticOwnData(error, "semanticFailureEvidence")
  : { found: false, value: undefined };
const semanticFailureEvidence = semanticFailureProperty.found
  ? retainSemanticFailureEvidence(semanticFailureProperty.value)
  : null;
```

Add it at blocked top-level independently:

```js
...(semanticFailureEvidence === null ? {} : { semanticFailureEvidence }),
```

Arbitrary earlier or `runTurn` errors must omit semantic evidence even when they carry an exact-looking non-enumerable marker. Keep `partialEvidence`, `task1Prevalidation`, `eventCompaction`, cleanup, artifact privacy checking, and write order unchanged.

- [ ] **Step 7: Verify the new tests and the complete focused runner suite**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; node --test --test-name-pattern='semantic failure' tests/design-visual-m2-b1-runner.tests.mjs; node --test tests/design-visual-m2-b1-runner.tests.mjs; node --check evals/support/run-design-visual-m2-b1.mjs; git diff --check
```

Expected: all commands exit `0`, valid projection retained, hostile projections omitted, no raw canary retained.

- [ ] **Step 8: Commit blocked semantic retention**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; git add -- 'evals/support/run-design-visual-m2-b1.mjs' 'tests/design-visual-m2-b1-runner.tests.mjs'; git diff --cached --check; git commit -m 'feat(evals): retain M2B1 semantic failure evidence'
```

---

### Task 4: Full verification, independent review, and delivery boundary

**Files:**
- Verify: `evals/support/run-design-visual-m2-b1.mjs`
- Verify: `tests/design-visual-m2-b1-runner.tests.mjs`
- Verify unchanged: `evals/support/run-fresh-evaluator-turn.mjs`
- Verify unchanged: `evals/support/collect-codex-app-server.mjs`
- Verify unchanged: `evals/skill-contracts/design-visual-m2-b1-smoke-plan-v10.json`
- Verify unchanged: `evals/skill-contracts/design-visual-m2-b1-v10-blocked.json`
- Verify unchanged: `evals/skill-contracts/design-visual-m2-attempt-index-v12.json`
- Verify unchanged: `TASKS.md`
- Verify unchanged: `vendor/source-manifest.json`

**Interfaces:**
- Consumes: all commits from Tasks 1-3.
- Produces: fresh test evidence, byte-identity evidence for historical artifacts, an independent Critical/Important review, and a clean branch ready for the separately authorized generation 11 phase.

- [ ] **Step 1: Run the complete related test suite and syntax checks**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; node --test tests/codex-app-server-collector.tests.mjs tests/fresh-evaluator-turn.tests.mjs tests/design-visual-m2-b1-runner.tests.mjs; node --check evals/support/run-design-visual-m2-b1.mjs; node --check evals/support/run-fresh-evaluator-turn.mjs; node --check evals/support/collect-codex-app-server.mjs; git diff --check
```

Expected: exit `0`, zero failed tests, no syntax or whitespace errors.

- [ ] **Step 2: Verify historical and forbidden-file boundaries**

Run a read-only Node or PowerShell check that asserts:

```text
v10 plan        5674 / 9f3df46fd0e9ca2544d3ec29cab1251fa0b7c697214c693a2c94a498848bfbe0
v10 blocked     2504 / 34a1cb1c5fdf7655aeab9f5f6df899c40ae8752cd93edd57061f95c29dcbfcd0
v12 receipt     9294 / a9a33783af85215dafe11a67f6e1a642290fa98f669379ef81ed036fcd1c1fc3
```

Compare the full Task 1-3 commit range. Require Task 1 to modify only `tests/design-visual-m2-b1-runner.tests.mjs`, and require Tasks 2-3 to modify only `evals/support/run-design-visual-m2-b1.mjs` plus that runner test. Confirm there is no diff in adapter, collector, v10 plan/history, `TASKS.md`, or manifest. Confirm all seven v10 success outputs remain absent and the blocked output remains present. Do not inspect or delete broad temp baselines in this no-live phase.

- [ ] **Step 3: Request independent code review**

Dispatch a read-only reviewer with the design spec, implementation plan, base SHA before Task 2, and current HEAD. Require explicit Critical/Important findings for:

```text
exact schema and type/count invariants
proxy/accessor trap safety
raw output/path/credential exclusion
target-only post-validation catch
eventCompaction retention and task1Prevalidation absence
success-path and historical-contract invariance
no live/retry/generation11 scope drift
```

Fix every valid Critical or Important finding with a new RED → GREEN cycle and a focused commit, then rerun Steps 1-2 and request a final READY review.

- [ ] **Step 4: Verify final repository state**

```powershell
$ErrorActionPreference='Stop'; Set-Location -LiteralPath 'D:\JOEWRKS\작업하네스\.worktrees\joeness-interface'; git status --short; git log -6 --oneline
```

Expected: clean worktree; no live-result, generation 11, TASKS, or manifest commit.

- [ ] **Step 5: Deliver the required Korean explanation**

Begin with the outcome and completed verification: report the exact fresh combined-suite pass count with zero failures, syntax/diff-check exit `0`, all three historical tuples from Step 2, clean worktree status, and the final independent reviewer `READY` with zero Critical/Important findings. Then report these three groups without promoting M2B1:

```text
달라진 점: 앞으로 같은 sample-a 의미 실패가 나면 세 조건의 기대값·실제값·일치 여부와 안전한 과정 요약이 차단 기록에 남는다.
그대로인 점: 평가 질문·판정 규칙·512/128 한도·재시도 금지·기존 v10 기록·승격 상태는 변하지 않았다.
남은 작업: generation 11 지원/고정 계획 → clean preflight → 별도 승인된 실시간 1회 → 결과 영수증, 이후 별도 M2B2 런타임 증거와 사용자 수락 경계가 남는다.
```

Link the exact current design spec and implementation plan. Do not claim the missing v10 predicate was recovered, do not authorize another live attempt, and do not update promotion or manifest state.
