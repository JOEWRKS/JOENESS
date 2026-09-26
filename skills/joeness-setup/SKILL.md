---
name: joeness-setup
description: Set up, revise, or detach a project's lightweight working instructions and record locations when the user asks to organize project work. Ordinary coding, questions, and status updates do not require setup.
---

# JOENESS Setup

Connect this project to its existing sources of truth; do not install a work harness.
The global Independent Judgment Core remains separate. No stages, vendor routing,
background process, or mandatory five-document bundle.

## Inspect and propose

Identify the explicit project root, its AGENTS hierarchy, Git status and existing
product, plan, task, issue and design sources. Current files/target state outrank
old handoffs; use handoffs as locators. Do not replay completed work.

Reuse the project's canonical paths and terms. Only suggest a missing document
when a concrete recurring need has no existing home. The small
[AGENTS](assets/AGENTS.md), [ROADMAP](assets/ROADMAP.md), [TASK](assets/TASK.md),
[ISSUES](assets/ISSUES.md) and [DESIGN](assets/DESIGN.md) assets are adaptable
writing references, not a batch-copy instruction.

Show a short change proposal: paths reused/created, the actual short AGENTS
connection, recording scope, and what stays unchanged. Include consent for
routine factual recording in that proposal. Once authorized, do not request
approval for each routine record. A request to inspect or propose is not approval
to apply. Preserve code changes authorized alongside a request not to record.

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
again. Put current task execution/results in its task source; reusable failure
cause, fix, verification and remaining workaround in its issue source. Change a
roadmap only for an explicit decision, and design only within its own authority.
Questions, opinions, explanations and no-record requests are not facts to append.
If a required source is inaccessible or a record write fails, finish independent
authorized work and report the exact missing/read/write boundary.

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
