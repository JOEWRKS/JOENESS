# JOENESS 1.0.1 — source, installation and publication

Status: 1.0.1 local gates passed; candidate ready for QA. Personal update and
main/tag/Release are not yet completed at this source checkpoint.

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
- Exact source commit and branch push: pending.
- Hosted Windows workflow on exact source: pending.
- Personal backup, old matching package Remove, new Apply/Check: pending.
- Installed 17-file hashes, protected files and representative gate: pending.
- QA main/tag/Release: pending coordination and independent verification.

New manifest SHA-256: `7e00a1b4981ba4a677c7214d287c17cb02e91faa42574a4c87c4bed356b2c36c`.
Template SHA-256: `a79d9f2cce804ea06942bcd507d32b2c7e449be17fcb6471f8b1273392b014eb`.
Only the release version and this template hash differ in the manifest from the
previous source; the other 16 payload files are byte-identical.

## Protected boundary

`JOENESS-v1.0.0` annotated tag object:
`e8d5170664ac2a68f30a6d44e14b961ee1e07a2e`; peeled commit:
`7a8f4e6b296f9aaa5a1ee198b0b69e3a206b630f`. It is unsigned; no signature claim.
Do not move or recreate it. Dororong project/art, unrelated APP-001 paragraph and
untracked `docs/ISSUES.md` are outside this change. The latter remains SHA-256
`d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7`.
