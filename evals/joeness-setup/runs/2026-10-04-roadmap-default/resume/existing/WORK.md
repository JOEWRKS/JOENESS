# Workshop work

## Direction

1. Registration reliability.
2. Attendee export.
3. User guide: usage order for completed features and their actual limitations.

Product decisions and approved dependencies: [PRODUCT.md](PRODUCT.md).
This is the project's single direction source; required-outcome evidence belongs
in [CHECKS.md](CHECKS.md). The user has approved adding the guide after export;
the existing registration and export dependencies remain in force.

## Current

Current stage: registration reliability — verification pending.
Next eligible required work: obtain the agreed tablet and run the restart check
in [registration evidence](CHECKS.md#registration-reliability). Device access is
still unavailable, so attendee export remains blocked by this prerequisite.
The newly approved user guide is also not yet eligible: it follows completed
attendee export, as recorded in [guide evidence](CHECKS.md#user-guide).
Independently authorized: the [help text correction](CHECKS.md#independent-help-text-correction)
may proceed without waiting for persistence. Its target and approved wording
are not present in this documentation-only checkout.

Available preparation now: recover the agreed tablet check procedure and
arrange device access; recover the help text target and approved wording so
that the independent correction can proceed. The tablet check itself cannot
run yet. No product implementation or guide drafting is ready to start in
this checkout. This request changes roadmap documents only.

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
- On completion: refresh Current from remaining open items; the user guide
  becomes eligible. No release acceptance is inferred.

### User guide — not started; prerequisite open

- Goal: explain the order of using completed features and their actual limitations.
- Entry condition: attendee export is complete. The user's approval adds this
  stage after export and does not waive earlier prerequisites.
- Required outcomes and checks: [guide evidence](CHECKS.md#user-guide).
- Completion condition: the guide covers the actual usage sequence and known
  limitations of completed features, and its statements have been checked
  against the completed behavior and supporting evidence. Do not describe
  unfinished features as available or unresolved checks as passed.
- On completion: refresh Current from remaining open items. No further stage
  is approved and no release acceptance is inferred.

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

W3: roadmap documentation updated on 2026-10-04 at the user's request.
Recorded approval for a user guide after attendee export in PRODUCT.md and
added its stage and [required outcomes](CHECKS.md#user-guide). The guide will
cover completed features' usage order and actual limitations. The user confirms
the tablet check still cannot run, so registration remains verification pending;
export and the guide remain dependent on unfinished predecessors. Current now
lists available preparation and the independent help text work's missing inputs.
Only PRODUCT.md, WORK.md and CHECKS.md were changed; no product implementation,
product test run, tablet check or guide content was completed.
