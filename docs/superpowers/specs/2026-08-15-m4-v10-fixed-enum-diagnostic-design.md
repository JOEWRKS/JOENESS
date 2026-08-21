# M4 v10 Raw-Free Fixed-Enum Diagnostic Design

## Status and decision

This design is approved for specification. It defines an additive v10 diagnostic protocol for the direct-user delegation evaluation path. It does not authorize a v9 retry, a v10 live/model invocation, an MCP compatibility relaxation, or any promotion.

The v9 live attempt produced one authentic blocked artifact with adapter stage `after-auxiliary-request`. That stage proves that the role-separated path reached a post-response auxiliary boundary, but it does not distinguish a turn interrupt from `mcpServerStatus/list`, nor does it distinguish transport, MCP validation, cleanup, final-text, or JSON-parse failure. The v9 artifact and attempt index remain immutable.

## Goals

- Preserve only fixed, closed diagnostic enums across the fresh adapter, role-separated adapter, direct-user delegation runner, and live wrapper.
- Distinguish the major bounded failure phases that v9 collapsed into one adapter stage.
- Authenticate fresh-adapter diagnostics without inspecting or retaining an exception message, cause, detail, response, event, output, path, process identifier, stderr, digest, or configuration content.
- Preserve exact schema-1 rebuild compatibility for the persisted v9 blocked artifact.
- Prove propagation and privacy with deterministic in-memory tests before any new App Server or model execution.

## Non-goals

- Do not infer the v9 root cause retroactively.
- Do not relax MCP envelope, pagination, configured-name, or inertness validation.
- Do not change project instructions, direct-user input, response schema, semantic PASS/FAIL classification, or promotion boundaries.
- Do not add raw diagnostic text, arbitrary strings, numeric error codes, event summaries, response hashes, or model-output hashes.
- Do not modify the collector solely to classify failures that its callers can already bracket.

## Protocol

### Fresh-adapter failure phases

`evals/support/run-fresh-evaluator-turn.mjs` exports this exact ordered enum:

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
```

The order follows execution and validation boundaries. `unmapped` is always last and is the fail-closed projection for an uninstrumented or unauthenticated error.

### Role-adapter auxiliary methods

`evals/support/run-authority-role-separated-evaluator-turn.mjs` exports this exact ordered enum:

```js
export const AUTHORITY_ROLE_SEPARATED_AUXILIARY_METHODS = Object.freeze([
  "none",
  "turn-interrupt",
  "mcp-server-status-list",
  "unmapped",
]);
```

Only exact method names are mapped internally:

- `turn/interrupt` becomes `turn-interrupt`.
- `mcpServerStatus/list` becomes `mcp-server-status-list`.
- Any other auxiliary method becomes `unmapped`.

The transport method string itself is never retained.

### Authentic diagnostic projection

The fresh adapter owns a module-private `WeakMap` keyed by the exact generated failure object. It exports `projectFreshEvaluatorFailureDiagnostic(error)`, which returns either a fresh primitive-only object or `null`:

```js
{
  schemaVersion: 1,
  failurePhase: "<FRESH_EVALUATOR_FAILURE_PHASES value>"
}
```

The projector performs only object-identity lookup. It must not read properties from `error`, so ordinary objects, proxies, revoked proxies, accessors, symbols, or matching-looking forged fields cannot mint diagnostic evidence or execute traps. The `WeakMap` does not create a strong retained reference.

The fresh adapter records the phase immediately before each bounded operation. The first primary failure phase wins. Cleanup phases are selected only when no earlier primary failure exists:

- `terminal-timeout`: before awaiting the timeout interrupt.
- `agent-message-delta-overflow`: before awaiting the overflow interrupt.
- `mcp-status-collection`: before calling `listMcpServerStatus`.
- `mcp-runtime-inertness`: after collection and before `verifyMcpRuntimeIsInert`.
- `session-close`: an otherwise-primary close failure.
- `session-cleanup`: an otherwise-primary release or cleanup failure.
- `event-compaction`: event normalization or compaction failure before a more specific primary failure.
- `post-runtime-validation`: blocker aggregation or final runtime validation after the turn path.
- `final-agent-text`: missing, truncated, or structurally invalid final agent text.
- `structured-output-parse`: parsing the retained final text into the requested structured value.
- `unmapped`: no authenticated phase is available.

## Role-separated blocked evidence

The role adapter keeps its successful result contract unchanged. Its blocked evidence advances to schema 2:

```js
{
  schemaVersion: 2,
  adapterId: "authority-role-separated-evaluator-turn-v1",
  status: "blocked",
  stage: "<existing closed adapter stage>",
  sessionCloseCount: 1,
  diagnostic: {
    schemaVersion: 1,
    provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
    failurePhase: "<fixed phase>",
    lastAuxiliaryMethod: "<fixed auxiliary method>"
  },
  privacy: {
    absolutePathPersisted: false,
    rawProjectInstructionPersisted: false,
    rawUserInputPersisted: false,
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    eventPayloadPersisted: false
  }
}
```

The adapter initializes `lastAuxiliaryMethod` to `none`, assigns the mapped enum before invoking an auxiliary transport call, catches the failure object only to call the identity-backed projector, and passes only the two primitive enums into its existing branded blocked-error path.

The following combinations are valid:

- Adapter stage `before-auxiliary-request` or `after-auxiliary-request` requires a method other than `none`.
- `terminal-timeout` and `agent-message-delta-overflow` require `turn-interrupt`.
- `mcp-status-collection`, `mcp-runtime-inertness`, `final-agent-text`, and `structured-output-parse` require `mcp-server-status-list`.
- `session-close`, `session-cleanup`, `event-compaction`, `post-runtime-validation`, and `unmapped` may retain the authentic last method observed by the adapter.

An invalid combination is rejected. It is not normalized into plausible detailed evidence.

## Runner and live-wrapper propagation

`evals/support/run-joeness-m4-direct-user-delegation-eval.mjs` extends its authentic adapter projection as follows:

- Require the exact schema-2 blocked keys and nested diagnostic keys.
- Preserve the current adapter-brand authenticity gate.
- Emit `freshFailure.schemaVersion: 2` and copy only the fixed diagnostic enums plus the existing adapter stage, close count, and false privacy fields.
- Keep the top-level cause exactly `role-separated-adapter-rejection` / `BLOCKED_ROLE_SEPARATED_ADAPTER`.
- Keep the existing serialized-size bound.

The runner emits this exact schema-2 fresh-failure projection:

```js
{
  schemaVersion: 2,
  provenance:
    "direct-user-delegation-runner-observed-authentic-role-separated-adapter-rejection",
  runnerStage: "role-separated-evaluator-rejected",
  adapter: {
    schemaVersion: 2,
    adapterId: "authority-role-separated-evaluator-turn-v1",
    status: "blocked",
    stage: "<existing closed adapter stage>",
    sessionCloseCount: 1,
    diagnostic: {
      schemaVersion: 1,
      provenance: "authority-role-separated-fixed-enum-diagnostic-v1",
      failurePhase: "<fixed phase>",
      lastAuxiliaryMethod: "<fixed auxiliary method>"
    }
  },
  privacy: {
    rawOutputPersisted: false,
    rawOutputDigestPersisted: false,
    rawEventsPersisted: false,
    absolutePathsPersisted: false,
    rawStderrPersisted: false,
    configContentsPersisted: false
  }
}
```

`evals/support/run-joeness-m4-direct-user-delegation-live.mjs` validates a strict discriminated union:

- Schema 1 accepts exactly the historic v9 `freshFailure` shape and rebuilds the persisted v9 artifact byte-for-byte.
- Schema 2 requires the exact diagnostic shape and valid phase/method combination.
- Unknown schemas, extra keys, missing keys, reordered keys, accessors, symbols, proxies, invalid enums, and invalid combinations are rejected without detailed publication.

No semantic assessment, raw value, or model text is added to blocked artifacts.

## Files

Implementation scope is limited to four sources and their four focused test files:

- `evals/support/run-fresh-evaluator-turn.mjs`
- `evals/support/run-authority-role-separated-evaluator-turn.mjs`
- `evals/support/run-joeness-m4-direct-user-delegation-eval.mjs`
- `evals/support/run-joeness-m4-direct-user-delegation-live.mjs`
- `tests/fresh-evaluator-turn.tests.mjs`
- `tests/authority-role-separated-evaluator-turn.tests.mjs`
- `tests/joeness-m4-direct-user-delegation-eval.tests.mjs`
- `tests/joeness-m4-direct-user-delegation-live.tests.mjs`

The collector, v9 plan, v9 blocked artifact, v9 attempt index, configuration, Core, manifest, and plugin state are outside this implementation scope.

## Test design

Every production change follows RED, minimal GREEN, then focused regression. The required diagnostic matrix is:

| Scenario | Expected phase | Expected auxiliary method |
| --- | --- | --- |
| Terminal timeout with a successful interrupt | `terminal-timeout` | `turn-interrupt` |
| Agent-message delta overflow with a successful interrupt | `agent-message-delta-overflow` | `turn-interrupt` |
| Malformed MCP response envelope | `mcp-status-collection` | `mcp-server-status-list` |
| Configured/runtime MCP mismatch or non-inert status | `mcp-runtime-inertness` | `mcp-server-status-list` |
| Valid MCP status followed by missing or truncated final text | `final-agent-text` | `mcp-server-status-list` |
| Valid MCP status followed by non-JSON final text | `structured-output-parse` | `mcp-server-status-list` |

Security and compatibility tests must also prove:

- Matching-looking ordinary errors do not project.
- Proxy, revoked-proxy, accessor, symbol, extra-key, missing-key, and reordered-key inputs do not execute traps or mint evidence.
- Invalid phase/method combinations are rejected.
- Raw canaries placed in messages, details, MCP server info, final text, events, paths, and stderr never appear in role evidence, runner receipts, live artifacts, or their serializations.
- The committed schema-1 v9 blocked artifact rebuilds identically.
- A malformed schema-2 receipt cannot downgrade into trusted detailed evidence.
- Successful semantic PASS/FAIL behavior and cleanup remain unchanged.

The focused suites are run first, followed by the existing combined adapter, runner, live-wrapper, and collector suite. Syntax, `git diff --check`, canonical JSON, UTF-8/no-BOM, and source-tuple checks remain mandatory before review.

## No-model verification and execution boundary

The complete diagnostic propagation path can be verified with existing in-memory session and injected-runtime fixtures. Those tests exercise the imported fresh adapter, role adapter, Task-B runner, and live-wrapper rebuild/publication logic without launching App Server or starting a model turn.

An optional, separately planned protocol-only App Server probe may initialize an ephemeral thread and call `mcpServerStatus/list` while retaining only fixed PASS/failure enums. Such a probe cannot reproduce post-turn timeout, delta overflow, post-turn MCP drift, missing final text, or malformed model JSON, so it cannot identify the v9 root cause by itself.

No v10 live/model invocation is authorized by this design. After implementation and independent review, a new support commit and a sole-plan child may be created. Any live execution requires a new immutable v10 plan, a fresh preflight and environment baseline, independent semantic and cleanup GO reviews, and separate explicit authorization. The v9 command remains permanently non-retryable.

## Acceptance criteria

- All six diagnostic scenarios produce the exact fixed-enum pair in deterministic tests.
- All hostile and raw-canary tests pass without trap execution or content leakage.
- The historic v9 blocked artifact rebuild remains byte-identical.
- Existing PASS/FAIL/blocked branch exclusivity, cleanup, source/config, and publication tests remain green.
- Only the eight scoped source/test files change in the implementation support commit.
- The implementation commit changes no evaluation input, semantic verdict, MCP validation rule, Core, manifest, configuration, or promotion state.
- A future v10 plan remains `candidate/unvalidated` and does not itself authorize live execution.
