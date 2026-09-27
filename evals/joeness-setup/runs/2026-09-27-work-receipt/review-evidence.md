# JOENESS setup: work receipt boundary

## Purpose and observed baseline

The primary product aim is role-correct project records that let a successor recover purpose, current work, decisions, problems and next action. Chat wording is a supporting surface, not a second memory or translation pipeline.

In the saved-project continuity comparison, both arms reconstructed the material state correctly, but the user preferred the Bare handoff's readability in one blind sample. The earlier reading-shelf sample favored JOENESS. Neither sample proves a general readability effect. The user's requested ordinary work report calls out work done, changed files, record summary, problems and next action; the prior guidance applied a similar plain-language opening only to human handoffs.

## Bounded change

- `SKILL.md` states the primary aim and asks for a short receipt after substantive work, sourced from already-checked facts.
- The adaptable `assets/AGENTS.md` carries the same short rule into newly configured projects. Questions do not require the receipt.
- `references/usage.md` and `README.md` explain the hierarchy: role-correct records first, conversational report second.
- `vendor/source-manifest.json` binds the exact changed skill bytes. The Independent Judgment Core, setup helper, document templates other than AGENTS, and install behavior were not changed.

## Cost and loss risks

The source skill gained 33 whitespace-delimited words; the project AGENTS reference gained 28. These are not measured model tokens. The skill is read on setup use; a project connection based on the AGENTS reference would recur in project sessions. Each substantive-work answer may be longer, but no extra tool pass, model call or background operation is specified solely for formatting. A real latency/token A/B has not been run.

Compression can hide a required unverified check, scope decision or pending user acceptance. The instruction therefore keeps these boundaries explicit and exact evidence available after the short opening. This is guidance, not proof that future agents will never omit a fact.

## Deterministic verification and deployment boundary

- `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs`: 6 PASS / 0 FAIL.
- `tests/joeness-project-setup.tests.ps1`: 21 PASS.
- `tests/joeness-install.tests.ps1`: PASS.
- `tests/astra-judgment-sync.tests.ps1`: PASS current-only release contract.
- `skill-creator/scripts/quick_validate.py skills/joeness-setup`: valid.
- Before transition, personal `JOENESS.ps1 -Check` against the revised source reported `blocked`: installed state manifest identity differed. Installed files exactly matched prior commit `88edb9f`; its own `-Check` reported `current`. The source Core and installer bytes were unchanged between that commit and this update.
- A disposable old `Apply → Check → Remove`, then new `Apply → Check` trial passed. Its temporary installation was removed and the empty test directory was cleaned up.
- Personal transition used the same old-source `-Remove` and new-source `-Apply`, each with a successful result. New-source `-Check` is `current`; all nine installed skill files match the revised manifest. Personal `AGENTS.md` SHA-256 remained `05e3327da893e8dc4e13d7c687d4774f7adfe579be56cc43031ca295f8a0ec10` before and after. The old-source worktree was restored to its prior branch.
- In the separate Setup test project (`D:\JOEWRKS\JOENESS-Accuracy-Setup-20260927`), only the owned `AGENTS.md` block and `.joeness/setup-state.json` were revised through the project helper. A fresh `-Check` returned `current/clean`; the bounded project update was committed as `122be46c5232d39b17a5d1c2d458817847e60266`.

## Fresh project-session check

One new desktop chat (`01a0e1e2-2687-7152-a8d3-5da378c95bf2`) used the revised test-project connection but ran `gpt-6-astra / high`; it is not the target-runtime result. It accurately reported M2 incomplete, R3 unverified, old handoff and diagnostic stale, no writes, and the next target check. A direct local CLI attempt at `gpt-6-astra / xhigh` failed before answering because that CLI was too old for the model; it did not test the guidance.

A second fresh desktop chat (`01a0e1e4-6585-7290-9613-bca4d3ef75dd`) explicitly ran `gpt-6-astra / xhigh` with the same read-only M2 request. It checked current files and Git, reran the relevant local suite (5 pass / 0 fail), and reported M2 incomplete because the actual handheld R3 result is absent. It distinguished the CSV deferral, old handoff, pre-repair diagnostic, technical verification and unrecorded user acceptance. It said no code or documents were changed; the only pre-existing worktree changes were the owned setup block/state. No required claim was lost in this one response. The test rerun supported its current verification claim; it was not a separate formatting pass.

The high chat took 51.5 seconds and its local rollout counter reported 153,518 total tokens (133,376 cached input, 1,017 output). The target xhigh chat took 78.1 seconds and reported 201,170 total (175,872 cached input, 1,719 output). These runs differ in reasoning effort, and neither is an old-guidance control. They measure test-run usage, not the incremental cost of the new receipt wording or typical daily use. The only controlled instruction-size observation here is the 33-word skill and 28-word project-reference increase. A causal latency/token effect and human comprehension improvement remain unverified.

## Final local verification

After the deployment and fresh chats, the unchanged source release gate was rerun: `astra-judgment-sync.tests.ps1` PASS, project safety 21/21 in both PowerShell hosts, installer lifecycle PASS, and JS setup contracts 6/6. Personal `JOENESS.ps1 -Check` returned `current` with only `joeness-setup` active and no blockers. The separate test project's setup helper returned `current/clean` with no changed targets; its Git worktree was clean at `122be46c5232d39b17a5d1c2d458817847e60266`. This verifies source/install/project state, not unique behavioral benefit or user acceptance.
