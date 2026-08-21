# M4 v10 Raw-Free Fixed-Enum Diagnostic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated, raw-free fixed-enum diagnostic to the M4 fresh-turn blocked path so a future v10 attempt can distinguish bounded failure phases without changing evaluation behavior or rewriting v9 evidence.

**Architecture:** The fresh adapter brands only a fixed `failurePhase` in a module-private `WeakMap`. The role adapter adds a fixed `lastAuxiliaryMethod`, validates the phase/method pair, and emits schema-2 blocked evidence. The Task-B runner and live wrapper strictly project that schema while retaining exact schema-1 v9 rebuild compatibility.

**Tech Stack:** Node.js ES modules, `node:test`, strict own-data validation, module-private `WeakMap`/`WeakSet` authenticity, canonical JSON, Git source-tuple and topology checks.

## Global Constraints

- Authoritative design: `docs/superpowers/specs/2026-08-15-m4-v10-fixed-enum-diagnostic-design.md`, committed at `85f7eaf94998e7ce7eb9218a9500d97c86e40d4e`.
- The execution starting commit is the commit that adds this plan. Capture it with `git rev-parse HEAD` before editing and require a clean status.
- The implementation support commit must be the direct child of that captured starting commit and contain exactly eight modified files: four sources and four tests listed below.
- Do not make intermediate implementation commits. Use RED/GREEN review checkpoints in the working tree, then create one reviewed support commit. This preserves the direct-parent topology required by the future execution-boundary verifier.
- Do not edit the collector, any v9 plan/artifact/index, TASKS, the routing-policy spec, Core, manifest, configuration, fixtures, or plugin state.
- Persist no exception message, cause, detail, arbitrary method name, MCP response, event, output, path, PID, stderr, digest, or configuration content in the new diagnostic.
- Preserve top-level blocked cause `role-separated-adapter-rejection` / `BLOCKED_ROLE_SEPARATED_ADAPTER`, every semantic result boundary, and all cleanup/publication gates.
- The v9 blocked artifact remains exactly 7,381 bytes / SHA-256 `941c8aea5c04762cbb01359dcc9c5c731f5f29ee05508ca991ade44d6b4a7cd9` and must rebuild through the live wrapper without change.
- No App Server, model, preflight, protocol probe, or live command is authorized by this implementation plan.

---

### Task 1: Brand fixed failure phases in the fresh adapter

**Files:**
- Modify: `evals/support/run-fresh-evaluator-turn.mjs:912-940,943-1802`
- Test: `tests/fresh-evaluator-turn.tests.mjs:88-430,2313-2465`

**Interfaces:**
- Produces: `FRESH_EVALUATOR_FAILURE_PHASES: readonly string[]`
- Produces: `projectFreshEvaluatorFailureDiagnostic(error): {schemaVersion: 1, failurePhase: string} | null`
- Consumes later: the role adapter calls the projector only on the error rejected by `runFreshEvaluatorTurn`.

- [ ] **Step 1: Add the projector test helper and fixed enum RED**

Add a helper that returns the rejected error rather than its legacy diagnostic payload:

```js
async function rejectedFailure(promise) {
  let observed;
  await assert.rejects(promise, (error) => {
    observed = error;
    return error?.freshEvaluatorEvidence !== undefined;
  });
  return observed;
}
```

Add a test asserting the exact ordered public enum and the missing projector:

```js
test("fresh evaluator exposes the closed raw-free failure-phase projector", async () => {
  const subject = await loadSubject();
  assert.deepEqual(subject.FRESH_EVALUATOR_FAILURE_PHASES, [
    "terminal-timeout",
    "agent-message-delta-overflow",
    "mcp-status-collection",
    "mcp-runtime-inertness",
    "session-close",
    "session-cleanup",
    "event-compaction",
    "post-runtime-validation",
    "final-agent-text",
    "structured-output-parse",
    "unmapped",
  ]);
  assert.equal(typeof subject.projectFreshEvaluatorFailureDiagnostic, "function");
  assert.equal(subject.projectFreshEvaluatorFailureDiagnostic(new Error("forged")), null);
});
```

- [ ] **Step 2: Run the fixed-enum RED**

Run:

```powershell
node --test --test-name-pattern="closed raw-free failure-phase projector" tests/fresh-evaluator-turn.tests.mjs
```

Expected: FAIL because `FRESH_EVALUATOR_FAILURE_PHASES` and `projectFreshEvaluatorFailureDiagnostic` are absent.

- [ ] **Step 3: Add six deterministic phase RED cases**

Extend `createSession` with own-data fixture options `mcpInventory`, `mcpAfterResponse`, and `closeError`. Keep defaults equivalent to the current fixture. Add tests that obtain the rejected error, call the projector, and compare an exact two-key object:

```js
assert.deepEqual(subject.projectFreshEvaluatorFailureDiagnostic(failure), {
  schemaVersion: 1,
  failurePhase: "structured-output-parse",
});
```

Cover these exact cases:

1. `omitTerminal: true`, `turnTimeoutMs: 1` -> `terminal-timeout`; assert one `turn/interrupt` request.
2. Emit 4,097 agent-message delta fragments before completion -> `agent-message-delta-overflow`; assert one `turn/interrupt` request.
3. `mcpAfterResponse: {}` -> `mcp-status-collection`.
4. `mcpInventory: [{name: "fixture-active"}]` with `mcpAfterResponse` equal to the raw response below -> `mcp-runtime-inertness`:

```js
{
  data: [{
    name: "fixture-active",
    authStatus: "notLoggedIn",
    tools: { forbidden: {} },
    resources: [],
    resourceTemplates: [],
    serverInfo: null,
  }],
  nextCursor: null,
}
```
5. `finalText: ""` with valid empty MCP status -> `final-agent-text`.
6. `finalText: "PRIVATE-NON-JSON-CANARY"` with valid empty MCP status -> `structured-output-parse`.

For every case assert the serialized projector result excludes the raw canary, fixture root, and legacy `primaryCause` content.

- [ ] **Step 4: Run the six-phase RED matrix**

Run:

```powershell
node --test --test-name-pattern="failure phase|terminal-timeout|delta-overflow|mcp-status|final-agent-text|structured-output-parse" tests/fresh-evaluator-turn.tests.mjs
```

Expected: FAIL because rejected failures are not identity-branded with a phase.

- [ ] **Step 5: Implement the private phase brand and projector**

Add the exact enum, a private `Set`, and a private `WeakMap` near the existing constants:

```js
export const FRESH_EVALUATOR_FAILURE_PHASES = Object.freeze([
  "terminal-timeout",
  "agent-message-delta-overflow",
  "mcp-status-collection",
  "mcp-runtime-inertness",
  "session-close",
  "session-cleanup",
  "event-compaction",
  "post-runtime-validation",
  "final-agent-text",
  "structured-output-parse",
  "unmapped",
]);
const FRESH_EVALUATOR_FAILURE_PHASE_SET = new Set(FRESH_EVALUATOR_FAILURE_PHASES);
const FRESH_EVALUATOR_FAILURE_DIAGNOSTICS = new WeakMap();

export function projectFreshEvaluatorFailureDiagnostic(error) {
  if (error === null || (typeof error !== "object" && typeof error !== "function")) {
    return null;
  }
  const diagnostic = FRESH_EVALUATOR_FAILURE_DIAGNOSTICS.get(error);
  return diagnostic === undefined
    ? null
    : { schemaVersion: 1, failurePhase: diagnostic.failurePhase };
}
```

Change `attachEvidence` to accept a phase, normalize it through the fixed set, brand the newly created outer failure, and retain the legacy `freshEvaluatorEvidence` behavior unchanged:

```js
function attachEvidence(error, evidence, failurePhase = "unmapped") {
  const primaryCause = {};
  for (const key of ["name", "code", "message", "details"]) {
    const property = diagnosticOwnData(error, key);
    if (property.found) {
      primaryCause[key] = sanitizeDiagnosticEvidence(property.value);
    }
  }
  if (Object.keys(primaryCause).length > 0) {
    evidence.primaryCause = primaryCause;
  }
  const failure = new Error("fresh evaluator turn validation failed", { cause: error });
  failure.freshEvaluatorEvidence = evidence;
  FRESH_EVALUATOR_FAILURE_DIAGNOSTICS.set(failure, {
    schemaVersion: 1,
    failurePhase: FRESH_EVALUATOR_FAILURE_PHASE_SET.has(failurePhase)
      ? failurePhase
      : "unmapped",
  });
  return failure;
}
```

Track `activeFailurePhase` and `primaryFailurePhase`. Set the active phase immediately before each bounded operation and copy it in the main catch. Set `event-compaction`, `session-close`, `session-cleanup`, or `post-runtime-validation` only when no earlier primary phase exists. Split final text extraction and JSON parsing into separate catches:

```js
let outputText;
try {
  outputText = finalAgentText(terminalAgentMessage);
} catch (error) {
  throw attachEvidence(error, evidence, "final-agent-text");
}
let output;
try {
  output = JSON.parse(outputText);
} catch (error) {
  throw attachEvidence(error, evidence, "structured-output-parse");
}
```

- [ ] **Step 6: Add hostile projector tests**

Prove that an ordinary forged error, proxy, revoked proxy, accessor-bearing object, symbol-bearing object, and primitive all return `null` without invoking traps. Prove the projector returns a fresh object on repeated calls and that mutating the first projection does not alter the second.

- [ ] **Step 7: Run fresh-adapter GREEN and full regression**

Run:

```powershell
node --test --test-name-pattern="failure phase|projector|terminal-timeout|delta-overflow|mcp-status|final-agent-text|structured-output-parse" tests/fresh-evaluator-turn.tests.mjs
node --test tests/fresh-evaluator-turn.tests.mjs
node --check evals/support/run-fresh-evaluator-turn.mjs
```

Expected: all PASS. Preserve the RED and GREEN command outputs in the execution handoff; do not commit.

---

### Task 2: Add role-adapter method attribution and schema-2 blocked evidence

**Files:**
- Modify: `evals/support/run-authority-role-separated-evaluator-turn.mjs:5-12,26-57,566-576,588-894`
- Test: `tests/authority-role-separated-evaluator-turn.tests.mjs:88-203,749-918`

**Interfaces:**
- Consumes: `projectFreshEvaluatorFailureDiagnostic(error)` from Task 1.
- Produces: `AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHODS: readonly string[]`.
- Produces: schema-2 `authorityRoleSeparatedEvidence` with exact nested `diagnostic`.

- [ ] **Step 1: Add schema-2 and auxiliary mapping RED cases**

Update the API test to assert the exact method enum:

```js
assert.deepEqual(subject.AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHODS, [
  "none",
  "turn-interrupt",
  "mcp-server-status-list",
  "unmapped",
]);
```

Add three authentic blocked cases:

- 4,097 deltas -> adapter schema 2, phase `agent-message-delta-overflow`, method `turn-interrupt`.
- Malformed `mcpServerStatus/list` response -> phase `mcp-status-collection`, method `mcp-server-status-list`.
- Non-JSON final agent text -> phase `structured-output-parse`, method `mcp-server-status-list`.

For each case assert exact key order for adapter evidence and its nested diagnostic, exact six false privacy fields, session close count 1, and absence of raw canaries.

- [ ] **Step 2: Run role-adapter RED**

Run:

```powershell
node --test --test-name-pattern="schema-2 diagnostic|auxiliary method|delta-overflow|mcp-status|structured-output-parse" tests/authority-role-separated-evaluator-turn.tests.mjs
```

Expected: FAIL because blocked evidence is schema 1 and has no diagnostic.

- [ ] **Step 3: Implement fixed method mapping and combination validation**

Import the projector with `runFreshEvaluatorTurn`. Add the exact public method enum and private set. Add these module-private helpers:

```js
function mappedAuxiliaryMethod(method) {
  if (method === "turn/interrupt") return "turn-interrupt";
  if (method === "mcpServerStatus/list") return "mcp-server-status-list";
  return "unmapped";
}

function diagnosticCombinationIsValid(stage, failurePhase, lastAuxiliaryMethod) {
  if (!FRESH_EVALUATOR_FAILURE_PHASE_SET.has(failurePhase)) return false;
  if (!AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHOD_SET.has(lastAuxiliaryMethod)) {
    return false;
  }
  if (
    ["before-auxiliary-request", "after-auxiliary-request"].includes(stage) &&
    lastAuxiliaryMethod === "none"
  ) {
    return false;
  }
  if (["terminal-timeout", "agent-message-delta-overflow"].includes(failurePhase)) {
    return lastAuxiliaryMethod === "turn-interrupt";
  }
  if ([
    "mcp-status-collection",
    "mcp-runtime-inertness",
    "final-agent-text",
    "structured-output-parse",
  ].includes(failurePhase)) {
    return lastAuxiliaryMethod === "mcp-server-status-list";
  }
  return AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHOD_SET.has(lastAuxiliaryMethod);
}
```

Initialize `lastAuxiliaryMethod = "none"` next to the stage, assign the mapped value before every auxiliary transport call, and capture the caught error:

```js
} catch (error) {
  const projected = projectFreshEvaluatorFailureDiagnostic(error);
  const failurePhase = projected?.failurePhase ?? "unmapped";
  const method = lastAuxiliaryMethod;
  stage = stage === "complete" ? "post-validation" : stage;
  try {
    await closeOnce();
  } catch {
    stage = "session-cleanup";
  }
  if (closeStarted && sessionControl !== null) {
    try {
      if (readCapturedGetter(sessionControl, "processExitCode") === null) {
        stage = "session-cleanup";
      }
    } catch {
      stage = "session-cleanup";
    }
  }
  throw roleSeparatedError(stage, closeCount, failurePhase, method);
}
```

Change `roleSeparatedError` to reject invalid pairs and emit exact schema-2 evidence with the six existing privacy fields and the fixed provenance literal. Never pass the caught error to `roleSeparatedError`.

- [ ] **Step 4: Add invalid-pair and raw-canary security RED/GREEN cases**

Exercise ordinary forged diagnostic-looking errors, proxy/revoked-proxy responses, response accessors, and unexpected auxiliary methods. Assert no traps, raw methods, canaries, response contents, roots, or error text occur in serialized evidence. Early pre-thread failures must emit `failurePhase: "unmapped"` and `lastAuxiliaryMethod: "none"`. Invalid phase/method combinations are constructed and rejected at the runner and live-wrapper reconstruction boundaries in Tasks 3 and 4.

- [ ] **Step 5: Run role-adapter GREEN and regression**

Run:

```powershell
node --test --test-name-pattern="schema-2 diagnostic|auxiliary method|delta-overflow|mcp-status|structured-output-parse|raw-free" tests/authority-role-separated-evaluator-turn.tests.mjs
node --test tests/authority-role-separated-evaluator-turn.tests.mjs
node --check evals/support/run-authority-role-separated-evaluator-turn.mjs
```

Expected: all PASS. Preserve the command outputs in the execution handoff; do not commit.

---

### Task 3: Project authenticated schema-2 failures through the Task-B runner

**Files:**
- Modify: `evals/support/run-joeness-m4-direct-user-delegation-eval.mjs:7-10,127-157,1185-1241`
- Test: `tests/joeness-m4-direct-user-delegation-eval.tests.mjs:139-330,1098-1144`

**Interfaces:**
- Consumes: schema-2 `authorityRoleSeparatedEvidence` from Task 2.
- Produces: schema-2 `freshFailure` with exact nested adapter diagnostic.
- Preserves: the existing `AUTHENTIC_ADAPTER_ERRORS` gate and top-level blocked receipt.

- [ ] **Step 1: Add authentic schema-2 runner RED**

Extend the authentic adapter-rejection test with a malformed final JSON path that uses the imported role adapter. Assert this exact diagnostic:

```js
assert.deepEqual(calls.writes[0].value.freshFailure.adapter.diagnostic, {
  schemaVersion: 1,
  provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
  failurePhase: "structured-output-parse",
  lastAuxiliaryMethod: "mcp-server-status-list",
});
```

Assert `freshFailure.schemaVersion === 2`, `adapter.schemaVersion === 2`, exact key order, serialized size within the current bound, one blocked write, no evidence write, and no final-text canary.

- [ ] **Step 2: Run runner RED**

Run:

```powershell
node --test --test-name-pattern="authentic adapter rejection.*schema-2|fixed-enum diagnostic" tests/joeness-m4-direct-user-delegation-eval.tests.mjs
```

Expected: FAIL because the runner projector only accepts schema 1.

- [ ] **Step 3: Implement exact schema-2 projection**

Import `AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHODS` from `run-authority-role-separated-evaluator-turn.mjs` alongside the existing adapter imports. Import `FRESH_EVALUATOR_FAILURE_PHASES` directly from `run-fresh-evaluator-turn.mjs`; this creates no cycle because the fresh adapter does not import the runner. Build private sets from those two frozen arrays, add the exact diagnostic keys, and implement the same stage/phase/method validator from Task 2. Update `projectJoenessM4DirectUserDelegationFreshFailure` to require:

```js
[
  "schemaVersion",
  "adapterId",
  "status",
  "stage",
  "sessionCloseCount",
  "diagnostic",
  "privacy",
]
```

Require role evidence schema 2, exact six false adapter privacy fields, exact diagnostic provenance, fixed enums, and valid combination. Return the exact schema-2 `freshFailure` shape from the design. Keep `AUTHENTIC_ADAPTER_ERRORS.has(error)` load-bearing and return `null` for any malformed or unauthenticated value.

- [ ] **Step 4: Add authenticity and downgrade security cases**

Prove matching-looking ordinary errors, proxies, revoked proxies, accessors, extra keys, reordered keys, symbols, invalid enums, and invalid pairs cannot mint `freshFailure`. In a full runner call, malformed detailed evidence must become generic `evaluation-failed` or no detailed receipt; it must never be normalized to a valid schema-2 detail.

- [ ] **Step 5: Run runner GREEN and regression**

Run:

```powershell
node --test --test-name-pattern="authentic adapter rejection|schema-2|diagnostic|downgrade" tests/joeness-m4-direct-user-delegation-eval.tests.mjs
node --test tests/joeness-m4-direct-user-delegation-eval.tests.mjs
node --check evals/support/run-joeness-m4-direct-user-delegation-eval.mjs
```

Expected: all PASS. Preserve the command outputs in the execution handoff; do not commit.

---

### Task 4: Rebuild schema 1 and schema 2 strictly in the live wrapper

**Files:**
- Modify: `evals/support/run-joeness-m4-direct-user-delegation-live.mjs:210-249,2955-2999`
- Test: `tests/joeness-m4-direct-user-delegation-live.tests.mjs:116-160,2139-2177,2285-2323`

**Interfaces:**
- Consumes: schema-1 historic v9 and schema-2 current Task-B `freshFailure`.
- Produces: a fresh closed clone of the selected schema branch.
- Preserves: the committed v9 blocked artifact and all publication/cleanup gates.

- [ ] **Step 1: Add historic schema-1 compatibility and schema-2 RED**

Read the committed v9 blocked artifact in the test and assert:

```js
assert.deepEqual(
  subject.rebuildJoenessM4DirectUserDelegationDelegatedBlockedReceipt(v9Blocked),
  v9Blocked,
);
```

Add `taskBDelegatedBlockedReceiptV2()` with the exact schema-2 fresh-failure shape and assert it rebuilds with exact key order and diagnostic. Keep `taskBDelegatedBlockedReceipt()` unchanged as the schema-1 fixture.

- [ ] **Step 2: Run live-wrapper union RED**

Run:

```powershell
node --test --test-name-pattern="schema-1 compatibility|schema-2 fresh failure|exclusive branches" tests/joeness-m4-direct-user-delegation-live.tests.mjs
```

Expected: schema-1 remains GREEN and schema-2 FAILS because `delegatedFreshFailure` only accepts schema 1.

- [ ] **Step 3: Implement a strict discriminated union**

Import `AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHODS` from `run-authority-role-separated-evaluator-turn.mjs` and `FRESH_EVALUATOR_FAILURE_PHASES` from `run-fresh-evaluator-turn.mjs`, build private sets, and duplicate the exact stage/phase/method validator at this independent publication boundary. Split the parser into `delegatedFreshFailureV1`, `delegatedFreshFailureV2`, and a schema discriminator that reads only exact own data:

```js
function delegatedFreshFailure(value) {
  const schema = exactObject(
    value,
    ["schemaVersion", "provenance", "runnerStage", "adapter", "privacy"],
    "delegated Task-B fresh failure",
  );
  if (schema.schemaVersion === 1) return delegatedFreshFailureV1(schema);
  if (schema.schemaVersion === 2) return delegatedFreshFailureV2(schema);
  fail("delegated Task-B fresh failure schema is invalid");
}
```

Because both top branches share the same top-level key order, each branch must still revalidate every nested exact key, enum, false privacy field, and phase/method combination. Return fresh objects only.

- [ ] **Step 4: Add hostile schema-2 reconstruction cases**

Mutate every diagnostic field and representative ordering; add extra/missing keys, symbols, accessors, proxy/revoked-proxy values, invalid phase/method pairs, and raw canaries. Assert throws, zero trap execution, no detailed downgrade, no publication, and no canary in any serialized error or artifact. Assert the schema-1 v9 fixture still rebuilds identically after all mutations.

- [ ] **Step 5: Update authentic live-wrapper blocked expectations**

The in-memory full orchestration test must now assert schema 2, fixed diagnostic pair, one physical blocked artifact, evidence absence, canonical unique file, symmetric privacy scan, launch/close 1/1, process 0, roots absent, and config unchanged. PASS and semantic FAIL fixtures remain unchanged.

- [ ] **Step 6: Run live-wrapper GREEN and regression**

Run:

```powershell
node --test --test-name-pattern="schema-1 compatibility|schema-2 fresh failure|exclusive branches|authentic adapter rejection" tests/joeness-m4-direct-user-delegation-live.tests.mjs
node --test tests/joeness-m4-direct-user-delegation-live.tests.mjs
node --check evals/support/run-joeness-m4-direct-user-delegation-live.mjs
```

Expected: all PASS. Preserve the command outputs in the execution handoff; do not commit.

---

### Task 5: Verify the no-model propagation boundary and create the single support commit

**Files:**
- Verify only: the eight implementation files from Tasks 1-4.
- Do not modify: the design, this plan, collector, v9 records, fixtures, configuration, Core, manifest, or plugin state.

**Interfaces:**
- Consumes: all RED/GREEN checkpoints.
- Produces: one reviewed v10 support commit and exact source tuples for the future v10 plan.

- [ ] **Step 1: Run the combined no-model suite**

Run:

```powershell
node --test tests/fresh-evaluator-turn.tests.mjs tests/authority-role-separated-evaluator-turn.tests.mjs tests/joeness-m4-direct-user-delegation-eval.tests.mjs tests/joeness-m4-direct-user-delegation-live.tests.mjs tests/codex-app-server-collector.tests.mjs
```

Expected: PASS with zero failures and zero skips. This command uses only deterministic fixtures; it must not launch App Server or a model.

- [ ] **Step 2: Run syntax and static privacy verification**

Run:

```powershell
node --check evals/support/run-fresh-evaluator-turn.mjs
node --check evals/support/run-authority-role-separated-evaluator-turn.mjs
node --check evals/support/run-joeness-m4-direct-user-delegation-eval.mjs
node --check evals/support/run-joeness-m4-direct-user-delegation-live.mjs
git diff --check
```

Use an ASCII-only Node readback to assert the eight files are UTF-8/no-BOM, LF-only, final-LF; the v9 blocked tuple is unchanged; serialized schema-2 test artifacts exclude every raw canary; and the schema-2 diagnostic/fresh-failure objects contain only their exact fixed keys. Existing legacy diagnostic code may still mention `message`, `cause`, `details`, `events`, `outputText`, or `stderr`, but none of those fields may enter the new schema-2 projection.

- [ ] **Step 3: Verify exact scope and topology**

Require:

```text
M evals/support/run-fresh-evaluator-turn.mjs
M evals/support/run-authority-role-separated-evaluator-turn.mjs
M evals/support/run-joeness-m4-direct-user-delegation-eval.mjs
M evals/support/run-joeness-m4-direct-user-delegation-live.mjs
M tests/fresh-evaluator-turn.tests.mjs
M tests/authority-role-separated-evaluator-turn.tests.mjs
M tests/joeness-m4-direct-user-delegation-eval.tests.mjs
M tests/joeness-m4-direct-user-delegation-live.tests.mjs
```

Require current `HEAD` equals the captured starting commit, the worktree has no other tracked or untracked path, and v9 plan/blocked/index tuples equal their committed bytes.

- [ ] **Step 4: Complete code-quality and security reviews**

Review against the design in two independent passes:

1. Contract review: exact schemas, enum order, valid pair matrix, v9 compatibility, source topology, no semantic drift.
2. Security review: WeakMap authenticity, proxy/accessor trap safety, raw-canary privacy, downgrade behavior, publication/cleanup confinement.

Both reviews must report Critical 0 / Important 0 before commit. Apply findings through new RED/GREEN cycles and rerun Steps 1-3 after any byte change.

- [ ] **Step 5: Create the one implementation support commit**

Stage exactly the eight reviewed files, verify `git diff --cached --name-status` and `git diff --cached --check`, then run:

```powershell
git commit -m "feat: add v10 raw-free adapter diagnostics"
```

Post-commit require: direct parent equals the captured starting commit; diff is exactly the eight `M` paths; committed blobs equal reviewed working tuples; status is clean.

- [ ] **Step 6: Stop before any v10 execution plan or live action**

Report the support commit and eight exact byte/SHA-256 tuples. A future task may create a sole new v10 plan child that pins those tuples and remains `candidate/unvalidated`. Do not run preflight, App Server, model, protocol probe, or live under this implementation plan.
