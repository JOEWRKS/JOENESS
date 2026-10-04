# Workshop work

## Direction

1. Registration reliability.
2. Attendee export.

Product decisions and approved dependencies: [PRODUCT.md](PRODUCT.md).
This is the project's single direction source; required-outcome evidence belongs
in [CHECKS.md](CHECKS.md). The order above remains approved and unchanged.

## Current

Current stage: registration reliability — verification pending.
Next eligible required work: obtain the agreed tablet and run the restart check
in [registration evidence](CHECKS.md#registration-reliability). Device access is
still unavailable, so attendee export remains blocked by this prerequisite.
Independently authorized: the [help text correction](CHECKS.md#independent-help-text-correction)
may proceed without waiting for persistence. Its target and approved wording
are not present in this documentation-only checkout.

## Stages

### Registration reliability — verification pending

- Goal: reliable registration persistence, including the agreed device check.
- Entry condition: approved first in [product order](PRODUCT.md); no predecessor.
- Required outcomes and individual checks: [registration evidence](CHECKS.md#registration-reliability).
- Completion condition: persistence implementation, unit checks and the required
  tablet restart check all have supporting evidence. The device result is test
  acceptance, not a request for a new product decision. Historical W1 results
  do not stand in for the missing device result.
- On completion: refresh Current from remaining open items; attendee export
  becomes eligible. Completion of an individual task does not complete this stage.

### Attendee export — not started; prerequisite open

- Goal: attendee export within the product's approved scope.
- Entry condition: registration reliability is complete, including the agreed
  tablet restart check. No prerequisite waiver is recorded.
- Required outcomes, checks and undecided criteria: [export evidence](CHECKS.md#attendee-export).
- Completion condition: resolve the export format and its check criteria, then
  implement and verify that agreed outcome. Format and detailed criteria remain
  undecided; this document does not invent them or claim export is ready.
- Next after this stage: no further product stage is approved. A later direction
  decision is required; no release acceptance is inferred.

### Independent authorized work

The help text correction is independent of registration persistence. Its own
check is in [CHECKS.md](CHECKS.md#independent-help-text-correction); it neither
waives registration checks nor becomes an invented gate for attendee export.
Payment, accounts and network synchronization remain excluded by PRODUCT.md.

## History

W1: registration persistence implementation done. Unit tests passed.
Required tablet restart check was unavailable. See CHECKS.md.
Original note retained for traceability; no release has been accepted.

W2: authorized JOENESS document connection applied on 2026-10-04.
Retained this file as direction and task history and CHECKS.md as outcome
evidence; added stage gates and corrected Current against its open checks.
The helper Apply and subsequent Check returned current; readback confirmed the
managed connection and stage references. The original W1 note remains above.
No product code, product test run or personal installation was changed.
Fresh-chat delivery of the new AGENTS connection has not been tested.
