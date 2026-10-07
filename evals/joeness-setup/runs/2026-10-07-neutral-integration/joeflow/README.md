# T008 JOEFLOW neutral integration evidence

Status: `TEST_ONLY / NOT_PRODUCT_AUTHORITY / NOT_A_RELEASE`

This directory contains the JOEFLOW side of the T008 neutral connection test.
It does not modify GEO, the JOEFLOW repository, the installed personal skill,
or the JOENESS/JOEFLOW draft contract.

## Inputs and authority boundary

- `open-source-state.json` is a synthetic `OPEN / UNAPPROVED` state for the
  JOENESS stop/resume copy test. It contains a selected direction, a resolved
  related unknown, and a separate open external-rights unknown.
- `approved-baseline-state.json` is a read-only evidence copy of the existing
  approved M6 dogfood state. Its approval is not a new T008 user approval.
- The generated 2.1 handoff and contract use the installed JOEFLOW engine at
  `C:\Users\tjdwo\.codex\skills\joewrks-product-definition`.
- No JOENESS root document is an engine input. The fixture therefore exercises
  the JOEFLOW-only path.

## Reproduce

```powershell
python -B "D:\JOEWRKS\작업하네스\evals\joeness-setup\runs\2026-10-07-neutral-integration\joeflow\run_dependency_audit.py"
```

Then validate the fixed OPEN input independently:

```powershell
python -B "C:\Users\tjdwo\.codex\skills\joewrks-product-definition\scripts\validate_state.py" "D:\JOEWRKS\작업하네스\evals\joeness-setup\runs\2026-10-07-neutral-integration\joeflow\open-source-state.json"
```

## Expected results

- unchanged approved baseline: `CONFORMANT / SAME_APPROVED_REVISION`;
- added unconsumed evidence plus baseline refresh at the same revision:
  Closure and exact approval/Manifest identities remain valid;
- a newer `OPEN / UNAPPROVED` revision with only that unconsumed evidence:
  `CONFORMANT / OLDER_APPROVED_REVISION_UNAFFECTED`;
- consumed seed drift: `REENTRY_REQUIRED` for only the affected consumer while
  the source approved contract identity and approval history remain preserved.

Exact outputs are in `audit-results.json`; byte identities are in
`sha256-manifest.json`.

## Limitations

- This is local deterministic contract evidence, not product acceptance.
- It does not test JOENESS writing or the cross-tool interruption/resume path;
  JOENESS performs that test against its read-only copy of
  `open-source-state.json`.
- It does not migrate authority, release either system, or modify a personal
  installation.
