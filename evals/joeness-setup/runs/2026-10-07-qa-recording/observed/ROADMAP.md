# Delivery
Product authority: PRODUCT.md. Current stage: Import validation.
Entry: import implementation available. Completion: R1 and R2 verified; user acceptance separate.
Next: identify the same current build/input to resolve conflicting automated-check
reports; perform the supported-device check when a device is available.
| ID | Required outcome | Status | Check | Evidence or gap |
|---|---|---|---|---|
| R1 | Reject malformed imports | verification pending | failure message matches input | [worker-b](TASK.md#worker-b): row-2 failure; A's old-build pass lacks build identity; [integrated handoff](TASK.md#handoff-2026-10-07), [I-1](ISSUES.md#i-1) |
| R2 | Device import | verification pending | actual supported device | device unavailable |

Retry endpoint reachability is not R1/R2 proof; see
[reported diagnosis and limits](TASK.md#handoff-2026-10-07). No stage completion
or user acceptance is established.
