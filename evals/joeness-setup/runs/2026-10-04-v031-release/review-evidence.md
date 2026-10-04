# JOENESS 0.3.1 release

## Scope and authorization

The user approved deployment after bounded roadmap validation. This release is setup-only: one public `joeness-setup` skill, no global Core or global AGENTS payload. Release scope includes GitHub main/tag and the personal installation; existing project connections are not automatically migrated.

Changes: default roadmap proposal with existing-source reuse and explicit opt out; distinct stage entry/completion and independently verifiable outcomes; setup readback beyond helper status; existing-proof lookup before proposing repeated work. Six-field reporting is unchanged.

## Frozen package

- Version: `0.3.1`.
- Manifest SHA-256: `d5e19dd508fa30d751aba8444944a07d4b473c106f5f4fa77f915760a5143b96`.
- All nine skill file hashes match the manifest. Release preparation changes version identity and documentation, not the tested skill bytes.
- Prior release: `JOENESS-v0.3.0`, commit `89d33f8`. Its installer reports the existing personal installation as `current` before any removal.
- Personal global AGENTS before migration: SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty file).

## Evidence reused and limits

- [Roadmap creation and existing-source scenarios](../2026-10-04-roadmap-default/).
- [Real project pilots and failures](../2026-10-04-roadmap-real-pilot/review-evidence.md).
- [Instruction split and bounded readback](../2026-10-04-dungeon-instruction-split/review-evidence.md).
- [T500 failure and T501 correction](../2026-10-04-roadmap-operation/review-evidence.md).
- [Proof reuse, changed-condition and missing-proof cases](../2026-10-04-next-work-proof/review-evidence.md).
- [Fresh saved-project chat](../2026-10-04-dungeon-next-proof/review-evidence.md), thread `01a106ea-25b7-7473-b93d-456f19442cf5`.

Fresh-chat evidence is reused for unchanged skill bytes. It demonstrates readback of already corrected documents, not independent discovery of a wrong summary. Exact internal runtime identity, long-horizon recurrence prevention, general accuracy superiority and token savings remain unverified. Prior failure evidence is retained. The new release does not certify the games' completion or user acceptance.

## Deployment gates

Local release preparation passed: Windows release contract; 27 project safety cases on Windows PowerShell and PowerShell 7 each; installation lifecycle on both shells; Node contracts/fixtures 9 passed, 0 failed; `git diff --check`; all nine manifest hashes. New evidence totals approximately 215 KB, without credentials, full rollouts or Codex-home copies; credential-pattern scan found no matches. Other installed skills: 428 files, sorted absolute-path/hash aggregate SHA-256 `79a26cd5d2cd18f89d7ac2f8e9c00e41c439c265b8735fd1a4d0b6364d95a402` before migration.

Pending exact release commit, remote Windows workflow, main/tag publication and personal `Check: current`. Do not infer deployment completion from this preparatory record. Confirmed results will be appended in a documentation-only follow-up without changing the frozen runtime package.
