Use the Visual Check skill at `skills/visual-check/SKILL.md` for this task. Its required common reference and approved-reference translation rules are normative.

Read only the exact artifacts pinned by `evals/skill-contracts/design-visual-m2-visual-run-manifest-v2.json`. Verify every byte count and SHA-256. Open the approved source alone at original detail before opening all four candidates at original detail. Do not inspect fixture manifests, pressure artifacts, ground-truth documents, incident reports, prior verdicts, or external project files.

Apply the exact Design handoff without adding candidate-derived rules. Return one JSON object with `candidates` and `limitations`. For each candidate include:

- `id`
- at most seven `checkGroups`; each group has `designCheckIds`, `verdict` (`PASS|FAIL|UNVERIFIED`), and one concise directly observed fact
- `visualOverall`
- `interactionBehavior`
- `runtimeIdentity`
- `userAcceptance`

Every applicable Design check ID must appear in exactly one group. Put non-applicable IDs in one explicit `notApplicableDesignCheckIds` array; do not silently omit them. A required visual FAIL makes `visualOverall` FAIL. Missing required visual evidence makes it UNVERIFIED. Static pixels cannot prove interactability. A preserved capture does not independently prove current live runtime identity. Do not edit files. Return JSON only and stay under 2,500 words.
