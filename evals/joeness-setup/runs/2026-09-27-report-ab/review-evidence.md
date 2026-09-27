# Report-readability A/B result

Arm A was the new five-field connection at test-project commit
`873ecd39f3c76fee4d32afb6f1cc7aa1272cbc54`; Arm B was the prior free-form
connection at `122be46c5232d39b17a5d1c2d458817847e60266`. The user saw
only [blind-samples.md](blind-samples.md) and replied `A — 이유를 적겠습니다`.
No reason was supplied. This is one blind preference for the new form, not a
general readability estimate.

Both agents correctly kept the milestone incomplete, identified the missing
actual-device result, rejected the stale handoff and pre-repair diagnostic as
current truth, kept user acceptance separate, and reported no file writes.
The new answer used five short opening bullets without internal milestone or
requirement codes; the old answer opened with `M2` and `R3`, then a table of
internal requirement IDs. The new agent also ran a direct duplicate probe in
addition to the local suite; the old agent inspected Git history. Neither extra
inspection can be attributed to the reporting instruction from one pair.

Observed run data: old-form CLI reported 22,148 tokens and 88,308 ms elapsed.
New-form elapsed was 93,398 ms; its CLI token counter was not retained, so no
token comparison is available. The 5,090 ms observed difference is not a causal
latency estimate. Both ran Codex `0.158.0-alpha.2`, `gpt-6-astra / xhigh`,
read-only, with the same prompt and identical `cases/E/**` bytes. Both execution
worktrees stayed clean. Do not use this report-format result as evidence that
JOENESS improves project record classification or long-horizon handoffs.
