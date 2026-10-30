# JOENESS 1.2.0 — source, main and personal installation

User decisions on 2026-10-30: commit and push, fast-forward main, then update the personal
installation. Tag/Release publication not requested yet.

1. Source commit `021a2207e7f8977fd4816d01cc1425e1745e08cd` pushed to `claude/joeness-light-block`
   and fast-forwarded to `main`. It adds the optional between-turn change notice hook
   (`scripts/changes-hook.mjs`, `references/changes-hook.md`) and changes `SKILL.md` and
   `references/usage.md`; 17 → 19 skill files ([evidence](../2026-10-30-followup-hook-ab/report.md)).
   Local checks: Node 104/104, release, project-setup and install PowerShell suites PASS under
   Windows PowerShell 5.1. Hosted exact-commit
   [Windows run 41044537897](https://github.com/JOEWRKS/JOENESS/actions/runs/41044537897) on main:
   completed/success (including the PS7 steps).
2. Personal update 1.1.1 (`8e473d7`, manifest `1a55f7d8…`) → 1.2.0 (manifest `3afa11cf…`) with
   [install-and-check.mjs](install-and-check.mjs): old Check current → backup verified → old
   Remove → new Check ready → Apply current → Check current, all exit 0.
   [Exact record](personal-install.json). The 19 installed files match the manifest. The delta is
   exactly the state file, SKILL.md, references/usage.md and the two new hook files; global
   AGENTS.md/config.toml unchanged; the representative installed checks passed.
   Backup: `C:/Users/tjdwo/.codex-install-backups/joeness-v120-20261030-3afa11cf7d45`.
3. Claude Code sessions in `D:\JOEWRKS` load the skill through `D:\JOEWRKS\.claude\skills\joeness-setup`,
   a link to the clean main clone `D:\JOEWRKS\.local\joe-latest-20261029\JOENESS` (was 1.1.0 `2fa204b`).
   Fast-forwarded to `021a220` (1.2.0) with no local changes.
4. Existing project connections are not updated automatically, and the hook is never added to a
   project without its own approval. Existing tags/Releases untouched.
