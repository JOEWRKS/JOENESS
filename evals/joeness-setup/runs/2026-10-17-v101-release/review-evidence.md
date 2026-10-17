# JOENESS 1.0.1 — source, installation and publication

Status: 1.0.1 released by QA, with exact-release Windows gates and authorized
personal transition verified. This subsequent documentation-only closure does not
move the release tag or change the installed payload.

User authority (2026-10-17): commit/push and personal update; preserve the existing
1.0.0 tag; coordinate the new version with QA. QA Manager owns main/tag/Release
publication after exact-source and installed checks. No existing project edits.
QA confirmation: local thread `01a115f2-a9fd-7c81-930a-0e225906f843`, T043/Q5.
Agreed order: source version/push → QA source/Windows verification → personal
transition → QA exact final commit/CI/install verification → main/tag/Release.

## Scope and evidence

- Patch only: optional-gate condition in `assets/AGENTS.md`; other 16 payload files,
  F01–F06 scripts/contracts and data schemas unchanged. Version identity 1.0.1.
- [Behavioral failure, correction and bounded evidence](../2026-10-17-operating-rule-transfer/review-evidence.md).
- [Exact candidate promotion and earlier package tests](../2026-10-17-operating-rule-transfer/promotion-evidence.md).
- Prior failure evidence retained. No claim of general model superiority, truth
  detection, token reduction or automatic update of existing project connections.

## Release checklist

- Local current Windows workflow commands: all passed; [exact outputs](local-gates.json).
  Node 99/99, Windows release contract, PS5/7 project safety 27/27 each and
  both installation lifecycle suites. No changed runtime during these tests.
- Exact source commit and branch push: `90db1b08ddaeccea7468c28bdc41f234ab7ccaaa`,
  `codex/qa-recording-boundaries`; remote match confirmed.
- Hosted Windows workflow on exact source: [39017686496](https://github.com/JOEWRKS/JOENESS/actions/runs/39017686496), completed/success, attempt 1.
- Personal backup, old matching package Remove, new Apply/Check: PASS, after QA's
  explicit candidate/CI verification message. [Raw transition evidence](personal-install.json).
- Installed 17-file hashes, protected files and representative gate: PASS, 3/3.
- QA main/tag/Release: completed; released commit
  `a50e62fe3677aecca62125af9578abf2773a5400`. QA cross-checked installed files,
  previous backups, global settings and other JOE skills before publication.
  No payload, installer, test or workflow change from the passing source candidate.

## Publication confirmation — 2026-10-17

- Release: [JOENESS-v1.0.1](https://github.com/JOEWRKS/JOENESS/releases/tag/JOENESS-v1.0.1),
  ID `415683536`, latest, non-draft, non-prerelease; independently fetched again.
- Annotated tag object: `4a09ef9a1d8aaa20ba9a702a35c57a24d2042168`.
- Tag peeled commit and main at publication:
  `a50e62fe3677aecca62125af9578abf2773a5400`, verified with `git ls-remote`.
- Exact-release main Windows CI: [39018200088](https://github.com/JOEWRKS/JOENESS/actions/runs/39018200088), completed/success.
- Same-commit branch CI: [39018118940](https://github.com/JOEWRKS/JOENESS/actions/runs/39018118940), completed/success.
- Existing 1.0.0 tag object and peeled commit independently rechecked unchanged;
  QA additionally confirmed the old Release identity, body and publication state
  unchanged. No old tag or Release was replaced.
- This closure edits only ROADMAP status and this evidence document. Later main
  documentation commits are not a new release or a reason to move the fixed tag.

New manifest SHA-256: `7e00a1b4981ba4a677c7214d287c17cb02e91faa42574a4c87c4bed356b2c36c`.
Template SHA-256: `a79d9f2cce804ea06942bcd507d32b2c7e449be17fcb6471f8b1273392b014eb`.
Only the release version and this template hash differ in the manifest from the
previous source; the other 16 payload files are byte-identical.

QA independently checked manifest/17-file identity, complete candidate connection
text, configured-gate missing-proof exit 2/UNVERIFIED and protected fixture bytes.

## Personal transition

- Old matching source: `5e5af5197130e0fc11c9b6333b4cfa602aa1439e`; old manifest
  `529a22ace091617b01e4eb82178f3a7fb9dbc16e2eab0b0b925676be81c0a905`.
- New installed source: `90db1b08ddaeccea7468c28bdc41f234ab7ccaaa` (1.0.1).
- Guarded script: `node install-and-check.mjs --approved-personal-v101 <source SHA>`.
- Old package Check current → verified backup → old Remove removed → new Check
  ready → Apply current → Check current; all five commands exit 0.
- Backup: `C:/Users/tjdwo/.codex-install-backups/joeness-v101-20261017-7e00a1b4981b`.
  Contains only the previous 17 managed files and ownership state, each hash-checked;
  no credentials or entire Codex home. Old exported package path is in raw evidence.
- Installed namespace contains exactly 17 files, each matching new manifest/state.
  Only `skills/joeness-setup/assets/AGENTS.md` and `joeness-skills-state.json`
  differ. Other 16 skill files, global `AGENTS.md` and `config.toml` unchanged.
- Installed helper test 3/3: current visual coverage, missing proof failure/recovery,
  user acceptance separate. No semantic superiority claim.
- Existing project connections and Dororong data unchanged. Updated personal skill
  is available from the next request; no hot-reload claim for an already-running turn.

## Preparation issue retained

The ad-hoc pre-push summary assertion expected TAP `# pass 99`; this Node version
emitted spec-reporter `ℹ pass 99`. The 99-pass/0-fail test run itself succeeded.
PowerShell continued to the authorized commit after this assertion, so the commit
already existed before correction. Before any push, the actual recorded outputs,
seven zero exits and committed scope were checked again using both reporter
prefixes. All passed. No tests were skipped or expected behavior weakened.

## Protected boundary

`JOENESS-v1.0.0` annotated tag object:
`e8d5170664ac2a68f30a6d44e14b961ee1e07a2e`; peeled commit:
`7a8f4e6b296f9aaa5a1ee198b0b69e3a206b630f`. It is unsigned; no signature claim.
Do not move or recreate it. Dororong project/art, unrelated APP-001 paragraph and
untracked `docs/ISSUES.md` are outside this change. The latter remains SHA-256
`d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7`.
