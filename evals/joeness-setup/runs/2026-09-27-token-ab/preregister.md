# Six-field connection token A/B — preregistered spike

Question: For the same bounded local correction, does adding JOENESS's
project connection create a material token/time penalty, unnecessary work,
or information loss compared with normal project files alone?

Use two clean Git clones of the same fictional project at
`3926c5b51903a5cc656200b5c6b9be69a8ac7c6a`, before its Case C fix.
The Setup arm keeps that commit's six-field `JOENESS-SETUP` AGENTS block and
matching state. The Bare arm uses the official helper to detach the owned
block/state, leaving all other project files unchanged. Both arms use the
same local machine, personal always-on Core, CLI binary and auth. Thus this
isolates the *project connection*, not the entire JOENESS package or Core.
Do not edit the original project, personal installation or product sources.

Run order: Bare, then Setup. One fresh ephemeral `codex-cli
0.158.0-alpha.2` session per arm, `gpt-6-astra / xhigh`, identical
`--ignore-user-config` and sandbox settings, no conversation carryover.
Use the exact same user prompt, without a report-format hint:

> Case C의 라벨이 다시 소문자로 표시되는 오류를 현재 제품 기준대로 고쳐줘. 관련 테스트를 실행하고, 확인된 원인·수정·검증을 이 프로젝트의 작업 및 문제 기록에 남긴 뒤 결과를 알려줘. 다른 case와 기존 평가 기록은 건드리지 마.

Capture each raw final answer, CLI-reported usage (total, input, cached,
output when available), elapsed wall time, Git diff and relevant test
result. Score before interpreting cost:

- Correct uppercase behavior and non-string rejection; relevant local tests
  pass, no other case changed.
- TASK records actual work/verification; ISSUES preserves reusable cause,
  fix, verification and any genuine remaining boundary.
- Final answer states what was fixed, verifies it, does not invent another
  task or user acceptance, and does not omit a material boundary. Setup's
  six-field shape is a presentation check, not itself a quality win.
- Note needless test reruns, extra approvals, or unrelated reading/writes.

Compare costs only if both arms reach materially comparable outcomes.
Report absolute and percentage differences, but do not infer a general
causal effect from one non-counterbalanced pair. Preserve a clear failure;
rerun only if an execution is invalid (e.g. CLI failure before the task),
not to improve a result. No JOENESS source change is authorized by this
measurement.
