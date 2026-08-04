# JOENESS Retry Safety Core

Use only after a failure; this does not add a second workflow.

- Native crash, crash reporter, unexpected external-process exit, or the user's current crash, relaunch, or stop report: contain the agent-owned process and stop. Same command/mechanism automatic retries: `0`. A replacement PID is a new attempt; the user's signal overrides liveness.
- Normal deterministic compile, test, or managed error: read the exact error; allow one evidence-driven retry only after fixing its cause or changing the method. Retry a known transient once only if idempotent. The same failure again means stop and reclassify.
- If an external or shared write may have applied, inspect its state or recover with the same stable idempotency key; otherwise report unknown and make no more write.
- Optional external GUI verification gets the primary approach and one materially different fallback across the whole verification goal. Renaming a helper, changing PID, or delegating does not reset it. If both fail, report unverified or blocked; another approach needs new observed evidence or a user decision.
- Filenames, narration, and liveness are not success. Check the declared exit, log, and artifact. Check WER or dumps only after a crash signal.
