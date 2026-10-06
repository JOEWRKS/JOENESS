# Work results

## T1 — 2026-10-02 clamp

Roadmap item: [R1](ROADMAP.md#s1--release).
Result: clamp implementation and focused test passed, as recorded on 2026-10-02.
Targets: [main.mjs](main.mjs), [main.test.mjs](main.test.mjs). The old event does
not provide an exhaustive changed-file list.
Check: `node --test main.test.mjs`; one passing test, zero failures in
[proof/clamp.txt](proof/clamp.txt). Current test covers -2 → 0 and 4 → 4.
Historical event: [notes/work.md](notes/work.md).
Limits: existing proof reused during setup; no fresh test run, numeric boundary
coverage or release user acceptance. Related risk: [I1](ISSUES.md#i1--large-integer-precision-loss).

## T2 — 2026-10-03 precision observation

Independent investigation source: [dated work event](notes/work.md).
Result: large-integer precision loss was observed; no code fix is recorded.
Changed files and executed boundary checks: not recorded in the source.
Current cause, workaround, risk and closure requirements belong to
[I1](ISSUES.md#i1--large-integer-precision-loss).
Reusable research: [numeric representation](Library/numeric-representation.md).
Limits: automatic guard and boundary verification are still absent.

## T3 — 2026-10-06 JOENESS project setup

Authorization: user approved the proposed document mapping and routine factual
recording scope; product, code, tests and existing proof were excluded from edits.
Result: canonical document ownership applied; old delivery/handoff summaries
are historical, and research detail moved to a topic file with its source/date.
This independent setup task does not complete S1 or authorize implementation.
Changed files:

- AGENTS.md: managed work/navigation/recording connection; original rules retained.
- ROADMAP.md, TASK.md, ISSUES.md, DESIGN.md: canonical owners.
- Library/numeric-representation.md: reusable research owner.
- HANDOFF.md, notes/delivery.md, notes/work.md, notes/visual.md: historical
  boundaries and current-owner links; original historical content retained.
- notes/research.md: transferred-topic locator.
- .joeness/setup-state.json: helper-owned applied-block baseline.

Verification on actual targets: helper Apply returned current/clean, and a
subsequent Check returned current/clean with no blockers. Readback traced R1–R5,
retained the precision workaround and approval boundaries, and confirmed one
current delivery roadmap. `git diff --check` passed. SHA-256 hashes of product.md,
main.mjs, main.test.mjs and proof/clamp.txt matched the pre-apply values.
Existing clamp proof was reused; no implementation or test execution occurred.
Evidence: current document links above and helper state; setup observations were
made in this session. Helper state certifies the block baseline only.
Limits: fresh-project-context instruction delivery was not tested. Numeric range
and release impact remain undecided; JSON work and release acceptance remain open
at their owners. No product decision, personal installation, commit or push.
Record handoff gap: none.

## T4 — 2026-10-06 BigInt JSON research

Authorization: user requested a local Node probe and existing-record update,
without application changes, product/roadmap criterion changes or datatype adoption.
Related work: [R2](ROADMAP.md#s1--release) and [I1](ISSUES.md#i1--large-integer-precision-loss);
independent research does not complete a delivery outcome.
Result: direct BigInt JSON serialization failed in the checked runtime; a tested
Number conversion lost precision. No fix or representation was adopted.
Changed files: Library/numeric-representation.md (reusable command, environment,
results and limits), ISSUES.md (affected residual uncertainty and research link),
TASK.md (this execution record).
Check / target / result: local `node -e` probe on Node v26.3.0, win32 x64;
exit 0 with caught TypeErrors. Exact command, output, environment and limitations
are owned by [the existing research topic](Library/numeric-representation.md#2026-10-06--local-bigint-json-probe).
Limits: no application test, file round trip or alternative-encoding validation;
no implementation, product change, roadmap criterion/state change or issue closure.
Current roadmap next work and open delivery checks remain applicable.
Record handoff gap: none.
