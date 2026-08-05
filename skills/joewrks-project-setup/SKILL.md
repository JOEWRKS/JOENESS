---
name: joewrks-project-setup
description: Use when the user explicitly asks to persist a project contract, or begins a project-level development or design effort or major release-scope expansion likely to span sessions, milestones, collaborators, or release work and provides no concrete plan.
---

# JOEWRKS Project Setup

Keep one verified durable project contract and at most one planning ledger. Persistence is context, not proof or additional authority.

## Route

| Observed state | Action |
|---|---|
| Small fix, edit, research, explanation, or brainstorming | Stop this skill; continue normally. |
| No verifiable Git project root | Use a compact chat plan; create nothing. |
| Usable authoritative tracker exists | Use it as the single source; do not offer or copy another ledger. |
| Project-level start or major release-scope expansion, no concrete plan or ledger | Make the read-only offer below once in the current task. |
| Explicit persist/setup/apply request | Disclose exact targets, then write only the approved targets. |

1. Run `scripts/project-setup.ps1 -Check -ProjectPath <path>`. Bind all later work to its exact `projectRoot` and `targetHash`.
2. Read only the minimum project rules and evidence. Ledger discovery is limited to a user-named tracker, documents linked by project rules, root `TASKS.md`, `ROADMAP.md`, `TODO.md`, and a directly relevant approved plan.
3. Before consent, reconcile only already-observed evidence, Git status, and bounded read-only file inspection. Do not run tests, builds, or external checks solely to decide whether to offer persistence. The original task may independently authorize them.

For implicit use with no ledger, the pre-consent response contains only one sentence naming the long-horizon trigger and current reversible assumption, up to three read-only checks, and this body-separated offer rendered in the user's language. Plan detail belongs in the approved ledger:

```text
Project roadmap
Decision: Create TASKS.md and add its location and update rule to the project AGENTS.md?
Recommended: Yes, because this work spans multiple milestones or sessions.
Waiting: Permanent planning files and plan-based broad implementation. Read-only checks and a compact current-step plan can continue.
```

Name both targets. Do not write before an explicit yes. A refusal applies only to the current task: create no files, do not ask again in that task, and continue within scope using a compact chat plan.

## Persist

Immediately before writing, repeat the bounded ledger discovery and reread the current managed `AGENTS.md` body. If a ledger now exists, use it and do not create or overwrite `TASKS.md`. When no ledger still exists, create a UTF-8 root `TASKS.md`, preferably no more than 4 KiB, as this compact locator rather than a narrative:

```markdown
# Plan
- Goal / release: authoritative link or one-line summary
- Milestones: current plus shallow future milestones
- Now: one to three rows with outcome, acceptance, status, and owner only when shared
- Blockers / decisions / links: one compact list
- Evidence / reviewed: references only, review date, and evidence types checked
```

Keep each fact in one place. Group unknown product facts into one blocker instead of repeating `unverified` fields, and link rather than copy project rules, logs, or Handoff content.
All five locator lines are required; when evidence is missing, use `pending - see blocker` once instead of omitting or repeating the field.

Mark inferred milestones `provisional`; they are not new requirements, completion gates, or external-action authority. The ledger is not proof. Before starting or completing work, recheck current evidence and keep unsupported states partial or unverified. Update only at milestone, scope, release-condition, decision, blocker, or planned-handoff boundaries, never per edit, command, response, or commit.

For approval of the implicit roadmap offer, preserve the current managed body and add or update only these two facts: the selected ledger path, and the evidence-reconciliation plus event-based update rule above. The proposed managed-body diff may contain no other change. If that narrow edit cannot be isolated, stop without applying it and request explicit full-setup scope.

For an explicit full-contract setup/apply request that disclosed the broader scope, prepare the managed `AGENTS.md` body, preferably 2 KiB and at most 8 KiB. Include a durable fact only when verified; omit unverified fields instead of listing them. Eligible facts are product outcome, users/platforms, release target, non-goals, constraints and authority boundaries, authoritative documents, standard run/build/test paths, project-documented, risk-proportional acceptance and release evidence, maintenance or collaboration rules, unresolved external decisions, and the single ledger path with the update rule above. Preserve only project-specified review requirements; do not invent validation topology or duplicate unchanged clean builds solely for confirmation. Do not copy milestones or volatile progress into `AGENTS.md`.

Exclude both JOEWRKS markers; the helper owns them. Encode the approved body as UTF-8 Base64 and run:

```powershell
scripts/project-setup.ps1 -Apply -ProjectPath <path> `
  -ExpectedRoot <check-projectRoot> `
  -ExpectedTargetHash <check-targetHash> `
  -ManagedBodyBase64 <base64>
```

Report helper JSON and the observed diff. If `TASKS.md` succeeded but the managed block failed, report partial completion and leave the verified ledger intact. Never call a partial write complete. The helper may change only its project-root `AGENTS.md` block; do not install dependencies, change product code/design, make external writes, create global rules, or expand authority.
