# Roadmap next-action sync retest

Status: **bounded pass for the previously observed maintenance defect**. The
original failure and comparison remain in [report.md](report.md); this file does
not erase or reinterpret them as a candidate performance advantage.

## Correction

Candidate setup guidance now says that when a required item or stage status
changes, the same roadmap's current-stage and next-priority summary must be
refreshed from open items. This does not authorize changing approved order or
scope. Only the setup skill, its AGENTS and ROADMAP writing references, and
their manifest hashes changed.

## Fresh same-case replay

- Baseline fictional project: `D:/JOEWRKS/JOENESS-Roadmap-Probe-20260928`,
  commit `c1ba5b2b0db9ebe2cd01446156ea4ac5c1c4c179`.
- Fresh clone: `D:/JOEWRKS/JOENESS-Roadmap-Probe-20260928-Candidate-Retest`.
  No personal installation or real project was changed.
- A fresh setup agent used the candidate source skill. It changed only
  `AGENTS.md`, `ROADMAP.md`, and `.joeness/setup-state.json`. The initial
  roadmap named Reservation as the current stage and reservation behavior and
  conflict tests as the next priority.
- A separate fresh continuation agent implemented one bounded Reservation task.
  It changed only `src/library.mjs`, `tests/library.test.mjs`, `TASK.md`, and
  `ROADMAP.md`. It did not alter Product scope, old handoff, setup state or
  acceptance.
- Independent `node --test tests/library.test.mjs`: **3 pass / 0 fail**.
- Final roadmap: `Current stage: **Desk pilot**`; `Reservation — complete`;
  `Next priority: observe a volunteer completing an actual checkout and return
  on the desk tablet, then obtain the product owner's separate acceptance
  decision.` A read-only consistency assertion passed. The completed
  Reservation work is no longer the next action.
- Final roadmap SHA-256:
  `c86a6cf3876ac3de44f02fd2455370f023d55e31093e1412b3ca5902bff80a4a`.
  AGENTS SHA-256:
  `0b559cf32a377c5ed7738531746afc5fd83cd32d3b68499de52c728b34a5f9b0`.

The actual desk-tablet checkout/return and product-owner decision remain
unverified. This was one synthetic same-case replay, not a long-horizon or
token-efficiency comparison. The older installed arm was not rerun because its
original case result was clear; this replay tests only the candidate correction.

## Source checks after correction

- `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs`:
  6 pass / 0 fail.
- `tests/astra-judgment-sync.tests.ps1`: pass.
- `tests/joeness-install.tests.ps1`: pass.
- `tests/joeness-project-setup.tests.ps1`: 21 cases pass in Windows PowerShell
  and 21 cases pass in PowerShell 7.
- Skill quick validation: pass.
- `git diff --check`: pass.

No release-complete claim, merge, push or personal install was made by this
retest.
