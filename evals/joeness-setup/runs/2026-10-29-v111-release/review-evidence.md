# JOENESS 1.1.1 — source, branch and personal installation

User decision on 2026-10-29: commit, push, and update the personal installation. QA publication
(main/tag/Release) not requested yet.

1. Source commit `8e473d7535e9f920f7eac71cefff4e907d5be989` pushed to `claude/joeness-light-block`. Only `assets/AGENTS.md` changes
   in the 17-file payload (approval-scope rule, [evidence](../2026-10-29-approval-scope-ab/report.md)).
   Local checks: Node 99/99, release, project-setup and install PowerShell suites PASS under
   Windows PowerShell 5.1. PS7 steps not run locally (no pwsh).
2. Personal update 1.1.0 (`cd1ff75`, manifest `acef856f…`) → 1.1.1 with
   [install-and-check.mjs](install-and-check.mjs): old Check current → backup verified → old
   Remove → new Check ready → Apply current → Check current, all exit 0.
   [Exact record](personal-install.json). The 17 installed files match the manifest. The delta is
   exactly assets/AGENTS.md and the state file; global AGENTS.md/config.toml unchanged; the
   representative installed checks passed.
   Backup: `C:/Users/tjdwo/.codex-install-backups/joeness-v111-20261029-1a55f7d861dd`.
3. Existing project connections are not updated automatically. Existing tags/Releases untouched.
