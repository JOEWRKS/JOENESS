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
  effect and no regression for the two recording rules). Small samples (2–4 runs
  per arm); no general performance or token claim. TASK size rules:
  [TASK size A/B](../2026-10-24-task-size-ab/report.md), phases 22–29 on copies of
  four real projects (Claude only, 3–6 runs per arm, blind grading in 28–29).
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

## Remaining

1. Commit the release preparation (user approval).
2. Push the work branch; Windows workflow on the exact commit (user approval).
3. Personal installation update: backup, Apply, Check current, 17-file hash match (user approval).
4. QA publication of `JOENESS-v1.1.0` after main CI and installation comparison (QA owner).
