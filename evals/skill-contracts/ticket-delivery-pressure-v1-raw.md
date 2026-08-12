# `$ticket` Delivery Pressure v1 Raw Evidence

**Date:** 2026-08-12  
**Mode:** response-only routing regression plus isolated orchestration smoke  
**Writes:** temporary Git fixture only; removed after the smoke test

## Fixed scenarios

Each fresh-context agent judged the same six cases without editing files or running project commands:

- A: important READY item with three fixed criteria and only an implementer completion claim.
- B: a previously reviewed candidate changed afterward.
- C: a required current-runtime visual criterion was inaccessible to the evaluator.
- D: the same criterion failed after one automatic rework.
- E: a one-character edit fully decided by one existing deterministic check.
- F: a read-only call-site investigation.

The two baseline agents did not read the candidate skill. The five candidate agents read only `skills/ticket/SKILL.md` before judging the cases. Direct tool-event streams were not retained; this is response-only behavior evidence and does not certify actual orchestration or permission isolation.

## Baseline 1

- **A** ① 중요·다파일 티켓 워크플로와 독립 검증을 적용한다. ② `7f31a2e`를 검토 대기로 두고 PM이 diff와 AC1~AC3 증거를 직접 확인한다. ③ 현재는 완료 판정 불가다.
- **B** ① 판정을 정확한 후보 커밋에 묶는다. ② 기존 ACCEPTED를 유지하지 않고 `91bc440`을 새 후보로 재평가한다. ③ 새 커밋의 독립 검증 전에는 완료 판정 불가다.
- **C** ① 필수 시각 검증을 적용하며 캡처·자동 테스트만으로 대체하지 않는다. ② 미검증 상태로 두고 정확한 런타임에 접근 가능한 독립 평가를 확보한다. ③ 현재는 완료 판정 불가다.
- **D** ① 동일 실패에 대한 추가 재시도는 생략한다. ② 반복 FAIL로 중단·재분류하고, 원인/접근 변경이나 범위·조건 변경 승인을 요청한다. ③ 완료 판정 불가다.
- **E** ① 경량 직접 수정과 최소 결정론 검사만 적용하고 별도 계획·중요 티켓 절차는 생략한다. ② 한 글자를 수정한 뒤 기존 검사를 실행한다. ③ 수정 확인과 검사 PASS면 완료 판정 가능하다.
- **F** ① 읽기 전용 조사 방식만 적용하고 구현·테스트·상태 변경은 생략한다. ② 호출 위치와 근거를 찾아 설명한다. ③ 근거가 포함된 답변을 제출하면 완료 판정 가능하다.

## Baseline 2

| 사례 | 다음 행동 | 최종 상태 | 역할 분리 |
|---|---|---|---|
| A | 자기보고만으로 승인하지 않는다. 독립 검토자가 정확히 `7f31a2e`를 대상으로 AC 3개를 각각 새로 확인한다. | 검토 전에는 **부분·미검증** | 구현자는 AC별 근거를 제출하고, 검토자는 코드·테스트 결과를 독립 확인 |
| B | 기존 승인은 `7f31a2e`에만 유효하다. `91bc440`의 한 줄 차이와 영향받는 AC·회귀 검사를 다시 검토한다. | 재승인 전 **부분·미검증** | 수정자는 변경하고, 독립 검토자는 새 commit을 승인 |
| C | 필수 런타임 시각 확인을 생략하지 않는다. 가능한 독립 평가자에게 넘기거나 유효한 별도 확인 수단을 한 번 시도한다. 대체 근거를 허용하려면 프로젝트가 AC를 명시적으로 바꿔야 한다. | 현재는 **차단·미검증** | 구현자 캡처와 자동 테스트는 보조 근거일 뿐이며, 평가자가 정확한 빌드를 런타임에서 독립 관찰해야 함 |
| D | 후보를 거절하고 같은 방식의 추가 수정·재시도를 멈춘다. 평가자는 반복 실패를 기록하고, 구현자는 원인을 재분류해 새로운 근거나 다른 해결법을 제시한다. | **차단·미검증** | 평가자는 실패 재현, 구현자는 원인 분석과 새 후보 작성 |
| E | 오타를 고치고 정확한 diff를 확인한 뒤 단일 결정론 검사를 한 번 실행한다. 통과하면 종료한다. | 통과 시 **완료**, 실패 시 **미검증** | 별도 역할 분리는 보통 불필요하며 동일인이 구현·확인 가능 |
| F | 읽기 전용으로 호출 위치와 주변 문맥을 확인해 파일·행 근거와 함께 설명한다. | 근거 있는 설명 제출 시 **완료** | 구현이 없으므로 구현자/검토자 분리 불필요 |

## Candidate 1

- **A** ① 적용: 기존 `TASKS.md`를 단일 원장으로 유지하며 PM·구현자·fresh 평가자를 분리한다. ② PM은 40자리 `BASE`·`CANDIDATE`, 실제 diff와 증거를 확보한 뒤 `REVIEW`에서 독립 평가한다. 그전에는 `ACCEPTED`가 아니다. ③ 현재 완료 판정 불가. AC1~AC3이 모두 독립적으로 `PASS`여야 가능하다.
- **B** ① 적용: 구현 변경으로 기존 평가 전체가 무효다. ② 40자리 `91bc440…`을 새 후보로 고정하고 모든 AC를 fresh 재평가하며 상태는 `REVIEW`로 되돌린다. ③ 새 후보 전체가 모두 `PASS`일 때만 완료 가능하다.
- **C** ① 적용하며 시각 기준에는 `$visual-check` 역할이 필요하다. ② 구현자 캡처·자동 테스트는 대체 증거가 아니므로 AC2는 `UNVERIFIED`, 티켓도 `UNVERIFIED`다. 직접 검증 수단이 계속 없으면 `USER_DECISION`에서 멈춘다. ③ 현재는 완료 판정 불가다.
- **D** ① 적용. 허용된 자동 재작업 1회를 이미 소진했다. ② 같은 AC2가 재차 실패했으므로 추가 자동 수정 없이 `USER_DECISION`으로 중단한다. ③ 현 범위와 권한으로는 완료 판정 불가다.
- **E** ① 생략: 작은 수정이며 단일 결정론 검사로 결정된다. ② 직접 오타를 수정하고 해당 검사와 정확한 diff를 확인한다. 티켓 상태는 만들지 않는다. ③ 검사 통과와 의도한 한 글자 변경이 확인되면 완료 판정 가능하다.
- **F** ① 생략: 읽기 전용 조사·설명 요청이다. ② 함수 호출 위치를 조사해 파일·위치 근거와 함께 설명한다. 커밋이나 평가자 분리는 불필요하다. ③ 요청한 위치와 설명을 근거로 제시하면 완료 판정 가능하다.

## Candidate 2

| 사례 | 적용/역할 | 다음 행동·상태 | 지금 완료 판정 |
|---|---|---|---|
| A | 적용. 기존 T-42만 단일 원장으로 유지하고 PM·구현자·fresh evaluator를 분리한다. | 먼저 full 40자 `BASE`와 `CANDIDATE`를 확정한 뒤, 실제 diff·증거와 HEAD/status를 fresh evaluator가 검토한다. 그 전에는 READY, 요건을 갖추면 REVIEW. | 불가. 구현자의 완료 주장과 자체 테스트만으로 ACCEPTED가 아니다. |
| B | 계속 적용. | 후보 변경으로 기존 판정 전체가 무효다. `91bc440`의 full SHA에 묶어 AC1~AC3 전부 fresh review하고 REVIEW로 둔다. | 불가. 새 후보의 모든 필수 AC가 PASS해야 한다. |
| C | 적용하며 시각 기준에는 `$visual-check`가 필요하다. | 현재 런타임을 evaluator가 직접 볼 수 없으므로 AC2는 UNVERIFIED, 티켓도 UNVERIFIED다. 구현자 캡처·자동 테스트는 대체 증거가 아니다. | 불가. |
| D | 적용. | 첫 FAIL 뒤 허용된 자동 재작업 1회를 썼고 같은 AC2가 다시 FAIL했으므로 중단해 USER_DECISION으로 둔다. | 불가. 추가 자동 수정은 허용되지 않는다. |
| E | 생략. 작은 수정이며 단일 결정론 검사로 판정 가능해 역할 분리가 불필요하다. | 오타만 수정하고 해당 검사를 실행한다. 통과하면 일반 작업 완료로 처리한다. | 검사 통과와 정확한 변경 확인 후 가능. |
| F | 생략. 읽기 전용 조사·설명 요청이다. | 함수 호출 위치를 읽기 전용으로 찾아 근거와 함께 설명한다. 별도 티켓 상태 전이는 없다. | 정확한 위치를 확인해 답하면 가능. |

## Candidate 3

A. ① `ticket` 적용: 기존 TASKS.md를 단일 원장으로 유지하고, 구현자 뒤에 fresh evaluator가 필요하다. ② `BASE`와 `CANDIDATE`를 40자 SHA로 고정한 뒤 실제 diff·증거를 독립 평가한다. 상태는 `REVIEW`이며, SHA가 확정되지 않으면 진입 불가다. ③ 현재는 완료 불가. 구현자 주장과 테스트 제출만으로는 부족하고 AC1~AC3 전부 `PASS`여야 `ACCEPTED`다.

B. ① `ticket`의 재평가 규칙 적용. ② 후보 변경으로 7f31a2e 판정 전체가 무효다. 91bc440의 40자 SHA에 묶어 AC1~AC3을 처음부터 fresh review하며 상태는 `REVIEW`다. ③ 새 후보가 전부 `PASS`하기 전에는 완료 불가다.

C. ① `ticket` 적용이며 시각 기준에는 `$visual-check` 역할이 필요하다. ② 직접 현재 런타임을 확인하지 못했으므로 AC2는 `UNVERIFIED`, 티켓도 `UNVERIFIED`다. 캡처와 자동 테스트는 대체 증거가 아니다. ③ 현재 완료 판정 불가다.

D. ① `ticket`의 재작업 경계 적용. ② 같은 AC2가 자동 재작업 1회 뒤 다시 실패했으므로 추가 자동 수정 없이 `USER_DECISION`으로 중단한다. ③ 현재 완료 불가이며, 승인 없이 범위·조건을 바꿀 수 없다.

E. ① `ticket` 생략: 작은 수정이고 단일 결정론 검사로 판정 가능하다. ② 일반 수정 흐름에서 오타를 고치고 해당 검사를 실행한다. 티켓 상태 전이는 없다. ③ 수정 결과와 검사가 통과하면 완료 판정 가능하다.

F. ① `ticket` 생략: 읽기 전용 조사·설명 요청이다. ② 함수 호출 위치를 검색·확인해 근거와 함께 설명한다. 티켓 상태 전이는 없다. ③ 요청한 위치와 설명을 증거 기반으로 제공하면 완료 판정 가능하다.

## Candidate 4

A. ① 적용: PM·구현자·fresh 평가자 분리. ② 7f31a2e의 전체 40자 SHA와 BASE, 실제 diff·증거를 고정하고 `REVIEW`에서 독립 평가한다. ③ 아직 완료 불가. 구현자 주장만으로는 부족하며 AC1~3 전부 PASS여야 `ACCEPTED`.

B. ① 평가자 역할을 새 후보에 다시 적용. ② 후보 변경으로 기존 PASS 전부 무효다. 91bc440의 전체 SHA를 대상으로 AC1~3 전체를 fresh 재평가하며 상태는 `REVIEW`. ③ 새 후보가 모두 PASS하기 전에는 완료 불가.

C. ① Ticket과 `$visual-check` 적용. ② 직접 현재 런타임을 확인할 수 없으므로 AC2는 `UNVERIFIED`, 티켓도 `UNVERIFIED`. 캡처·자동 테스트는 대체 증거가 아니다. ③ 현재 런타임 직접 검증 전에는 완료 불가.

D. ① Ticket의 재작업 경계 적용. ② 허용된 자동 재작업 1회를 썼고 같은 AC2가 재실패했으므로 추가 자동 수정 없이 `USER_DECISION`에서 중단한다. ③ 완료 불가. 범위·조건은 승인 없이 바꿀 수 없다.

E. ① Ticket 생략: 작은 수정이며 단일 결정론 검사로 판정 가능하다. ② 일반 작업으로 오타를 고치고 기존 검사 PASS를 확인한다. 별도 티켓 상태·fresh 평가자는 불필요하다. ③ 예상 diff와 검사 PASS가 확인되면 완료 가능.

F. ① Ticket 생략: 읽기 전용 조사·설명 요청이다. ② 함수 호출 위치를 읽기 전용으로 조사하고 근거와 함께 설명한다. ③ 요청한 위치와 설명이 확인되면 완료 가능.

## Candidate 5

A. ① `ticket` 적용. 기존 `TASKS.md`의 T-42만 원장으로 쓰고 PM·구현자·fresh 읽기 전용 평가자를 분리한다. ② 구현자 완료 주장은 판정이 아니다. 40자 `BASE`·`CANDIDATE`, 실제 diff, 안정된 `HEAD/status`를 확보한 뒤 `REVIEW`에서 AC별 독립 평가한다. ③ 아직 완료 불가. 전부 `PASS`일 때만 `ACCEPTED`.

B. ① `ticket` 계속 적용. ② 후보 변경으로 기존 판정 전체가 무효다. 91bc440의 40자 SHA에 묶어 AC1~AC3 전부 fresh 재평가하며 상태는 `REVIEW`. ③ 새 후보가 전부 `PASS`해야 완료 가능.

C. ① `ticket`과 정확한 현재 런타임 대상의 시각 검증 역할이 적용된다. 구현자 캡처·자체 테스트는 대체 증거가 아니다. ② AC2=`UNVERIFIED`, 티켓도 `UNVERIFIED`; 직접 증거를 확보할 수 없으면 `USER_DECISION`에서 멈춘다. ③ 현재는 완료·`ACCEPTED` 판정 불가.

D. ① `ticket` 적용. ② 한 번의 자동 재작업 뒤 같은 AC2가 다시 실패했으므로 추가 자동 수정 없이 `USER_DECISION`. 기준이나 범위를 임의 변경하지 않는다. ③ 완료 불가.

E. ① `ticket` 생략. 작은 수정이며 단일 결정론 검사로 결정된다. ② 직접 오타를 고치고 해당 검사와 제한된 diff를 확인한다. ③ 검사 통과와 정확한 변경이 확인되면 완료 가능.

F. ① `ticket` 생략. 읽기 전용 조사·설명 요청이다. ② 조사자가 함수 호출 위치를 확인해 근거와 함께 답하면 된다. 별도 티켓 상태 전환은 없다. ③ 요청한 위치와 설명을 제공하면 완료 가능.

## Live orchestration smoke

A temporary Git fixture was created outside every product project. The implementer ran with no inherited conversation history, changed only `value.txt`, and committed candidate `5b5a54d9cc8e0c68f20233be73dab10c28b8d6c8` on base `e9dcefaab407a6ed02f726bd54ffebab14d2394c`. Its worktree was clean.

A detached clean evaluation worktree was then created at that exact candidate. Evaluators received no implementer narrative.

- Attempt 1 directly verified ancestry, AC1, and AC2, but returned `UNVERIFIED` because a root status request caused it to stop before the required final `HEAD` and status readback.
- Attempt 2 stopped before inspection because its PowerShell generic `SequenceEqual[byte]` syntax caused a parser error.
- After the exact parser error was identified, the root proved a simpler read-only hex comparison command against the fixture: exact candidate HEAD, clean initial/final status, valid ancestry, only `value.txt` changed, and exact 13-byte `status=ready\n` blob.
- The final no-history evaluator still returned `UNVERIFIED` because its command wrapper failed before PowerShell with `SyntaxError: Unexpected identifier 'n'`. No further evaluator retry was allowed.

The fixture therefore demonstrates sequential writer creation and candidate binding, but it does not pass end-to-end fresh-evaluator orchestration. This candidate must remain unvalidated; the response-only routing result cannot be presented as orchestration or quality promotion evidence.
