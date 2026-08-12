# JOENESS 검증 부채 로드맵

이 파일은 현재 검증 작업의 유일한 활성 원장이다. 날짜별 계획·실험·사고 보고서는 역사 증거로만 링크하고 진행 상태를 중복 기록하지 않는다.

- **목표 / 릴리스:** V9 배포 후보를 기준으로 시작해 현재 skill-contract v14까지 변경된 기능의 설치·행동·실프로젝트 효과를 검증한다. 증거가 없는 기능은 `candidate/unvalidated`를 유지하고 전체를 한 번에 승격하지 않는다.
- **마일스톤:**
  - [x] **M0 후보 고정·설치:** 전체 회귀, 격리 `Check → Apply → Check → 재Apply → Remove → Check`, 원상복구, feature branch push
  - [x] **M1 Ticket E2E:** M1A 승인 + M1B 재작업·중단 + M1C 평가 입력 비오염 증거
  - [ ] **M2 Design→Visual:** M2A 정적 회귀, M2B1 fresh 인계, M2B2 exact 런타임을 모두 통과해야 완료
    - [ ] **M2A 큐레이션 정적 회귀:** skill-contract 전체 suite 12/12(그중 v14 신규 사례 4건); fresh 후보 평가는 미완료
    - [ ] **M2B1 fresh 인계:** v7 오판을 역사 보존하고 v5 Design 계약을 새 평가 방법으로 다시 산출·Visual에 전달
    - [ ] **M2B2 exact 런타임:** MergeDrop 폰·태블릿과 RVR 수정본을 exact commit/build/install/state/capture로 결박
  - [ ] **M3 Core V6:** clean·partial·blocked·workaround·반복 오류·복구 상황의 한국어 결과 우선 보고와 중단 규칙
  - [ ] **M4 암묵 라우팅:** Project·Ticket·Design·Visual Check·Spec·Handoff의 양성/음성 사례
  - [ ] **M5 결합 흐름:** Project → Ticket → Spec → Handoff 재개의 종단 검증
  - [ ] **M6 실프로젝트 파일럿:** Unity, .NET 게임 모드, 웹/앱에서 품질·재작업·시간을 기록하고 기능별 승격 판정
- **현재:**

  | 단계 | 기대 결과 | 합격 조건 | 상태 |
  |---|---|---|---|
  | M0 | 재현 가능한 V9 배포 후보 | 전체 회귀와 격리 수명주기 통과, clean tree, exact hash, 원상복구 | 완료 — [`joeness-v9-m0-validation-v1.json`](evals/experiments/joeness-v9-m0-validation-v1.json), 증거 `4ce9b25` |
  | M1A | 첫 후보 승인 경로 | 무이력 평가자, 조건별 직접 판정, 평가 전후 비변경 | 완료 — [`joeness-ticket-m1-e2e-v1.json`](evals/experiments/joeness-ticket-m1-e2e-v1.json), 증거 `80bae67` |
  | M1B | 실패·변경 후보·재작업 상한 | 판정 무효, 1회 재작업, 반복 실패·무변경 중단, 증거 누락 분리 | 행동 경로 완료 — 증거 `f614c75`; 당시 provenance 한계는 M1C에서 보완 |
  | M1C | 평가 입력·상태 증거 | prompt manifest·allowlist·hash와 전후 generated/ignored snapshot | 완료 — [index](evals/experiments/joeness-ticket-m1c-e2e-v3-index.json), [summary](evals/experiments/joeness-ticket-m1c-e2e-v3.json), [raw](evals/experiments/joeness-ticket-m1c-e2e-v3-raw.json), 증거 `115cc52` |
  | M2A | 큐레이션 정적 회귀 | blind fixture·숨긴 ground truth·출처 우선 기준·변형/상태 구분·부분/전체 판정, 실패 이력 보존 | 부분 통과 — [skill-contract suite 12/12](evals/skill-contracts/design-visual-m2-v14-contract-test-v1.json), 그중 v14 신규 사례 4건; [전체 회귀 영수증](evals/skill-contracts/design-visual-m2-v14-partial-validation-v1.json). v7은 [semantic review](evals/skill-contracts/design-visual-m2-visual-v7-semantic-review.json)에서 오판이 확인돼 거절 |
  | M2B1 | fresh Design→Visual 인계 | Design 입력·출력과 Visual 입력을 hash로 고정, 별도 fresh 평가자, 후보별 실제 관찰 | 차단 — v5 evaluator가 final JSON 없이 종료했고 세 번째 시도는 retry budget 위반; [blocked evidence](evals/skill-contracts/design-visual-m2-design-v5-blocked.json). 동일 경로 자동 재시도 금지 |
  | M2B2 | exact 런타임 | 정확한 소스·빌드·설치본·대상 상태·직접 화면을 하나의 증거로 결박, 사용자 수락은 별도 판정 | 미검증 — MergeDrop은 수정본 미커밋/캡처 미결박, RVR은 수정 후 런타임 프레임 미보존 |

- **차단 / 결정 / 링크:**
  - 검증 기간에는 검증 실패를 고치는 최소 변경 외 새 기능을 추가하지 않는다.
  - M0 검증 기준은 `codex/joeness-interface`의 `f3b4b30`; 원격 feature branch와 일치한다.
  - 사용자 홈은 V7·스킬 5개이며 `$ticket`과 최신 Design/Visual 규칙이 아직 적용되지 않았다. M1~M3의 격리 검증 후 M4 직전에 exact `Check → Apply → Check`로 갱신하고 새 Codex 작업에서 라우팅을 검증한다.
  - M1은 Ticket 기능만 통과했다. `promotionPass=false`이므로 JOENESS 전체는 계속 `candidate/unvalidated`이며 다음 활성 단계는 M2다.
  - M2A의 정적 계약 통과는 새 fresh 판정이나 M2 전체를 승격하지 않는다. v7 오판은 삭제·재분류하지 않고 거절 이력으로 보존한다.
  - M2B1은 같은 evaluator 경로를 다시 호출하지 않는다. 새 실행 래퍼·더 작은 기계 검증 계약 등 물질적으로 다른 방법이나 사용자 결정이 있어야 재개한다.
  - M2B2가 끝날 때까지 M2는 부분 완료다. 정적 비교본, 미추적 캡처, 사용자 서술은 exact corrected runtime 직접 화면을 대체하지 않는다.
  - fresh 실행은 exact prompt·허용 입력·raw final output·run identity를 보존한다. transport-level 실행 이력이 없으면 그 한계를 명시하고 완전한 격리 증거로 주장하지 않는다.
  - 사용자 수락은 에이전트 화면 판정과 분리해 `UNVERIFIED`로 유지한다.
  - 공식 상태와 증거 포인터: [`vendor/source-manifest.json`](vendor/source-manifest.json)
- **증거 / 검토:** 2026-08-12에 M0 전체 회귀와 격리 공개 진입점 수명주기를 통과했다. 개인 설치는 V7이며 아직 갱신하지 않았다. 상태 변경은 exact 커밋·실행 결과·산출물·대상 상태를 다시 읽은 뒤에만 한다. 필수 검증이 남으면 `부분 완료` 또는 `미검증`으로 유지한다.

## M1B 결과

BASE `6b9dd05…`에서 정상 `ACCEPTED`, 고장 `REWORK`, 1회 target-only 수정 `ACCEPTED`, 무변경·반복 실패 `USER_DECISION`, 증거 누락 `UNVERIFIED`가 분리됐다. 후보·평가자는 원격 ref와 [`joeness-ticket-m1b-e2e-v1.json`](evals/experiments/joeness-ticket-m1b-e2e-v1.json)에 고정했다. 이 역사 증거의 prompt·일부 상태 한계는 보존하며 M1C의 새 실행으로 보완했다.

## M1C 결과

V3 평가기는 6개 후보마다 서로 다른 무이력 작업을 만들고 프로젝트 지침과 구현자 서술을 제외했다. 각 작업은 exact 후보 SHA의 detached 작업공간에서 ancestry·diff·후보·증거·검사기 5개 작업을 수행했으며, 전후 tracked/index/untracked/ignored/generated 상태가 모두 같았다. 결과는 `ACCEPTED / REWORK / ACCEPTED / USER_DECISION / USER_DECISION / UNVERIFIED`로 기대값과 일치했다. 실행 원본의 절대경로는 역사 기록으로 보존하고, 저장소 내 재검증은 상대경로와 exact hash를 고정한 [index](evals/experiments/joeness-ticket-m1c-e2e-v3-index.json)를 사용한다.

## 갱신 규칙

마일스톤, 범위, 릴리스 조건, 결정, 차단, 계획된 인계가 바뀔 때만 갱신한다. 편집·명령·응답·커밋마다 쓰지 않는다. 실패 재실행은 새 증거로 보존하고 이전 실패를 덮어쓰지 않는다.
