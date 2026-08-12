# JOENESS 검증 부채 로드맵

이 파일은 현재 검증 작업의 유일한 활성 원장이다. 날짜별 계획·실험·사고 보고서는 역사 증거로만 링크하고 진행 상태를 중복 기록하지 않는다.

- **목표 / 릴리스:** V9 후보의 설치·행동·실프로젝트 효과를 기능별로 검증한다. 증거가 없는 기능은 `candidate/unvalidated`를 유지하고 전체를 한 번에 승격하지 않는다.
- **마일스톤:**
  - [x] **M0 후보 고정·설치:** 전체 회귀, 격리 `Check → Apply → Check → 재Apply → Remove → Check`, 원상복구, feature branch push
  - [ ] **M1 Ticket E2E:** M1A 첫 후보 승인 경로 + M1B 판정 무효화·실패 조건 재작업 1회·반복 실패 중단
  - [ ] **M2 Design→Visual:** MergeDrop·RVR 결함과 정상 대조군에서 기준 자가도출, 부분/전체 판정 분리, 실제 화면 확인
  - [ ] **M3 Core V6:** clean·partial·blocked·workaround·반복 오류·복구 상황의 한국어 결과 우선 보고와 중단 규칙
  - [ ] **M4 암묵 라우팅:** Project·Ticket·Design·Visual Check·Spec·Handoff의 양성/음성 사례
  - [ ] **M5 결합 흐름:** Project → Ticket → Spec → Handoff 재개의 종단 검증
  - [ ] **M6 실프로젝트 파일럿:** Unity, .NET 게임 모드, 웹/앱에서 품질·재작업·시간을 기록하고 기능별 승격 판정
- **현재:**

  | 단계 | 기대 결과 | 합격 조건 | 상태 |
  |---|---|---|---|
  | M0 | 재현 가능한 V9 배포 후보 | 전체 회귀와 격리 수명주기 통과, clean tree, exact hash, 원상복구 | 완료 — [`joeness-v9-m0-validation-v1.json`](evals/experiments/joeness-v9-m0-validation-v1.json), 증거 `4ce9b25` |
  | M1A | 첫 후보 승인 경로 | 무이력 평가자, 조건별 직접 판정, 평가 전후 비변경 | 완료 — [`joeness-ticket-m1-e2e-v1.json`](evals/experiments/joeness-ticket-m1-e2e-v1.json), 증거 `80bae67` |
  | M1B | 실패·변경 후보·재작업 상한 경로 | 기존 판정 무효, 실패 조건만 1회 재작업, 반복 실패·무변경은 USER_DECISION | 진행 중 |

- **차단 / 결정 / 링크:**
  - 검증 기간에는 검증 실패를 고치는 최소 변경 외 새 기능을 추가하지 않는다.
  - M0 검증 기준은 `codex/joeness-interface`의 `f3b4b30`; 원격 feature branch와 일치한다.
  - 사용자 홈은 V7·스킬 5개이며 `$ticket`과 최신 Design/Visual 규칙이 아직 적용되지 않았다. M1~M3의 격리 검증 후 M4 직전에 exact `Check → Apply → Check`로 갱신하고 새 Codex 작업에서 라우팅을 검증한다.
  - 공식 상태와 증거 포인터: [`vendor/source-manifest.json`](vendor/source-manifest.json)
- **증거 / 검토:** 2026-08-12에 M0 전체 회귀와 격리 공개 진입점 수명주기를 통과했다. 개인 설치는 V7이며 아직 갱신하지 않았다. 상태 변경은 exact 커밋·실행 결과·산출물·대상 상태를 다시 읽은 뒤에만 한다. 필수 검증이 남으면 `부분 완료` 또는 `미검증`으로 유지한다.

## M1B 활성 티켓

- **목표:** 후보 변경 시 판정 무효화, 실패 조건만 1회 재작업, 반복 실패·무변경 중단, 증거 누락 `UNVERIFIED`를 새 평가자로 검증한다.
- **기준:** `candidate.json`의 `target=READY`, `guard=STABLE`, `evidence.json` 존재. 매 후보에서 3조건과 diff를 전부 다시 본다.
- **고정:** BASE 뒤 이 티켓·검사기·기준은 불변이며 구현자는 후보 JSON만 쓴다. 고장·무변경·증거누락은 제품이 아닌 평가 fixture다.
- **합격:** 정상 `ACCEPTED` → 고장 `REWORK` → target-only 1회 수정 `ACCEPTED`; 무변경은 `USER_DECISION`, 증거누락은 `UNVERIFIED`, 추가 재작업은 없다.

## 갱신 규칙

마일스톤, 범위, 릴리스 조건, 결정, 차단, 계획된 인계가 바뀔 때만 갱신한다. 편집·명령·응답·커밋마다 쓰지 않는다. 실패 재실행은 새 증거로 보존하고 이전 실패를 덮어쓰지 않는다.
