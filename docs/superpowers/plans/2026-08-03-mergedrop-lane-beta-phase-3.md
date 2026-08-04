# MergeDrop Lane Beta Phase 3 Implementation Plan

> **For agentic workers:** Execute in the isolated pilot with a fresh worker. Use root-cause evidence and RED→GREEN checks; do not alter JOENESS source during this phase.

**Goal:** Record the owner's lane-based product decision and correct the two independently reproduced UI defects before any Android SDK or packaging work.

**Architecture:** Preserve the deterministic game rules. Fix compact-height distortion by constraining board width from the available vertical budget rather than independently capping canvas height. Add a small pure accessibility formatter so the selected lane and board contents are testable and exposed through the existing semantic page.

**Tech Stack:** Existing JavaScript ES modules, Node built-in test runner, HTML Canvas, CSS, and current local browser tools. No new dependency.

## Global Constraints

- Writable root: `D:\JOEWRKS\.harness-evals\joeness-0.1-beta-mergedrop-01` only.
- Product choice: retain deterministic lane placement for the next beta.
- Do not install Android SDK, Gradle, ADB, an engine, or another package.
- Do not claim Android, device, signing, Play Console, or launch readiness.
- Preserve current merge rules and the six passing rule tests.
- No commit, push, publication, deployment, or account action.

---

### Task 1: Confirm the lane decision

**Files:**
- Modify: `docs/decisions/2026-08-03-core-feel-gate.md`

- [x] Record that the owner selected deterministic lanes for the next beta.
- [x] Preserve free-body physics as a future reconsideration point, not active scope.

### Task 2: Preserve the board ratio on compact portrait screens

**Files:**
- Modify: `styles.css`

- [x] Reproduce the existing 360×640 failure: rendered canvas ratio approximately `0.898`, not `9/13`.
- [x] Remove the independent compact-height cap that forces canvas height without matching width.
- [x] Under `max-height: 760px`, cap and center board width from the 56svh vertical budget (`56 × 9 / 13 = 38.77svh`) while keeping controls usable.
- [x] Verify at 360×640 and 390×844: canvas ratio within `0.01` of `9/13`, no horizontal overflow, and action controls at least 44px high.

### Task 3: Expose selected lane and board state

**Files:**
- Create: `src/accessibility.mjs`
- Create: `test/accessibility.test.mjs`
- Modify: `index.html`
- Modify: `src/app.mjs`
- Modify: `styles.css`

- [x] Write failing tests for a Korean board description containing selected lane, current piece, score, and every column's contents or empty state; run them and confirm the missing formatter causes RED.
- [x] Implement the smallest pure `describeBoard(game, selectedColumn)` formatter and make the new tests GREEN.
- [x] Add a visually hidden board summary referenced by the focusable canvas; update it on render.
- [x] Announce keyboard lane changes through the existing polite status without flooding pointer movement.
- [x] Verify keyboard selection changes the accessible text, a drop updates board contents, and the console remains clean.

### Task 4: Verify and hand off

**Files:**
- Modify: `README.md`
- Create: `docs/handoff/2026-08-03-phase-3.md`

- [x] Run the full test suite and syntax checks.
- [x] Repeat compact and regular portrait browser checks plus one keyboard and one pointer drop.
- [x] Document exact completed, partial, unverified, and next Android-boundary work.
- [x] Leave the next phase as selecting and authorizing the smallest real Android debug-build route; do not implement it in this phase.
