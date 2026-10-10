---
name: joeness-setup
description: Use when the user asks to install or connect JOENESS in a project, organize its working documents, or revise or detach its project setup. Ordinary coding, questions, and status updates do not require setup.
---

# JOENESS Setup

Make project goals, current work, evidence and unresolved risks retrievable by
their owners. Write each detailed fact once; link it from relevant summaries.
Write concisely at source, retaining cause, uncertainty, evidence and approval
boundaries. No fixed length cap, routine rewrite pass or history purge.

"Install JOENESS in this project" requests a project setup proposal, not a
personal package installation. Show changed paths, ownership transfers and
recording scope; apply after approval. No global payload, background worker,
stage engine, vendor routing or product/design decision-making.

## Inspect and normalize

Inspect the explicit root, AGENTS hierarchy, Git state, project goals, active
plans, work records, relevant code/target and linked proof. Follow topic links
as needed; do not exhaustively reread unrelated code, assets or history.
Current evidence outranks stale status; handoffs locate sources, not new scope.

An approved JOENESS setup establishes these canonical project files:
[AGENTS.md](assets/AGENTS.md), [ROADMAP.md](assets/ROADMAP.md),
[TASK.md](assets/TASK.md), [ISSUES.md](assets/ISSUES.md) and
[DESIGN.md](assets/DESIGN.md). ROADMAP is required, not an optional connection
to an arbitrary plan. Existing documents are inputs to normalization.
Retain compliant content; do not rewrite it just for appearance.
Where a role has no content, state "none", "not applicable" or "undecided"
truthfully. Do not invent issues, visual approval, goals or a staged sequence.

| Owner | Stores | Excludes |
| --- | --- | --- |
| AGENTS | Concise work rules, owner paths, reading/update triggers | Work history, progress, copied checklists |
| ROADMAP | Project delivery scope, ordered stages, required outcomes/checks, current states, gaps, next eligible work | Common operating rules, ownership tables, detailed execution/research |
| TASK | Per-work result, changed files, target/check/result/limits, proof; links roadmap item | A second current-stage ledger, reusable research detail |
| ISSUES | Open defects and effective workarounds: cause/uncertainty, residual risk, closure condition and proof link | Every unfinished feature, complete task logs |
| DESIGN | Visual rules and authority/version/scope; approved versus proposed changes | Product meaning, delivery progress, execution proof |
| Library/ | Topic-based research, references and reusable technical knowledge with sources | Current progress, adopted product/design approval, competing plans |

Existing Product/decision authorities retain product meaning; do not create a
mandatory PRODUCT.md or replace them with ROADMAP. DESIGN may link an existing
approved visual source without copying it. Canonical file names do not permit
overwriting an occupied file or bypassing project instructions.

For each existing source, check project, goal, scope and currency before using
it. A feature plan or evaluation run cannot represent the whole project.
Propose exact old section → new owner mappings. Transfer live ownership, keep
dated evidence and links, and mark superseded live summaries as historical or
limited in scope. Do not leave two active roadmaps. Preserve distinct decisions,
completed work, pending checks and effective workarounds. If a required transfer
is not authorized or cannot preserve its sources, report incomplete normalization,
not complete setup. Do not silently fall back to the old arbitrary-plan model.

Library uses topic files (for example research.md or references.md), not date
folders. Use an existing relevant topic/section before adding a file; split only
for independent retrieval/reuse/update needs or demonstrated navigation burden.
Create the folder when there is material to store, not empty placeholder notes.
Record source, checked date, observation versus inference, applicable scope and
remaining uncertainty. A research suggestion is not an adopted decision.
A one-off review normally belongs in TASK. Keep brief completion methods on
ROADMAP items; link an existing reusable method if detail warrants it. Do not
automatically create an EVALUATION.md, criteria file or report for each role.

## Proposal and application

Show:
- Actual files/sections to retain, create, transfer or mark superseded.
- A short AGENTS connection: exact owners, task-based reads/updates, concise
  records, stage-completion gate and six-field report meanings below.
- Routine factual recording scope and preserved code/Product/approval boundaries.
- Unknown goals/criteria and any ownership conflict that prevents complete setup.

Inspection/proposal alone authorizes no writes. Approval covers only this plan.
Within agreed recording scope, routine facts need no repeated approval.
A no-record request does not cancel separately authorized implementation.
Carry these recording boundaries into the short project connection: never copy
credentials or unnecessary personal data into records, reports or Git. Preserve
meaning with a redacted summary and an authorized restricted source locator
that does not itself expose secrets. If storage/access scope is unclear, leave
raw material at its source and report the evidence-access gap, not missing proof.

Use [project-setup.ps1](scripts/project-setup.ps1) for the owned AGENTS block.
It supports Windows PowerShell and an explicit Git root; do not run git init
for a non-Git project. Offer the proposed text/manual handoff instead.

1. Check with `-Check -ProjectPath <root>`. An oversized AGENTS or a block beyond
   the observed initial window is blocked. Do not displace or shorten user rules.
2. Apply the approved body with `-Apply -ExpectedRoot -ExpectedTargetHash
   -ExpectedStateHash -ManagedBodyBase64`; use actual Check values and UTF-8 body
   without markers. Recheck after any authorized outside-block AGENTS edit.
3. Only `current` confirms block application. `partial` names unresolved files.
   Inspect current targets before retrying. No blind retry or completion claim.
4. Verify actual instruction delivery separately in a fresh project context,
   when authorized and available; otherwise report that check unverified.

Hashes are lower-case SHA-256 or `absent`. The helper owns only JOENESS-SETUP
markers and .joeness/setup-state.json. State is the applied-block baseline,
not task memory, approval or a document-quality certificate. Keep it portable.
Edited/unowned/legacy markers, malformed state or root/source drift require
inspection and a scoped correction. Do not reseed state, move markers, replace
the whole file or overwrite outside bytes to bypass a conflict.

Other document edits are semantic work within the approved mapping, not helper
automation. Approved history transfer outside the block must preserve evidence;
do not copy this skill or the design proposal into AGENTS. Report per-file partial
application truthfully; block success cannot hide an unfinished document transfer.

## Roadmap and suitability check

ROADMAP states project scope and Product source, current stage and next eligible
work. Each stage has an entry condition and completion condition. Each required
outcome has an ID, status, check/criterion and proof or exact gap. Separate checks
that can independently pass; do not turn every implementation step into a gate.
Use the approved order. A small project can have one stage. With unknown goals,
write a direction-pending boundary and the decision needed, not a fictional stage.
Unconfirmed criteria remain pending and cannot support a completion verdict.
Keep optional/later ideas outside required stage outcomes.

States: not started, in progress, verification pending, on hold, complete,
removed from scope. Holds and missing required checks remain open. Scope removal
requires an authorized decision/reason; retain the item, never count it as passed.
Keep technical verification and required user acceptance distinct.
Where a required outcome depends on an external specialist verdict, connect the
explicit [review gate](references/review-gate.md): pinned scope/criteria, current
target inputs and result path. Never substitute technical checks for visual
compliance. The gate is opt-in to that required scope, not an always-on engine.

Before reporting setup complete, read back actual documents, not just templates:
- Is this the whole project's approved scope, not merely an available subplan?
- Are required outcomes independently checkable, with entry/completion conditions,
  accurate proof/gaps and current/next work? Trace each required item.
- Does each fact have one owner? Check forbidden content, competing current
  summaries, obsolete restrictions and unnecessary files, not just field presence.
- Can a maintainer find the next action and its ground without reading all history?
- Are old evidence, effective workarounds and approval boundaries preserved?

Correct authorized gaps or identify them precisely. Report separately:
connection integrity; document suitability; fresh-context delivery; task-result
verification. A direction-pending starter is not a completed staged roadmap.
User acceptance remains separate. No general performance or token-saving claim.

## Work after setup

Normal sessions follow the short AGENTS connection; do not invoke setup again.
AGENTS governs working method. For content, priority follows the question:
approved owners govern intent, actual target and applicable proof govern facts.
Neither working code nor a newer note grants approval. Resolve conflicts at the
owner; keep only affected verdicts open.

| Work | Read first → as needed | Update within recording consent |
| --- | --- | --- |
| New/resumed work | ROADMAP current item → related TASK, ISSUES and actual target | TASK result, related ISSUES, affected ROADMAP state/next |
| Defect | ISSUES and actual target → TASK proof, ROADMAP impact | TASK check, ISSUES residual risk/closure, affected ROADMAP |
| Visual | ROADMAP scope → DESIGN authority, relevant Library | TASK proof; DESIGN only for authorized decisions; ROADMAP |
| Research | ROADMAP question → relevant Library and sources | Library detail, TASK result/link, affected ROADMAP |
| Direction change | ROADMAP → Product/decision source and relevant evidence | Authorized direction in its owner; ROADMAP scope/order |
| Completion/handoff | ROADMAP required items → linked TASK proof, ISSUES, applicable approval | Changed facts only; no duplicate handoff ledger |

Read relevant sections, not every file in the row. Before selecting next work
or declaring evidence missing, inspect linked proof and the relevant record index.
Failed lookup does not establish that a check never occurred. Reuse applicable
proof; rerun only for an identified change, failure or uncovered condition.

The worker records execution/checks in TASK and updates affected ROADMAP
state/gap/next before handoff. The investigator records unresolved cause,
workaround, residual risk and closure evidence in ISSUES; a workaround is not
a complete fix. On verified closure, leave a concise closed status/proof link;
preserve detailed history in TASK, topic knowledge or retrievable Git.
A brief roadmap gap linked to ISSUES is not a second detailed issue record.
If nothing changed, report without appending a repeat verification entry.
Questions, opinions and no-record requests do not cause record writes.

For parallel work on shared records, name one integrator for affected entries;
other workers hand over scoped results and proof instead of overwriting them.
The integrator rereads current entries and compares the working baseline before saving,
merges independent changes, and preserves both sources if intent or approval conflicts.
Leave only the conflict and dependent verdict open; continue independent authorized work.
If the baseline changed, reconcile before retrying. This is not an atomic lock:
the setup helper protects only its AGENTS block/state, not TASK/ROADMAP writes.

Before starting dependent work, check its entry conditions. Independent authorized
work may proceed without falsely advancing a blocked stage. Before declaring a
stage/milestone/release complete, check every required item and actual evidence;
for a connected specialist gate, run its current-input check before advancing
the affected status. Missing/failed/stale results keep that verdict pending.
Implementation, technical verification, visual compliance and user acceptance
remain separate. The helper rejects invalid claims but cannot intercept direct
document edits or natural-language bypasses; do not claim host enforcement.
optional ideas do not block it. Changing approved scope/order/criteria requires
authorized direction. A finished task does not finish its stage. A read/write
failure does not erase completed implementation: report the handoff gap and
continue independent authorized work.

For requested history cleanup, retrieve the latest actual detail at an exact
Git commit:path before replacing it with a locator. Older commits do not preserve
uncommitted updates; missing history or ZIP copies are not archives. Keep active
risks and workarounds visible. Do not add an archive engine or rewrite Git history.

## User guidance and reports

After confirmed setup, read [usage.md](references/usage.md). Explain actual
created/changed files, the five roles plus topic Library, recording scope and
ordinary work/resume/no-record requests. State what remains undecided or
unverified. Do not present unused templates as files already created.

After substantive work or a human handoff, start with six hyphen bullets in the
user's language (Korean: 작업, 업데이트 파일, 이슈, 해결, 남은 문제, 다음 작업).
Use everyday words, noun phrases or short sentences, not paragraphs.
Name only files actually changed, by purpose; use 없음 for empty fields.
이슈 = encountered problem; 해결 = verified fix, not a passing check;
남은 문제 = unresolved/unverified work. Next work comes from authorized scope
or ROADMAP. Put IDs, exact paths and necessary evidence after the opening.

Add 상세 보고 only for a material cause, proof, verification limit, scope or
acceptance boundary not conveyed above. Keep it brief; no repetition, extra
rewrite/check pass or invented writes. Simple questions need no work report.

## Stop recording, detach, uninstall

"Stop automatic recording" changes the authorized managed body to retain source
navigation but disable record writes; it is not Detach.
"Detach this project" uses a fresh Check then `-Detach` with the three expected
values above. Remove only the unchanged owned block and matching separators;
leave ordinary files, including an empty AGENTS. Edited blocks remain preserved.
Package uninstall is separate; do not detach projects as its side effect.
Already open sessions may need restarting to reload instructions.
