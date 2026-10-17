# Product promotion — 2026-10-17

Status: source integration and required local package checks complete; all passed.
This is unpublished working-tree work, not main/tag/Release or personal installation.

## Authority and exact scope

User: “검증한 후보 제품에 반영하고 필요한 재검증까지 진행해. 도로롱 아트는 건드리지 말고”.
This supersedes the prior hold on the tested template candidate only. No other
F01–F06 implementation/contract, version, personal install or real-project change.
No commit/push, remote workflow, tag, Release or outbound chat message performed.

Changed product payload: `skills/joeness-setup/assets/AGENTS.md`, two old lines
replaced by four. Only an explicitly configured required gate triggers that tool
requirement; no gate means no invented checker/receipt prerequisite. Actual required
outcomes and the configured gate's missing/failed/stale behavior remain mandatory.
Manifest pins the new template; all other 16 payload files unchanged.

The version label remains 1.0.0 pending release management, but the source package
is **not the published 1.0.0 package**. Root AGENTS, installation notes, roadmap and
changelog identify this as unpublished work. Never overwrite the existing release
or treat the shared version label as installation identity.

## Exactness and behavioral evidence reuse

`node promotion-check.mjs C:/Users/tjdwo/.codex` passes:
- source template reproduces the tested candidate's entire connection, with only
  the same path/consent placeholder substitutions;
- all 17 source files match the manifest; exactly one changed from baseline;
- only that hash entry changed in manifest; schemas/flags/versions retained;
- personal 17 files and state still match the previous released package.

SHA-256 identities:
- template: `a79d9f2cce804ea06942bcd507d32b2c7e449be17fcb6471f8b1273392b014eb`;
- evaluated candidate connection: `7cdccadeb9ba5f02fab41036e7b1604c307a108143b6c9349260e69ac48f725a`;
- new source manifest: `05d7c19597a132af42581eff5f9ba1cadca0c901709cda309cebea9035079132`;
- old/personal manifest: `529a22ace091617b01e4eb82178f3a7fb9dbc16e2eab0b0b925676be81c0a905`;
- preserved personal state: `e853b4a81c6aeedefd8d5ff9d70df2e82a7e2368b348e8244f1c39b7e319eb70`.

Reuse the two prior independent candidate runs: no configured gate did not invent
one; explicitly connected gate ran and kept missing specialist proof UNVERIFIED.
No new model run was needed for identical connection bytes. No claimed model
identity, general success rate, token improvement or auto-injection certification.
The fixture generator now pins its original baseline commit, preserving reproduction
of the earlier failure after product integration rather than silently testing the
new source against itself. Prior failure/evidence files retained.

## Package verification

Final outputs: [promotion-test-results.json](promotion-test-results.json).
- Full Node suite: 99/99 PASS.
- Windows release contract: PASS locally.
- PowerShell 5/7 installation lifecycle: PASS on both, including installed helper
  regression, user-byte preservation, legacy/drift rejection and rollback tests.
- Dedicated isolated new-package installation: ready → current → current; all 17
  installed files match new manifest, including the new template; no global AGENTS.
  Canonical Remove cleaned only the owned temporary installation (empty temp root
  retained). Personal installation never used as an Apply/Remove target.
- Skill creator quick validator: `Skill is valid!` (`python -X utf8`).
- Existing PS5/7 project-connection safety 27/27 each reused: project-setup.ps1,
  its tests and state schema are unchanged. No claim of a newly run hosted CI.
- `git diff --check`: PASS.

## Personal and unrelated-file preservation

Read-only Check of the new source against the old personal installation returned
`blocked`, exit 1, with “Skill ownership does not match this package; existing
files were preserved”. This is the expected fail-closed package mismatch, **not
a new defect, an automatic migration, or a failed isolated installation**. No
Apply/Remove was attempted there. All 17 old hashes and state hash remain exact.

Dororong artwork/project never edited. Existing untracked docs/ISSUES.md retained
hash `d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7`;
pre-existing APP-001 roadmap paragraph preserved. No historical failures removed.

## Remaining boundary

Source correction does not update existing project AGENTS or personal skills.
Publishing and an approved personal/project transition remain separate actions.
The original semantic limitation still applies: consumers cannot establish the
truth of a falsely reviewed source-text interpretation. This change only prevents
the tested optional-tool requirement overreach; it is not a general truth detector.
