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

Compression can hide a required unverified check, scope decision or pending user acceptance. The instruction therefore keeps these boundaries explicit and exact evidence available after the short opening. This is guidance, not proof that future agents will never omit a fact; independent fresh-context behavior remains unverified.

## Deterministic verification and deployment boundary

- `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs`: 6 PASS / 0 FAIL.
- `tests/joeness-project-setup.tests.ps1`: 21 PASS.
- `tests/joeness-install.tests.ps1`: PASS.
- `tests/astra-judgment-sync.tests.ps1`: PASS current-only release contract.
- `skill-creator/scripts/quick_validate.py skills/joeness-setup`: valid.
- Personal `JOENESS.ps1 -Check` against this revised source reports `blocked`: installed state manifest identity differs. No personal installation or existing project managed block was changed; do not claim that current chats already receive the new receipt rule.
