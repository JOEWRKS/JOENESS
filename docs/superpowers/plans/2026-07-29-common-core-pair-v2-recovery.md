# Common Core Pair v2 Recovery Plan

**Status:** v2, v3, and v4 are closed as blocked; the evidence-preserving v5 recovery below is active.

## 1. Evidence that closed v1

- `common-core-v1` ran once and is immutable.
- It stopped before the first `turn/start`; no Core behavior or efficiency claim is possible.
- The candidate and materialized case `AGENTS.md` were byte-identical:
  7,933 bytes, SHA-256 `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495`.
- The evidence hash remained
  `ff259fccc2af2363000b6533a37f28e4fe596987c5667ed8fd29f194ebf81af6`.
- The first failure was `Core instruction source is not the exact overlay`;
  the remaining 15 cases were not run.
- The failed result did not preserve the actual returned `instructionSources`.
  It therefore proves the gate category, not whether the returned list was empty,
  plural, or a differently represented path.

The direct cause is the Collector expecting implicit project-instruction discovery
while sending `environments: []`. The generated protocol contract says an empty
selection disables environments, and Codex loads project instructions from the
resolved turn environments. The v1 mock covered the expected response but not this
live boundary.

Primary references inspected for the installed protocol:

- generated `ThreadStartParams.json` from the v1 fixed run root;
- [Codex app-server README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md);
- [Codex AGENTS discovery source](https://github.com/openai/codex/blob/main/codex-rs/core/src/agents_md.rs);
- [Codex environment selection source](https://github.com/openai/codex/blob/main/codex-rs/core/src/environment_selection.rs);
- [Codex 0.145.0 turn protocol](https://raw.githubusercontent.com/openai/codex/rust-v0.145.0/codex-rs/app-server-protocol/src/protocol/v2/turn.rs);
- [Codex 0.145.0 turn processor](https://raw.githubusercontent.com/openai/codex/rust-v0.145.0/codex-rs/app-server/src/request_processors/turn_processor.rs).

## 2. Recovery decisions

1. Never delete, overwrite, or retry either v1 run ID.
2. Create a new `no-harness-control-v2` / `common-core-v2` pair.
3. Both sides use the same corrected Collector, cases, model settings, permission
   profile, local environment selection, and review contract.
4. Start each case thread with one explicit `local` environment whose cwd and
   runtime workspace root are exactly that case root.
5. Pin `project_doc_max_bytes: 32768`, `project_root_markers: []`, and
   `project_doc_fallback_filenames: []` on every thread. The candidate must fit
   the byte limit and remain exact UTF-8.
6. Record Control's global instruction-source snapshot, if any. Core must report
   that same snapshot plus exactly its materialized `AGENTS.md`; this keeps the
   pair portable without mistaking a user's global instructions for contamination.
7. Omit `cwd`, environment, root, and config overrides on `turn/start` so the
   exact sticky local thread selection remains active. Model tools remain disabled, the
   permission profile remains read-only with network disabled, and the only
   workspace root is the synthetic case root.
8. Replace the false `app-server-environments-disabled` case claim with explicit
   local-root selection evidence. Keep write and network isolation as separate
   proofs.
9. Do not use `developerInstructions` as a fallback. It has different role,
   wrapping, and provenance from discovered `AGENTS.md`, so it is not an equivalent
   treatment.
10. Preserve observed thread evidence and `instructionSources` when the gate fails.
11. Keep schema version 3 but select an exact v1/v2 run profile; a retry number is
    not a new evidence schema, and mixed-generation pairing is forbidden.
12. Harden complete-evidence validation before v2 so case roots, thread IDs, turn
    IDs, and lifecycle start/terminal events cannot be duplicated.
13. Record the candidate path, byte length, and SHA-256 in both Control and Core.
    Core must match the reviewed Control reference and its own materialized
    overlay exactly.
14. Run the three-thread, model-free instruction-discovery probe inside Control
    preflight. Bind its receipt to the runtime version, protocol schema, pinned
    project-doc config, and candidate reference; atomically checkpoint and
    read back the receipt before the first model turn, and require every Control
    case to match it before `turn/start`.
15. A complete comparable pair requires complete case identity, lifecycle, and
    instruction-source evidence even when a run-global limitation leaves the
    capability verdict blocked.

## 3. Implementation sequence

### Task A: Write failing offline tests

- thread bootstrap request has one exact local environment and one exact root;
- Control records its exact source snapshot and Core accepts only that prefix plus
  one exact candidate source;
- source mismatch preserves the observed thread evidence in a blocked record;
- Control preflight exercises both instruction-source branches without a model
  turn and records a hash-bound receipt;
- complete results reject duplicate or cross-pair thread/turn IDs, wrong run
  roots, duplicate lifecycle starts, and invalid event order;
- historical v1 Control and blocked Core continue to validate.

### Task B: Implement the smallest source fix

- reuse one bootstrap-request helper in smoke and live cases;
- extend thread parsing to validate the requested runtime roots;
- record honest controlled-local environment evidence;
- keep the current write, network, MCP, hook, secret, and mutation controls;
- add v2 run identities and result paths without reopening v1;
- retain the same non-discoverable Common Core candidate.

### Task C: Verify and review implementation

Run syntax checking, all Node tests, the P0 contract, historical v1 validation,
blocked Core v1 validation with exact baseline bytes, and diff checks.
An independent reviewer checks the live boundary, historical compatibility,
one-shot gates, and the new lifecycle mutations.

### Task D: Execute the new pair

1. Commit the corrected Collector, tests, manifest, and this recovery plan.
2. Run model-free smoke and require both instruction-source probes to pass.
3. Run Control v2 exactly once; independently review and commit its evidence.
4. Without changing paired source files, run Core v2 exactly once.
5. Independently review all cases, metric deltas, and pair comparability.
6. Commit Core v2 evidence without changing its evidence hash.

## 4. Promotion rule

Create root `AGENTS.md` only when the latest reviewed pair passes behavior,
capability, and efficiency gates with no regression. Its bytes must equal the
candidate. If a pair is blocked or regresses, keep root `AGENTS.md` absent and
retain that round as evidence.

## 5. v2 outcome and v3 recovery

- Control v2 ran exactly once and is immutable at commit
  `7207a78519c716ec0815fb5b2f2f57ca98f9bd59`.
- Its evidence SHA-256 is
  `f07b7d96a7e64bd2301b6b62145a24dd9226a76ddb207511b73ac54d4e8ff55b`;
  its reviewed file SHA-256 is
  `b2ea370e7cb377480dceb7d3fb38d7346bc2360119a21df33c3dee91bc6ad536`.
- The first ten completed cases passed independent behavior review.
- `pressure-04-product-completeness` stopped at the 256-event evidence limit
  before its substantive message and turn completed. The remaining five cases
  were not run, so Control capability is blocked and Core v2 must not run.
- Of the 256 recorded events in the blocking case, 242 were correlated,
  blocker-free `item/agentMessage/delta` notifications whose text was already
  intentionally discarded; completed messages retain the bounded final text.

The root fix validates the exact pinned delta envelope, correlates it, and
coalesces each safe message stream into one count/byte/hash summary in the
bounded event array. Count and byte caps prevent a stream from bypassing the
evidence limit. Each item has one summary before exactly one matching completed
message, with the same byte length and SHA-256; aggregate count/bytes and event
count are revalidated. Malformed, foreign, oversized, or secret-shaped deltas
remain recorded and blocking, including secrets split across fragments or item
IDs in receipt order. Non-coalescible deltas retain only count/byte/hash
metadata, and every valid raw delta consumes the same global count/byte budget
regardless of correlation. Notifications received before start responses are
normalized at queue ingress; their deltas are bounded and coalesced before any
raw payload can wait in memory. A complete review may label a case `pass` or `fail` only
when that individual case has complete runtime, source, and identity evidence
even if the overall capability is blocked. Recorded execution identities may
not collide across blocked and reviewed cases. The fixed Collector uses new immutable IDs
`no-harness-control-v3` and `common-core-v3`; neither v1 nor v2 is retried or
rewritten.

## 6. v3 outcome and v4 recovery

- Control v3 ran exactly once and is immutable at commit
  `769d67bd49fd0edb1d21b70eb92114d71df38154`.
- Its evidence SHA-256 is
  `b95a54dd903f090ebae90effdada44c7bf555f293e930a735f867165a932bbd9`;
  its reviewed file SHA-256 is
  `476b5ee43038e4c751b2657d059ef43005d05c62c02509500e1a85b585f7d95a`.
- Fifteen complete cases passed independent behavior review.
- In `p0-02-unknown-write`, the subject issued one stable-key Write, treated
  response loss as unknown, and began the allowed ReadState recovery. The
  Collector rejected that ReadState before recording its response, interrupted
  the turn, and left the case without a completed recovery receipt. Control
  capability is therefore blocked and Core v3 must not run.
- The public dynamic-tool schema allowed the supplied stable idempotency key to
  remain on ReadState, while the Collector's exact argument validator accepted
  only `operation` and `targetKey`. The v4 root fix accepts either exact
  ReadState shape only when any supplied key equals `request-001`, then strips
  the irrelevant key before the read-only broker request. Wrong keys and extra
  fields remain rejected. The v4 live schema also requires `request-001` on
  Write; validation reconstructs the prior schema only for immutable v1-v3
  evidence.
- The fixed Collector uses new immutable IDs `no-harness-control-v4` and
  `common-core-v4`. v1, v2, and v3 artifacts are validation-only and are never
  retried or rewritten.

## 7. v4 outcome and v5 recovery

- Control v4 ran exactly once and is immutable at commit
  `9eceb6e279809245c72024c2127e656efb4fb3dc`.
- Its evidence SHA-256 is
  `7f355883559d3e6045610ddbc210d40fddf570bf41edf91a13c02aeaf9c6c7ea`;
  its reviewed file SHA-256 is
  `f4f92037a75d923d307cf560ab80c2abd21624e4b73476e793f13f3c9053c0ba`.
- Fifteen complete cases passed independent behavior review.
- In `p0-02-unknown-write`, the subject stated the safe intent to use the
  supplied stable key and recover without a new key. Its first Write reached
  the correct dynamic tool and operation, but the normalized start event
  failed the exact argument predicate. The Collector stopped before the
  handler, so the broker recorded no write, response loss, recovery, or
  external effect. The raw arguments are intentionally not retained, so the
  evidence does not distinguish a missing key, wrong value, extra field, or
  runtime serialization drift. Control capability is blocked and Core v4 was
  not run.
- The v4 public schema used a conditional `allOf` to require the key only on
  Write. That did not reliably produce an exact first-Write envelope. The v5
  root fix removes the conditional branch and requires the same exact
  `request-001` field for both Write and ReadState. The live handler enforces
  that one shape; ReadState retains the caller key in evidence and strips it
  only from the broker request because it is not part of the read operation.
  Historical v1-v3 optional schemas and the v4 conditional schema are
  reconstructed only when validating their immutable evidence.
- The fixed Collector uses new immutable IDs `no-harness-control-v5` and
  `common-core-v5`. v1 through v4 are validation-only and are never retried or
  rewritten.
