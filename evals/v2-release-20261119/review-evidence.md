# JOENESS 2.0.0 — source, main, publication and personal installation

User decision on 2026-11-19 ("게시 ㄱㄱ", said directly to the parent Claude Code session in answer to
"세 도구 2.0.0을 게시할까요(태그·push·Release·개인 설치)?"): version commit, main push, CI, tag, Release,
Codex personal installation and Claude Code clone update in sequence, run by that parent session.

1. Runtime payload since 1.4.2: none. `git rev-parse HEAD:skills/joeness-setup` = `73af9e5e1e55def3e56cfaf11d2657d7ad7a944d`
   (= `JOENESS-v1.4.2`); the 19 manifest file hashes are unchanged and only `release.version` moved to 2.0.0.
   Preparation commits `97a1a10` (survey), `e7f39d6` (hygiene), `d332846` (`docs/SECURITY.md`), `b096fa6` (docs,
   quickstart, version) by the building sessions; record [report.md](report.md), survey
   [../v2-survey-20261119/report.md](../v2-survey-20261119/report.md). No behavioral A/B, no paid runs.
2. Release commit `9b6dd25e915b01d483b54ee135413900532c3ec3` (CHANGELOG publish line, AGENTS source-version line,
   [release notes](release-notes-v2.0.0.md)) fast-forwarded to `main` and pushed. Local checks at that commit:
   Node 106/106, release PowerShell suite exit 0 (Windows PowerShell 5.1); install and project-setup suites exit 0 at
   the candidate commit (unchanged files since). Tag `JOENESS-v2.0.0`, Release
   https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v2.0.0.
   Exact-commit [Windows run 44527020551](https://github.com/JOEWRKS/JOENESS/actions/runs/44527020551): completed/success
   (this is the only PowerShell 7 run; `pwsh` is not installed on the local machine).
3. Claude Code: `D:\JOEWRKS\.claude\skills\joeness-setup` links to the clean main clone
   `D:\JOEWRKS\.local\joe-latest-20261029\JOENESS`, fast-forwarded `e70e9dc` → `9b6dd25` (and again to the receipt
   commit) with no local changes; manifest version 2.0.0.
4. Codex personal update 1.4.2 (`593bd02`, manifest `d1582e24c956…`) → 2.0.0 (manifest `2add432166e5…`) with
   [install-and-check.mjs](install-and-check.mjs) (the 1.4.2 script with commit, hash, version and path constants
   changed): old Check current → backup verified → old Remove → new Check ready → Apply current → Check current,
   all exit 0; status `installed-and-verified`. [Exact record](personal-install.json).
   The 19 installed files match the manifest; the delta is exactly the state file (`joeness-skills-state.json`,
   releaseVersion 2.0.0); no skill file changed bytes; global AGENTS.md/config.toml unchanged; the representative
   installed check (review-gate tests against the installed CLI) exited 0.
   Backup: `~/.codex-install-backups/joeness-v200-20261119-2add432166e5`. User paths in the receipt are `~` and `<tmp>`.
5. Existing project connections are not updated and need no update: the connection body is byte-identical to 1.4.2,
   and `-Check` compares a project's block only with that project's last applied baseline, so it stays `current`.
