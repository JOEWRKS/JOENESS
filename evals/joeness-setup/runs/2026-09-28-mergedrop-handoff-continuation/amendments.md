# Pre-model preparation amendments

The preregistered question, prompts, order, material rubric, and stop rule remain unchanged. No model run had started when these preparation issues occurred.

1. The first `prepare` call failed after copying Bare: the runner combined Git stderr line-ending warnings with stdout from `git diff --name-only` and rejected the warning text as a filename. The copied source was not altered by an agent. The runner now parses stdout separately; it reused only the exact partial Bare copy and prepared both arms.
2. The second `prepare` call finished copying and freezing both prior repairs, then failed while calling the project-setup helper on the JOENESS copy. This historical MergeDrop fixture retains `JOEWRKS-PROJECT` markers, which the current helper reports as `legacy` even alongside its pre-existing `JOENESS-SETUP` block. The earlier A/B used this exact fixture connection, not a fresh helper application. No migration or product file change was made. The runner now verifies that the copied `JOENESS-SETUP` block bytes match the saved setup-state hash and separately verifies the isolated package install. `finalize-prepared` recorded this state in `inventory.json` before any model run.

Neither failed preparation is a Bare or JOENESS agent outcome. Do not count helper `legacy` as a clean setup-helper check; report it as a fixture limitation.
