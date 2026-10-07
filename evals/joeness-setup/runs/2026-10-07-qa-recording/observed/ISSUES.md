# Open issues
## I-1
Malformed row 2 may be accepted. Worker B observed failure; older A report says pass.
Cause unknown. Closure: same current target checked and discrepancy resolved.
Still open after integration: A's old-build identity is unavailable and its report
used a baseline preceding worker B's saved note. Identify the compared build/input
and resolve both observations before a closure verdict; see
[handoff evidence](TASK.md#handoff-2026-10-07).

## I-2
Two retry attempts were reportedly refused before a third reached the test
endpoint. Cause unknown; no verified fix or continuing-reliability check exists.
Observed recovery: third-attempt reachability only, not an established workaround.
Source and limits: [DEMO-41 handoff diagnosis](TASK.md#handoff-2026-10-07).
Closure: explain the refusals with permitted source evidence and verify reliable
endpoint access on the relevant target. This is separate from R1 rejection and
R2 device checks; both remain pending.
