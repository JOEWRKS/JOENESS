# M2B1 Semantic Failure Evidence Design

## Goal

When the sample-a visual evaluator reaches the final bounded-defect outcome gate and fails, preserve the exact bounded predicate results and the already-available path-private process summary without retaining the evaluator's raw output or changing the evaluator contract.

## Current Evidence Gap

The v10 attempt reached the final sample-a gate in `validateVisualM2B1Output`. That gate requires all three of these facts:

1. At least one applicable visible-appearance acceptance check has verdict `FAIL`.
2. The visible-appearance aggregate is `FAIL`.
3. The complete-contract aggregate is `FAIL`.

The validator currently throws a plain error when any requirement is missing. The throw happens before `retainTask1Evidence`, so the blocked artifact retains the error message but not the three predicate values or the adapter's safe `eventCompaction` summary. The historical v10 artifact remains authoritative and must not be rewritten; its exact failed predicate stays `UNVERIFIED`.

## Decision

Use a fixed semantic projection attached to the validator error as a non-enumerable own-data property. Reuse the existing post-validation projection for the path-private input, App Server, and `eventCompaction` summary. The final blocked writer independently validates both projections and stores them as separate top-level evidence.

This is preferred over changing the validator return type because it preserves the public validator API and success path. It is preferred over recomputing the predicates in the caller because validation logic remains defined in one place. It is preferred over retaining the full verdict vector or running Task 1 evidence validation earlier because those choices widen the privacy and size surface or change failure precedence.

## Semantic Evidence Interface

Only a sample-a bounded-defect failure may create this exact object:

```json
{
  "schemaVersion": 1,
  "kind": "visual-bounded-outcome",
  "candidateId": "sample-a",
  "requiredOutcome": "applicable-visible-fail-and-aggregate-fail",
  "predicates": {
    "applicableVisibleAcceptanceFail": {
      "expected": true,
      "actual": false,
      "matched": false
    },
    "visibleAppearanceOverall": {
      "expected": "FAIL",
      "actual": "UNVERIFIED",
      "matched": false
    },
    "completeContractOverall": {
      "expected": "FAIL",
      "actual": "UNVERIFIED",
      "matched": false
    }
  },
  "failedPredicateCount": 3,
  "rawOutputRetained": false
}
```

The actual booleans and aggregate enums come only from values already computed after the visual output's shape, transfer order, scope/verdict, unsupported-layer, and aggregate-consistency checks have passed. The aggregate enum is limited to `PASS`, `FAIL`, or `UNVERIFIED`.

The writer must reject the projection unless:

- every top-level and nested key is exact own data with no symbols, accessors, proxies, or extra keys;
- `candidateId`, `kind`, `requiredOutcome`, `schemaVersion`, and each expected value match the fixed literals above;
- `applicableVisibleAcceptanceFail.actual` and every `matched` value are strict booleans;
- both aggregate actual values are strings in the fixed `PASS | FAIL | UNVERIFIED` enum;
- each `matched` value equals the comparison of its expected and actual values;
- `failedPredicateCount` is a safe integer, equals the number of false `matched` values, and is between 1 and 3;
- `rawOutputRetained` is exactly `false`; and
- the complete serialized projection fits within 2 KiB.

Malformed or hostile semantic evidence is omitted. The semantic projection must never fall back to raw output, checks, observed text, paths, prompts, credentials, identifiers, hashes of dynamic content, stderr text, or event payloads. The separately retained `eventCompaction` keeps only its already-approved bounded counts, fixed labels, aggregate byte length, limits, and exceeded flags; it adds neither raw text nor a content digest.

## Data Flow

1. `validateVisualM2B1Output` computes the three final sample-a predicate results once.
2. On failure, it creates the existing error and attaches `semanticFailureEvidence` as a non-enumerable own-data property.
3. The visual orchestration catches only an error carrying the own-data `semanticFailureEvidence` marker and calls the existing `attachPostValidationFreshEvidence(error, visualResult, visualInput)`. Other validator errors keep their current propagation behavior. This adds the bounded path-private process summary and a valid `eventCompaction` when available, without retaining output text.
4. Cleanup and shutdown handling remain unchanged.
5. The blocked writer reads `semanticFailureEvidence` through safe own-data inspection, rebuilds an exact primitive-only object, and stores it at top-level independently of `partialEvidence`, `task1Prevalidation`, and `eventCompaction`.
6. `task1Prevalidation` is not synthesized because the Task 1 guard did not run before this semantic failure.

## Failure And Privacy Behavior

- A malformed semantic projection does not prevent the normal sanitized cause and cleanup record from being written; only the invalid projection is omitted.
- A valid semantic projection remains available even when unrelated partial evidence must fall back to its minimal form.
- A valid post-validation `eventCompaction` remains separately bounded by its existing limits.
- The existing staged-path privacy gate continues to run immediately before every artifact write. Credential rejection remains inside the exact projection validators and bounded-clone paths; this change does not claim or add a separate global credential gate.
- The evaluator prompts, image inputs, output schemas, candidate outcomes, acceptance criteria, Task 1 limits `512/128`, retry count `0`, session order, and success-write behavior do not change.

## Test Contract

Tests must prove the following with a RED then GREEN cycle:

- the reachable sample-a failure states retain the exact predicate values and aggregate enums;
- the validator error property is non-enumerable own data;
- the full runner path writes the semantic projection and valid `eventCompaction` at blocked top-level while leaving `task1Prevalidation` absent;
- malformed, missing, extra-key, wrong-literal, wrong-type, inconsistent-count, live/revoked proxy, accessor, oversized, path-shaped, and credential-shaped projections are omitted without invoking traps;
- non-target validator errors do not gain post-validation or semantic evidence;
- hostile partial evidence cannot remove or alter a valid semantic projection;
- raw visual output, `observed` strings, checks, staged-root or private absolute paths, their encoded variants or digests, credentials, stderr text, and event payloads from the semantic and post-validation projections never appear in the blocked artifact; approved repository-relative plan and `executionSource` paths remain allowed;
- successful Design, sample-a, and sample-b paths retain their existing behavior;
- the historical v10 plan, blocked artifact, v12 receipt, evaluator contract, manifest, and prior records remain byte-identical; and
- no live evaluator session runs during this implementation.

## Commit And Release Boundary

1. First, update only the runner test to pin the now-historical v10 state: seven success outputs absent and the existing v10 blocked artifact exact at `2504` bytes and SHA-256 `34a1cb1c5fdf7655aeab9f5f6df899c40ae8752cd93edd57061f95c29dcbfcd0`.
2. Then implement semantic retention in only `evals/support/run-design-visual-m2-b1.mjs` and `tests/design-visual-m2-b1-runner.tests.mjs`.
3. Do not change the adapter, collector, v10 plan, v10 artifact, v12 receipt, `TASKS.md`, source manifest, evaluator contract, caps, or retry policy in this implementation.
4. Generation 11 support, an actual v11 plan, preflight, independent authorization, one live attempt, and its additive receipt are separate future steps. The v10 command must never be rerun.

## Required Completion Explanation

After implementation, report in plain Korean:

- **What changed:** a future sample-a semantic failure will identify which of the three required outcomes failed and will retain the bounded process summary; previously only the generic error message survived.
- **What did not change:** the evaluator's questions, acceptance rules, limits, retry policy, historical v10 evidence, promotion status, and authorization for another live run.
- **What remains:** generation 11 support and a pinned plan, clean preflight, explicit authorization for one new live attempt, result persistence, and the still-separate M2B2 runtime proof and user acceptance boundaries. The implementation's tests and independent review belong in the completed verification report, not in this remaining-work list.

## Non-goals

- Recovering the missing v10 predicate values retroactively.
- Retaining raw evaluator output or the full check verdict vector.
- Proving image attachment conversion, provider inclusion, model pixel use, original detail, or user acceptance.
- Changing sample-b semantics in this implementation.
- Increasing event or MCP limits.
- Running or authorizing another evaluator attempt.
- Updating promotion or the source manifest.
