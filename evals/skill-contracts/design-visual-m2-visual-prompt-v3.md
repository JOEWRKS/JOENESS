Use the Visual Check skill at `skills/visual-check/SKILL.md`. Read only the exact artifacts pinned by `evals/skill-contracts/design-visual-m2-visual-run-manifest-v3.json`. Verify every byte count and SHA-256. Open the approved source alone at original detail, then all four candidates at original detail. Do not inspect fixture manifests, pressure artifacts, ground-truth documents, incident reports, prior verdicts, or external project files.

Apply the exact Design handoff and controller check groups without adding rules. Return JSON only:

```json
{"candidates":[{"id":"...","groups":[{"id":"shell|composition|sprite|navigation|target|metadataState|boundaries","designCheckIds":["..."],"verdict":"PASS|FAIL|UNVERIFIED","fact":"one concise direct observation"}],"notApplicableDesignCheckIds":["..."],"visualOverall":"PASS|FAIL|UNVERIFIED","interactionBehavior":"PASS|FAIL|UNVERIFIED","runtimeIdentity":"PASS|FAIL|UNVERIFIED","userAcceptance":"PASS|FAIL|UNVERIFIED"}],"limitations":["..."]}
```

For every candidate, copy the exact group membership and not-applicable list for its variant from the pinned group file; do not omit or move IDs. A required in-scope visual FAIL makes `visualOverall` FAIL. Missing required in-scope visual evidence makes it UNVERIFIED. The boundaries group records scope limits and does not by itself downgrade a complete named-scope visual PASS. Static pixels cannot prove interaction. Preserved captures do not independently prove current live runtime identity. Do not edit. Stay under 1,800 words.
