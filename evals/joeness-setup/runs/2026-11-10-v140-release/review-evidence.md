# JOENESS 1.4.0 — source, main, publication and personal installation

User decision on 2026-11-10 ("둘 다 승인", relayed by the JOEDESIGN side session in answer to
"JOENESS C팔 채택·1.4.0 게시"): adopt the C connection sentences, then version commit, main push,
tag, Release and personal installation in sequence.

1. Runtime payload since 1.3.0: `SKILL.md`, `assets/AGENTS.md`, `assets/TASK.md`, `assets/ROADMAP.md`,
   `references/review-gate.md` (19-file payload unchanged in count). The connection body is byte-identical
   to the tested C arm of the [43rd A/B/C](../2026-11-09-report-stamp-ab/report.md).
2. Release commit `696c32aa0a1d50fb972c4965495360496150908f` fast-forwarded to `main` and pushed.
   Local checks: Node 104/104, release, install and project-setup PowerShell suites PASS (Windows PowerShell 5.1).
   Exact-commit [Windows run 42770997371](https://github.com/JOEWRKS/JOENESS/actions/runs/42770997371): completed/success.
3. Claude Code: `D:\JOEWRKS\.claude\skills\joeness-setup` links to the clean main clone
   `D:\JOEWRKS\.local\joe-latest-20261029\JOENESS`, fast-forwarded `54c23d4` → `696c32a` with no local changes;
   its 19 skill files match the 1.4.0 manifest.
4. Codex personal update 1.3.0 (`d1ad612`, manifest `831fe05a…`) → 1.4.0 (manifest `33e5ae2cf462…`) with
   [install-and-check.mjs](install-and-check.mjs): old Check current → backup verified → old Remove → new Check
   ready → Apply current → Check current, all exit 0; status `installed-and-verified`. [Exact record](personal-install.json).
   The 19 installed files match the manifest; the delta is exactly the state file and the five changed skill files;
   global AGENTS.md/config.toml unchanged; the representative installed check (review-gate tests against the
   installed CLI) exited 0. Backup: `~/.codex-install-backups/joeness-v140-20261110-33e5ae2cf462`.
   The building session's auto-mode permission check refused this step and the tag/Release, so the
   JOEDESIGN main session ran them under the same user approval; this session verified the results afterwards
   (state file 1.4.0, receipt fields, tag and Release below). User paths in the receipt are shown as `~` and `<tmp>`.
5. Existing project connections are not updated automatically.

## Publication (2026-11-10)

- Annotated tag `JOENESS-v1.4.0`, object `d5c2d974a48de2f817a74338e2af86608c5321da`, peeled to the release
  commit `696c32a`, whose exact-commit Windows run passed.
- [Release 440034364](https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v1.4.0): published
  2026-11-10T06:55:58Z; non-draft, non-prerelease. Notes: [release-notes.md](release-notes.md).
- Existing `JOENESS-v0.3.4`–`JOENESS-v1.3.0` tags and Releases untouched. Later commits are documentation only;
  do not move the tag.
