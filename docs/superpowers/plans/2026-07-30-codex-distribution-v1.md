# Codex Distribution V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Add a safe, repeatable Codex/Windows installer that keeps the repository canonical, installs the Common Core by default, and offers the candidate design/frontend bundle only as an explicit internal-pilot option.

**Architecture:** One PowerShell 5.1 script owns both read-only drift checking and transactional apply. It owns only one managed block inside the user Codex `AGENTS.md`, owns optional skill/vendor files as whole files, uses the existing `vendor/source-manifest.json` as the source hash ledger, and records only relative managed targets and hashes in a small state file. The optional design skill and all of its runtime files are one unit under the user `.agents` root.

**Tech Stack:** PowerShell 5.1 and .NET standard library; existing JSON source manifest; plain PowerShell tests with temporary roots.

## Global Constraints

- Work only in the current repository checkout; derive the source root from the script location.
- Keep the root `AGENTS.md` bytes and hash unchanged.
- Use `vendor/source-manifest.json` as the only source-file/hash ledger; do not add a second distribution manifest.
- Default to Common Core only. Install the design/frontend candidate only with `-IncludeDesignFrontend`.
- The candidate flag is limited to a same-user internal pilot under parent §12.4; it does not promote the skill or prove implicit routing, semantic improvement, Figma, or browser behavior.
- Do not modify plugin settings, project-local instruction files, or repositories outside this harness.
- Do not add dependencies, Pester, services, locks, uninstall/repair/force modes, or an updater.
- Do not write personal absolute paths into tracked files or the installed state file.
- Keep `-Check` strictly read-only.
- Treat the optional skill plus its `vendor` files, notices, and manifest as one apply/rollback unit.
- For `AGENTS.md`, store and compare the managed-block hash; capture the whole-file hash only to detect a concurrent change during one apply. Marker-external edits are allowed and preserved.
- For optional skill/vendor targets, store and compare whole-file hashes.
- Omitting `-IncludeDesignFrontend` after a prior opt-in preserves and drift-checks the installed bundle but never removes, unmanages, or updates it. The flag is required for a source update.
- Read and write `AGENTS.md` as bytes. Accept only strict UTF-8 with or without BOM, preserve its BOM and marker-external bytes, and reject unsupported encodings before a write.
- Do not edit `README.md` during this plan; expand its existing stub after the installer contract passes.

---

### Task 1: Lock the executable contract with failing tests

**Files:**

- Create: `tests/sync-harness.tests.ps1`
- Later create: `scripts/sync-harness.ps1`

1. Add a tiny assertion helper and temporary-root helper using only PowerShell/.NET.
2. Add a fixture that supplies separate temporary source, `CodexHome`, `AgentsHome`, and `BackupRoot` paths. The source fixture is a minimal copy rooted around the script so source drift can be tested without editing the checkout.
3. Assert `-Check` on an empty target:
   - exits successfully;
   - returns parseable JSON with `status = "ready"` and `changesRequired = true`;
   - reports Common Core as planned;
   - does not create a target, state, directory, or backup.
4. Assert `-Apply` on an empty target:
   - creates the managed Common Core block and state;
   - preserves no unrequested target;
   - is followed by `-Check` reporting `status = "current"`;
   - a second `-Apply` changes no target hashes and creates no backup.
5. Assert existing UTF-8 Korean text, BOM state, newline style, and marker-external `AGENTS.md` bytes survive initial apply, a later external edit, check, no-op apply, and a source-core update.
6. Assert malformed or duplicate markers, an `AGENTS.override.md` shadow, unmanaged same-name design targets in either the current or legacy user skill root, and post-install target drift block before any write.
7. Assert source hash mismatch and a planned `AGENTS.md` larger than 32 KiB block before any write.
8. Assert `-IncludeDesignFrontend` installs exactly the active skill files and manifest-listed dependency files beneath `AgentsHome`; default apply installs none of them.
9. Assert opt-in apply followed by default check/apply preserves and still drift-checks the optional bundle without deleting, unmanaging, or updating it.
10. Assert the state file contains no drive-letter or user-profile absolute path and records block ownership separately from whole-file ownership.
11. Assert a deterministic mid-apply failure restores targets whose just-applied hashes still match and reports any target that changed again as unresolved instead of overwriting it. Use an internal callback accepted only by the dot-sourced function; the standalone CLI exposes no failpoint option.
12. Run:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tests\sync-harness.tests.ps1
   ```

   Expected: FAIL because `scripts\sync-harness.ps1` does not exist.

### Task 2: Implement read-only preflight and `-Check`

**Files:**

- Create: `scripts/sync-harness.ps1`
- Modify: `tests/sync-harness.tests.ps1`

1. Add mutually exclusive `-Check` and `-Apply` switches plus:
   - `-IncludeDesignFrontend`;
   - optional `-CodexHome`;
   - optional `-AgentsHome`;
   - optional testable `-BackupRoot`.
2. Resolve defaults without persisting them:
   - Codex home from nonempty `CODEX_HOME`, else `%USERPROFILE%\.codex`;
   - agents home from `%USERPROFILE%\.agents`;
   - backups from `%LOCALAPPDATA%\JOEWRKS\work-harness\backups`.
3. Validate all source-manifest paths as relative, non-escaping file paths and verify every listed size and SHA-256 before considering a write.
4. Build the exact desired Common Core managed block using stable markers while preserving marker-external bytes.
5. Detect before apply:
   - duplicate or incomplete markers;
   - a nonempty user `AGENTS.override.md`;
   - installed-target drift against prior state;
   - unmanaged collision at any exact planned optional target;
   - a duplicate `joewrks-design-frontend` directory or frontmatter `name` under the current `.agents\skills` root or legacy `<CodexHome>\skills` root, excluding `.system`;
   - the resulting user `AGENTS.md` exceeding 32 KiB.
6. Decode existing `AGENTS.md` with strict UTF-8 validation, preserve an existing BOM and external byte slices, and reject UTF-16 or invalid UTF-8 before planning a write.
7. Treat optional state transitions explicitly:
   - absent flag and no prior opt-in: do not plan optional files;
   - absent flag and prior opt-in: verify installed hashes, preserve the bundle, and report a source update as available without applying it;
   - present flag: install or update the complete optional bundle;
   - any installed-file drift: block before writing.
8. Return one JSON object containing:
   - `status`: `current`, `ready`, or `blocked`;
   - `changesRequired`;
   - normalized logical changes and blockers;
   - resolved target paths for operator visibility;
   - capability notes that Python is observed only and Figma/browser are checked at task time.
9. Ensure every `-Check` path is read-only, including the case where target roots do not exist.
10. Run the focused tests. Expected: `-Check` cases pass; apply cases still fail.

### Task 3: Implement safe `-Apply` and idempotency

**Files:**

- Modify: `scripts/sync-harness.ps1`
- Modify: `tests/sync-harness.tests.ps1`

1. Reuse the same preflight used by `-Check`; abort on any blocker before creating a backup or target directory.
2. If status is already `current`, return success without rewriting files or creating a backup.
3. For a real apply:
   - capture each existing target hash or absence;
   - copy existing target bytes to a run-specific backup directory;
   - create a temporary file beside each destination;
   - verify its expected hash;
   - recheck the destination against its preflight hash immediately before replacement;
   - replace the destination;
   - verify the applied hash.
4. Write `joewrks-harness-state.json` last with schema version, source identities, the Common Core block hash, relative whole-file targets, and applied hashes only.
5. Include the existing `vendor/source-manifest.json` in the optional design bundle and copy only files selected from its active-skill and source dependency entries.
6. Keep the standalone CLI free of a failure-injection parameter. Expose a dot-sourceable `Invoke-JoewrksHarnessSync` function whose internal test callback can run after a replacement; normal script invocation never supplies it.
7. On failure, walk applied targets in reverse and restore only when the current hash still equals this run's applied hash. Report skipped restores as unresolved.
8. Make failures nonzero and still emit a parseable final JSON result with `status = "failed"`, backup path, rollback result, and unresolved targets.
9. Run the focused tests until all pass.

### Task 4: Verify and checkpoint the Codex distribution subsystem

**Files:**

- Verify: `scripts/sync-harness.ps1`
- Verify: `tests/sync-harness.tests.ps1`
- Verify: `docs/superpowers/specs/2026-07-27-common-work-harness-design.md`
- Verify: `docs/superpowers/specs/2026-07-30-design-frontend-vendor-router-design.md`

1. Run from a clean temporary target:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tests\sync-harness.tests.ps1
   node --test tests\*.tests.mjs
   powershell -NoProfile -ExecutionPolicy Bypass -File tests\p0-evaluation-contract.tests.ps1
   $env:PYTHONDONTWRITEBYTECODE='1'
   python -B vendor\ui-ux-pro-max\scripts\validate_data.py
   python -B -m unittest discover -s vendor\ui-ux-pro-max\scripts\tests
   ```

2. Verify:
   - root `AGENTS.md` SHA-256 remains `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495`;
   - new installer, test, state schema, and README text contain no personal absolute path;
   - `README.md` remains the user's untracked stub;
   - `git diff --check` passes.
3. Confirm the parent and child specs still state that the design skill is a non-promoted candidate allowed only behind explicit same-user internal-pilot selection.
4. Ask one independent read-only reviewer to compare the final diff with this plan and the parent §12.3-12.4 contract.
5. Fix only demonstrated gaps, rerun affected checks, and commit the subsystem on `codex/codex-distribution-v1`.
