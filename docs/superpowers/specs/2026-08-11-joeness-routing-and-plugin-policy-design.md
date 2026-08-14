# JOENESS Routing And Plugin Policy Design

## Outcome

JOENESS keeps one silent always-loaded Core and six public skills while user and project authority governs every workflow. Calling an external skill selects only independently authorized parts of that skill; it never approves the skill's whole workflow. The Core retains only the two observed high-value completion routes: produced visual work must use `$visual-check` before an acceptance or readiness claim, and a created or materially revised persistent specification must use `$spec` after final readback. These are model instructions, not deterministic hooks.

## Accepted decisions

- Keep the public and internal `spec` identity and `$spec` call unchanged.
- Show the always-loaded layer to users as **JOENESS Core**. Preserve Core v1-v7 and all historical evaluation artifacts unchanged; keep v7 active and do not create a new candidate without behavior evidence.
- Keep one public `$visual-check`. Reduce its main body to the trigger, mode routing, exact-evidence gate, verdict rule, and compact reporting contract. Move durable-evidence details into an always-required internal reference and concrete-defect or approved-reference-translation details into conditional references installed with the skill.
- A visual completion report exposes the result, not skill ceremony: one user-language line with PASS, FAIL, or UNVERIFIED and the exact artifact/version, target, and evidence pointer. Detailed checks remain in a project-provided evidence location or the task result.
- UI UX Pro Max and Apple Design remain installed, non-discoverable `$design` references.
- External plugins are not JOENESS dependencies. Figma stays conditionally useful for actual Figma targets. Superpowers is explicit-only and should be disabled by default when the runtime cannot prevent implicit use. Ponytail is disabled by default; only its review/audit tools are explicitly selected for over-engineering reviews.
- JOENESS documents the external-plugin policy but does not install, enable, disable, or rewrite those plugins or the user's global plugin configuration.
- Invoking an external skill does not approve its whole workflow; use only the parts independently authorized by the current user request or project contract.

## Contract precedence

The current user request and applicable project contract define authority and scope. External skill instructions may shape how an already-authorized part is performed, but cannot add a whole-workflow approval, a new artifact, a new approval gate, a companion service, a plugin setting change, or another material action. A narrower current user instruction wins over a broader skill workflow. A materially outcome-changing conflict is returned to the user as at most one focused question; otherwise the agent proceeds with the authorized subset.

This boundary belongs in the root project rules and in the explicit full-contract branch of `$project`. The narrow implicit roadmap approval remains exactly the two-fact managed-body update: ledger path plus evidence-reconciliation and event-based update rule. It does not acquire the broader external-skill clause or any additional write.

If an implicitly invoked Superpowers workflow cannot be constrained to this authority model, that integration is incompatible with JOENESS explicit-only policy. JOENESS recommends default disabled in that environment. This is a warning and compatibility fallback only: JOENESS performs no plugin config write and never installs, enables, disables, or rewrites plugin settings.

## Invocation contract

The skill descriptions remain the primary discovery surface. The always-loaded Core adds only the compact trigger and timing so a producer cannot claim readiness merely because it skipped skill discovery; the selected skill owns the exact target, exclusions, evidence, and readback contract:

1. Created or changed visual output whose acceptance depends on appearance, layout, motion, or rendering requires `$visual-check` on the exact current result before any acceptance, fixed, ready, delivered, or release claim. Planning-only and nonvisual work are excluded.
2. A created or materially revised persistent specification requires `$spec` after final artifact readback and before delivery. Read-only review, unchanged-spec implementation, and nonmaterial edits are excluded.

Explicit `$visual-check` remains the strongest user-controlled invocation path. Markdown instructions cannot provide a deterministic semantic hook; no collector or lifecycle hook is added.

## M4 rubric and fallback

M4 is satisfied only when a constrained external-skill path gives a direct recommendation and asks at most one outcome-changing question. It adds no separate spec, plan, checklist, approval, or commit ceremony; starts no companion or server before a concrete A/B need or user request; invokes no visual-check before an actual visual artifact exists; emits no raw token-intensive or quota warning; exposes no user-facing skill ceremony; and performs no plugin config write.

When the external workflow cannot meet that rubric, the fallback is to stop using its unauthorized portions, continue with the independently authorized task where possible, and recommend that an unconstrainable implicit plugin remain disabled by default. JOENESS does not enforce that recommendation through configuration.

Exact installed-plugin activation remains unverified until separate live evidence is collected. M4 changes no installation, does not apply JOENESS, and runs no live model or plugin evaluation.

## Visual Check structure

The public body selects exactly one or more applicable modes:

- output completion;
- concrete defect verification;
- approved-reference translation;
- durable evidence for every mode;
- concrete-defect and approved-reference details only when their mode applies.

The completion gate derives the smallest sourced, falsifiable checks, inspects the exact native or runtime evidence, records PASS/FAIL/UNVERIFIED per required check, and applies FAIL before UNVERIFIED before PASS. Automated checks, filenames, captures, or reviewer claims never substitute for direct inspection. Unresolved checks block only dependent work.

## Validation

- Add RED contract tests before changing active sources.
- Preserve Core v1-v7 and the current evaluation history byte-for-byte.
- Keep active Core v7 under the 3,072-byte decision recorded in `2026-08-13-joeness-user-language-and-core-size-decision.md`. The active pointer remains v7; create no Core v8 until behavior evidence justifies a Core change.
- A later live evaluation must run fresh-context samples where the user does not name `$visual-check`, plus negative nonvisual and planning-only cases; M4 contract work does not run them.
- Score routing and actual visual verdict behavior separately. Mentioning a skill name is not a pass.
- Run the focused Node tests while editing, then the repository's documented release suite once before installation or release claims.

## Non-goals

- No new public skill, collector, visual daemon, screenshot framework, or project-specific art rule.
- No automatic plugin configuration changes.
- No Core v8, live model evaluation, plugin activation check, installation, or apply operation in M4 contract work.
- No rewrite of historical Core, skill, pressure, or incident evidence.
