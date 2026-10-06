# Open problems and workarounds

## I1 — Large-integer precision loss

Status: open; a manual workaround is recorded, no verified durable fix.
Source: [2026-10-03 work event](notes/work.md), indexed by [T2](TASK.md#t2--2026-10-03-precision-observation).
Affected scope: numeric inputs; release impact depends on the supported range
decision noted in [ROADMAP](ROADMAP.md#s1--release).
Cause: Number representation is implicated in the source; no more specific
cause was confirmed. This setup did not reproduce the failure.
Workaround: manually reject inputs above MAX_SAFE_INTEGER, as recorded.
Residual risk: enforcement is manual; an automated guard and boundary test are
missing. The supported numeric range and alternative JSON encodings remain
unconfirmed. [Local research](Library/numeric-representation.md#2026-10-06--local-bigint-json-probe)
now shows direct BigInt JSON serialization fails in the checked environment;
no replacement representation has been adopted or integrated.
Closure condition: an authorized input policy, a durable implementation matching
that policy, and a passing boundary check recorded in TASK. A workaround or
research suggestion alone cannot close the issue.
Verification: no automated guard or boundary-check evidence in the inspected
implementation, test or linked records.
Next action: resolve supported numeric range and release impact at product.md
under product decision approval, then request the bounded implementation/check.
Research: [numeric representation](Library/numeric-representation.md); BigInt
remains a suggestion.
