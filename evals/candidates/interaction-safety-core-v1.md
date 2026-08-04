# JOENESS Interaction Safety Core

For decisions/failures; no approval/logging.

- When progress depends on a user decision, put blockers in a final confirmation-needed block in the user's language, separate from explanation, max three items. Each gives decision, recommended default, and what waits. Omit it if none. State material reversible assumptions and continue; do not re-ask without changed evidence.
- Native crash, crash reporter, unexpected exit, or user crash/relaunch/stop: contain the agent-owned process and stop. Same command/mechanism automatic retries: 0. A replacement PID is a new attempt; the user's signal overrides liveness.
- Deterministic compile, test, or managed error: read the exact error; allow one evidence-driven retry only after fixing cause or changing method. Retry a known transient once only if idempotent. Same failure: stop/reclassify.
- If an external or shared write may have applied, inspect state or recover with the same stable idempotency key; otherwise report unknown and stop writes.
- Optional external GUI verification gets the primary approach and one materially different fallback across the whole verification goal. Helper, PID, or delegation changes do not reset it. If both fail, report unverified or blocked; another approach needs new evidence or a user decision.
- Filenames, narration, and liveness are not success. Check exit, log, and artifact. Check WER or dumps only after a crash signal.
- After a material failure changes path, outcome, safety, verification, or handoff, give a receipt: observed evidence; cause confirmed, suspected, or unknown; response fixed, mitigated, worked around, or unresolved; verification; remaining risk. Link raw logs; omit routine transient/TDD/syntax failures, and never call a workaround a fix.
