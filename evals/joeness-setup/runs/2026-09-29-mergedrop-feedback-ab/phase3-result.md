# Phase 3 result — MergeDrop animal feedback project-connection A/B

## Decision boundary

This is the one preregistered real-project comparison in [phase3-preregistered.md](phase3-preregistered.md). It tests the **project connection only**. Both Codex app chats were requested as `gpt-6-astra` / `xhigh`, but app readback did not independently expose the internal runtime identity or per-chat token usage. The personal Independent Judgment Core could have applied to both. This result cannot establish full JOENESS-vs-Bare performance or token economy.

Both arms began at MergeDrop commit `80d527fd5133c788a9fdc0c781ed9a206199cee5` with identical bytes for the 942 tracked and non-ignored untracked source paths. A lacked only the JOENESS-owned AGENTS connection block and `.joeness/setup-state.json`; B retained them. The source worktree at `D:\JOEWRKS\MergeDrop\.worktrees\mergedrop-v1` still matches those 942 initial path hashes after the experiment and remains at the same HEAD. Neither candidate was merged, installed on a device, or deployed to Play.

| Arm | New implementation chat | Candidate path | Observed work |
| --- | --- | --- | --- |
| A, no project connection | `codex://threads/01a0ed05-9fa9-7ef1-908e-03f78692dc14` | `D:\JOEWRKS\MergeDrop\.worktrees\animal-feedback-bare` | 21m 33s; 49 command executions, 11 file-change events; 11 existing + 12 new source paths changed against its candidate baseline. |
| B, project connection | `codex://threads/01a0ed19-a52c-7b80-807c-565434e96134` | `D:\JOEWRKS\MergeDrop\.worktrees\animal-feedback-setup` | 20m 08s; 41 command executions, 9 file-change events; 11 existing + 11 new source paths changed against its candidate baseline. |

Those elapsed times and tool counts are **one observation per arm**, not a reliable speed or cost estimate. The agents chose different implementation and verification details. B also consulted an available design skill and made one web lookup while A did not; those discretionary choices further prevent causal attribution of time or quality differences to the setup connection. Do not compare 741 vs 739 test totals as a quality score: the extra tests differ.

## Functional and verification results

| Criterion | A | B | Boundary |
| --- | --- | --- | --- |
| Animal-only distinct merge cue, SFX mute, other four skins | PASS in code/automated checks | PASS in code/automated checks | Human listening, device volume and fatigue: UNVERIFIED. |
| Strong non-merge wall/floor/piece impact; weak/tangential/repeated contact and merge duplication suppressed | PASS in focused EditMode and actual Unity collision PlayMode checks | PASS in focused EditMode and actual Unity collision PlayMode checks | Dense live-game/device behavior and frame/GC cost: UNVERIFIED. |
| Full EditMode final | 741/741 PASS, 0 fail/skip | 739/739 PASS, 0 fail/skip | Baseline was 714/714. |
| Collision PlayMode final | 9/9 PASS | 5/5 PASS | Different test designs; both used actual collision callbacks. |
| Python audio generator checks | 8/8 PASS | 8/8 PASS | No human audio acceptance. |
| Rendered still proof | 412×915 impact frame, viewed | 360×640 and 800×1280 impact frames, viewed | Different viewports and staged stills, not matched-frame visual A/B or device proof. |
| No original-project mutation | PASS: original 942 baseline hashes still match | PASS: same check | Candidate worktrees contain uncommitted experiment files. |

Final evidence paths and SHA-256 (the large Unity logs and XML remain in the isolated worktrees, not in this repository):

| Arm | Artifact under its candidate path | SHA-256 |
| --- | --- | --- |
| A | `TestResults/animal-feedback-full-final.xml` | `e5389e02691012167e02b7308fb64dc939e80d04b4bc6417b802d18dccd099ef` |
| A | `TestResults/animal-feedback-playmode-final.xml` | `bda44e16a49e0fe665566f92ad34fe1d5f6a48ca5e45006a7782ef0e8aa16c80` |
| A | `Artifacts/VisualChecks/Animal/FeedbackCandidate/412x915-Animal-Korean-impact-80ms.png` | `284e00f5c5449b40f706b1c6462283f6f023b67b80b03df14fed82c63c54baaa` |
| A | `game/Assets/MergeDrop/Audio/AnimalMerge.wav` | `80c27d0250931dc19e124f6c3fe033d500d74ab9550a2c5fe7b917d8c2770552` |
| B | `TestResults/animal-feedback-full-final.xml` | `509da1eda557133c09186929744149a462d2d03d48562e9365e16646119e6cf5` |
| B | `TestResults/animal-feedback-physics.xml` | `a5f54b05617b3d3a73967d35ab1a248a1178c3bbea9b42a710500880ee02bc93` |
| B | `Artifacts/AnimalFeedback/VisualProof/360x640-Animal-Korean-impact-100ms.png` | `5fd473b408a7c01991be3eeeade03fa531eb9166507463d3107126787492c290` |
| B | `game/Assets/MergeDrop/Audio/AnimalMerge.wav` | `ab638519ca6ef3b052bb5f7fcc3882b34207f9f27cad4a2a12914bd6e91a4910` |

Failure evidence is preserved in each candidate's earlier TestResults and Logs. A's first PlayMode checks missed piece/decorative collider callbacks after one physics step (6/8); the fixture advanced to actual contact and the final run passed 9/9. A's first render clipped part of the floor spark; it moved the mark into the container and reran tests/render. B's first focused EditMode run passed 24/25; the failure counted pre-existing merge-pool children before fixture initialization. The fixture was corrected, and the final full run passed 739/739. B's synchronous full run passed 737/737 but excluded two coroutine tests; its final run included and passed them. Both final Unity logs also contain the same unrelated missing iOS Resolver/Xcode editor assembly message; Android-relevant tests completed successfully, but its broader impact was not established.

## Fresh read-only handoff

The same prompt was sent to separate fresh app chats asking for completed work, remaining verification, past problems/solutions and next action from current files only, with no writes:

| Arm | Handoff chat | Result |
| --- | --- | --- |
| A | `codex://threads/01a0ed1b-ce73-74a1-877a-c2b46eb689b8` | Recovered implementation, final XML counts, prior failures and fixes, device/user-acceptance boundary. 2,722-character answer; 4m 09s; 15 command executions. Did not use the six-field opening. |
| B | `codex://threads/01a0ed2c-411e-72b1-9424-7179dcd1ed0e` | Recovered the same categories and opened with six fields. 2,769-character answer; 3m 33s; 12 command executions. Its `이슈` field incorrectly grouped unperformed Android/user acceptance with an encountered problem, although the detailed body separated the boundary. |

Both handoffs were materially accurate about implementation versus verification versus user acceptance, and neither edited files or reran tests. B's six-field opening is an observable format difference, **not a demonstrated comprehension or token benefit**. The nearly equal answer lengths and B's minor `이슈` misclassification are friction, not evidence to expand rules. Neither answer has a blinded human usefulness rating.

## Assessment and next action

**Observed project-connection unique value: not demonstrated.** Both arms completed the scoped candidate and accurate handoff. B was not materially safer or more complete; its small observed time/tool-count difference is inconclusive. A found and repaired a visual clipping issue; B used additional viewport renders. The single-pair design cannot attribute such differences to JOENESS. No token or device-performance claim is supported.

The experiment is complete at its preregistered boundary. Keep both candidates isolated; do not auto-merge or declare the game feature accepted. A user choice of candidate, listening/visual preference, and a separately authorized Android device/performance pass would be needed for production adoption. A full Bare-vs-Core comparison remains a different experiment and is not required to finish this project-connection comparison.
