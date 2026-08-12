Use only the files directly pinned by the exact run manifest path in the launch instruction. Verify every byte count and SHA-256. Read the pinned Visual Check skill and both pinned required references completely. Read the pinned Design output. Open the pinned approved source and the single pinned candidate at original detail. Do not inspect any other file, history, fixture manifest, ground truth, pressure artifact, incident report, prior verdict, or external project.

Return JSON only:

```json
{"candidateId":"...","variant":"...","checks":[{"id":"...","sourceIds":["..."],"expected":"exact observableFact","applicability":"REQUIRED|NOT_APPLICABLE","observed":"concise direct fact or missing-evidence boundary","verdict":"PASS|FAIL|UNVERIFIED|NOT_APPLICABLE"}],"visibleActionPresentation":"active|selectable|ambiguous","visualAppearanceOverall":"PASS|FAIL|UNVERIFIED","contractOverall":"PASS|FAIL|UNVERIFIED","interactionBehavior":"PASS|FAIL|UNVERIFIED","runtimeIdentity":"PASS|FAIL|UNVERIFIED","userAcceptance":"PASS|FAIL|UNVERIFIED","limitations":["..."]}
```

Return all 37 Design check IDs exactly once and in their original section order: invariants, variants, states, wholeFrameChecks, focusedChecks, unverifiedBoundaries. Copy every ID, sourceIds, and observableFact exactly. Only a variant check explicitly belonging to the other variant is `NOT_APPLICABLE`, and its verdict must be `NOT_APPLICABLE`; every other check is `REQUIRED` and cannot use that verdict.

Do not merge checks. A compound check is PASS only if every part is directly supported. A visible label or style cannot prove underlying state, interaction, operability, named-device provenance, or current runtime identity. `contractOverall` is FAIL if any required check FAILs, otherwise UNVERIFIED if any required check is UNVERIFIED, otherwise PASS. `visualAppearanceOverall` reports only directly visible appearance and cannot upgrade `contractOverall`. Candidate pixels are observations, never acceptance authority. Do not edit files.
