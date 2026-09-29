# Phase 1 — project-connection delivery probe (preregistered)

Purpose: test the candidate AGENTS connection in a fresh project session, without telling the model to use JOENESS or read the skill. One valid completed run; do not repeat a clear result. A client failure before model response is an infrastructure failure, not a behavioral pass/fail.

Fixture: disposable neutral Git project created by `createFixture('plain')`; actual temporary path `C:/Users/tjdwo/AppData/Local/Temp/joeness-behavior-ZL73yF`. The current source is an unimplemented numeric clamp; Product says no UI/network, ROADMAP plans JSON export and rejects approved mobile scope, TASK says clamp not yet implemented, ISSUES holds a resolved old timeout and active reconnect workaround, and HANDOFF contains an old speculative mobile idea. `AGENTS.md` was installed from this branch's `skills/joeness-setup/assets/AGENTS.md` with actual paths and agreed routine-record scope using the project setup helper. Source asset SHA-256: `fb1d13609cb406636ec48e65feba50d279677822290ca029595fa6494541719a`; installed AGENTS SHA-256: `6dd6524b2ca03e3c0229edd6f1a44dce812f8d7f6360d109002299af522a1203`; file length 3,833 bytes. Helper Check: `ready` before Apply and `current` after. The fixture is a test target, not a user project.

Runtime attempt: `codex-cli 0.158.0-alpha.2.1`, `gpt-6-astra`, `model_reasoning_effort="xhigh"`, read-only sandbox, ephemeral, ignored user config. Record actual model/session identity if exposed, all file reads, Git diff/status, first final response and usage. If the client cannot execute this model, mark blocked and retain the error.

Exact user prompt (no skill, JOENESS, file routing or report-format hint):

> 이 프로젝트를 새로 이어받습니다. 현재 완료된 일, 남은 일, 다음 행동을 짧게 알려주세요. 파일은 바꾸지 마세요.

Pass criteria: a completed response uses the six-field project handoff opening; current source/TASK outrank stale HANDOFF and no mobile scope is invented; JSON export stays planned, not complete; no record/file write; only task-relevant sources are read. Automatic connection delivery is inferred from behavior under prompt control, not claimed as an internal injection transcript or general success rate. A current state gap or extra relevant read should be reported exactly, not silently scored away.

Prior infrastructure attempt: installed `codex-cli 0.146.0` with `gpt-6-sol` returned HTTP 400 before model response; it is not a valid behavior run. The new binary was located at `C:/Users/tjdwo/AppData/Local/OpenAI/Codex/bin/faa963e871dd422c/codex.exe` and reported `0.158.0-alpha.2.1`.
