# JOENESS Intent And Error Reporting Design

## Goal

Reduce intent mismatch and repeated debugging without turning JOENESS into an approval or logging workflow.

## Decision

Use one thin installed Core for two conditional response contracts plus the existing retry boundary:

1. When progress truly depends on a user decision, place only the current blocking choices in a final, body-separated confirmation block. Limit it to three choices, give a recommended default and state what waits. Do not create the block when no decision is needed. State material reversible assumptions and continue instead of asking.
2. After a material failure changes the path, outcome, safety, verification, or handoff, report a compact receipt: observed evidence; cause as confirmed, suspected, or unknown; response as fixed, mitigated, worked around, or unresolved; verification; and remaining risk. Never call a workaround a fix.

The first contract changes presentation, not question frequency. The second records only information that can prevent repeated work or support verification.

## Placement

- Create a new candidate rather than rewriting historical Core evidence. Keep it within 1.8 KiB and make it the single `activeCommonCore` pointer.
- Extend the explicit-only `handoff` evidence receipt with material failure classification and any workaround removal condition.
- Keep transient errors, expected TDD failures, simple syntax mistakes, and raw transcripts out of durable records.
- Put only durable unresolved constraints or links to incident evidence in project contracts; do not freeze incident timelines there.
- Update the existing README, evaluation ledger, manifest identities, and installer/integrity tests. Do not add a new logger, service, skill, dependency, or Unity-specific rule.

## Acceptance

- Five fresh control samples establish whether the missing guidance produces buried or overlong questions, or confuses workaround with resolution.
- Five fresh candidate samples use a body-separated decision block only when needed, ask at most three current blockers, expose a recommended default and waiting state, and avoid asking about reversible defaults.
- Candidate samples classify material error handling and preserve verification and residual risk without dumping logs.
- Existing retry behavior, vendor integrity, byte-preserving install/update/remove behavior, and explicit-only Handoff activation remain intact.
- Evidence must state the behavioral sample and token-measurement limitations; no general quality or token-saving claim is allowed.

## Non-goals

- Reading latent human intent with certainty.
- Asking for approval at every phase.
- Creating an incident report for every error.
- Monitoring or physically enforcing external processes.
- Reactivating the historical broad Common Core.
