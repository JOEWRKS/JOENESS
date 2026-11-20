# JOENESS 2.0.1 — source, main, publication and personal installation

User decision on 2026-11-20 ("세 도구 게시", said directly to the parent Claude Code session after "전부 고친 다음에 게시하자"):
version commit, main push, CI, tag, Release, Codex personal installation and Claude Code clone update in sequence,
run by that parent session.

1. Runtime payload since 2.0.0: five files. The entry guard of `scripts/review-gate.mjs`, `roadmap-review.mjs`,
   `operation-review.mjs`, `impact-review.mjs` (real-path comparison, fail closed with exit 2 instead of a silent
   exit 0 on a junction/symlink install path) and `references/review-gate.md` (CRLF pin guidance, `<joeness-setup>`
   placeholder, DESIGN Result-cell procedure). `SKILL.md`, `assets/AGENTS.md` and `project-setup.ps1` are
   byte-identical to 2.0.0. Preparation commits `4cadc19`, `69e1338`, `28c4ba7`, `2d6ee2a` by the building session;
   record [report-201.md](report-201.md), inputs [docs-joeness-report.md](docs-joeness-report.md),
   [integration-report.md](integration-report.md). No behavioral A/B, no paid runs.
2. Release commit `8ae6b37de04fcaaef71f8d1b9aa9bc7654cd1cb3` (CHANGELOG publish line, AGENTS source-version line,
   [release notes](release-notes-v2.0.1.md)) fast-forwarded to `main` and pushed. Local checks at that commit:
   Node 113/113, release PowerShell suite exit 0 (Windows PowerShell 5.1); install and project-setup suites exit 0
   at the candidate commit (unchanged files since). Tag `JOENESS-v2.0.1`, Release
   https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v2.0.1.
   Exact-commit [Windows run 44711543568](https://github.com/JOEWRKS/JOENESS/actions/runs/44711543568): completed/success
   (the only PowerShell 7 run; `pwsh` is not installed locally).
3. Parent-session verification before publication: through a junction to the candidate's skill folder,
   `review-gate.mjs` with bogus arguments printed its JSON and exited 2 (2.0.0 exited 0 with no output); in a copy of
   the integration-trial project, a JOEDESIGN 2.0.1 receipt with project-relative evidence paths was consumed with
   `allowed:true` after restoring `DESIGN.md` to its pre-Result-update bytes (the documented procedure).
4. Claude Code: `D:\JOEWRKS\.claude\skills\joeness-setup` links to the clean main clone
   `D:\JOEWRKS\.local\joe-latest-20261029\JOENESS`, fast-forwarded to the receipt commit; manifest version 2.0.1.
   From this release the gate scripts run through that junction path.
5. Codex personal update 2.0.0 (`9b6dd25`, manifest `2add432166e5…`) → 2.0.1 (manifest `552a8c4bc298…`) with
   [install-and-check.mjs](install-and-check.mjs) (the 2.0.0 script with commit, hash, version, changed-file list
   and path constants changed): old Check current → backup verified → old Remove → new Check ready → Apply current →
   Check current, all exit 0; status `installed-and-verified`. [Exact record](personal-install.json).
   The 19 installed files match the manifest; the delta is exactly the state file and the five payload files;
   global AGENTS.md/config.toml unchanged; the representative installed check (review-gate tests against the
   installed CLI) exited 0. `JOENESS.ps1 -Check` afterwards: `current`, `installedRelease` 2.0.1.
   Backup: `~/.codex-install-backups/joeness-v201-20261120-552a8c4bc298`. User paths in the receipt are `~` and `<tmp>`.
6. Existing project connections need no update: the connection body is byte-identical to 2.0.0.
