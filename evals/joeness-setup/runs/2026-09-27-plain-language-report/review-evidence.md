# JOENESS plain-language work report — bounded review

## Outcome

The six selected report fields remain. Their contents now use short, ordinary Korean. Material detail uses the same language and places exact names/counts beside the claims they support. No new global Core rule, document role, workflow step, or automatic background action was added. Source files changed: `skills/joeness-setup/SKILL.md`, its short `assets/AGENTS.md` connection, `references/usage.md`, and their three SHA-256 entries in `vendor/source-manifest.json`.

## Behavioral evidence and failures retained

- The [preregistered boundary and amendments](preregister.md) records the earlier human failure: the old report was relatively preferred in two blind pairs but still hard for a non-developer to read.
- The first fresh old-guidance `read-only` run [could not inspect files](responses/reading-shelf-old.md) because command execution returned `blocked by policy`. The next read-only run was interrupted; both result records remain. `workspace-write` also blocked project file reads; its successful-but-uninformed Reading Shelf answer and interrupted Workshop record remain. None of these four attempts is counted as a semantic pass.
- With the same fictional project trees and the previously working `danger-full-access` mode, two fresh new-guidance handoffs produced [Reading Shelf](responses/reading-shelf-new-full-access-retry.md) and [Workshop Slots](responses/workshop-slots-new-full-access-retry.md). Both recovered the current task boundary, issue causes/fixes, next action, and separate user acceptance. Both preserved project Git status before/after. Reading Shelf reran one relevant local test suite; Workshop relied on recorded test evidence and did not rerun it. Neither fabricated a kiosk result or repeated implementation.
- The user found the first Workshop wording easier to read but too long, and clarified that familiar words should **replace jargon, not expand each term into a lesson**. That feedback prompted the narrow second edit. One fresh [concise Workshop handoff](responses/workshop-slots-new-concise-recheck.md) preserved the same required facts, did not write files or rerun tests, and received the user's “굳” readability response. This is direct human usability feedback for one sample, not a population-level comprehension claim.
- The final concise response says local reservation/cancellation fixes are complete, actual venue-device verification is missing, the milestone remains incomplete, email is deferred, old handoff text is stale, and user acceptance is separate and not granted. It also retains exact changed paths, known causes, before/after test evidence, and the next action.
- All five completed result records have matching final-response SHA-256 and identical before/after Git status. Two intentionally interrupted attempts retain incomplete result records.

## Cost and performance boundary

All successful sessions used `codex-cli 0.158.0-alpha.2`, `gpt-6-astra/xhigh`, fresh ephemeral contexts. The first new-guidance Workshop handoff used 86,465 input + 2,512 output tokens (88,977 total), 91,526 ms. The concise recheck used 82,185 input + 2,118 output tokens (84,303 total), 79,636 ms. This is a descriptive 394-output-token and 4,674-total-token decrease in one fresh sample, **not** a causal or general savings estimate. The failed sandbox attempts are excluded from this comparison but retained in [results](results). No material correctness regression was observed in the two successful projects or the concise recheck. A code-writing performance comparison was not rerun, so general task-performance non-regression remains unverified.

## Deterministic and install checks

- `python -X utf8 .../skill-creator/scripts/quick_validate.py skills/joeness-setup`: valid.
- `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs`: 6 pass, 0 fail.
- `tests/astra-judgment-sync.tests.ps1`: pass.
- `tests/joeness-project-setup.tests.ps1`: 21 safety cases pass under both `pwsh` and Windows PowerShell.
- `tests/joeness-install.tests.ps1`: pass.
- Personal installation initially blocked the new manifest identity, as designed. The installed manifest exactly matched Git commit `bbe456aa7c9510f082bff80774d577af9aa673f8`; its own `-Check` returned `current`. That matching package was removed through its normal `-Remove`, then the new source `-Apply` returned `current`. A fresh new-source `-Check` returned `current` with sole active skill `joeness-setup`. No state file was manually edited and no unknown/user-owned file was replaced.

The evaluation helper kept final responses, usage, hashes, and Git status, not full rollouts or credentials. The installed package uses the new report wording in new sessions; already-running sessions may keep their prior loaded instructions.
