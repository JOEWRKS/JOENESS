# Project-record performance A/B — observed result

The [pre-registration](preregister.md) was committed at `83575a9` before either
arm ran. The same frozen fictional seed started both independent Git histories
at `2a1bd2f960f8ca95948c25a0f92cf55b3b0388e7`. Setup added only the
helper-owned `AGENTS.md` block and `.joeness/setup-state.json` before S1;
non-setup seed files were identical. This is a single diagnostic pair, not a
statistical estimate.

Runtime: Codex CLI `0.158.0-alpha.2`, `gpt-6-astra`, reasoning `xhigh`, fresh
ephemeral context for every stage. S1–S3 used `workspace-write`; S4 used
`read-only`. CLI MCP startup/shutdown warnings appeared, but all eight runs
exited 0 and no stage depended on those MCP servers. The personal installed
skill and repository skill had identical SHA-256
`87D9C84E3BE17B807E9B1B7E2B294265242F9F9F93033FD2919D57C4F5895500`.
No product skill source was changed during this experiment.

| Stage | Order | Bare result | Setup result |
|---|---|---|---|
| S1, preserve attendee | Bare → Setup | Correct fix; 4 local tests pass; TASKS, ROADMAP, ISSUES and HANDOFF updated. [Response](s1-bare-response.md). Commit `ffa28ca81ac493fe99566b8535960c413d38560d`. | Correct fix; 3 local tests pass; TASKS, ROADMAP and ISSUES updated, PRODUCT and old HANDOFF preserved. [Response](s1-setup-response.md). Commit `9ba1ebe9f0c2a69fb399be5eed2047318ebb74f6`. |
| S2, cancel without deletion | Setup → Bare | Current bug reproduced, fixed and covered by 8 passing local tests; reusable cause/fix in ISSUES, run result in `evidence/cancel-run.md`. [Response](s2-bare-response.md). Commit `9a6e07e4095c1b353a1988b54f97c4081bab36bd`. | Current bug reproduced, fixed and covered by 5 passing local tests; reusable cause/fix in ISSUES, earlier diagnostic not mistaken for current proof. [Response](s2-setup-response.md). Commit `5c900caf2765a56952acf0b2229c433ee697b452`. |
| S3, explicit email deferral | Bare → Setup | Deferred optional email, left required kiosk check open, did not claim acceptance; also amended PRODUCT and HANDOFF with the decision. [Response](s3-bare-response.md). Commit `07ed613f2a67ca03d3bbc17fd5b0534d1c6a05c2`. | Deferred optional email in ROADMAP and TASKS, left required kiosk check open, preserved PRODUCT and old HANDOFF. [Response](s3-setup-response.md). Commit `034ae229b483b227306a45ce833d51d5886928f5`. |
| S4, fresh successor | Setup → Bare | Correctly reconstructed both fixes, the `filter` cause and `map` fix, email decision, missing actual-kiosk proof, incomplete M1 and pending acceptance. Rejected old handoff. No write. [Response](s4-bare-response.md). | Same material facts and boundary; rejected old handoff and run-specific diagnostic as current proof. No write. [Response](s4-setup-response.md). |

Full, self-contained Git histories are [Bare](bare.bundle) (SHA-256
`59AE58D82118590CA8EE97313E6F3CB8A2C95164CE861FBD7CFACB9C67F66801`)
and [Setup](setup.bundle) (SHA-256
`41190FFAFA108461091F32613DBA7D3309E2039CB8C1D1D2FBD672E7D00809F8`).
Both bundles verified as complete histories and preserve the stage snapshots.
The local final worktrees were clean. Fresh final `node --test` checks passed
8/8 for Bare and 5/5 for Setup; the difference reflects different test cases,
not a shared 8-test gate.

## Score against pre-registered criteria

- Product/scope, required-item gate, acceptance boundary: both pass. Neither
  invented an implementation, kiosk result, milestone completion or user
  acceptance. Bare's added PRODUCT decision was explicit and did not change
  behavior; Setup kept PRODUCT bytes unchanged.
- Role-correct history: both pass. Actual work/checks are in TASKS, required
  state in ROADMAP and reusable cancellation cause/fix in ISSUES. Bare also
  refreshed HANDOFF and expanded the run-specific evidence file. Setup left
  the stale HANDOFF intact, but its fresh successor still ignored the stale
  claim. No material continuation failure occurred in either arm.
- Successor accuracy: both pass on all requested facts. The next action in
  each is actual venue-kiosk verification and result capture, not email work.
- Material failure or unique Setup improvement: none observed. Stop per the
  pre-registered equivalence rule; no independent reproduction run is warranted.

## Friction and inference limits

CLI-reported tokens by stage (S1/S2/S3/S4): Bare
`19,588 / 21,307 / 13,682 / 12,888` = `67,465`; Setup
`15,514 / 18,244 / 12,217 / 12,033` = `58,008` (14.0% fewer observed).
Elapsed milliseconds: Bare `131,249 / 159,048 / 73,673 / 67,311` =
`431,281`; Setup `127,467 / 133,480 / 62,793 / 69,315` = `393,055`
(8.9% less observed). Model variance, different authored tests and
counterbalanced-but-single order prevent attributing these deltas to Setup.
Bare produced more regression cases and a more detailed separate run proof;
these are not automatically wasted checks. Setup's S4 five-field report still
used internal IDs and was long, so the readability preference from the
separate [blind report pair](../2026-09-27-report-ab/review-evidence.md)
did not reproduce as a uniformly terse handoff here. Report style was excluded
from the project-record performance score.

Conclusion: both arms preserved the project facts and enabled correct
handoff. JOENESS Setup's unique accuracy/performance benefit remains
**unproven** in this bounded sequence; this is not evidence that it is harmful
or that the product's broader goal has been fully tested.
