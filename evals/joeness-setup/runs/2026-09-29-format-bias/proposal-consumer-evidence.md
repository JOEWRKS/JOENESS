# Proposed connection downstream check

The [first case](proposal-consumer-preregistered.md) and [complementary case](acceptance-boundary-preregistered.md) each ran once in a fresh ephemeral `gpt-6-astra` / `xhigh` context with the **unchanged proposed AGENTS body** from the installed-skill forward answer. Runtime: `codex-cli 0.158.0-alpha.2`; read-only fixture `D:/JOEWRKS/JOENESS-Accuracy-Bare-20260927` at HEAD `64b73dddf616456d524bebf1a88b243899991924`. The model was instructed not to use files or tools. This is text consumption, not automatic project-instruction delivery or an Apply.

An initial attempt used the PATH `codex-cli 0.146.0`. The server rejected `gpt-6-astra` before any answer (`requires a newer version of Codex`), so it is an environment failure, not a model result or a rerun of a completed case. The two results below used the compatible CLI. No source, fixture, or installed-skill bytes were changed in these probes.

## No acceptance yet, required verification still open

Thread `01a0e972-f786-7512-968b-7765b9538387`; 16,407 input tokens (12,416 cached subset), 471 output tokens.

> - 작업: 앞선 작업에서 예약 화면 구현 완료.
> - 업데이트 파일: 없음.
> - 이슈: 알려진 결함·장애 없음.
> - 해결: 없음.
> - 남은 문제: 실제 태블릿 필수 검증과 사용자 수락 미완료.
> - 다음 작업: 태블릿 사용 가능 시 예약·취소를 검증하고 결과 보고.
>
> 기존 자동 검사 10개는 통과했습니다. 이번 인수인계에서는 파일 수정이나 새 검사 실행이 없었습니다. 구현은 끝났지만 현재 단계 완료 조건은 아직 충족하지 못했습니다.

`이슈` and `해결` classified correctly; required runtime verification stayed open; no changed file, fix or release completion was fabricated. The strict preregistered placement criterion was **not fully met**: the pending user acceptance appeared in `남은 문제` beside the technical check instead of a separate detail sentence. The answer did name the two states distinctly and did not treat acceptance as proof of technical verification. Record a literal-format partial, not a material factual failure or a full pass.

## Visual acceptance granted, required verification still open

Thread `01a0e975-3ff2-7441-84f3-fdf66186fc07`; 16,430 input tokens (12,416 cached subset), 630 output tokens.

> - 작업: 앞선 작업에서 예약 화면 구현 완료.
> - 업데이트 파일: 없음.
> - 이슈: 없음.
> - 해결: 없음.
> - 남은 문제: 실제 태블릿에서 예약·취소 필수 검증 미실행.
> - 다음 작업: 태블릿 사용 가능 시 필수 검증을 수행하고 결과 보고.
>
> 기존 자동 검사 10개는 통과했고, 사용자는 시각적 결과를 승인했다. 이 승인은 태블릿 기능 검증을 대신하지 않으므로 현재 단계는 아직 미완료다. 이번 인수인계에서는 파일 수정이나 새 검사 실행이 없었다.

This distinct case passed: it kept visual acceptance in detail, did not substitute it for the required tablet check, and left the stage open. It did not invent a defect, fix, changed file or new test. The output was longer than necessary, but no material factual regression was observed.

## Decision and limits

The proposed connection's missing literal `이슈 = problem` and acceptance-placement wording remain observable omissions against the strict proposal criterion. Two consumer examples did not show an issue/fix hallucination or an acceptance-as-verification error. Existing [project-connection evidence](project-connection-evidence.md) already proves a material `해결` error was fixed in the actual owned block. Adding another general rule solely to force one display slot in this text probe would increase instruction size without demonstrated material value. Keep product bytes unchanged; preserve the strict partial and do not claim universal correctness or human readability. The roadmap's human evaluation and value/cost gates stay open.

Local verification after this evidence-only addition: the current-release sync contract passed; project setup safety passed 23/23 under both PowerShell 7 and Windows PowerShell; install lifecycle passed; Node setup contract/fixture tests passed 6/6; `git diff --check` found no whitespace errors. The fixture remained clean at the same HEAD and its empty `AGENTS.md` kept SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. Product skill and Core hashes remained `51d00c30caaaccc1ea27e18ea0ef5630c73ee49e0c2a0755a7ef7c5983bd594d` and `f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9`, respectively.
