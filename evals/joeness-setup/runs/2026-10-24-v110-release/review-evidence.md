# JOENESS 1.1.0 — source, release branch and personal installation

Status: 1.1.0 source committed (`cd1ff7558ab1eb191924dc956ef119a930e72cdc`), pushed to
`codex/joeness-v110-light` with the exact-commit Windows workflow passing, and installed
personally on 2026-10-25. QA publication (main/tag/Release) is not done yet.

User decision on 2026-10-24: keep the light connection body with both recording
rules (own TASK entry per piece of work; rewrite ROADMAP current/next lines when an
item changes) in the shared body, and move to release preparation. Commit/push,
personal installation update and QA publication each need separate approval.
QA owns main/tag/Release; preserve existing JOENESS-v1.0.0–v1.0.2 tags/Releases.

User decision on 2026-10-24/25: add two TASK size rules to the shared body. The first
keeps each new TASK entry to about 10 lines with no copied text. The second offers,
once per session while TASK is over about 40KB, to move closed entries to TASK-archive.md,
and moves them only after the user agrees. Evidence: [TASK size A/B](../2026-10-24-task-size-ab/report.md).

## Scope

- Within the 17-file payload only `assets/AGENTS.md`, `assets/ROADMAP.md` and
  `SKILL.md` change against 1.0.2 (`1b3d5a0`); the other 14 files and F01–F06
  executable contracts are unchanged. Installer/test version pins change to 1.1.0
  without altered checks or behavioral expectations.
- Connection body: 4,907 bytes / 649 words / 64 lines → 3,586 bytes / 568 words /
  46 lines. Template SHA-256 `4ded5ac9c1185393708d4e70195168463d6389c627f5eaa1397effeee8df4504`.
- Manifest SHA-256 (working tree, version 1.1.0):
  `acef856fad8cb1360e3f67a0ee2ca8f896fc5c6d1ca4e0fd6b89f6dd7d909eca`.
- Behavior evidence: [light-block A/B report](../2026-10-23-light-block-ab/report.md),
  phases 1–21 (Claude A/B including long-context reproductions on a copy of real
  project records; Codex gpt-6-astra/xhigh checks in phases 20–21 showing no added
  effect and no regression for the two recording rules; phase 31 long-session blind
  A/B keeps the follow-up-turn line: without it turns 5–8 fell from 96% to 89%).
  Small samples (2–6 runs per arm); no general performance or token claim. TASK size rules:
  [TASK size A/B](../2026-10-24-task-size-ab/report.md), phases 22–29 on copies of
  four real projects (Claude, 3–6 runs per arm, blind grading in 28–29), plus a short Codex
  gpt-6-astra/xhigh check in phase 30 (2 runs per arm, 2 turns).
- Existing project connections are not updated automatically.

## Local gates (2026-10-24, rerun 2026-10-25 after the TASK size rules)

| Gate | Result |
|---|---|
| `node --test` (six CI suites) | 99/99 pass |
| `tests/joeness-release.tests.ps1` (PS5) | PASS |
| `tests/joeness-project-setup.tests.ps1` (PS5) | 27 project safety cases PASS |
| `tests/joeness-install.tests.ps1` (PS5) | 17/17, lifecycle PASS |
| PS7 project-setup / install | not run locally (`pwsh` absent); covered by Windows workflow |
| `git diff --check 1b3d5a0` | clean |

## Release and personal installation (2026-10-25)

User decision on 2026-10-25: commit, fix the version, push, and update the local installation.

1. Source commit `cd1ff7558ab1eb191924dc956ef119a930e72cdc` pushed to `codex/joeness-v110-light`
   (git ls-remote exact match). Hosted exact-commit
   [Windows run 40113059267](https://github.com/JOEWRKS/JOENESS/actions/runs/40113059267):
   completed/success, covering the PS7 steps not run locally.
2. Personal update 1.0.2 (`17349aa`, manifest `73281c22…`) → 1.1.0 with
   [install-and-check.mjs](install-and-check.mjs): old Check current → backup verified → old
   Remove → new Check ready → Apply current → Check current, all exit 0.
   [Exact record](personal-install.json). The 17 installed files match the manifest. The delta
   is exactly SKILL.md, assets/AGENTS.md, assets/ROADMAP.md and the state file. Global
   AGENTS.md/config.toml are unchanged, and the representative installed checks passed.
   Backup: `C:/Users/tjdwo/.codex-install-backups/joeness-v110-20261025-acef856fad8c`.
3. Harness fix, made before any change: the 1.0.2 script piped `git archive` into `tar` stdin,
   which hit EOF under Node 26, and Git Bash GNU tar read `C:` as a host. The archive is now
   written to a temp file and extracted with Windows `tar.exe`. The two preflight stops
   changed nothing (no backup or record).
4. Existing project connections are updated one at a time at the user's request. AI-Gomoku was
   asked to bring its block to 1.1.0.

## Remaining

1. QA publication of `JOENESS-v1.1.0` (main fast-forward, tag, Release) by the QA owner after
   checking the exact SHA, CI and this installation. Preserve existing v1.0.0–v1.0.2 tags/Releases.
