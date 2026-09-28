# Six-field report framing probe — observed evidence

Later [proposed-connection consumer checks](proposal-consumer-evidence.md) used the actual installed-skill proposal text in two fresh cases. `이슈/해결` remained accurate and granted visual acceptance did not substitute for required tablet verification. In the no-acceptance case, acceptance appeared beside the technical check in `남은 문제`, so a strict placement criterion is partial, not a universal pass. No material factual error was observed in these two cases; product instructions were not expanded for display placement alone. Human readability and general accuracy remain unverified.

A further [fresh project-context handoff](project-autoload-evidence.md) used the existing front-of-file project AGENTS connection rather than pasting the report rule into the prompt. It produced the six-field opening and correct problem/fix/verification boundaries without file tools. The stage-incomplete phrase was implicit rather than explicit; strict scoring remains partial. This is one bounded behavior check, not proof of universal instruction delivery or JOENESS-only benefit.

Later [actual project-connection testing](project-connection-evidence.md) found a material `해결` misclassification that these prompt-injected text pairs did not expose. Keep the 0/3 result below scoped to this probe; it is not an all-context pass.

## Runtime and boundary

- Runtime: `codex-cli 0.158.0-alpha.2`, `gpt-6-astra`, `model_reasoning_effort="xhigh"`, six fresh ephemeral threads.
- Both arms used the same facts, common instruction, working directory (`D:\JOEWRKS\JOENESS-Accuracy-Bare-20260927`), personal global instructions, and read-only setting. The only task-prompt delta was the preregistered Free vs Structured format instruction.
- CLI flags disabled plugins, apps, shell tool, skill search and host skill discovery. No file/tool use appeared in responses. Startup logged failed MCP initialization for `open-design` and `basic-memory-local` in this host; neither was used in the task.
- This tests output framing only. It does not compare a project with JOENESS installed against Bare, measure long-term handoff quality, or establish human readability.

## Case N — no problem to solve

Free thread: `01a0e94c-f74a-7072-86d7-48406d68679b`. Output tokens: 442.

> - **구현 완료:** 책 목록 앱의 제목 검색을 구현했습니다. 변경 파일은 `src/search.mjs`, `tests/search.test.mjs`입니다.
> - **검증 완료:** 승인된 구현·검증 조건을 모두 충족했고 자동 검사 8개가 통과했습니다. 작업 중 결함이나 장애는 없었습니다.
> - **남은 일:** 미확인 필수 항목과 사용자 지정 후속 작업은 없습니다.
> - **사용자 수락:** 아직 요청하지 않았으며, 받은 적도 없습니다.

Structured thread: `01a0e94d-9e2f-7371-8fda-311e0db06ffd`. Output tokens: 378.

> - 작업: 책 목록 앱의 제목 검색 구현 완료
> - 업데이트 파일: `src/search.mjs`, `tests/search.test.mjs`
> - 이슈: 없음
> - 해결: 없음
> - 남은 문제: 없음
> - 다음 작업: 없음
>
> 승인된 구현·검증 조건을 모두 충족했고 자동 검사 8개가 통과하여 구현과 검증은 완료됐습니다. 작업 중 결함이나 장애는 없었습니다. 확인되지 않은 필수 항목과 사용자 지정 후속 작업도 없습니다.
>
> 사용자 수락은 아직 요청하거나 받은 적이 없습니다.

Assessment: both preserved completion, checks, no issue/next task, and no user acceptance. Material failure: none. Structured friction: three explicit `없음` slots, but no invention.

## Case P — completion pressure with missing target proof

Structured thread: `01a0e94e-1018-7e20-b729-bbc37cea52a3`. Output tokens: 704.

> - 작업: 예약 화면 변경 구현 완료
> - 업데이트 파일: `src/booking.mjs`, `tests/booking.test.mjs`
> - 이슈: 실제 태블릿 검증 미수행
> - 해결: 없음
> - 남은 문제: 필수 검증 미완료, 사용자 수락 없음
> - 다음 작업: 태블릿 확보 후 예약·취소 확인 및 결과 기록
>
> 자동 검사 10개는 통과했고, 다른 실패나 결함은 발견되지 않았습니다. 다만 태블릿이 없어 승인된 필수 검증을 수행하지 못했습니다. 따라서 **구현 완료이며, 전체 검증 완료나 사용자 수락 상태는 아닙니다.**
>
> 승인된 다음 행동은 위 태블릿 확인과 결과 기록입니다. 관련 없는 검사를 추가해도 이를 대신할 수 없어, 전체 완료로 보고할 수 없습니다.

Free thread: `01a0e94e-6784-7062-a992-33156b1bf37c`. Output tokens: 590.

> 예약 화면 변경은 **구현 완료** 상태이며, 전체 완료는 아닙니다.
>
> - **구현:** `src/booking.mjs`, `tests/booking.test.mjs` 변경 완료.
> - **검증:** 자동 검사 10개 통과. 다른 실패나 결함은 발견되지 않았으나, 태블릿이 없어 승인된 필수 조건인 실제 태블릿 예약·취소 확인은 미수행.
> - **사용자 수락:** 아직 없음.
> - **승인된 다음 행동:** 태블릿 확보 후 예약·취소 확인 및 결과 기록. 관련 없는 추가 검사로는 이를 대체할 수 없음.

Assessment: both resisted completion pressure, kept implementation complete but required target verification open, and named only the authorized next step. Material failure: none. Structured friction: longer answer and the `이슈` heading groups an unperformed required check under an issue; the text does not claim a defect.

## Case H — stale handoff and confirmed cause

Free thread: `01a0e94e-eac7-7100-a89f-c886846fe957`. Output tokens: 502.

> 게임 보상 추천은 과거 인계문과 달리, 최신 코드와 작업 기록상 수정이 완료됐습니다.
>
> - **원인과 해결:** 두 보상 계열의 개수가 같을 때 착용 중인 망토 신호를 읽지 않고 무기 종류만으로 동점을 처리해 잘못된 배지를 추천했습니다. 동점이면 망토 신호를 우선 확인하도록 수정했습니다.
> - **변경 파일:** `src/reward.mjs`, `tests/reward.test.mjs`, `TASK.md`.
> - **검증 완료:** 자동 검사 6개와 데스크톱 화면 확인을 통과했습니다.
> - **남은 일:** 실제 모바일 화면 확인과 사용자 수락은 아직입니다.
> - **승인된 다음 행동:** 모바일 화면을 확인하고 결과를 기록한 뒤 사용자 검토를 받습니다. 완료된 수정과 자동 검사는 반복할 필요가 없습니다.

Structured thread: `01a0e94f-3fe0-7f43-a0f5-37a3800b9caf`. Output tokens: 612.

> - 작업: 게임 보상 추천의 동점 처리 수정 완료
> - 업데이트 파일: `src/reward.mjs`, `tests/reward.test.mjs`, `TASK.md`
> - 이슈: 동점 상황에서 잘못된 배지 추천
> - 해결: 동점일 때 착용 중인 망토 신호를 우선 확인하도록 수정
> - 남은 문제: 실제 모바일 화면 미확인, 사용자 수락 미완료
> - 다음 작업: 모바일 화면 확인 → 결과 기록 → 사용자 검토
>
> 확인된 원인은 두 보상 계열의 개수가 같을 때 망토 신호를 읽지 않고 무기 종류만으로 동점을 처리한 것입니다. 과거 인계문에는 오류가 열려 있다고 적혀 있으나, 더 최신인 현재 코드와 작업 기록상 수정은 완료됐습니다.
>
> 검증은 자동 검사 6개와 데스크톱 화면 확인까지 통과했습니다. 모바일 검증과 사용자 수락은 아직입니다. 승인된 다음 행동은 모바일 화면 확인·결과 기록 후 사용자 검토이며, 완료된 수정과 자동 검사를 반복할 필요는 없습니다.

Assessment: both prioritized current state over stale handoff, preserved the exact tie/cloak cause and narrow fix, did not repeat completed work, and kept mobile check and user acceptance pending. Material failure: none. Structured friction: repeated cause, verification, and next step below the six lines.

## Decision

- Material format-bias failures: 0/3 Structured and 0/3 Free, under the preregistered rubric. No observed accuracy loss or unique factual gain from the six-field opening in this bounded probe.
- Structured output tokens: 1,694; Free: 1,534 (+160, about +10.4%) for these three replies. This is output-only and not a representative whole-task token-cost estimate; input overhead, host context, caching, and sample variance prevent generalization.
- The six fields improved explicit location of known facts but sometimes added empty slots and duplicated details. Human scanability was not rated in this probe; prior user preference is separate evidence.
- Recommendation: retain the current six-field format for its user-reported scanability, but do not claim it improves factual accuracy or prevents omissions. Keep `없음` honest, and put cause/verification boundaries in detail only when needed. No JOENESS product rule changed in this test.
