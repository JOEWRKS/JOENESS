# Setup-only personal migration — bounded evidence

Date: 2026-09-30. Scope: personal Codex installation and read-only fresh-chat check. No product release, remote push, or project setup write.

## Previous installation

- Previous package source: `089dd6cc17eafc05e46ed66b457e4e0072936f59`; its manifest SHA-256 matched the installed state: `3a8118fabfd383b619f02c0821244b5b91557d838e312737e0015a42a18ea5fe`.
- That exact package reported `-Check: current`. The new setup-only package reported `-Check: blocked` while the old Core state remained.
- The exact previous package's `-Remove` returned `removed`. The global `C:\Users\tjdwo\.codex\AGENTS.md` remains an empty, pre-existing file (0 bytes); the old `joewrks-harness-state.json` is absent. No user-owned text was discarded.

## New installation

- The setup-only source reported `-Check: ready → -Apply: current → -Check: current`. Installed public skills: `joeness-setup` only. Source manifest SHA-256 at installation: `a9f83b60ef4890964ec0e232ce2825d5ba16772fba1fbd1e0017cf9e02d30c61`.
- Installed `SKILL.md` SHA-256 equals source: `60e4e335e688385a84d7d6a5a8d34bcf95ac0cd8d5a7ff56e67301ec79495355`. Installed usage guide SHA-256: `d6ea7b6906616dd5202e8913e300802b5a1e712d88a2ab31eb1bd39e31be2724`.
- The first application exposed a stale sentence falsely saying the global Core was installed. The package was checked and removed through its own installer, the guide and manifest hash were corrected, a CLI onboarding assertion failed before the fix and passed afterward, then the corrected package was applied and checked again. The final displayed guide explicitly says that no global judgment instruction is installed.
- Windows PowerShell release, installation, and project setup tests passed; PowerShell 7 installation and project setup tests passed; Node setup contract/fixture tests passed 9/9; skill validation passed. These are local results, not remote CI.

## Fresh chat

- Codex chat `01a0edbf-359d-7573-8b59-96c12a5774c1` opened in saved neutral project `JOENESS_TEST-04`, read-only. Its answer identified available `joeness-setup` at `C:/Users/tjdwo/.codex/skills/joeness-setup/SKILL.md` and did not claim the global Core was present.
- It read the existing project `AGENTS.md`, roadmap/task/issue files and current code. It identified an outdated task entry, a completed code fix, unresolved reconnect issue and next roadmap item without rerunning tests or writing files. The project's Git status was unchanged before and after (`ISSUES.md`, `TASK.md` modified; `.joeness/`, `AGENTS.md` untracked from prior work).
- Boundary: this was an already-connected neutral project. A fresh setup proposal/application, post-migration routine recording, remote CI and human acceptance were not tested here. Absence of the Core is confirmed by the personal installation files and installer state; the chat's own answer alone is not proof of absence.
