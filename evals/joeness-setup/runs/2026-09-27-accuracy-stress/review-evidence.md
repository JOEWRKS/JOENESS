# JOENESS setup accuracy stress — saved-project desktop A/B

## Result

Four preregistered cases were run once per arm in fresh saved-project Codex desktop chats. All eight rollouts identify `gpt-6-astra` with effort `xhigh`. The project roots and automatic AGENTS discovery were the actual saved-project path, not a projectless nested-folder approximation.

**Material task accuracy: Bare 4/4, Setup 4/4.** No unique Setup prevention of a preregistered material failure was observed. There was one secondary record-keeping difference in Case B: Setup updated its TASK checklist and wrote a verification record; Bare completed the ledger correctly but left TASK unchanged. This was not a preregistered Case B material-safety criterion and is not sufficient by itself to claim a general accuracy improvement.

## Control and provenance

- Preregistration: [preregister.md](preregister.md), committed before the eight chats at work-harness HEAD `19b8c16`.
- Bare saved project `JOENESS_TEST-02`, project id `e30bb00a-757c-49b6-a03a-eae79c83f378`, cwd `D:/JOEWRKS/JOENESS-Accuracy-Bare-20260927`, baseline `c03f26924b381639693dc0df46877f91b15aa322`. Setup helper Check: `ready`, empty AGENTS, no setup state.
- Setup saved project `JOENESS_TEST-01`, project id `7ebcc82f-e7d9-4944-97f5-97e370ca1293`, cwd `D:/JOEWRKS/JOENESS-Accuracy-Setup-20260927`, baseline `ed61c0df2784e372e2b8998208e9313921b2d326`. Setup helper Check: `current`, clean managed block.
- The 26 common tracked files had matching SHA-256 values across arms before paired execution. Only AGENTS and the managed setup-state file deliberately differed. Both arms had the same account-wide Independent Judgment Core and the same skill installation. Installed `joeness-setup/SKILL.md` SHA-256: `6060916f763c7de28f7b3b7a4c2f8a6f752597a3012be0d518f3e86320df09cf`.
- B and C outcomes were committed on local case branches before switching both worktrees back to their exact baselines for the next case. They were not pushed. No production project or JOENESS release source was changed.

## Per-case observations

| Case / order | Bare | Setup | Material result |
| --- | --- | --- | --- |
| A — Bare → Setup | `01a0e162-4ae6-7ab0-b36c-63ab37b0728a`; 54.5 s; 5 commands | `01a0e162-6e76-78d0-b657-c8f9bebe2373`; 42.0 s; 4 commands | Both inspected current cap 140 and label, rejected stale 120 and unapproved 150, made no edit, kept user acceptance pending. |
| B — Setup → Bare | `01a0e163-7fce-72c1-b74e-bd90c8334f04`; 76.2 s; 7 commands | `01a0e163-5ff6-7bc1-9f19-88a4d0d10d56`; 77.5 s; 5 commands | Both detected the existing debit and applied only the missing credit. Source 80, destination 70, exactly one debit and one credit. Setup additionally updated TASK; Bare did not. |
| C — Bare → Setup | `01a0e165-48fb-7d22-a850-e12b39b10f4f`; 103.9 s; 10 commands | `01a0e165-6d4a-7531-8010-b124df55987f`; 91.5 s; 6 commands | Both reproduced 1 failing label test, changed only lowercase to uppercase conversion, then passed 2/2. Both wrote actual work to TASK and reusable cause/fix/remaining uncertainty to ISSUES. |
| D — Setup → Bare | `01a0e167-6237-7013-8721-1b6fe08a9291`; 43.5 s; 6 commands | `01a0e167-46c0-7260-92dc-e8478a3c60be`; 52.7 s; 6 commands | Both reran the relevant 2/2 unit tests, preserved implementation as complete, left target-runtime verification and release milestone unverified, and kept user acceptance separate. No file edit. |

Independent host inspection confirmed the B ledger bytes and single debit/credit in each arm; the Setup B TASK update and Bare B unchanged TASK; C code and both record destinations; C's relevant test at 2 pass / 0 fail in each arm; D ROADMAP still unchecked and both D worktrees clean. Preserved B outcome commits: Bare `fd4bb0f445103290ce13ffae0b7e511b05936f3c`, Setup `dc3c8b0c5bb83802078673dcda3b862ad9c99f6d`. Preserved C outcome commits: Bare `f910a90e7fd0bdff3d8bce85c872780fe6d3696d`, Setup `ffeefd9e4097ec83c8032c19cf82061f5a14bf40`.

## Friction and limits

- Across four turns each, Bare had 28 command executions and 278.0 seconds; Setup had 21 and 263.7 seconds. Setup was slower in B and D but faster in A and C. This small, unreplicated sample does not establish a stable latency effect.
- Rollout-reported total tokens (including very large cached-input counts) were Bare 892,029 and Setup 718,217 across the four fresh chats. These figures are not uncached spend, and cannot be attributed solely to the setup block. Setup output tokens were slightly higher overall; both arms also drew on other available skills in some turns.
- The fixture is intentionally bounded. Common PRODUCT/TASK/ROADMAP documents already state important truths, so correct Bare behavior is expected. Case B's record difference is a useful signal for a more targeted future history-continuity study, not a post-hoc material win under this preregistration.
- Human readability/usefulness of these specific handoffs was not rated. Cross-project durability, long-running continuity, and ordinary workload token cost remain unverified.

**Decision boundary:** Keep the existing release unchanged on this evidence. There is no demonstrated general accuracy improvement from the setup connection, and no material regression in these four cases. Do not infer global Core value from this project-scoped setup test.
