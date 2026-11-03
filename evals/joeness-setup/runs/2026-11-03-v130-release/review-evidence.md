# JOENESS 1.3.0 — source, main and personal installation

User decision on 2026-11-03 ("1.3.0 게시"): version commit, main push, personal installation,
tag and Release in sequence, as approved since 1.2.0.

1. Source commit `f7937db73df810ea762917196b1efa99f3845fd0` pushed to `claude/joeness-light-block`
   and fast-forwarded to `main`. Runtime payload: only `assets/AGENTS.md` changed since 1.2.0
   (check-scope rule; [42nd A/B](../2026-11-02-check-scope-ab/report.md), [live check](../2026-11-02-check-scope-ab/live-check.md)).
   Local checks on `f7937db`: Node 104/104, release, project-setup and install PowerShell suites PASS
   under Windows PowerShell 5.1. Hosted exact-commit Windows run on main: see Publication below.
2. Personal update 1.2.0 (`8f9db3f`, manifest `3afa11cf…`) → 1.3.0 (manifest `831fe05ac007…`) with
   [install-and-check.mjs](install-and-check.mjs): old Check current → backup verified → old Remove →
   new Check ready → Apply current → Check current, all exit 0. [Exact record](personal-install.json).
   The 19 installed files match the manifest. The delta is exactly the state file and
   `skills/joeness-setup/assets/AGENTS.md`; global AGENTS.md/config.toml unchanged; the representative
   installed check (review-gate tests against the installed CLI) passed.
   Backup: `C:/Users/tjdwo/.codex-install-backups/joeness-v130-20261103-831fe05ac007`.
3. Claude Code sessions in `D:\JOEWRKS` load the skill through `D:\JOEWRKS\.claude\skills\joeness-setup`,
   a link to the clean main clone `D:\JOEWRKS\.local\joe-latest-20261029\JOENESS`. Fast-forwarded
   `e2b1343` → `f7937db` (1.3.0) with no local changes.
4. Existing project connections are not updated automatically. AI-Gomoku already carries this body
   (applied 2026-11-02 as the 1.3.0 candidate through `project-setup.ps1`, commit `c5ed3ff` in that project).
   Existing tags/Releases untouched.

## Publication

(filled in after the tag and Release)
