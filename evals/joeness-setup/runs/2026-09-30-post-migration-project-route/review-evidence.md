# Setup-only project route and routine record — bounded evidence

Date: 2026-09-30. Source: personally installed `joeness-setup` from `0.3.0-beta.3-dev`. Scope: neutral local fixtures only; no production project, remote push, or release.

## Fresh project connection

- A new Git fixture at `C:\Users\tjdwo\AppData\Local\Temp\joeness-setup-apply-20260930-a` contained `PRODUCT.md`, `ROADMAP.md`, `TASK.md`, `ISSUES.md`; it had no `AGENTS.md` or setup state. No DESIGN role was needed.
- Proposed and applied one short AGENTS connection: reuse those four sources, read relevant roles, record authorized work in TASK and reusable causes in ISSUES, check required roadmap items, and give a six-field work report. No project code or existing role documents were changed by setup.
- Installed helper: `Check ready` with both target/state hashes `absent`; `Apply current` changed only `AGENTS.md` and `.joeness/setup-state.json`; subsequent `Check current` reported clean and no changes required. Final target SHA-256 `9da6e561ebc1c395e14fa2fcc2a4f1876d1e8b1ae8820caf3492fa4718abf474`; state SHA-256 `7180c0c98a976cb77f085b33ea222fab76c27acbf029ce201b78f910b36b32d0`.
- Boundary: this new fixture is not a saved Codex app project, so fresh-chat automatic delivery for this exact fixture was not tested. The prior saved neutral project's read-only fresh-chat delivery is recorded in [personal migration evidence](../2026-09-30-setup-only-migration/review-evidence.md).

## Routine record in a saved neutral project

- New Codex chat `01a0edc8-f80a-73f0-bf68-4cfaa6e2f9f5` worked in saved `JOENESS_TEST-04`. Its existing connection allowed routine recording after authorized work.
- Before the run, `TASK.md` incorrectly said the clamp fix was not implemented; SHA-256 `a4c6a003e8fe0e719f36e6ac3c14b464471409e0a39dcdda2e267203aef41029`. Current `main.mjs` used `Math.max(0, n)`. The chat ran `node --test main.test.mjs`: 1 pass, 0 fail, exit 0.
- The chat changed `TASK.md` only, recording current implementation, checked inputs `-2` and `4`, user acceptance unknown, other inputs unverified, and the roadmap's next JSON export item. After SHA-256 `0b58d2d6181e3e82ea387d36a9c47fb5e4c9b106c2a9e2f2e7c7a1a376651086`.
- `ISSUES.md` was unchanged (SHA-256 `7781f5b10ce87abc5066d918ebe4760e0f020ce51bb3fdcc2b8c59e9a3a65fa3`); TASK linked its existing C-1 cause instead of duplicating it. No code, test, Product, roadmap, or AGENTS changes were observed.
- Boundary: this demonstrates a scoped corrective record after an actual recheck, not a new feature implementation or general quality advantage over Bare. Human acceptance, a same-project fresh-setup-to-new-chat chain, remote CI, and formal release remain unverified.
