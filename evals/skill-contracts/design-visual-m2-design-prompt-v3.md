Use the Design skill pinned by `evals/skill-contracts/design-visual-m2-authority-v3.json`.

Read only these repository artifacts:

- `evals/skill-contracts/design-visual-m2-authority-v3.json`
- its pinned predecessor and frozen-facts JSON files
- the approved PNG pinned by v3, opened at original detail
- the Design skill pinned by v3

Verify the direct v3 byte counts and SHA-256 values before using a file. Historical skill pins embedded in the predecessors describe their old runs and do not override v3's current Design-skill pin. Do not open external project files, candidate screenshots, prior Design outputs, Visual verdicts, fixtures other than the pinned approved PNG, incident reports, or pressure artifacts. The frozen facts are controller-supplied authority; do not claim their external originals were reread.

Return only the JSON object required by v3. Derive observable implementation-independent checks from the approved image and frozen facts. Keep the six requested sections, but do not preserve an old check count. Every check must contain exactly `id`, `sourceIds`, `observableFact`, `evidenceLayer`, `applicability`, and `semantics`. Make each check atomic to one evidence layer. Split visible appearance, artifact identity, interaction, runtime identity, and user acceptance. Applicability must be explicit as `always` or exact named dimensions; do not rely on section membership and do not infer scope from future candidate pixels. Use `acceptance` only for requirements and `boundary` only for evidence limits. Candidate coordinates are not authority. Do not create or edit files.
