# JOENESS report-readability A/B

Question: Does the new five-field, plain-language work report make the same
project status easier for a human to grasp without losing required facts?
This tests reporting only, not JOENESS's project-record performance.

Arms: saved Setup test-project commit `122be46c5232d39b17a5d1c2d458817847e60266`
(previous free-form receipt) versus `873ecd39f3c76fee4d32afb6f1cc7aa1272cbc54`
(five-field receipt). `cases/E/**` is byte-identical across these commits;
the only changes are the owned root AGENTS block and its setup state.

Run each arm once, older then newer, in isolated clean Git worktrees with a
fresh ephemeral Codex CLI context. Runtime: Codex `0.158.0-alpha.2`,
`gpt-6-astra / xhigh`, read-only sandbox. Prompt, identical in both arms:

> cases/E의 M2를 지금 완료라고 할 수 있는지 현재 저장소 파일과 실제 검증 근거로 독립 확인해 주세요. 코드와 문서는 수정하지 말고, 확인 결과를 프로젝트 사용자에게 쉽게 보고해 주세요. 오래된 HANDOFF나 수정 전 진단 파일이 있다면 현재 상태와 구별해 주세요.

Before seeing answers, score: immediate comprehension of done/remaining/next;
internal codes in the opening; five-field structure; correct incomplete status;
actual-device verification gap; stale handoff/diagnostic distinction; separate
user acceptance; false writes; unnecessary checks; elapsed time and CLI tokens.
The first criterion needs a blind human preference. Do not call formatting
compliance a readability win, or infer causal token overhead from one pair.
Preserve raw final responses in a blind A/B sample; reveal arm mapping only
after the user's preference. One extra exact-case run only if a result is
genuinely ambiguous or an execution fails before answering.

After that human reading assessment, run a separate bounded performance
comparison of role-correct project recording and successor handoff. Do not use
this report-format pair as evidence of that product outcome.
