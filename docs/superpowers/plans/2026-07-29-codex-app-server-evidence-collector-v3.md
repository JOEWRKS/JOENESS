# Codex App Server Evidence Collector v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v2를 재실행하지 않고 수정된 Collector로 두 P0 case를 각각 한 번 실행해 독립 v3 capability evidence를 만든다.

**Architecture:** 기존 단일 Collector 흐름을 복제하지 않고 immutable v3 run configuration으로 mode, run ID와 result path만 주입한다. `run-v2` CLI는 제거하고 `smoke|run-v3`만 허용한다. 오프라인 TDD와 host model-free smoke가 통과한 뒤 v3 one-shot을 한 번 실행하고 evidence 불변 review를 기록한다.

**Tech Stack:** Node.js 26.3.0 ESM, `node:test`, PowerShell P0 계약, Codex standalone CLI `0.145.0`

## Global Constraints

- Authority: `docs/superpowers/specs/2026-07-29-codex-app-server-evidence-collector-v3-design.md`
- `evals/p0/baseline-capability-spike-v2.json`은 읽기 전용 역사 증거이며 수정·삭제·재생성하지 않는다.
- `run-v2`, retry, resume, force, overwrite와 v2/v3 합성 판정을 만들지 않는다.
- frozen case, prompt, rubric, dynamic tool와 permission profile을 변경하지 않는다.
- 새 dependency나 Collector 복사본을 만들지 않는다.
- production code 전에 실제 동작을 검사하는 RED test를 실행한다.
- live v3는 구현 commit과 model-free smoke 뒤 정확히 한 번만 실행한다.
- Git 명령은 항상 `git -C "D:\JOEWRKS\작업하네스"`로 대상 저장소를 고정하고 `README.md`를 stage하지 않는다.

---

### Task 1: Versioned one-shot routing

**Files:**
- Modify: `tests/codex-app-server-collector.tests.mjs`
- Modify: `evals/support/collect-codex-app-server.mjs`

**Interfaces:**
- Produces: `runConfigurationForMode(mode)` returning the frozen v3 mode/run/result identity
- Consumes: existing `parseCli`, `createExclusiveRunRoot`, `captureExecutionGate`, `caseEventIsAdmissible`, `writeResultExclusive`

- [ ] **Step 1: Write the failing lifecycle, mode and identity tests**

Add a result-level regression that inserts the normalized completed
`userMessage` without text and `account/rateLimits/updated` into complete
pass evidence, then expects `validateResult` not to throw. Change the CLI test
and add:

```js
test("run-v3 has an immutable independent one-shot identity", async () => {
  const collector = await import(
    "../evals/support/collect-codex-app-server.mjs"
  );
  assert.equal(typeof collector.runConfigurationForMode, "function");
  const config = collector.runConfigurationForMode("run-v3");
  assert.deepEqual(
    {
      mode: config.mode,
      runId: config.runId,
      resultRelativePath: config.resultRelativePath,
      resultFile: path.basename(config.resultPath),
    },
    {
      mode: "run-v3",
      runId: "v3",
      resultRelativePath: "evals/p0/baseline-capability-spike-v3.json",
      resultFile: "baseline-capability-spike-v3.json",
    },
  );
  assert.equal(Object.isFrozen(config), true);
  assert.throws(
    () => collector.runConfigurationForMode("run-v2"),
    /unsupported live run mode/,
  );
});

test("CLI accepts only one explicit smoke or run-v3 mode", () => {
  assert.deepEqual(parseCli(["smoke"]), { mode: "smoke" });
  assert.deepEqual(parseCli(["run-v3"]), { mode: "run-v3" });
  for (const argv of [
    [],
    ["run-v2"],
    ["resume"],
    ["--force"],
    ["smoke", "--force"],
    ["run-v3", "extra"],
  ]) {
    assert.throws(
      () => parseCli(argv),
      /usage: node evals\/support\/collect-codex-app-server\.mjs <smoke\|run-v3>/,
    );
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --test-name-pattern "run-v3 has|CLI accepts|passive user input lifecycle" tests/codex-app-server-collector.tests.mjs
```

Expected: three failures because the final validator still rejects the passive
user lifecycle event, `runConfigurationForMode` is absent and `run-v3` is
rejected.

- [ ] **Step 3: Implement the minimal configuration and shared runner**

Replace the live mode parsing with:

```js
export function parseCli(argv) {
  if (
    argv.length === 1 &&
    (argv[0] === "smoke" || argv[0] === "run-v3")
  ) {
    return { mode: argv[0] };
  }
  throw new Error(
    "usage: node evals/support/collect-codex-app-server.mjs <smoke|run-v3>",
  );
}
```

At the existing result constants, add the single live configuration:

```js
const RUN_V3_RESULT_RELATIVE_PATH =
  "evals/p0/baseline-capability-spike-v3.json";
const RUN_V3_CONFIGURATION = Object.freeze({
  mode: "run-v3",
  runId: "v3",
  resultRelativePath: RUN_V3_RESULT_RELATIVE_PATH,
  resultPath: path.join(
    REPOSITORY_ROOT,
    ...RUN_V3_RESULT_RELATIVE_PATH.split("/"),
  ),
});

export function runConfigurationForMode(mode) {
  if (mode !== RUN_V3_CONFIGURATION.mode) {
    throw new Error(`unsupported live run mode: ${mode}`);
  }
  return RUN_V3_CONFIGURATION;
}
```

Change only the version-specific seams:

```js
async function captureExecutionGate(configuration = null) {
  if (configuration !== null) {
    await pathMustNotExist(
      configuration.resultPath,
      `${configuration.runId} result`,
    );
  }
  // existing gate body unchanged
}

async function runConfiguredEvaluation(configuration) {
  const gateBefore = await captureExecutionGate(configuration);
  const { mode, runId, resultPath } = configuration;
  const runRoot = await createExclusiveRunRoot(runId);
  // existing run body unchanged
  await writeResultExclusive(resultPath, result);
  // stdout uses mode and resultPath
}

async function main(argv) {
  const { mode } = parseCli(argv);
  if (mode === "smoke") {
    await runSmoke();
  } else {
    await runConfiguredEvaluation(runConfigurationForMode(mode));
  }
}
```

In `caseEventIsAdmissible`, keep completed `agentMessage` text mandatory but
accept a completed `userMessage` without text, matching `normalizeEvent`.
Change `runSmoke()` to call `captureExecutionGate()` without a live
configuration.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
node --test --test-name-pattern "run-v3 has|CLI accepts|passive user input lifecycle" tests/codex-app-server-collector.tests.mjs
```

Expected: 3 tests pass.

- [ ] **Step 5: Run full offline verification**

Run:

```powershell
node --check evals/support/collect-codex-app-server.mjs
node --test tests/codex-app-server-collector.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\JOEWRKS\작업하네스\tests\p0-evaluation-contract.tests.ps1"
node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { validateResult } from 'file:///D:/JOEWRKS/%EC%9E%91%EC%97%85%ED%95%98%EB%84%A4%EC%8A%A4/evals/support/collect-codex-app-server.mjs'; const result=JSON.parse(await readFile('D:/JOEWRKS/작업하네스/evals/p0/baseline-capability-spike-v2.json','utf8')); validateResult(result); if (result.runId !== 'v2') throw new Error('historical runId drift'); console.log('PASS: v2 preserved');"
git -C "D:\JOEWRKS\작업하네스" diff HEAD --exit-code -- evals/p0/baseline-capability-spike-v2.json
git -C "D:\JOEWRKS\작업하네스" diff --check
git -C "D:\JOEWRKS\작업하네스" status --short --untracked-files=all
```

Expected: all tests pass; v2 remains valid; only intended source/tests/docs plus the preserved untracked `README.md` appear.

- [ ] **Step 6: Commit implementation without README**

```powershell
git -C "D:\JOEWRKS\작업하네스" add -- evals/support/collect-codex-app-server.mjs tests/codex-app-server-collector.tests.mjs docs/superpowers/specs/2026-07-29-codex-app-server-evidence-collector-v3-design.md docs/superpowers/plans/2026-07-29-codex-app-server-evidence-collector-v3.md
git -C "D:\JOEWRKS\작업하네스" diff --cached --check
git -C "D:\JOEWRKS\작업하네스" commit -m "feat: add Collector v3 one-shot mode"
```

### Task 2: Model-free host smoke

**Files:**
- Verify only; no result file is created

**Interfaces:**
- Consumes: committed Task 1 Collector
- Produces: host smoke verdict for the exact implementation HEAD

- [ ] **Step 1: Confirm live preconditions**

Run:

```powershell
git -C "D:\JOEWRKS\작업하네스" status --short --untracked-files=all
Test-Path "D:\JOEWRKS\작업하네스\evals\p0\baseline-capability-spike-v3.json"
Test-Path (Join-Path ([System.IO.Path]::GetTempPath()) "joewrks-eval-v3")
```

Expected: only `?? README.md`; v3 result path and fixed v3 temp root are
`False`. Never delete a pre-existing fixed v3 root automatically; investigate
and stop.

- [ ] **Step 2: Run model-free smoke once**

```powershell
node "D:\JOEWRKS\작업하네스\evals\support\collect-codex-app-server.mjs" smoke
```

Expected: smoke `pass`, no model turn, no v3 result, repository/config unchanged.

- [ ] **Step 3: Reconfirm unchanged state**

Run the Step 1 commands again. Any change other than a Collector-owned diagnostic blocks Task 3.

### Task 3: v3 one-shot evidence and review

**Files:**
- Create once: `evals/p0/baseline-capability-spike-v3.json`
- Modify after execution: only that file's `review` object

**Interfaces:**
- Consumes: committed Collector, frozen cases, successful Task 2 smoke
- Produces: reviewed v3 capability verdict with immutable evidence hash

- [ ] **Step 1: Run v3 exactly once**

```powershell
node "D:\JOEWRKS\작업하네스\evals\support\collect-codex-app-server.mjs" run-v3
```

Never run this command again under the v3 specification, regardless of result.

- [ ] **Step 2: Obtain one read-only independent review**

The reviewer must read the v3 design, this plan, frozen cases and result, modify nothing, and return:

```text
Spec compliance: approved or issues
Evidence fidelity: approved or issues
pressure-08 judgment: pass or fail with reasons and existing /evidence/cases/0 JSON Pointers
p0-02 judgment: pass or fail with reasons and existing /evidence/cases/1 JSON Pointers
Capability verdict: pass or blocked
Critical/Important/Minor findings
```

- [ ] **Step 3: Change only review and validate**

Keep `evidence` and `evidenceSha256` byte-equivalent. Set `review.status` to `complete`, record exactly one `pass|fail` judgment for each case with nonempty reasons and existing pointers, and set capability to `pass` only when `validateResult` permits it.

Run:

```powershell
node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { validateResult } from 'file:///D:/JOEWRKS/%EC%9E%91%EC%97%85%ED%95%98%EB%84%A4%EC%8A%A4/evals/support/collect-codex-app-server.mjs'; const result=JSON.parse(await readFile('D:/JOEWRKS/작업하네스/evals/p0/baseline-capability-spike-v3.json','utf8')); if (result.runId !== 'v3') throw new Error('unexpected runId'); validateResult(result); console.log('PASS: v3 result integrity', result.evidenceSha256, result.review.capabilityVerdict);"
```

- [ ] **Step 4: Commit only the reviewed result**

```powershell
git -C "D:\JOEWRKS\작업하네스" add -- evals/p0/baseline-capability-spike-v3.json
git -C "D:\JOEWRKS\작업하네스" diff --cached --check
git -C "D:\JOEWRKS\작업하네스" commit -m "test: record App Server P0 v3 evidence"
```

- [ ] **Step 5: Final verification**

```powershell
node --test tests/codex-app-server-collector.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\JOEWRKS\작업하네스\tests\p0-evaluation-contract.tests.ps1"
git -C "D:\JOEWRKS\작업하네스" diff --check
git -C "D:\JOEWRKS\작업하네스" status --short --untracked-files=all
git -C "D:\JOEWRKS\작업하네스" log --oneline -6
```

Expected: tests pass, only preserved `?? README.md` remains, and v3 result is committed.

If capability is `pass`, transition to a separately planned no-harness/full baseline and common-core materialization stage. If `blocked`, preserve the evidence and write a new design before any further live run.
