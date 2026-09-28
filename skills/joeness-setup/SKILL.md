---
name: joeness-setup
description: Set up, revise, or detach a project's lightweight working instructions and record locations when the user asks to organize project work. Ordinary coding, questions, and status updates do not require setup.
---

# JOENESS Setup

First principle: classify project facts by role so successors can recover purpose,
current work, decisions, problems and next action. Chat summaries support, not
replace, those sources.

Connect this project to its existing sources of truth; do not install a work harness.
The global Independent Judgment Core remains separate. No stage engine, vendor
routing, background process, or mandatory five-document bundle.

## Inspect and propose

Identify the explicit project root, its AGENTS hierarchy, Git status and existing
product, plan, task, issue and design sources. Current files/target state outrank
old handoffs; use handoffs as locators. Do not replay completed work.

Reuse the project's canonical paths and terms. Only suggest a missing document
when a concrete recurring need has no existing home. The small
[AGENTS](assets/AGENTS.md), [ROADMAP](assets/ROADMAP.md), [TASK](assets/TASK.md),
[ISSUES](assets/ISSUES.md) and [DESIGN](assets/DESIGN.md) assets are adaptable
writing references, not a batch-copy instruction.

Classify a candidate record source by its stated purpose and actual use.
Run-scoped evaluation or proof artifacts are evidence for those runs, not a
general task or issue ledger merely because they contain work or failures.
If agreed routine recording has no suitable home, propose one small source
or mark the role unused; do not silently repurpose evidence artifacts.

Show a short change proposal: paths reused/created, the actual short AGENTS
connection, recording scope, and what stays unchanged. Include consent for
routine factual recording in that proposal. Once authorized, do not request
approval for each routine record. A request to inspect or propose is not approval
to apply. Preserve code changes authorized alongside a request not to record.

When using this skill for substantive work, lead with the terse work report
defined below. Say whether this turn only proposed changes or changed files.
Give technical paths and details after the report if useful; omit internal
helper states or hashes unless they explain a conflict. Do not imply that
checking a connection activates a background process.
If routine recording is agreed, include a concise work-receipt rule in the
proposed project connection; no status banner for unrelated questions.
If an existing roadmap defines approved ordered stages, milestones or release
scope, connect its current-stage lookup and required-item completion gate
briefly. A finished task does not finish its stage or release. Keep the actual
checklist, item states and evidence in the roadmap, not a copied list in AGENTS.
For a requested handoff to a person, start with the same terse work report:
what was done, changed, encountered, resolved, still open, and the recipient's
next action.
Put IDs, test counts, paths, and detailed proof after it. Preserve the distinction
between technical completion, user acceptance, and unverified work.

## Apply the short connection

Use [project-setup.ps1](scripts/project-setup.ps1) for the owned AGENTS block.
It supports Windows PowerShell and an explicit Git root; never run git init for
a non-Git project. Explain the boundary and offer a proposed text/manual handoff.

1. Run `-Check -ProjectPath <root>`.
2. For an authorized proposal call `-Apply`, with `-ExpectedRoot`,
   `-ExpectedTargetHash`, `-ExpectedStateHash` from that Check and
   `-ManagedBodyBase64` containing UTF-8 body text, without markers.
3. Read the JSON result. Only `current` confirms Apply; `partial` names unresolved
   files, not success. Inspect targets before any retry.

Hash inputs are lower-case SHA-256 or `absent`. The helper owns only
`JOENESS-SETUP` markers and `.joeness/setup-state.json`. State is an applied-block
baseline, not task memory or proof of approval. It travels with the project; do
not put absolute machine paths in it. Do not include secrets in records.

`edited`, `unowned`, `legacy`, malformed state, or source/root drift require
inspection and a scoped correction proposal. Do not delete/reseed state, move
markers, or replace the whole file to bypass a conflict. The helper does not
automatically merge internal user edits. Preserve outside bytes.

Create/update other project documents only within the approved proposal. Their
semantics are the agent's work, not this helper's job. Keep only actual paths,
authority roles, and agreed recording rules in AGENTS; never copy this full skill
or the implementation proposal there.

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
again. Before substantive new or resumed work, use the connected roadmap, if
one exists, to locate the current approved stage, required checks and the
request's place in that order. Verify progress against current files/Git/target
state; an old roadmap status or handoff is not proof of present completion.
If a request would skip an unmet dependency or change approved scope, explain
the conflict and seek an explicit direction decision. Independent authorized
work can proceed without falsely advancing the stage. Do not invent stages for
projects without them or silently reorder a roadmap in response to a proposal.
Put current task execution/results in its task source; reusable failure
cause, fix, verification and remaining workaround in its issue source. Change
roadmap direction or scope only for an explicit decision; update a required
item's check/evidence state only from actual verification. Change design only
within its own authority.
When a roadmap item or stage status changes, refresh its current-stage and
next-priority summary in the same document from the remaining open items.
Do not leave completed work listed as the next action; this status sync does
not authorize changing approved order or scope.
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
After substantive work, lead with six brief hyphen bullets in the user's
language (Korean labels: `작업`, `업데이트 파일`, `이슈`, `해결`, `남은 문제`, `다음 작업`).
Write each as a non-developer would describe the result: one clear point in
ordinary words, not a paragraph, unexplained acronym, requirement ID or
milestone code. Name the work and changed files by their purpose in this opening;
give exact filenames below when needed. Name only files actually changed and use
`없음` for an empty field. `이슈` is a problem encountered or confirmed; `해결`
is only a correction actually made and verified; `남은 문제` is what remains
unresolved or unverified. Do not hide an open problem under `해결` or invent one
to fill `남은 문제`. Take the next task only from current authorized scope or the
roadmap, otherwise say `없음`.

Add `상세 보고` only for material context or requested proof. Keep it concise too:
state the result in everyday words, then the necessary cause, evidence and next
boundary. Use one point per short sentence; replace jargon with a familiar word
instead of expanding every term into a lesson. Put an exact identifier, path or
test count beside the fact it supports when needed. Do not repeat the opening,
add background or list every inspected file merely to sound accessible. Retain
required verification gaps, scope decisions, cause/fix evidence and separate
user acceptance; a handoff needing them keeps them here, not in long opening
bullets. Compose directly from facts already checked; do not add a translation
pass, invent a next task, rerun checks or reread sources merely to format the reply.
Simple questions need no receipt; never claim a write that did not occur.

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
