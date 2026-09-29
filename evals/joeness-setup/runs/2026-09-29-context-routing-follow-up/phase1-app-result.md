# Phase 1 saved-project rescue — bounded pass

Protocol: [phase1-app-preregistered.md](phase1-app-preregistered.md). The saved local project `JOENESS_TEST-04` was verified to point to the exact disposable fixture before dispatch. The fresh Codex app task requested `gpt-6-astra` / `xhigh` via `create_thread`; the readback did not separately expose actual model/effort identity. Task ID: `01a0eca8-db85-7791-b7c9-6a3ab91045f9`, host `local`; completed turn `01a0eca8-dfd9-7233-86a1-9bb1f4991cd2`, duration 42,672 ms. App token usage was not exposed.

The exact user prompt matched the preregistration and did not name JOENESS, the SKILL, files to read, or a report format. The task first listed the project's files and Git status. It then read `AGENTS.md`, `TASK.md`, `ROADMAP.md`, `PRODUCT.md`, `main.mjs`, `main.test.mjs`, `ISSUES.md` and the stale `HANDOFF.md`; it did not read `DESIGN.md` for this nonvisual handoff. All command executions completed successfully. It did not run the test or edit files.

First final answer (verbatim):

> 작업: 현재 상태 인수인계  
> 업데이트 파일: 없음  
> 이슈: 간헐적 재연결 실패(A-2)가 미해결로 기록됨  
> 해결: 타임아웃(R-1)은 해결·검증 완료로 기록됨  
> 남은 문제: 음수를 0으로 바꾸는 기능 미구현, 다음 릴리스 JSON 내보내기 대기  
> 다음 작업: `clamp`의 음수 처리 구현 후 기존 테스트로 검증  
>
> 상세 보고: 현재 `clamp`는 입력을 그대로 반환하며 테스트는 작성되어 있습니다. 재연결 실패의 기록상 임시 대응은 수동으로 한 번 재연결하는 것입니다. 모바일 앱은 승인된 범위가 아닙니다.

The six fields appeared without a format hint. The answer matched current source/TASK, kept JSON as planned, retained the active workaround, and did not promote the old mobile idea. Post-run Git showed only the two pre-existing untracked setup outputs (`AGENTS.md`, `.joeness/`), no tracked diff; the AGENTS hash remained `6dd6524b2ca03e3c0229edd6f1a44dce812f8d7f6360d109002299af522a1203` and helper `-Check` remained `current/clean`. Product, Roadmap, Task, Issues, Design and source hashes were unchanged.

**Verdict:** Phase 1 operational behavior PASS for this one saved-project chat: a fresh task found and used the candidate project connection with no prompt hint and recovered done/open/next without writes. This does not directly prove which initial instruction bytes the app injected, nor universal auto-delivery. The agent also explicitly opened `AGENTS.md` using a file tool.

Fixture limitation: the evaluator's template adaptation left the line “Adapt this body...” in the applied AGENTS and duplicated the routine-record scope sentence. Those are evaluator-authored connection defects, not demonstrated product output from the setup skill. They did not corrupt this read-only handoff, but this run should not be used as evidence that a normal setup proposal is concise or free of duplication. The prior CLI file-read failure remains preserved in [phase1-result.md](phase1-result.md); this app run did not erase it.

After preserving the run, the evaluator corrected only the disposable test project's managed connection through a fresh `-Check → -Apply → -Check` (`current/clean` throughout). The corrected AGENTS is 3,654 bytes, SHA-256 `0c47eb76b1903767b01fc8fe221c79034f6e070fc7f53aff5c88d9c1f48722ce`; state SHA-256 `9d8972bc7010b98793a630f1de39f10e5e0d23bce422cda386d472bf3b8e4459`. This post-run fixture repair is **not** part of the phase 1 pass and did not alter shipped skill bytes.
