Use only the files directly pinned by `evals/skill-contracts/design-visual-m2-authority-v4.json`. Verify every direct byte count and SHA-256 before using a file. Historical skill pins embedded in predecessor files describe old runs and do not override v4's current Design-skill pin.

Read the pinned current Design skill completely. Treat the pinned frozen-facts JSON as the controller-supplied project contract. Open only the pinned approved PNG at original detail. Do not inspect external project files, candidate screenshots, candidate coordinates, prior Design outputs, Visual verdicts, other fixtures, incident reports, pressure artifacts, or expected verdicts. Do not claim the external originals were reread.

Return JSON only with exactly these top-level keys and no others:

```json
{"schemaVersion":4,"invariants":[],"variants":[],"states":[],"wholeFrameChecks":[],"focusedChecks":[],"unverifiedBoundaries":[]}
```

Every array item must contain exactly `id`, `sourceIds`, `observableFact`, `evidenceLayer`, `applicability`, and `semantics`. Make every check atomic to one evidence layer. Split visible appearance, artifact identity, interaction, runtime identity, and user acceptance. Do not preserve an earlier check count.

Use only one of these applicability forms:

```json
{"mode":"always"}
```

```json
{"mode":"match","dimensions":{"variant":["exact authority name"],"state":["exact authority name"],"surface":["exact authority name"],"target":["exact authority name"]}}
```

For `match`, include only required dimensions. Every included dimension value must be a non-empty array, even when it has one value. Do not rely on section position or infer scope from future candidate pixels. Use `semantics: "acceptance"` only for product requirements and `semantics: "boundary"` only for evidence limits. Every item in `unverifiedBoundaries` must be a boundary; all product requirements must be acceptance checks. Candidate coordinates are not authority. Do not create or edit files.
