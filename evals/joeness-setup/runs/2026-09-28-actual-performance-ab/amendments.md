# Evaluation infrastructure amendments

## 2026-09-28: Unity metadata normalization during grading

The first independent grading attempt for `invalid-visual-set-write-r1-bare` completed both Unity test runs, but `grade.mjs` rejected the result because Unity changed line endings in `SettingsIcon.png.meta` and `TimeManager.asset`. Git's meaningful diff showed no change to those files. The XML and logs from that rejected grading attempt remain in the external trial root under `grades/invalid-visual-set-write-r1-bare/`.

The grader was changed to compare the meaningful Git diff and untracked-file list before and after oracle overlay, while recording the raw status separately. Its result for this exact agent run was then produced in `attempt-02/`. No model run, prompt, source package, fixture, oracle, or outcome criterion was changed or repeated.

The amended grader also parses the first `git status` line correctly after the model runner's trimming. This second issue was caught before another Unity test invocation. Both mistakes were evaluation-infrastructure errors, not agent outcomes.

## 2026-09-28: Prevent newly skipped tests from counting as success

Before grading the remaining cases, a unit test exposed that the parser would count a baseline-passing test as acceptable if it became `Skipped`. The grader now treats any new non-passing outcome as a regression while allowing only the exact pre-existing failed cases. This closes a verification loophole; it does not change the registered oracle or agent prompts. The test was observed RED and then 7/7 GREEN.
