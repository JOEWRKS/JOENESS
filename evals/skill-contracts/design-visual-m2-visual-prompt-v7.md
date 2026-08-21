Use only the files directly pinned by the exact run manifest path in the launch instruction. Verify every byte count and SHA-256. Do not follow historical references or other paths found inside those files.

Read the pinned Visual Check skill and both pinned required references completely. Read the pinned typed Design output. Open the pinned approved source at original detail, then open the single pinned candidate at original detail. Do not inspect any other candidate, fixture manifest, ground truth, pressure artifact, incident report, prior verdict, task ledger, external project, or repository history.

Copy every Design check exactly once and in its original section order: `invariants`, `variants`, `states`, `wholeFrameChecks`, `focusedChecks`, `unverifiedBoundaries`. Copy `id`, `sourceIds`, `evidenceLayer`, `applicability`, `semantics`, and `observableFact` without alteration.

Determine `scopeMatch` mechanically:

1. `mode: "always"` means `APPLICABLE`.
2. For `mode: "match"`, compare every required dimension that is present in `claimScope`.
3. If any present value is not one of that dimension's exact allowed values, use `NOT_APPLICABLE`.
4. Otherwise, if any required dimension is absent from `claimScope`, use `UNVERIFIED`.
5. Otherwise use `APPLICABLE`.

Never infer a missing variant, state, surface, or target from candidate pixels, labels, section position, candidate ID, or visual plausibility. `NOT_APPLICABLE` requires verdict `NOT_APPLICABLE`; an `UNVERIFIED` scope match requires verdict `UNVERIFIED`.

Judge an applicable acceptance check only in its named `evidenceLayer`. A still image may support visible appearance. It does not by itself prove artifact identity, interaction, runtime identity, named-target provenance, or user acceptance.

For a boundary check, PASS means only that the stated evidence or authority limit is confirmed by the directly pinned inputs. FAIL means the limit is contradicted. UNVERIFIED means the limit itself cannot be determined. Boundary verdicts never enter either acceptance aggregate.

Return JSON only:

```json
{"candidateId":"exact manifest candidateId","claimScope":{},"checks":[{"id":"exact Design id","sourceIds":[],"evidenceLayer":"exact Design evidenceLayer","applicability":{},"semantics":"exact Design semantics","expected":"exact Design observableFact","scopeMatch":"APPLICABLE|NOT_APPLICABLE|UNVERIFIED","observed":"one concise direct fact or exact missing-evidence fact","verdict":"PASS|FAIL|UNVERIFIED|NOT_APPLICABLE"}],"visibleAppearanceOverall":"PASS|FAIL|UNVERIFIED","completeContractOverall":"PASS|FAIL|UNVERIFIED"}
```

`visibleAppearanceOverall` aggregates acceptance checks with `evidenceLayer: "visible-appearance"`; `completeContractOverall` aggregates all acceptance checks. For each aggregate, include every check whose `scopeMatch` is not `NOT_APPLICABLE`; FAIL takes precedence, then UNVERIFIED, then PASS. An empty aggregate is UNVERIFIED. Boundary checks are reported but excluded. Do not create extra state classifiers, merge checks, add rules, or edit files.
