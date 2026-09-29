# Context storage and routing — bounded validation

Date: 2026-09-29. Candidate branch: `codex/joeness-context-routing`.
Base: `6295e92`. Task 2 implementation: `3ffdfe5`. All evaluated projects below were disposable fictional Git fixtures; no user project was restructured.

## Static and installation regression

The commands below were run in the Windows CI workflow order after the source and usage edits:

| Command | Result |
| --- | --- |
| `powershell.exe -NoProfile -File tests/astra-judgment-sync.tests.ps1` | PASS, current-only release contract |
| `pwsh -NoProfile -File tests/joeness-project-setup.tests.ps1` | 25 PASS |
| `powershell.exe -NoProfile -File tests/joeness-project-setup.tests.ps1` | 25 PASS |
| `powershell.exe -NoProfile -File tests/joeness-install.tests.ps1` | PASS, lifecycle contract |
| `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs` | 9 PASS, 0 FAIL |
| `python -X utf8 C:\Users\tjdwo\.codex\skills\.system\skill-creator\scripts\quick_validate.py skills/joeness-setup` | PASS |
| `git diff --check` | PASS |

The package manifest pins `astra-judgment-core.md` SHA-256 `f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9`, `skills/joeness-setup/SKILL.md` SHA-256 `0b5b1f7fc047f50220899a91e9bb15107d2fa4d4b4f32cf66448a2d50b59fac7`, and `references/usage.md` SHA-256 `379fc232346c6aeb58c9bafa2c09ee57754dc97c7cd990775b6420e15a207fa9`. The Core bytes did not change in this implementation.

## Fresh behavior cases

The case catalog is `fixtures/joeness-setup/behavior-cases.json`. Expected outcomes stayed outside the agents' user requests. Evaluators inspected fixture files, answers and changed-file sets; read-only cases had empty diffs. Delivery mode: explicit SKILL read. Changed-source agents were directed to read this worktree's candidate `skills/joeness-setup/SKILL.md`; fixture AGENTS connections were not regenerated from the changed asset. Automatic daily-session delivery: untested. Fresh subagent runs did not expose their actual runtime model identifier, so these observations are behavior evidence, **not** independently attested GPT-6 Astra xhigh results. Two extra subagents were explicitly requested as `gpt-6-astra` / `xhigh` for single-signal and multi-signal cases, but their replies likewise did not attest the runtime identity.

| Case / disposable fixture | Observed read, action and diff | Judgment |
| --- | --- | --- |
| `selective-handoff` / `FsUbeg` | Read current AGENTS, Product, Roadmap, Task, Issues, old handoff, source and focused test; reported clamp still failing 0/1, A-2 active, JSON only planned, and no mobile scope. No write; did not read Design detail. | PASS; current state outranked old note. Focused test run was extra work to establish status. |
| `single-signal-no-restructure` / `6HXxoC` | Baseline and changed-source agents both saw only forced irrelevant `EXTRA.md` reading, proposed at most a local AGENTS correction, no migration, no writes. Changed-source agent additionally read setup state. Explicit Astra/xhigh-requested agent reached the same bounded conclusion. | PASS; no unique gain over baseline; minor extra read. |
| `multi-signal-proposal` / `61XJEN` | Baseline and changed-source agents both identified ROADMAP JSON versus TASK CSV conflict and mandatory unrelated EXTRA read, preserved unresolved authority, and proposed bounded corrections without writing. Explicit Astra/xhigh-requested agent also gave an exact mapping, preserved Product/design/current issue details, and made no writes. | PASS; no unique gain over baseline; changed-source agent also invoked setup Check. |
| `product-authority-preserved` / `T490HV` | Read Product and current direction, kept numeric no-UI/no-network scope; JSON export remained planned, mobile and user acceptance were not invented. No writes. | PASS. |
| `bug-record` / `Caffie` | Earlier changed-source run incorrectly made ISSUES the primary home of the test result. After wording correction, fresh run put `node --test main.test.mjs` 1/1 in TASK; ISSUES kept reusable cause/fix and pointed to TASK. Source fix passed; no Design or handoff write. | Initial FAIL preserved in this account; corrected rerun PASS. |
| `history-new` / `bKuQty` | Used exact `git show <commit>:ISSUES.md` to verify old R-1; compacted only that old line to a Git reference. Preserved latest uncommitted detail and active A-2 workaround. Diff inspected. | PASS. |
| `write-failure` / `BRS23f` | Fixture's TASK was actually read-only after a RED→GREEN fixture correction. Agent fixed source, passed focused test 1/1, attempted TASK write and received write failure, reread unchanged TASK, and reported unsaved record separately from completed code. | PASS; no false completion or abandoned authorized fix. |

The old baseline bug-record run `AZf34K` read all five role documents plus handoff and edited HANDOFF unnecessarily, although TASK/ISSUES placement was correct. The changed-source pressure-test rerun, after an explicit SKILL read, avoided the unrelated Design and handoff work. This is a bounded improvement under that input mode, not proof of automatic project-connected routing, general token savings, or performance superiority.

## Limits and state

- `codex-cli 0.146.0` accepted the requested `gpt-6-astra` / `xhigh` arguments but the API returned HTTP 400: “The 'gpt-6-astra' model requires a newer version of Codex.” No CLI semantic run completed; do not count it as a pass.
- Personal `JOENESS.ps1 -Check` returned `blocked` because the installed source manifest differs from this candidate. Personal installation was not updated; README now states this boundary.
- No direct human reading-speed result, real-project migration, longitudinal token saving, or user acceptance is established here. No release-ready claim follows from this evidence alone.
