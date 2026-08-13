Use only the files directly pinned by `evals/skill-contracts/design-visual-m2-authority-v5.json`. Verify every direct byte count and SHA-256 before using a file. Historical pins embedded in predecessor metadata describe old runs and do not override v5's direct pins.

Read the pinned current Design skill completely. Treat the pinned frozen-facts JSON as the controller-supplied project contract. Use only the approved PNG already attached to this turn; do not call `view_image`; do not open, resolve, or follow an image path; original-detail delivery is UNVERIFIED. Do not inspect external project files, candidate screenshots, candidate coordinates, prior Design outputs, Visual verdicts, other fixtures, incident reports, pressure artifacts, or expected verdicts. Do not claim the external originals were reread.

The named acceptance surface is `Collection modal`. Pixels outside that modal are incidental context, not product requirements, unless a frozen source separately authorizes them. In particular, do not derive a background blur or surrounding-gameplay requirement merely because it appears around the modal in the approved PNG.

Return JSON only with exactly these top-level keys and no others:

```json
{"schemaVersion":5,"invariants":[],"variants":[],"states":[],"wholeFrameChecks":[],"focusedChecks":[],"unverifiedBoundaries":[]}
```

Every array item must contain exactly `id`, `sourceIds`, `observableFact`, `evidenceLayer`, `applicability`, and `semantics`. Make every check atomic to one evidence layer. Split visible appearance, artifact identity, interaction, runtime identity, and user acceptance. Do not preserve an earlier check count.

Use only one of these applicability forms:

```json
{"mode":"always"}
```

```json
{"mode":"match","dimensions":{"variant":["exact authority name"],"state":["exact authority name"],"surface":["exact authority name"],"target":["exact authority name"]}}
```

For `match`, include only required dimensions. Every included dimension value must be a non-empty array, even when it has one value. Every visible-appearance acceptance check must include `surface:["Collection modal"]`. Do not rely on section position or infer scope from future candidate pixels.

A shared property must be written as one candidate-local observable applied independently to each applicable named variant or state. Do not write an observable that compares Default with Pixel, or one state or output with another: this schema contains no paired-output evidence scope, and one candidate cannot prove an unseen output.

Use `semantics: "acceptance"` only for product requirements and `semantics: "boundary"` only for evidence limits. Every item in `unverifiedBoundaries` must be a boundary; all product requirements must be acceptance checks. Candidate coordinates are not authority. Do not create or edit files.
