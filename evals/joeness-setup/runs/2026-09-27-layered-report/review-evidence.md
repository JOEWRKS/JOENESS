# Layered report information-retention check — observed result

The [pre-registration](preregister.md) was committed at `9893ec1` before the
run. One fresh `gpt-6-astra / xhigh` Codex CLI `0.158.0-alpha.2` context read
the unchanged Setup project at
`034ae229b483b227306a45ce833d51d5886928f5` in read-only mode. The
process exited 0. The project's Git worktree remained clean. The exact
[response](response.md) is retained; no skill source, installed skill, project
record or code was changed.

## Pre-registered information check

| Required fact | Observed in full response |
|---|---|
| Reservation fields retained; cancellation retains item and marks it cancelled; local checks passed | Present with recorded 3/3 and 5/5 results. |
| `filter` deletion cause, `map` status-update fix; current sources outrank old handoff and run diagnostic | Present with code references and explicit stale-evidence distinction. |
| Actual venue-kiosk result missing, M1 incomplete, local checks not a substitute | Present. |
| User acceptance separate and not granted; email excluded from M1/deferred without later implementation approval | Present. |
| One next action, no fabricated write or kiosk proof | Actual kiosk check and result capture; no write claimed. |

The first five named lines use plain Korean and avoid internal IDs, code names
and test counts. They let a reader see that local fixes exist, actual on-site
verification is missing, user acceptance is pending, and the next action is a
real-device check. However, `작업: 현재 자료로 인수인계 확인` is generic rather than
naming the two completed fixes. The `해결` line partially compensates. The
answer has detailed evidence below, so this instance did **not** lose the
pre-registered facts through simplification, but the first glance is not fully
informative by itself. It also used plain lines rather than the skill's
requested hyphen bullets and no explicit `상세 보고` heading. This is a small
presentation mismatch, not a factual failure.

CLI-reported usage was 18,606 tokens and 101,471 ms. The earlier fresh S4
handoff on the same project under its original prompt reported 12,033 tokens
and 69,315 ms: this run used 6,573 more tokens (+54.6%) and 32,156 more ms
(+46.4%). The prompts differed and model sampling varied, so the delta is
not a causal estimate of a layered format's overhead. Still, this one run does
not support claiming that stronger layperson wording is free. It also ran the
local checks during its own read-only inspection; no extra check was needed
to format the five lines, but the prompt did not prevent that work.

Decision: preserve the current JOENESS rule. It already calls for short plain
language first and technical proof below. The observed old handoff overfilled
the top lines; this extra prompt shows a feasible separation without fact loss
in one case, yet it neither proves reliable automatic compliance nor justifies
a stronger universal instruction. Keep the user's later readability feedback
in the [blind A/B record](../2026-09-27-report-ab/review-evidence.md). No
product source update or install is warranted from this evidence alone.
