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

## Deployment status

Pending: release commit, remote Windows gate, main/tag, safe personal transition.
This preparation record is not a release-complete claim.
