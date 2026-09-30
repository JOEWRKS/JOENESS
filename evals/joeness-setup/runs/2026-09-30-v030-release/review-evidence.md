# JOENESS 0.3.0 release record

Date: 2026-09-30. Release scope: Windows PowerShell + Git projects + Codex; setup-only `joeness-setup` skill. No always-on Core, vendor/router, or global `AGENTS.md` payload.

- User decision: approve `0.3.0` as a bounded release with the known report-classification limitation and no claim of general accuracy, speed, or token savings. No further A/B or fresh-chat rerun was required for a version/documentation-only change.
- Release commit on `main`: `89d33f8f803b18e8053c0486f512e69aba8a3b76`. Annotated Git tag `JOENESS-v0.3.0` points to that exact commit and was pushed to `origin`.
- Manifest SHA-256: `f5da24ac2b5f11b31d26e89e17e895417caa1f06571356238a3ff13724fc1503`. Release manifest pins one public skill and nine files; shipped skill bytes did not change from the preceding development candidate.
- Local stable-version checks: project setup safety 26/26 on Windows PowerShell and PowerShell 7; installer lifecycle passed on both; Node contract/fixture 9/9. After the final roadmap wording change, `joeness-release.tests.ps1` and `git diff --check` passed. The exact committed tree's full suite was verified by the Windows CI run below.
- [Windows CI run 36688744411](https://github.com/JOEWRKS/JOENESS/actions/runs/36688744411) completed `success` at the exact release commit. The workflow used full Git history and ran the release, setup, installer, Node, and diff checks on a clean Windows runner.
- Personal install: prior `0.3.0-beta.3-dev` package source at `0d7503b` returned `Check: current`, then `Remove: removed`. The release source returned `Check: ready → Apply: current → Check: current`. Installed state reports `releaseVersion: 0.3.0`, manifest hash match, nine matching managed-file hashes, and only `joeness-setup` active.
- Existing neutral fixture `joeness-setup-apply-20260930-a`: installed project helper returned `current/clean`, with no changed targets. Previous fresh-chat behavior evidence remains bounded; exact injected instruction bytes and general performance superiority are unverified.

Rollback/removal: from this tagged package, `JOENESS.ps1 -Check` must first report `current`; then `JOENESS.ps1 -Remove` removes only package-owned personal files. Project connections are separate and must be detached in their own Git roots. Never overwrite a `blocked` or drifted installation.

Known limits: one A/B handoff placed an unverified item under `이슈`; detailed explanation was not consistently preferred; another one-pair setup comparison used more tokens. Other OS/models, token savings, general task-performance improvement, autonomous recording, and universal human acceptance are not claimed.
