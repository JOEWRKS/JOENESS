# JOENESS 1.4.1 — source, main, publication and personal installation

User decision on 2026-11-14 ("게시하고 2번 ㄱ", said directly to the parent Claude Code session in answer to
"JOENESS 1.4.1 게시(버전·push·태그·Release·설치)를 승인할까요?"): version commit, main push, CI, tag, Release,
Codex personal installation and Claude Code clone update in sequence, run by that parent session.

1. Runtime payload since 1.4.0: `SKILL.md`, `assets/AGENTS.md`, `assets/DESIGN.md`, `assets/ROADMAP.md`,
   `references/review-gate.md`, `scripts/project-setup.ps1` (19-file payload unchanged in count). Candidate commits
   `5083183`, `ba846f3`, `1f30739`, `182fc7a` by the building session; evidence
   [2026-11-12-v141-candidate/report.md](../2026-11-12-v141-candidate/report.md) (Node 106/106, PowerShell project-setup
   28 cases, release and install suites exit 0; scratch repository runs of -Check/-Apply). No behavioral A/B, no paid runs.
2. Release commit `89ac76356bb3ae05f5676e26a396655416a50d77` (version 1.4.0 → 1.4.1 in manifest, installer, tests, README,
   installation doc; changelog dated) fast-forwarded to `main` and pushed. Local checks at that commit: Node 106/106,
   release, install and project-setup PowerShell suites PASS (Windows PowerShell 5.1), `git diff --check` clean.
   Exact-commit [Windows run 43608401096](https://github.com/JOEWRKS/JOENESS/actions/runs/43608401096): completed/success.
3. Claude Code: `D:\JOEWRKS\.claude\skills\joeness-setup` links to the clean main clone
   `D:\JOEWRKS\.local\joe-latest-20261029\JOENESS`, fast-forwarded `696c32a` → `89ac763` with no local changes;
   manifest version 1.4.1.
4. Codex personal update 1.4.0 (`696c32a`, manifest `33e5ae2cf462…`) → 1.4.1 (manifest `1f8fb7ca73d0…`) with
   [install-and-check.mjs](install-and-check.mjs): old Check current → backup verified → old Remove → new Check
   ready → Apply current → Check current, all exit 0; status `installed-and-verified`. [Exact record](personal-install.json).
   The 19 installed files match the manifest; the delta is exactly the state file and the six changed skill files;
   global AGENTS.md/config.toml unchanged; the representative installed check (review-gate tests against the
   installed CLI) exited 0. Backup: `~/.codex-install-backups/joeness-v141-20261115-1f8fb7ca73d0`.
   User paths in the receipt are shown as `~` and `<tmp>`.
5. Existing project connections are not updated automatically; `-Check` on an older connection may now report
   `warnings` for machine paths without changing its `current` status.

## Publication (2026-11-14)

- Annotated tag `JOENESS-v1.4.1`, object `7b81f3c012ddeab62face499d072bf57ed290301`, peeled to the release
  commit `89ac763`, whose exact-commit Windows run passed.
- [Release 445382142](https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v1.4.1): published
  2026-11-14T15:12:25Z; non-draft, non-prerelease, marked latest. Notes: [release-notes.md](release-notes.md).
- Existing `JOENESS-v0.3.4`–`JOENESS-v1.4.0` tags and Releases untouched. Later commits are documentation only;
  do not move the tag.
