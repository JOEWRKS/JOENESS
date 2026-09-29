# JOENESS Setup-Only Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the next JOENESS source candidate install only `joeness-setup`, without writing a global judgment Core or silently migrating an older installation.

**Architecture:** Keep `JOENESS.ps1` and the project-scoped setup script as their existing entrypoints. Narrow `scripts/sync-harness.ps1` to manifest validation, legacy-install detection, skill ownership checks, and transactional skill-file/state writes; leave project `JOENESS-SETUP` behavior unchanged. The repository release contract and documentation describe this source candidate, while the current personal installation remains untouched.

**Tech Stack:** Windows PowerShell 5.1, PowerShell 7, Node.js test runner, GitHub Actions Windows CI.

**Spec:** `docs/superpowers/specs/2026-09-29-joeness-setup-only-distribution-design.md`

## Global Constraints

- Candidate identity: `0.3.0-beta.3-dev`; manifest `schemaVersion: 3`, `runtimeMode: setup-only`, no `activeCommonCore` property.
- One public skill: `joeness-setup`; `managedRuntimeFiles: []`, `defaultVendors: []`, `pluginRouting: null`; no new vendor, runtime payload, public skill, or compatibility archive.
- Do not modify the personal `C:\Users\tjdwo\.codex` installation, connected projects, main branch, remote, or historical A/B evidence.
- New package Check/Apply/Remove must leave global `AGENTS.md` and `joewrks-harness-state.json` untouched; a legacy Core state or marker blocks all three modes without mutation.
- Preserve the project setup script's approval, ownership, and document-classification behavior. Change only its skill's stale Core description and rehash that file.
- Do not claim migration, fresh-chat behavior, personal usability, or a formal release from source-only tests.

## Review Focus

- A pre-existing global `AGENTS.md` with no Core marker, including an empty or non-UTF-8 file, must retain identical bytes through Apply/Remove; test in Task 1.
- A legacy Core state without its marker, or a marker without state, must block Check/Apply/Remove and preserve all files; test in Task 1.
- A legacy state or marker appearing after the first skill write must abort and roll back owned writes while preserving the newly appeared legacy file; test in Task 1.
- A foreign `joeness-setup` file or a tampered owned file/state must block every mode, including Remove, without data loss; test in Task 1.
- A malformed source manifest that retains `activeCommonCore` or adds a runtime/vendor/second skill must fail before touching the target; test in Task 1.

---

### Task 1: Setup-only package identity and safe installer

**Files:**
- Modify: `tests/joeness-install.tests.ps1`, `tests/joeness-setup-contract.tests.mjs`
- Modify: `vendor/source-manifest.json`, `scripts/sync-harness.ps1`, `skills/joeness-setup/SKILL.md`
- Remove from active tree: `astra-judgment-core.md` (retain Git history and `evals/experiments/**`)

**Interfaces:**
- Preserve CLI parameters `-Check`, `-Apply`, `-Remove`, `-CodexHome`, JSON result fields/statuses, and `Invoke-JoenessHarnessSync`/`Get-JoenessInstallGuide` behavior.
- `Get-JoenessSourceIdentity(SourceRoot)` returns `Skill` and `ManifestHash`, with no `CoreHash`/`CoreText`; reject any `activeCommonCore` property.
- `Get-JoenessLegacyObservation(ResolvedCodexHome)` reports a blocker when `joewrks-harness-state.json` exists or either Core marker occurs in global `AGENTS.md`; inspect without rewriting either path.
- Only transaction entries: nine manifest-pinned `skills/joeness-setup/**` files and `joeness-skills-state.json`. Keep the existing skill-state schema and strict package/manifest identity check.

- [ ] **Step 1: Write RED contracts.** In `tests/joeness-setup-contract.tests.mjs`, assert manifest v3, version, `setup-only`, absent `activeCommonCore`, sole skill and exact file hashes. In `tests/joeness-install.tests.ps1`, assert fresh Check/Apply/Remove and repeated Apply never create or alter global AGENTS/Core state; assert original AGENTS bytes for ordinary, empty, and non-UTF-8 fixtures. Assert the five Review Focus conditions with all-mode file-hash preservation; use `AfterWrite` after the first skill entry to inject late legacy state/marker and assert guard-triggered rollback leaves only that externally injected file. Retain rollback, guide-on-success, unowned collision, and unsupported-parameter coverage, but key injected failures to a skill entry rather than `AGENTS.md`.
- [ ] **Step 2: Run RED.** `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\joeness-install.tests.ps1` and `node --test tests/joeness-setup-contract.tests.mjs`. Expected: failures specifically on old Core installation and v2 manifest, not fixture syntax errors.
- [ ] **Step 3: Implement minimum source change.** Set the exact candidate manifest values; remove Core source and its active manifest field; rehash only changed `SKILL.md`. In `scripts/sync-harness.ps1`, remove Core block/state write logic, detect legacy state and marker bytes read-only, reject malformed manifests, and recheck legacy paths in the transaction guard before the first write. Preserve target-path safety, skill drift checks, rollback, JSON output, and success-only usage guide.
- [ ] **Step 4: Run GREEN on both shells.** Run the Step 2 commands, then `pwsh -NoProfile -File .\tests\joeness-install.tests.ps1`. Expected: all pass; both shells leave the global AGENTS/Core state bytes unchanged in all non-blocked fixtures.
- [ ] **Step 5: Commit this installer-and-contract slice.** Stage only Task 1 files; run `git diff --cached --check`; commit with a setup-only installer message. Do not run Apply against the personal home.

### Task 2: Current release gate, CI, and user-facing source description

**Files:**
- Move/modify: `tests/astra-judgment-sync.tests.ps1` → `tests/joeness-release.tests.ps1`
- Modify: `.github/workflows/windows-ci.yml`, `AGENTS.md`, `README.md`, `docs/ROADMAP.md`
- Leave unchanged: `tests/joeness-project-setup.tests.ps1`, `tests/joeness-setup-fixtures.tests.mjs`, `skills/joeness-setup/scripts/project-setup.ps1`, `evals/experiments/**`

**Interfaces:**
- Release gate asserts the active tree contains no Core source; Git history retains the removed file and the bounded A/B evidence, including the invalid preflight.
- CI invokes `tests/joeness-release.tests.ps1` and runs installer/project tests under Windows PowerShell 5.1 and PowerShell 7. Documentation distinguishes setup-only candidate source from the still-old personal installation.

- [ ] **Step 1: Run the old release contract RED against Task 1.** `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\astra-judgment-sync.tests.ps1`. Expected: its old active-Core/tree assertions fail, proving the release gate still needs migration; preserve historical evidence.
- [ ] **Step 2: Write the new release assertions.** Rename the release test and change its tree/manifest expectations to v3 setup-only with no Core, while retaining exact A/B provenance assertions. Replace global-block lifecycle assertions with CLI checks for no global file writes and legacy-state/marker fail-closed behavior; retain JSON, exit-code, rollback, and history checks. Point CI to the new test path and include the installer suite under `pwsh`.
- [ ] **Step 3: Complete release-gate and documentation alignment.** Remove old Core-specific expectations and obsolete test path references. Update README quick summary/install/upgrade warning, root AGENTS active composition and release command, and ROADMAP status so source change is checked off but personal migration, fresh-chat confirmation, and final release remain explicitly open. Keep user-facing copy brief and avoid presenting `joeness-setup` as an always-on global rule.
- [ ] **Step 4: Run GREEN full gate.** Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\joeness-release.tests.ps1`; `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\joeness-install.tests.ps1`; `pwsh -NoProfile -File .\tests\joeness-install.tests.ps1`; `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\joeness-project-setup.tests.ps1`; `pwsh -NoProfile -File .\tests\joeness-project-setup.tests.ps1`; `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs`; `python C:\Users\tjdwo\.codex\skills\.system\skill-creator\scripts\quick_validate.py skills/joeness-setup`. Expected: every command exits 0. Confirm the CI YAML runs this same gate and `git diff --check` is clean.
- [ ] **Step 5: Check the personal boundary read-only and commit.** Record hashes of personal global `AGENTS.md`, old Core state, and installed skill before/after an explicit `-Check -CodexHome C:\Users\tjdwo\.codex`; expected: `blocked` due old identity/marker, identical hashes, no Apply/Remove. Stage only Task 2 files; `git diff --cached --check`; commit. Report source candidate status without claiming personal install, new-chat use, or release completion.

## Plan self-review

- Spec coverage: identity, installer ownership, legacy fail-closed, project setup preservation, historical evidence, Windows gates, and deferred personal migration are assigned above.
- The tasks share one package interface; Task 1 makes it work and Task 2 validates and documents the whole release surface. No new migration interface is introduced.
- Remaining after this plan: separately authorized personal migration, saved-project/new-chat verification, user review, and release decision.
