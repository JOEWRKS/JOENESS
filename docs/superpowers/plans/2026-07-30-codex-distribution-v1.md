# Codex Distribution V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Add a safe, repeatable Codex/Windows installer that keeps the repository canonical, installs the Common Core by default, and offers the candidate design/frontend bundle only as an explicit internal-pilot option.

**Architecture:** One PowerShell 5.1 script owns both read-only drift checking and transactional apply. It writes one managed block to the user Codex `AGENTS.md`, uses the existing `vendor/source-manifest.json` as the source hash ledger, and records only relative managed targets and hashes in a small state file. The optional design skill and all of its runtime files are one unit under the user `.agents` root.

**Tech Stack:** PowerShell 5.1 and .NET standard library; existing JSON source manifest; plain PowerShell tests with temporary roots.

## Global Constraints

- Work only in the current repository checkout; derive the source root from the script location.
- Keep the root `AGENTS.md` bytes and hash unchanged.
- Use `vendor/source-manifest.json` as the only source-file/hash ledger; do not add a second distribution manifest.
- Default to Common Core only. Install the design/frontend candidate only with `-IncludeDesignFrontend`.
- Do not modify plugin settings, project-local instruction files, or repositories outside this harness.
- Do not add dependencies, Pester, services, locks, uninstall/repair/force modes, or an updater.
- Do not write personal absolute paths into tracked files or the installed state file.
- Keep `-Check` strictly read-only.
- Treat the optional skill plus its `vendor` files, notices, and manifest as one apply/rollback unit.
- Do not edit `README.md` during this plan; expand its existing stub after the installer contract passes.

---

### Task 1: Lock the executable contract with failing tests

**Files:**

- Create: `tests/sync-harness.tests.ps1`
- Later create: `scripts/sync-harness.ps1`

1. Add a tiny assertion helper and temporary-root helper using only PowerShell/.NET.
2. Add a fixture that supplies separate temporary `CodexHome`, `AgentsHome`, and `BackupRoot` paths.
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
5. Assert existing marker-external `AGENTS.md` bytes survive apply.
6. Assert malformed or duplicate markers, an `AGENTS.override.md` shadow, unmanaged same-name design targets in either the current or legacy user skill root, and post-install target drift block before any write.
7. Assert source hash mismatch and a planned `AGENTS.md` larger than 32 KiB block before any write.
8. Assert `-IncludeDesignFrontend` installs exactly the active skill files and manifest-listed dependency files beneath `AgentsHome`; default apply installs none of them.
9. Assert the state file contains no drive-letter or user-profile absolute path.
10. Assert a deterministic mid-apply failure restores targets whose just-applied hashes still match and reports any target that changed again as unresolved instead of overwriting it.
11. Run:

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
6. Return one JSON object containing:
   - `status`: `current`, `ready`, or `blocked`;
   - `changesRequired`;
   - normalized logical changes and blockers;
   - resolved target paths for operator visibility;
   - capability notes that Python is observed only and Figma/browser are checked at task time.
7. Ensure every `-Check` path is read-only, including the case where target roots do not exist.
8. Run the focused tests. Expected: `-Check` cases pass; apply cases still fail.

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
4. Write `joewrks-harness-state.json` last with schema version, source identities, relative managed targets, and applied hashes only.
5. Include the existing `vendor/source-manifest.json` in the optional design bundle and copy only files selected from its active-skill and source dependency entries.
6. On failure, walk applied targets in reverse and restore only when the current hash still equals this run's applied hash. Report skipped restores as unresolved.
7. Make failures nonzero and still emit a parseable final JSON result with `status = "failed"`, backup path, rollback result, and unresolved targets.
8. Run the focused tests until all pass.

### Task 4: Record the actual candidate status

**Files:**

- Modify: `docs/superpowers/specs/2026-07-30-design-frontend-vendor-router-design.md`

1. Replace the stale implementation-status line with the evidenced current state:
   - hybrid implementation exists;
   - retained-evidence validator and hard gate pass;
   - implicit activation and semantic improvement remain unverified;
   - promotion remains false;
   - explicit internal-pilot installation is allowed but default installation is not.
2. Do not rewrite historical evidence or claim live Figma/browser certification.
3. Run the focused manifest and hybrid-router tests.

### Task 5: Verify and checkpoint the Codex distribution subsystem

**Files:**

- Verify: `scripts/sync-harness.ps1`
- Verify: `tests/sync-harness.tests.ps1`
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
3. Ask one independent read-only reviewer to compare the final diff with this plan and the parent §12.3 contract.
4. Fix only demonstrated gaps, rerun affected checks, and commit the subsystem on `codex/codex-distribution-v1`.
