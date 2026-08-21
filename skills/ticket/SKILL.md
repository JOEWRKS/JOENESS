---
name: ticket
description: Use when an important planned task has observable acceptance criteria and requires separated implementation and context-separated review, or when the user or project contract requires managed ticket delivery.
---

# Ticket

Run one item through an implementer and new-context evaluator. Shared model and permissions limit independence.

## Route

- Important means project-designated high risk; data/persistence, security/privacy, payment, deployment/release, visual/runtime acceptance; or broad multi-component work with material rework risk. Skip low-risk fixes/read-only work/explanations, and low-risk changes decided by one deterministic check. Explicit use wins.
- With no usable tracker or prepared item, use `$project` first. Otherwise keep the tracker, Issue, or ledger as the single source; no parallel document.
- Require the exact Git root, authoritative goal, item, scope/exclusions, observable criteria, evidence needs, and full 40-character `BASE` SHA. Material gaps block.

## Roles

The root agent is PM and does not edit product files. Finish tracker changes before `BASE`; freeze it through verdict. States:

`READY -> IMPLEMENTING -> REVIEW -> ACCEPTED | REWORK | UNVERIFIED | USER_DECISION`

The implementer is the only intentional product writer. It receives the ticket and `BASE` with fixed scope and criteria, then implements, checks, and commits. Bind review to the full 40-character `CANDIDATE` SHA; a branch, file, narration, or completion claim is not identity or verdict.

## Evaluate

For every candidate, create a new evaluator without inherited conversation history (`fork_turns: "none"` when supported); never substitute same-context role-play. Use a separate clean evaluation worktree detached at `CANDIDATE`. If either is unavailable, review is `UNVERIFIED`.

Give it the original request, minimum authoritative project contracts referenced by the ticket, exact ticket, both SHAs, and evidence locations; withhold the implementer's narrative until its first verdict. It first checks ticket-to-goal alignment; mismatch requires ticket correction or `USER_DECISION`, not code repair.

It derives ancestry and `BASE..CANDIDATE` diff itself. Before and after review, require `HEAD == CANDIDATE` plus snapshots of tracked, untracked, and relevant generated state. Mutation invalidates the verdict. Read-only intent forbids product, tracker, or criteria edits.

Implementer logs and self-authored evidence are leads, not `PASS`. `PASS` needs evaluator inspection and direct check, or trusted CI/runtime evidence bound to `CANDIDATE`. Each criterion gets `PASS`, `FAIL`, or `UNVERIFIED`: any `FAIL` -> `REWORK`; else any required `UNVERIFIED` -> `UNVERIFIED`; only all required `PASS` -> `ACCEPTED`.

For visual criteria the evaluator applies `$visual-check` to the exact candidate. Its `PASS` does not replace the root PM's direct `$visual-check` inspection of the same exact result before a final visual claim. Either inspection unavailable -> `UNVERIFIED`.

## Stop

A changed candidate invalidates the verdict and needs another no-history evaluator. Allow one automatic rework round limited to failed criteria. The same failure again or no material change -> `USER_DECISION`. Missing evidence stays `UNVERIFIED`; reserve `USER_DECISION` for goal, scope, authority, or acceptance choices. JOENESS Core's stricter limit wins.

Report naturally in the user's language with result and verified boundary first. Use no fixed report labels or line count and create no document merely for this skill. Update the existing tracker after verdict only when authorized.
