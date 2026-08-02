# Project-aware Lean A/B V1 — Infrastructure-invalid report / 인프라 무효 보고서

## Verdict / 판정

`invalid-infrastructure`. No Control/Candidate performance comparison was scored, so this run proves neither benefit nor harm from the current Lean Core.

`invalid-infrastructure`다. 대조군과 후보군의 비교 가능한 결과가 없으므로, 이번 실행은 현재 Lean Core의 효과나 역효과를 증명하지 않는다.

## Observed evidence / 직접 확인한 증거

- Candidate-only instruction loading passed the non-scored canary.
- The first scored attempt exposed and fixed an evaluator snapshot error: generated `node_modules` files were counted as authored artifacts.
- The one allowed rerun failed because Windows shell commands ignored the requested `--cd` workspace and ran in `D:/JOEWRKS/JOEWRKS-TestProject-01`.
- A Codex Desktop worktree probe reproduced the same class of failure. Its task metadata pointed to `C:/Users/tjdwo/.codex/worktrees/6b7a/작업하네스`, whose checkout contained only `.git` at control commit `b56ce6a`, while the task's shell output reported package `backpack-dungeon` at commit `ea130d7`.
- That invalid Desktop probe consumed 80,802 total tokens. It is infrastructure overhead, not A/B evidence.
- The original harness repository and the unrelated game repository remained unchanged during the failed scored run.

## Consequence / 후속 처리

Do not retry this scored comparison in the current runtime and do not tune the Lean Core from these failures. Resume only after a read-only preflight proves that each task's observed shell CWD equals its isolated worktree, then run the same frozen candidate and contract.

현재 런타임에서는 같은 비교를 다시 실행하지 않고, 이 실패를 근거로 Lean Core를 수정하지 않는다. 각 작업의 실제 셸 CWD가 격리 worktree와 일치함을 읽기 전용 사전 점검으로 증명한 뒤에만, 고정된 동일 후보와 계약으로 평가를 재개한다.

Related upstream report / 관련 상위 이슈: https://github.com/openai/codex/issues/21606
