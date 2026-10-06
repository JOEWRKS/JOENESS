# Numeric Pocket roadmap

Product authority: [product.md](product.md), approved 2026-10-01.
Scope: local, dependency-free command-line numeric utility; clamp negatives to
zero, then export values as JSON. No UI, network or mobile app.
Current stage: S1 release — in progress.
Next eligible delivery work: R2 JSON export, with R3/R4 checks; implementation
requires a work request. The current setup approval covers documentation only.

## S1 — Release

Entry condition: approved release scope in product.md (met).
Completion condition: technical outcomes R1–R4 verified, then separate required
release user acceptance R5. An unresolved criterion cannot support completion.
Approved order: clamp → JSON export and its checks → release user acceptance.

| ID | Required outcome | Status | Check / completion criterion | Proof or exact gap |
| --- | --- | --- | --- | --- |
| R1 | Clamp negative values to zero | complete | Existing focused test checks -2 → 0 and 4 → 4 | [T1](TASK.md#t1--2026-10-02-clamp); broader numeric boundaries are not covered |
| R2 | Export clamped values as JSON | not started | JSON output represents the clamped input values | main.mjs exposes clamp only; export implementation and check absent |
| R3 | Preserve input order in JSON | not started | Ordered input produces JSON values in the same order | Order check absent; depends on R2 |
| R4 | Encode an empty list as [] | not started | Empty input produces [] | Empty-list check absent; depends on R2 |
| R5 | Obtain release user acceptance | verification pending | User explicitly accepts the release after technical verification | Required by product.md; no approval yet |

Open criterion: supported numeric range and the release impact of
[I1](ISSUES.md#i1--large-integer-precision-loss) need an authorized product
decision. Do not infer that the workaround closes I1 or that BigInt is adopted.
This does not change the documented next delivery item or authorize a code fix.

Scope/order changes: none. User acceptance is separate from technical checks.
Optional/later: [documentation reviewer experiment](notes/reviewer-plan.md)
is independent and does not block this release. The mobile dashboard suggestion
in [historical handoff](HANDOFF.md) is unapproved and outside current scope.

Historical delivery source: [notes/delivery.md](notes/delivery.md); this file is
the sole current project delivery roadmap.
