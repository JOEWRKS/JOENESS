# JOENESS 1.1.0 — source preparation

Status: 1.1.0 source prepared on branch `claude/joeness-light-block` (on top of
`7d3e42d`). Local gates passed except the PowerShell 7 steps, which need `pwsh`
(not installed here) and run in the Windows workflow. Not yet committed as a
release, pushed, installed or published.

User decision on 2026-10-24: keep the light connection body with both recording
rules (own TASK entry per piece of work; rewrite ROADMAP current/next lines when an
item changes) in the shared body, and move to release preparation. Commit/push,
personal installation update and QA publication each need separate approval.
QA owns main/tag/Release; preserve existing JOENESS-v1.0.0–v1.0.2 tags/Releases.

## Scope

- Within the 17-file payload only `assets/AGENTS.md`, `assets/ROADMAP.md` and
  `SKILL.md` change against 1.0.2 (`1b3d5a0`); the other 14 files and F01–F06
  executable contracts are unchanged. Installer/test version pins change to 1.1.0
  without altered checks or behavioral expectations.
- Connection body: 4,907 bytes / 649 words / 64 lines → 3,144 bytes / 494 words /
  41 lines. Template SHA-256 `0f2ad4d33b9504a96b085c020ce735201994b6dfe156b47829a890ed1027dfbf`.
- Manifest SHA-256 (working tree, version 1.1.0):
  `1346f5659499fdd6860ea63ae04510179f6ef9980143a524c2baf2bf64003c27`.
- Behavior evidence: [light-block A/B report](../2026-10-23-light-block-ab/report.md),
  phases 1–21 (Claude A/B including long-context reproductions on a copy of real
  project records; Codex gpt-6-astra/xhigh checks in phases 20–21 showing no added
  effect and no regression for the two recording rules). Small samples (2–4 runs
  per arm); no general performance or token claim.
- Existing project connections are not updated automatically.

## Local gates (2026-10-24)

| Gate | Result |
|---|---|
| `node --test` (six CI suites) | 99/99 pass |
| `tests/joeness-release.tests.ps1` (PS5) | PASS |
| `tests/joeness-project-setup.tests.ps1` (PS5) | 27 project safety cases PASS |
| `tests/joeness-install.tests.ps1` (PS5) | 17/17, lifecycle PASS |
| PS7 project-setup / install | not run locally (`pwsh` absent); covered by Windows workflow |
| `git diff --check 1b3d5a0` | clean |

## Remaining

1. Commit the release preparation (user approval).
2. Push the work branch; Windows workflow on the exact commit (user approval).
3. Personal installation update: backup, Apply, Check current, 17-file hash match (user approval).
4. QA publication of `JOENESS-v1.1.0` after main CI and installation comparison (QA owner).
