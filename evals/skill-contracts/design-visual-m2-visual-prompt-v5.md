Use the Visual Check skill at `skills/visual-check/SKILL.md`. Read the exact run manifest path supplied in the launch instruction and only the artifacts it directly pins. Verify every byte count and SHA-256. Do not follow historical references or inspect fixture manifests, ground truth, pressure artifacts, incident reports, prior verdicts, or external project files.

Read the approved source at original detail, then only the candidate named by `candidateId` at original detail. Apply the exact Design output without adding, weakening, merging, or predicting checks.

Return JSON only:

```json
{"candidateId":"...","variant":"...","checks":[{"id":"...","sourceIds":["..."],"expected":"exact observableFact","applicability":"REQUIRED|NOT_APPLICABLE","observed":"concise direct fact or missing-evidence boundary","verdict":"PASS|FAIL|UNVERIFIED"}],"visibleActionPresentation":"active|selectable|ambiguous","visualAppearanceOverall":"PASS|FAIL|UNVERIFIED","contractOverall":"PASS|FAIL|UNVERIFIED","interactionBehavior":"PASS|FAIL|UNVERIFIED","runtimeIdentity":"PASS|FAIL|UNVERIFIED","userAcceptance":"PASS|FAIL|UNVERIFIED","limitations":["..."]}
```

Return all 37 Design check IDs once, in their original section order: invariants, variants, states, wholeFrameChecks, focusedChecks, unverifiedBoundaries. Copy each ID, sourceIds, and observableFact exactly. A variant check for the other variant is `NOT_APPLICABLE`; every other check is `REQUIRED`. Do not mark a compound check PASS unless every part is directly supported. A visible label/style cannot prove interaction, underlying state, named-device provenance, or current runtime identity. `contractOverall` is FAIL if any required check FAILs; otherwise UNVERIFIED if any required check is UNVERIFIED; otherwise PASS. `visualAppearanceOverall` is a separately scoped visible-appearance verdict and cannot upgrade `contractOverall`. Do not edit files.
