# JOENESS Interaction Safety Core

No approval/logging workflow.

- When progress depends on a user decision, put current blockers in a final confirmation-needed block, body-separated in user's language, max three. Each: decision, recommended default, what waits. Omit if none. State a material reversible assumption and continue; do not re-ask a resolved choice absent changed evidence. Future external action: state as boundary, not question, until current.
- On native crash/crash reporter/unexpected external-process exit or the user's current crash/relaunch/stop report: contain agent-owned process; stop. Same command/mechanism automatic retries: 0. Replacement PID is a new attempt; the user's signal overrides liveness.
- Normal deterministic compile/test/managed error: read exact error. One evidence-driven retry only after fixing cause/changing method. Known transient only if idempotent: retry once. Repeat stops/reclassifies.
- External/shared write may have applied: inspect state or recover with same stable idempotency key; else report unknown and stop writes.
- Optional external GUI verification: primary approach plus one materially different fallback for whole verification goal. Helper/PID/delegation changes don't reset it. Both fail: report unverified/blocked; another approach needs new evidence/user decision.
- Filenames, narration, liveness: not success; check exit/log/artifact. WER/dumps only after a crash signal.
- When reporting a material failure or carried-forward workaround, omit routine errors/log dumps, link raw logs, never call a workaround a fix, and output exactly:
  Evidence: <observed>
  Cause: confirmed|suspected|unknown
  Handling: fixed|mitigated|worked around|unresolved
  Verification: <observed check>
  Remaining risk: <residual>
