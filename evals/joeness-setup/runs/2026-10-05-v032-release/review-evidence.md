# JOENESS 0.3.2 release preparation

2026-10-05. User approved GitHub main/tag deployment and personal installation.
Existing project documents are not automatically migrated. Game work is excluded.

## Frozen scope

- One public joeness-setup skill; no always-on payload, vendor, or new dependency.
- Explicit document ownership, worker update responsibility, and concise records.
- Roadmap owns goals/criteria/current states/next work; TASK owns execution proof.
- Only version identity and release documentation changed after behavioral review;
  all nine runtime files retain their previously tested manifest hashes.
- Evidence: [ownership review](../2026-10-05-document-ownership/review-evidence.md),
  [actual work review](../2026-10-05-document-ownership/dungeon-live-work-review.md).
  Preserve initial proposal/report failures. Actual-work updates were explicitly
  requested, not an unprompted-autonomy or performance A/B test. Long-horizon
  reliability, general accuracy gains and token savings remain unverified.

## Local preparation

[Full local matrix](local-checks.json): release contract PASS; project safety
27/27 on Windows PowerShell and PowerShell 7; installation lifecycle PASS on
both; Node 9/9; diff whitespace check PASS. Evidence excludes credentials,
full rollouts, personal-save copies and Codex-home copies. Credential-pattern
scan of the new ownership evidence found no matches.

The GitHub CLI is unavailable on PATH; use Git for publication and the GitHub
Actions API for the exact-commit result. Do not infer remote success from local tests.

## Confirmed deployment

- Release commit: `af9fc62c0534223bf09faf3fac84943edfe4597a`.
- Manifest SHA-256: `67fb65f498a857cb6985c3e2f737d08889459ede9a41bd68cc51b2238b24bd10`.
- Release contract rerun on the exact commit: PASS. The full local matrix tested
  identical runtime bytes. [Windows gate run 37220093687](https://github.com/JOEWRKS/JOENESS/actions/runs/37220093687)
  completed successfully on that exact SHA, including two-shell safety/lifecycle,
  Node checks, and whitespace check in a fresh checkout.
- Remote main fast-forwarded from `bb1f549` to the tested release commit; annotated
  `JOENESS-v0.3.2` points to the same commit. Both remote refs verified after push.
- Exact prior tagged package: `Check current → Remove removed`; new package:
  `Check ready → Apply current → Check current`. Nine installed files and state
  match the frozen manifest. Prior version remains recoverable from its tag.
- Global AGENTS and all other 428 installed skill files retain their pre-migration
  hashes. No project connection or game file changed by this release operation.
- One local orchestration variable collided with a dot-sourced PowerShell switch.
  It failed after read-only Check, before removal or apply. Fresh Check and distinct
  variable names resolved it; no installer code change or ownership bypass.

[Deployment values](deployment.json). This record and final README/roadmap updates
are documentation-only follow-up; their main HEAD is not the release tag SHA.
New settings are available on the next turn; a fresh chat is preferable when an
existing session has already loaded old instructions. Existing projects keep their
current connection until a separately approved project update.
