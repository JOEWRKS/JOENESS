Use the Visual Check skill at `skills/visual-check/SKILL.md` for this task. Its required common reference and approved-reference translation rules are normative.

Read only these repository artifacts:

- `skills/visual-check/SKILL.md`
- `skills/visual-check/references/durable-evidence.md`
- `skills/visual-check/references/approved-reference.md`
- `evals/skill-contracts/design-visual-m2-handoff-v1.json`
- the exact Design output pinned by that handoff
- `evals/skill-contracts/design-visual-m2-visual-input-v1.json`
- the exact approved source and four candidate PNGs referenced by those JSON files

Verify every declared byte count and SHA-256 before using an artifact. Open the approved source alone at original detail before the candidates. Then open each candidate at original detail. Do not inspect fixture manifests, pressure artifacts, ground-truth documents, incident reports, prior verdicts, or external project files.

Apply the Design contract without adding candidate-derived rules. For each candidate, return a JSON object containing: `id`, `checks` (each with the Design check id, `PASS|FAIL|UNVERIFIED`, and a concise directly observed fact), `visualOverall`, `interactionBehavior`, `runtimeIdentity`, and `userAcceptance`. A required visual FAIL makes `visualOverall` FAIL. Missing required visual evidence makes it UNVERIFIED. Static pixels cannot prove interactability. Keep preserved-capture identity separate from exact installed-runtime identity. Return one top-level JSON object with `candidates` and `limitations`. Do not edit files. Return JSON only.
