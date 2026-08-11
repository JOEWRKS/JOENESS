# JOENESS Routing And Plugin Policy Design

## Outcome

JOENESS keeps one silent always-loaded Core and five public skills. The Core gains only the two observed high-value completion routes: produced visual work must use `$visual-check` before an acceptance or readiness claim, and a created or materially revised persistent specification must use `$spec` after final readback. These are model instructions, not deterministic hooks.

## Accepted decisions

- Keep the public and internal `spec` identity and `$spec` call unchanged.
- Show the always-loaded layer to users as **JOENESS Core**. Preserve Core v1-v4 and all historical evaluation artifacts unchanged; activate a new candidate instead of renaming history.
- Keep one public `$visual-check`. Reduce its main body to the trigger, mode routing, exact-evidence gate, verdict rule, and compact reporting contract. Move durable-evidence details into an always-required internal reference and concrete-defect or approved-reference-translation details into conditional references installed with the skill.
- A visual completion report exposes the result, not skill ceremony: one user-language line with PASS, FAIL, or UNVERIFIED and the exact artifact/version, target, and evidence pointer. Detailed checks remain in a project-provided evidence location or the task result.
- UI UX Pro Max and Apple Design remain installed, non-discoverable `$design` references.
- External plugins are not JOENESS dependencies. Figma stays conditionally useful for actual Figma targets. Superpowers is explicit-only and should be disabled by default when the runtime cannot prevent implicit use. Ponytail is disabled by default; only its review/audit tools are explicitly selected for over-engineering reviews.
- JOENESS documents the external-plugin policy but does not install, enable, disable, or rewrite those plugins or the user's global plugin configuration.

## Invocation contract

The skill descriptions remain the primary discovery surface. The always-loaded Core adds only the compact trigger and timing so a producer cannot claim readiness merely because it skipped skill discovery; the selected skill owns the exact target, exclusions, evidence, and readback contract:

1. Created or changed visual output whose acceptance depends on appearance, layout, motion, or rendering requires `$visual-check` on the exact current result before any acceptance, fixed, ready, delivered, or release claim. Planning-only and nonvisual work are excluded.
2. A created or materially revised persistent specification requires `$spec` after final artifact readback and before delivery. Read-only review, unchanged-spec implementation, and nonmaterial edits are excluded.

Explicit `$visual-check` remains the strongest user-controlled invocation path. Markdown instructions cannot provide a deterministic semantic hook; no collector or lifecycle hook is added.

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
- Preserve v4 and the current v6 evaluation as history; create additive Core and skill-evaluation artifacts.
- Keep the active Core at or below 2 KiB.
- Run fresh-context samples where the user does not name `$visual-check`, plus negative nonvisual and planning-only cases.
- Score routing and actual visual verdict behavior separately. Mentioning a skill name is not a pass.
- Run the focused Node tests while editing, then the repository's documented release suite once before installation or release claims.

## Non-goals

- No new public skill, collector, visual daemon, screenshot framework, or project-specific art rule.
- No automatic plugin configuration changes.
- No rewrite of historical Core, skill, pressure, or incident evidence.
