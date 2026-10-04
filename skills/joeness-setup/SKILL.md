---
name: joeness-setup
description: Use when the user asks to install or connect JOENESS in a project, organize its working documents, or revise or detach its project setup. Ordinary coding, questions, and status updates do not require setup.
---

# JOENESS Setup

First principle: classify project facts by role so successors can recover purpose,
current work, decisions, problems and next action. Chat summaries support, not
replace, those sources.
Write a material fact once in its primary source; where another role needs it,
link the exact item instead of repeating its explanation. Keep the record short
from the start without dropping its evidence, open boundary or approval status.

Treat "install JOENESS in this project" as a project-connection request: show
the proposed file changes and recording scope before applying them. It is not
permission to install or replace the personal package. Connect this project to
its existing sources of truth; do not install a work harness.
No stage engine, vendor routing, background process, or mandatory
five-document bundle.

## Inspect and propose

Identify the explicit project root, its AGENTS hierarchy, Git status and existing
product, plan, task, issue and design sources. Current files/target state outrank
old handoffs; use handoffs as locators. Do not replay completed work.

Reuse the project's canonical paths and terms. A roadmap role is the default
for a project connection: reuse an existing direction source, whatever its
filename, or propose a small `ROADMAP.md` if none exists. Do not create a
second roadmap. Include an explicit opt out in the one setup proposal; do not
reconsider it on every task. Suggest other missing documents only when a
concrete recurring need has no existing home. The small
[AGENTS](assets/AGENTS.md), [ROADMAP](assets/ROADMAP.md), [TASK](assets/TASK.md),
[ISSUES](assets/ISSUES.md) and [DESIGN](assets/DESIGN.md) assets are adaptable
writing references, not a batch-copy instruction.

Classify a candidate record source by its stated purpose and actual use.
Run-scoped evaluation or proof artifacts are evidence for those runs, not a
general task or issue ledger merely because they contain work or failures.
If agreed routine recording has no suitable home, propose one small source
or mark the role unused; do not silently repurpose evidence artifacts.

Review document restructuring only for observed instruction truncation, a
reproduced structure-caused lookup error, or at least two independent weaker
signals: always-read instructions at 75% of a known loader limit, conflicting
authority across files, forced unrelated reading, duplicated/no primary home,
or a fresh reader unable to locate done/open/next. An unknown limit supplies
no percentage signal. Propose the smallest mapping with evidence, preserved
authority/history and expected reading cost; a local conflict may need only a
local fix. Do not move or delete user documents without approval.

Show a short change proposal: paths reused/created, the actual short AGENTS
connection, the default roadmap or its opt out, recording scope, and what stays
unchanged. Include consent for routine factual recording in that proposal. Once
authorized, do not request
approval for each routine record. A request to inspect or propose is not approval
to apply. Preserve code changes authorized alongside a request not to record.

When using this skill for substantive work, lead with the terse work report
defined below. Say whether this turn only proposed changes or changed files.
Give technical paths and details after the report if useful; omit internal
helper states or hashes unless they explain a conflict. Do not imply that
checking a connection activates a background process.
If routine recording is agreed, include a concise work-receipt rule in the
proposed project connection, preserving the field meanings below (especially
`해결` = verified fix, not a passing check); no status banner for unrelated questions.
Connect the roadmap's current-stage lookup and required-item completion gate
briefly. A finished task does not finish its stage or release. If an existing
direction source is only a priority list, do not claim it is a stage roadmap:
show the missing conditions and complete them when staged planning is in the
approved scope. Keep the actual checklist, item states and evidence in its
canonical source, not a copied list in AGENTS.
For a requested handoff to a person, start with the same terse work report:
what was done, changed, encountered, resolved, still open, and the recipient's
next action.
Put IDs, test counts, paths, and detailed proof after it. Preserve the distinction
between technical completion, user acceptance, and unverified work.

## Apply the short connection

Use [project-setup.ps1](scripts/project-setup.ps1) for the owned AGENTS block.
It supports Windows PowerShell and an explicit Git root; never run git init for
a non-Git project. Explain the boundary and offer a proposed text/manual handoff.

1. Run `-Check -ProjectPath <root>`. A block beyond the observed initial
   `AGENTS.md` window, or a file too long to fit with the front block,
   reports `blocked`. Do not shorten user-owned instructions without approval;
   clean ownership alone does not prove that a new chat received the rule.
2. For an authorized proposal call `-Apply`, with `-ExpectedRoot`,
   `-ExpectedTargetHash`, `-ExpectedStateHash` from that Check and
   `-ManagedBodyBase64` containing UTF-8 body text, without markers.
   New connections go near the beginning of `AGENTS.md`.
3. A clean block beyond the window means the file cannot fit in that window.
   Do not offer automatic relocation: moving it forward would displace other
   instructions. Propose a user-approved reduction of those instructions or
   inspect and detach the connection. Then recheck the actual target.
4. Read the JSON result. Only `current` confirms Apply; `partial`
   names unresolved files, not success. Inspect targets before any retry.
   Recheck and use a fresh project chat to verify actual instruction delivery.

`current` verifies the managed connection only. Before reporting setup complete,
read back the actual AGENTS and the created/reused roadmap. Confirm the agreed
path exists, one direction source is used, and the connection carries lookup,
dependency, stage-completion and status-update rules (existing project rules
may supply them). Check the roadmap's current/next and stage fields below,
including evidence gaps; a marker or filename is not enough. Correct missing
approved content before finishing, or report the precise incomplete part.
An explicit opt out or direction-pending starter is a valid stated boundary.

Hash inputs are lower-case SHA-256 or `absent`. The helper owns only
`JOENESS-SETUP` markers and `.joeness/setup-state.json`. State is an applied-block
baseline, not task memory or proof of approval. It travels with the project; do
not put absolute machine paths in it. Do not include secrets in records.

`edited`, `unowned`, `legacy`, malformed state, or source/root drift require
inspection and a scoped correction proposal. Do not manually move markers,
delete/reseed state, or replace the whole file to bypass a conflict. The helper does not
automatically merge internal user edits. Preserve outside bytes.

Create/update other project documents only within the approved proposal. Their
semantics are the agent's work, not this helper's job. Keep only actual paths,
authority roles, and agreed recording rules in AGENTS; never copy this full skill
or the implementation proposal there.
For a new roadmap or approved stage addition, finish with the known goal,
current stage, entry condition, required outcomes, each check and evidence gap,
completion condition, and next eligible work. Split outcomes whose checks can
pass independently; do not make a checkbox for every implementation detail.
One small stage suffices when appropriate. With no approved goal, make a
direction-pending roadmap and name the bounded decision needed; do not fabricate
a stage. Mark unknown decisions as undecided and make their resolution the next
eligible action only when they block dependent work. Do not invent approval,
criteria or a fixed sequence. A user request for only a priority list remains a
priority list, not a completed stage roadmap. If a project opted out of a
roadmap and later gains an approved ordered goal, propose its roadmap role then.

## Explain the completed setup

After confirmed setup, read [usage.md](references/usage.md) and give a short
onboarding response in the user's language: actual created/changed files;
the five document roles mapped to actual reused paths (unused roles marked not
used); the agreed recording scope; examples for ordinary work, resume, past-issue
lookup and opting out of recording. Explain that setup is not needed on every
task. Present this in chat, not as another document or a copy in project AGENTS.
For a proposal, blocked or partial result, report that actual boundary instead
of presenting setup as complete. The usage guide's default filenames are role
examples, not evidence that those files exist.

## Normal work after setup

Normal sessions use the project's short AGENTS connection without invoking setup
again. Its source list is an index, not a read-every-file checklist: read the
roles relevant to the request, and open DESIGN only for visual work or an
approval conflict. Before substantive new or resumed work, use the connected
roadmap to locate the current approved stage or direction-pending boundary,
required checks and the
request's place in that order. Verify progress against current files/Git/target
state; an old roadmap status or handoff is not proof of present completion.
If the project explicitly opted out, use its existing task and product sources
until a roadmap role is approved. If a request would skip an unmet entry condition
or change approved scope, explain the conflict and seek an explicit direction
decision. Independent authorized
work can proceed without falsely advancing the stage. Do not invent stages for
projects without them or silently reorder a roadmap in response to a proposal.
Put current task execution/check results in its task source; reusable failure
cause, fix and remaining workaround in its issue source, linking the TASK
verification instead of copying it. Change
roadmap direction or scope only for an explicit decision; update a required
item's check/evidence state only from actual verification. Change design only
within its own authority.
Before selecting next work or declaring evidence missing, check the item's
linked proof and search the relevant task/report index for matching work.
Resolve conflicting summaries against that evidence; an unsuccessful lookup
is not proof that a check was never done. Reuse applicable results. Repeat only
for an identified code/target change, failure or uncovered condition, limited
to that difference. When status changes, refresh current/next from the remaining
open conditions without changing approved order or scope.
Before declaring an approved stage, milestone or release complete, review every
required roadmap item and its actual check/evidence. Not started, in progress,
verification pending and on hold remain open. Scope removal is a recorded
authorized decision with a reason, not deletion or a completed check. Report
the current stage, open items and next eligible work. Optional or later ideas
are not automatic blockers. A task can finish while its stage remains open;
keep both states visible and user acceptance separate.
If a resumed task is already recorded complete and inspection finds no changed
task fact, report its status without appending a repeat verification note.
Questions, opinions, explanations and no-record requests are not facts to append.
If a required source is inaccessible or a record write fails, finish independent
authorized work and report the exact missing/read/write boundary.
After substantive work, open with six hyphen bullets in the user's language
(Korean: `작업`, `업데이트 파일`, `이슈`, `해결`, `남은 문제`, `다음 작업`).
Each bullet is one concrete fact in everyday words: a noun phrase or short
sentence, not a paragraph. Name only files changed in this work, by purpose;
use `없음` when a field is empty. `이슈` names a problem, `해결` a verified fix,
and `남은 문제` unresolved or unverified work. Derive `다음 작업` from authorized
scope or the roadmap. Keep codes and exact paths out of the opening.

Add `상세 보고` only when the six lines cannot carry a material cause, proof,
verification limit, scope or acceptance boundary. State checked facts and
their sources briefly in everyday words; do not repeat the six lines or add a
separate rewrite or verification pass.
Simple questions need no work report; never claim a write that did not occur.

When a user requests version cleanup, keep active issues and effective workarounds
visible. Compact resolved details only after retrieving the *latest actual detail*
from the exact Git commit and path; record that retrieval reference. A commit from
before an uncommitted update does not preserve that update. Missing history,
invalid refs or ZIP copies are not archives: retain detail and state the limitation.
Do not add an archive engine or rewrite Git history.

## Stop recording, detach, uninstall

"Stop automatic recording" updates the authorized managed body to retain source
navigation but disable routine record writes. It is not Detach.
"Detach this project" uses a fresh Check then `-Detach` with the three expected
values above; this removes only the unchanged owned block and matching owned
separators, leaving ordinary documents and even an empty AGENTS.md.
If the block was edited, preserve it and explain the conflict.
"Uninstall JOENESS" is a separate package operation; do not search for or detach
projects as a side effect. Existing sessions may need restarting to reload rules.
