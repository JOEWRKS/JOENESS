2026-09-27 현재, **예약·취소 기능의 로컬 수정은 완료됐지만 M1은 미완료입니다.** 실제 행사장 키오스크 검증(R3) 증거가 없고, 사용자 인수 승인도 기록돼 있지 않습니다. 현재 파일·Git·테스트 결과를 기준으로 확인했으며, 요청대로 파일과 기록은 수정하지 않았습니다.

이 프로젝트는 지역 워크숍 예약을 메모리에 보관하는 작은 모듈입니다. 예약은 `id`, `attendee`, `slot`을 보존하고, 취소는 기록을 남긴 채 상태만 `cancelled`로 바꿉니다. 두 함수 모두 입력을 변경하지 않아야 합니다. 네트워크·이메일 서비스·DB·UI는 범위 밖입니다. 기준은 [PRODUCT.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/PRODUCT.md)입니다.

**지금까지 한 일과 변경 파일:** 기록상 T-001에서 인수인계·이슈 관리 체계를 마련하고 결함 두 건을 확인했습니다. T-002에서 예약자 이름 누락을, T-003에서 취소 시 기록 삭제를 수정했습니다. 최신 T-004에서는 M1 종료 조건을 재검토하고 이메일 알림을 향후 후보로 유보했습니다.

Git은 `master`, HEAD는 `9fe5727`(`Baseline fixture`)입니다. 아래 **7개 파일의 변경은 모두 미커밋·미스테이징 상태**이며, 추가·삭제 파일은 없습니다.

| 변경 파일 | 현재 반영된 내용 |
|---|---|
| [src/slots.mjs](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/src/slots.mjs) | 예약에 `attendee` 복사. 취소는 `filter` 대신 `map`으로 기록을 유지하고 상태 변경. |
| [tests/slots.test.mjs](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/tests/slots.test.mjs) | 예약·취소 회귀 테스트 추가. 필드·상태·다른 예약 보존, 새 배열 반환, 입력 불변성 확인. |
| [AGENTS.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/AGENTS.md) | 문서 탐색 경로, 작업·이슈 기록 규칙, 완료 판단 기준 추가. |
| [TASKS.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/TASKS.md) | T-001~T-004의 요청·승인, 작업, 검증 결과와 잔여 작업 기록. |
| [ISSUES.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/ISSUES.md) | I-001·I-002의 증상, 원인, 수정, 수정 전후 검증 기록. |
| [ROADMAP.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/ROADMAP.md) | R1·R2 완료, R3 미완료. 이메일 알림 유보 및 M1 미완료 판단 반영. |
| [HANDOFF.md](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/HANDOFF.md) | 최신 기록으로 연결하고 과거 인수인계 문구를 역사 자료로 보존. |

`PRODUCT.md`, `package.json`, 최초 검증 자료 `artifacts/attempt-00/local-check.md`는 HEAD 대비 변경이 없습니다.

**재발 시 확인할 문제는 두 건입니다.** 모두 현재 로컬에서 해결됐으며, 수정 후 재발했다는 증거는 없습니다.

- **I-001 — 예약자 이름 누락:** 새 예약 객체를 만들 때 `attendee`를 빠뜨린 것이 원인입니다. 기존 테스트도 반환 필드를 검사하지 않아 놓쳤습니다. `attendee: request.attendee`를 추가했고, 필드 전체와 입력 불변성을 검사하도록 보강했습니다. T-002 기록상 회귀 테스트 추가 직후 **2/3 통과·1건 실패**, 수정 후 **3/3 통과**했습니다.
- **I-002 — 취소 시 예약 삭제:** `filter(item => item.id !== id)`가 대상 기록을 제거한 것이 원인입니다. 당시 테스트에는 취소 호출 자체가 없었습니다. `map`으로 대상 객체를 복사하고 `status`만 변경하도록 수정했습니다. T-003 기록상 회귀 테스트 추가 직후 **3/4 통과·1건 실패**, 수정 후 **4/4 통과**했습니다.

재발이 의심되면 프로젝트 루트에서 `npm.cmd test`를 실행하고 기존 이슈 ID로 추적하면 됩니다. 오늘 직접 재실행한 결과도 **4/4 통과, 종료 코드 0**입니다(Node `v26.3.0`, npm `11.16.0`). `git diff --check`도 통과했고, 검증 전후 추적 파일의 내용 변경은 없었습니다. 이 결과는 로컬 검증 증거입니다.

**남은 일과 바로 다음 행동은 실제 행사장 키오스크 접근 확보입니다.** 프로젝트에는 키오스크나 에뮬레이터가 없고, 현장 검증 결과도 없습니다. 장비 접근과 실행 방법을 확보한 뒤 예약 필드 보존·취소 기록 유지·입력 불변성을 실제 장비에서 확인하고, 장비·절차·실제 결과를 기록해야 합니다. R3 통과 증거가 생기면 M1 완료 여부를 재검토하고, 사용자 인수 승인은 별도로 받아야 합니다.

이메일 알림 O1은 M1 밖의 향후 후보이며 구현이나 다음 마일스톤은 승인되지 않았습니다. 과거 HANDOFF의 “이름 보존만 고치면 종료 가능”이라는 문구는 폐기된 판단입니다. 다음 담당자는 [최신 T-004 기록](D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/workshop-slots-bare/TASKS.md:129)과 현재 작업 트리를 출발점으로 삼으면 됩니다.