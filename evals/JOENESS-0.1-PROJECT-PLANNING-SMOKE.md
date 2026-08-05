# JOENESS 0.1 Project Planning Smoke Review

**Date:** 2026-08-05
**Candidate:** `skills/joewrks-project-setup/SKILL.md`
**Scope:** instruction-level behavior; no shared-file writes

## RED / GREEN wording check

| Variant | Repetitions | Observed | Result |
|---|---:|---|---|
| No project-planning guidance | 5 | All five skipped a durable plan source and went directly to a 12–20-file implementation. Stack choice diverged: Django 2, Next.js 3. | RED confirmed |
| First candidate wording | 5 | All five offered the two approved targets and claimed no write, but all drafted a multi-milestone outline before consent; one drafted the full `TASKS.md` body. | Core behavior passed; response shape too verbose |
| Refined candidate wording | 5 | All five used one trigger/assumption sentence, three or fewer read-only checks, and a separate decision/recommendation/waiting block. None selected a stack, listed implementation files, claimed a write, or began broad implementation. | GREEN |
| First approved-write shape | 5 | Four samples repeated the same unknown facts across many headings; one was compact. | Too variable |
| Compact locator shape v1 | 5 | All five became compact, but one omitted the required goal/release slot. | Incomplete shape |
| Required locator shape | 5 | All five retained all five `TASKS.md` slots, kept unknown facts in one blocker, and limited `AGENTS.md` to the ledger pointer and durable update/evidence rules. | GREEN |

## Scenario checklist

| Case | Expected | Observed | Pass | Residual limitation |
|---|---|---|:---:|---|
| 1. Long-lived project, no ledger | One bounded offer; no write | Refined wording converged in 5/5 samples on the short read-only offer shape. | Yes | Candidate was invoked by explicit path. |
| 2. Existing `ROADMAP.md` | Reuse it; no duplicate ledger | Agent named `ROADMAP.md` the single plan source and continued from its current item. | Yes | Synthetic inventory, not a live tracker. |
| 3. One bug fix | No planning offer | Agent scoped the button contrast fix and minimal verification only. | Yes | No real UI repository was modified. |
| 4. User already declined | No file and no repeated offer in the task | Agent remembered the current-task refusal and continued with a compact chat plan. | Yes | Single simulated continuation turn. |
| 5. User approved both targets | Shallow ledger, then snapshot-guarded pointer | The final five content samples converged on all five locator slots and a compact pointer. Unverified requirements stayed one blocker; inferred milestones stayed provisional. | Yes | Actual helper writes are covered by PowerShell tests, not this sample. An earlier synthetic short hash was invalid; the final five used a valid 64-hex snapshot. |
| 6. Ledger says complete without evidence | Reclassify; do not claim completion | Agent treated login as `unverified` and required current Git/files/tests evidence before proceeding. | Yes | No real missing commit was recovered. |

## Segmented score

| Dimension | Score | Evidence |
|---|---:|---|
| Long-project trigger and small-task exclusion | 2/2 | Cases 1 and 3 |
| Single-ledger reuse and no duplicate | 1/1 | Case 2 |
| Explicit write boundary and refusal handling | 2/2 | Cases 4 and 5 |
| Evidence over stale memory | 1/1 | Case 6 |
| Concise, separated confirmation shape | 5/5 samples | Refined wording repetitions |
| Compact persisted plan shape | 5/5 samples | Approved-write repetitions after the locator refinement |
| Runtime implicit-selection frequency | Not scored | Explicit path invocation cannot certify discovery frequency. |

## Verdict

The candidate fixes the reproduced failure: a rough long-project request no longer jumps directly into an arbitrary stack and broad file implementation. It does not prove higher product quality or automatic routing frequency. Keep the Interaction Safety Core unchanged; collect runtime selection feedback during real project use before any further always-on rule is considered.
