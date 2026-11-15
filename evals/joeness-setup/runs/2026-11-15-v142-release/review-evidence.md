# JOENESS 1.4.2 — source, main, publication and personal installation

User decision on 2026-11-15 ("둘 다 게시", said directly to the parent Claude Code session in answer to
"두 건을 게시(버전 올림·태그·Release·개인 설치)할까요?"): version commit, main push, CI, tag, Release,
Codex personal installation and Claude Code clone update in sequence, run by that parent session.

1. Runtime payload since 1.4.1: `assets/AGENTS.md` only (19-file payload unchanged in count). Preparation commits
   `93f9abe` (connection body, contract assertion, manifest file hash, CHANGELOG) and `b104507` (prep report) by the
   building session; evidence [2026-11-15-v142-prep/report.md](../2026-11-15-v142-prep/report.md) (Node 106/106,
   PowerShell 5.1 release, project-setup 28 cases and install suites PASS; scratch-project -Apply/-Check `current` from
   an empty state and from a 1.4.1 block). No behavioral A/B, no paid runs.
2. Release commit `593bd020e1c2a93545e9d7b61dacd4167e0a81ac` (version 1.4.1 → 1.4.2 in manifest, installer, tests,
   README, installation doc; changelog dated; AGENTS.md current-release line; release notes) fast-forwarded to `main`
   and pushed. Local checks at that commit: Node 106/106, release, project-setup and install PowerShell suites exit 0
   (Windows PowerShell 5.1), `git diff --check` clean.
   Exact-commit [Windows run 43724279170](https://github.com/JOEWRKS/JOENESS/actions/runs/43724279170): completed/success.
3. Claude Code: `D:\JOEWRKS\.claude\skills\joeness-setup` links to the clean main clone
   `D:\JOEWRKS\.local\joe-latest-20261029\JOENESS`, fast-forwarded `8adfc14` → `593bd02` with no local changes;
   manifest version 1.4.2.
4. Codex personal update 1.4.1 (`89ac763`, manifest `1f8fb7ca73d0…`) → 1.4.2 (manifest `d1582e24c956…`) with
   [install-and-check.mjs](install-and-check.mjs): old Check current → backup verified → old Remove → new Check
   ready → Apply current → Check current, all exit 0; status `installed-and-verified`. [Exact record](personal-install.json).
   The 19 installed files match the manifest; the delta is exactly the state file and `assets/AGENTS.md`;
   global AGENTS.md/config.toml unchanged; the representative installed check (review-gate tests against the
   installed CLI) exited 0. Backup: `~/.codex-install-backups/joeness-v142-20261115-d1582e24c956`.
   User paths in the receipt are shown as `~` and `<tmp>`.
5. Existing project connections are not updated automatically; `-Check` compares a project's block only with that
   project's last applied baseline, so a 1.4.1 block still reports `current`. An agent updates it by re-running `-Apply`
   with the new body.

## Publication (2026-11-15)

- Annotated tag `JOENESS-v1.4.2`, object `a27779cb2bf4163a7640caf0ee701a67e1c95bb0`, peeled to the release
  commit `593bd02`, whose exact-commit Windows run passed.
- [Release 446116521](https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v1.4.2): published
  2026-11-15T14:25:32Z; non-draft, non-prerelease, marked latest. Notes: [release-notes.md](release-notes.md).
- Existing `JOENESS-v0.3.4`–`JOENESS-v1.4.1` tags and Releases untouched. Later commits are documentation only;
  do not move the tag.
