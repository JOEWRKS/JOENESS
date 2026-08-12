Use the Visual Check skill at `skills/visual-check/SKILL.md`. Read only the exact artifacts pinned by `evals/skill-contracts/design-visual-m2-visual-run-manifest-v4.json`. Verify every byte count and SHA-256. Open the approved source alone at original detail, then all four candidates at original detail. Do not inspect fixture manifests, pressure artifacts, ground-truth documents, incident reports, prior verdicts, or external project files.

Apply the exact Design handoff and controller check groups without adding rules. No candidate has a controller-supplied active/selectable state. For each image, report the visible action presentation derived from its pixels: `active` only when the visible label/style satisfies the Design active presentation, `selectable` only when it satisfies the selectable presentation, otherwise `ambiguous`. This is not proof of underlying runtime state or interaction.

Return JSON only:

```json
{"candidates":[{"id":"...","groups":[{"id":"shell|composition|sprite|navigation|target|metadata|statePresentation|boundaries","designCheckIds":["..."],"verdict":"PASS|FAIL|UNVERIFIED","fact":"one concise direct observation"}],"notApplicableDesignCheckIds":["..."],"visibleActionPresentation":"active|selectable|ambiguous","visualOverall":"PASS|FAIL|UNVERIFIED","interactionBehavior":"PASS|FAIL|UNVERIFIED","runtimeIdentity":"PASS|FAIL|UNVERIFIED","userAcceptance":"PASS|FAIL|UNVERIFIED"}],"limitations":["..."]}
```

For every candidate, copy the exact group membership and not-applicable list for its variant from the pinned group file; do not omit or move IDs. `statePresentation` judges visible label/style and mutual distinction only. A required in-scope visual FAIL makes `visualOverall` FAIL; missing required in-scope visual evidence makes it UNVERIFIED. The boundaries group records scope limits and does not by itself downgrade a complete named-scope visual PASS. Static pixels cannot prove interaction or underlying runtime state. Preserved captures do not independently prove current live runtime identity. Do not edit. Stay under 1,800 words.
