---
name: joewrks-project-setup
description: Use when the user explicitly asks to persist a project contract, or starts or materially expands a long-lived development or design project with multiple sessions, milestones, collaborators, or release work and no concrete plan.
---

# JOEWRKS Project Setup

Keep one verified durable project contract and at most one planning ledger. Persistence is context, not proof or additional authority.

## Route

| Observed state | Action |
|---|---|
| Small fix, edit, research, explanation, or brainstorming | Stop this skill; continue normally. |
| No verifiable Git project root | Use a compact chat plan; create nothing. |
| Usable authoritative tracker exists | Use it as the single source; do not offer or copy another ledger. |
| Long-lived project, no concrete plan or ledger | Make the read-only offer below once in the current task. |
| Explicit persist/setup/apply request | Disclose exact targets, then write only the approved targets. |

1. Run `scripts/project-setup.ps1 -Check -ProjectPath <path>`. Bind all later work to its exact `projectRoot` and `targetHash`.
2. Read only the minimum project rules and evidence. Ledger discovery is limited to a user-named tracker, documents linked by project rules, root `TASKS.md`, `ROADMAP.md`, `TODO.md`, and a directly relevant approved plan.
3. Reconcile documents with current Git, files, commands, tests, builds, and observed external state. Do not infer current progress from filenames or narration.

For implicit use with no ledger, the pre-consent response contains only one sentence naming the long-horizon trigger and current reversible assumption, up to three read-only checks, and this body-separated offer. Plan detail belongs in the approved ledger:

```text
Project roadmap
Decision: Create TASKS.md and add its location and update rule to the project AGENTS.md?
Recommended: Yes, because this work spans multiple milestones or sessions.
Waiting: Permanent planning files and plan-based broad implementation. Read-only checks and a compact current-step plan can continue.
```

Name both targets. Do not write before an explicit yes. A refusal applies only to the current task: create no files, do not ask again in that task, and continue within scope using a compact chat plan.

## Persist

Use an existing tracker instead of `TASKS.md`. Otherwise create a UTF-8 root `TASKS.md`, preferably no more than 4 KiB, with only:

- product goal and authoritative release-condition link or one-line summary;
- shallow future milestones, current milestone, and next one to three priorities;
- each current item's outcome, acceptance condition, status, and owner only when shared;
- current blockers, decisions, and authoritative links;
- compact evidence references for completed work; and
- last review date and evidence types checked.

Mark inferred milestones `provisional`; they are not new requirements, completion gates, or external-action authority. The ledger is not proof. Before starting or completing work, recheck current evidence and keep unsupported states partial or unverified. Update only at milestone, scope, release-condition, decision, blocker, or planned-handoff boundaries, never per edit, command, response, or commit.

Create and verify `TASKS.md` first. Then prepare the existing managed `AGENTS.md` body, preferably 2 KiB and at most 8 KiB. Preserve only verified durable facts: product outcome, users/platforms, release target, non-goals, constraints and authority boundaries, authoritative documents, standard run/build/test paths, project-documented, risk-proportional acceptance and release evidence, maintenance or collaboration rules, unresolved external decisions, and the single ledger path with the update rule above. Preserve only project-specified review requirements; do not invent validation topology or duplicate unchanged clean builds solely for confirmation. Do not freeze volatile progress in `AGENTS.md`.

Exclude both JOEWRKS markers; the helper owns them. Encode the approved body as UTF-8 Base64 and run:

```powershell
scripts/project-setup.ps1 -Apply -ProjectPath <path> `
  -ExpectedRoot <check-projectRoot> `
  -ExpectedTargetHash <check-targetHash> `
  -ManagedBodyBase64 <base64>
```

Report helper JSON and the observed diff. If `TASKS.md` succeeded but the managed block failed, report partial completion and leave the verified ledger intact. Never call a partial write complete. The helper may change only its project-root `AGENTS.md` block; do not install dependencies, change product code/design, make external writes, create global rules, or expand authority.
