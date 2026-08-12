# JOENESS Ticket M1B E2E Evidence Record

This is a normalized context record, not a verbatim tool-event transcript. Full-history audit confirmed that every evaluator was created with `fork_turns: "none"` after its candidate SHA was fixed. Stored prompt bodies were encrypted, so narrative withholding is `UNVERIFIED` rather than asserted as independently proven.

## Frozen ticket

- BASE: `6b9dd05bfd83a7471741c4b501a91e8c7458752e`
- Criteria: `target-ready`, `guard-stable`, `evidence-present`
- Frozen files: `TASKS.md`, `skills/ticket/SKILL.md`, `evals/fixtures/ticket-m1b/check.mjs`, `evals/fixtures/ticket-m1b/fault-seed.json`, `tests/ticket-m1b-fixture.tests.mjs`
- The root PM stayed at BASE and did not edit candidate files. The normal implementer was the only intentional implementation writer. Fault, no-op, repeat-failure, and missing-evidence commits were explicitly labeled evaluation controls.

## Candidate chain and verdicts

### C1 normal

- SHA `6de8e690856ffae891d37dbb3abc6d2f37650791`, tree `0adb7f5aaf0818e6262ccbd3c1f06490e84aae92`, parent BASE.
- Added only `candidate.json` (`target=READY`, `guard=STABLE`) and `evidence.json`.
- Fresh evaluator `m1b_eval_normal`: `target-ready=PASS`, `guard-stable=PASS`, `evidence-present=PASS`; `ACCEPTED`.
- Direct checker accepted, focused 3/3 and full Node 240/240 passed. Before/after detached HEAD, tree, tracked, index, untracked, ignored/generated state were unchanged.

### C2 controlled fault

- SHA `b399205ed2e89da368a554b9caeab33fb84f8698`, tree `5931633a96bd151ec6bd4d7d2ad45219f85f6bc1`, parent C1.
- Changed only `candidate.json#/target` from `READY` to `M1B_FAULT_SEED`; this new SHA invalidated C1's governing verdict.
- Fresh evaluator `m1b_eval_fault`: `target-ready=FAIL`, other two criteria `PASS`; `REWORK`, exact failed IDs `["target-ready"]`.
- Direct checker reproduced the failure, focused 8/8 and full Node 240/240 passed. Before/after HEAD, tracked, index, and untracked state was unchanged; generated/ignored state was not retained. One target-only automatic rework was allowed.

### C3 successful rework

- SHA `ceacba63354fba223428e112d367327b32c706a0`, tree `0adb7f5aaf0818e6262ccbd3c1f06490e84aae92`, parent C2.
- The original implementer used the only automatic rework to change only `target` back to `READY`.
- Fresh evaluator `m1b_eval_pass` re-evaluated all criteria: 3 PASS, `ACCEPTED`; focused 8/8 and full Node 240/240 passed. C2's verdict was invalid for C3, while remaining valid as C2 history. HEAD, tracked, index, and untracked state was unchanged; generated/ignored state was not retained.

### C3 unchanged control

- SHA `409ee785f09eed2ab6c9e390c9c9de3fb304692a`, tree `5931633a96bd151ec6bd4d7d2ad45219f85f6bc1`, parent C2.
- SHA changed but tree equaled C2 and `C2..C3` was empty.
- Fresh evaluator `m1b_eval_noop` directly reproduced `target-ready=FAIL`; final state `USER_DECISION`. No further automatic attempt was allowed. HEAD, tracked, index, and untracked state was unchanged; generated/ignored state was not retained.

### C3 repeated-failure control

- SHA `7111f1ce9c4132e3d0d4cf932e9a8a4691eb9b1b`, tree `a07e32eb50c808b94f408cfd8392281150659e43`, parent C2.
- Materially changed only `target` from `M1B_FAULT_SEED` to `M1B_REPEAT_FAULT`.
- Fresh evaluator `m1b_eval_repeat_v2` directly found the same failed ID `target-ready`, with evidence present; final state `USER_DECISION`, not `UNVERIFIED`. No further automatic attempt was allowed. HEAD, tracked, index, and untracked state was unchanged; generated/ignored state was not retained.

### Missing-evidence control

- SHA `e9069c3c83b987a09560e52033337a9a393a09df`, tree `74f5caf730d5c75bca20050c691d45f76ce1a467`, parent C1.
- Deleted only `evidence.json`; normal candidate bytes stayed unchanged.
- Fresh evaluator `m1b_eval_missing`: `target-ready=PASS`, `guard-stable=PASS`, `evidence-present=UNVERIFIED`; final state `UNVERIFIED`, not `USER_DECISION` or code rework. Evaluation state was unchanged.

## Preserved refs

- `origin/codex/ticket-m1b-normal` → C1
- `origin/codex/ticket-m1b-fault` → C2
- `origin/codex/ticket-m1b-rework` → successful C3
- `origin/codex/ticket-m1b-noop` → unchanged C3 control
- `origin/codex/ticket-m1b-repeat` → repeated-failure C3 control
- `origin/codex/ticket-m1b-missing` → missing-evidence control

## Execution limitations

- This is a controlled repository fixture, not proof that Ticket improves a real project's quality, time, or cost.
- Context separation uses the same model family, filesystem, and permissions; it is not an external organization or security boundary.
- Full tool-event streams and complete terminal stdout were not retained. Agent final reports are normalized here and exact Git candidates are retained by remote refs.
- The fault controller's first shell relied on a misapplied workdir and landed in another repository; it stopped before edits. Explicit `Set-Location`, root, branch, and HEAD checks were then used for every fixture command.
- The normal evaluator discarded one initial wrong-workdir read before beginning review from an explicit correct root.
- One read-only evidence inventory command had a PowerShell parse error before execution; the corrected command performed no writes and completed once.
- The first `m1b_eval_repeat` spawn request used `fork_turns:none` but failed with `agent thread limit reached`; it created no evaluator or candidate. The actual evaluator was the later `m1b_eval_repeat_v2`.
