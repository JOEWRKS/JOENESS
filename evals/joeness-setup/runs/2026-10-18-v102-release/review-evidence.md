# JOENESS 1.0.2 — source, personal installation and publication

Status: final-version local checks passed; awaiting source push/QA check before personal installation.
User authorized commit/push, personal update and new-version coordination with QA
on 2026-10-18. QA confirmed version1.0.2 and the sequence below after checking the
actual user message `01a14db2-1a1c-79c3-a5d2-cd08bd86c04c`.

QA owner: local thread `01a115f2-a9fd-7c81-930a-0e225906f843`, T044/Q5.
Source/install owner: this JOENESS task. QA owns main/tag/Release; no duplicate
publication here. Preserve existing JOENESS-v1.0.0 and JOENESS-v1.0.1 tags/Releases.

## Scope

- Only assets/AGENTS.md changes within the17-file payload; other16 files and
  F01–F06 executable contracts unchanged. Version identity pins in installer/tests
  change to1.0.2, without altered checks or behavioral expectations.
- Template SHA-256 stays `75069615fdff4c686286cefa80d6ea380940b76a53ccdbf039350ba871f63163`.
- Final1.0.2 manifest SHA-256: `73281c229fdeec674fb25b1b036bb8733295fa082397fe883a773279334407ba`.
- [Exact candidate behavior and failures](../2026-10-18-method-boundary/review-evidence.md),
  [user-adopted source](../2026-10-18-method-boundary/promotion-evidence.md).
- Four recent bounded experiment directories preserve this change's rationale,
  evidence and failures, not historical product payloads. No full session logs,
  credentials or actual game/project files. Existing docs/ISSUES.md and APP-001
  roadmap paragraph remain user-owned and outside the commit.
- No general creativity improvement, token reduction or automatic updates to
  existing project connections claimed. No new model runs for identical payload.

## Sequence / current status

1. Final-version local Windows workflow: all7 commands passed. [Exact outputs](local-gates.json): Node99/99, release contract, PS5/7 project safety27/27 each and both installation lifecycle suites. PSModulePath isolated for child shells; previous failed environment evidence retained in method-boundary.
2. Source commit and working-branch push; QA exact source/CI check: pending.
3. Verified backup, matching1.0.1 Remove →1.0.2 Apply/Check and installed proof: pending.
4. QA final SHA/CI/install verification → main/tag/Release: pending.

Personal transition uses the exact installed1.0.1 source `90db1b08ddaeccea7468c28bdc41f234ab7ccaaa`
and manifest `7e00a1b4981ba4a677c7214d287c17cb02e91faa42574a4c87c4bed356b2c36c`.
`install-and-check.mjs` fails closed on drift/unknown ownership, backs up only
17 managed files+state, preserves global AGENTS/config, and verifies the expected
two-file delta (template+state). Partial transitions are not retried blindly.

Protected preflight tag identities (git ls-remote origin):
- 1.0.0 object `e8d5170664ac2a68f30a6d44e14b961ee1e07a2e`, peeled `7a8f4e6b296f9aaa5a1ee198b0b69e3a206b630f`.
- 1.0.1 object `4a09ef9a1d8aaa20ba9a702a35c57a24d2042168`, peeled `a50e62fe3677aecca62125af9578abf2773a5400`.
- Existing1.0.2 tag absent at preflight. No tag writes by this task.

Preparation issue: the staging helper's initial private-key heuristic matched its
own regex source. It stopped before staging any files. Replaced the wildcard with
specific optional key-family names; no credential found and no product/test change.
