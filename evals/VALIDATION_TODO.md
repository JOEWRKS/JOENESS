# Common Core 검증 TODO / Validation TODO

현재 단계: **완료 — 5/5**

목표: 기본 Codex와 중복되는 규칙 비용은 줄이고, JOEWRKS의 반복 실패만 막는 최종 Common Core를 결정한다.

## 종료 기준

- 같은 모델·도구·fixture에서 기본 Codex와 후보를 비교한다.
- 아래 4개 사례를 각각 항목별로 판정하며 총점으로 뭉개지 않는다.
- 허위 완료, 범위 침범, 잘못된 다음 단계, 테스트 우회, 타임아웃은 후보 즉시 탈락 조건이다.
- 후보가 품질 항목을 1개 이상 개선하면 총 토큰 증가 중앙값이 5% 이하여야 한다.
- 모든 품질 항목이 동률이면 총 토큰 증가 중앙값이 2% 이하여야 한다. 넘으면 별도 Common Core를 활성화하지 않는다.
- 인프라 오류만 재실행한다. 불리한 에이전트 결과를 성공할 때까지 반복하지 않는다.

## 진행 목록

- [x] 0. 현행 Core 기준선 수집
  - [x] 기존 프로젝트 `계속해줘` 게이트 검증
  - [x] stale handoff와 현재 저장소 충돌 검증
  - [x] 문서상 PASS와 현재 테스트 FAIL 충돌·근본 수정 검증
  - 판정: 세 사례 모두 품질 동률, 현행 Core 총 토큰 `+7.39%`, `+7.01%`, `+6.48%`.

- [x] 1. 축소 후보 동결
  - [x] 기존 Lite와 현행 Core의 재사용 가능성 검토
  - [x] JOEWRKS 고유 실패와 최종 충돌 보고 규칙만 남긴 후보 작성
  - [x] 권한·중복·모순 정적 검토
  - 후보: `evals/candidates/common-core-lean-v1.md`
  - 신원: 1,054바이트, 166단어, SHA-256 `b7108b59a03395f69316eeaae3ad3a66ec32918bfecc7feb28df16911779a8f3`

- [x] 2. 축소 후보 회귀 A/B
  - [x] 기존 프로젝트 게이트: 기본 vs 축소 후보
  - [x] stale handoff: 기본 vs 축소 후보
  - [x] false-completion/root-fix: 기본 vs 축소 후보
  - [x] 사례별 품질·토큰·시간·명령 비용 기록
  - 판정: 후보 개선 0건, 후보 열세 3건, hard fail 0건, 총 토큰 증가 중앙값 `+4.38%`.
  - 보고서: `evals/experiments/common-core-lean-regression-ab-v1.json`

- [x] 3. 축소 후보 고유가치 A/B
  - [x] 거친 프로젝트 요청을 실행 가능한 현재 산출물로 변환하는 사례 고정
  - [x] 계획에 멈추지 않고 사용 가능한 로컬 산출물까지 구현하는지 검증
  - [x] 불필요한 기능·도구·심사 호출과 최종 보고 진실성 검증
  - 판정: 양쪽 모두 단일 실행 가능 HTML을 구현해 후보 고유 전환 이점은 없었다. 후보 총 토큰 `+43.56%`; 시각 계층·사용자화·검색 1회 절감은 있었지만 범위·접근성·유지보수·보고·비용 결함도 있었다.
  - 보고서: `evals/experiments/common-core-lean-rough-request-ab-v1.json`

- [x] 4. 승격 또는 폐기 결정
  - [x] 4개 사례를 항목별로 종합하되 총점으로 결함을 상쇄하지 않음
  - [x] 종료 기준에 따라 `별도 Common Core 비활성` 결정
  - [x] 후보 문구의 구체적 누락이 아니라 이미 있는 규칙의 무효과이므로 수정 후보를 만들지 않음
  - 보고서: `evals/experiments/common-core-final-decision-v1.json`

- [x] 5. 실제 하네스 반영 및 최종 검증
  - [x] manifest를 1바이트 `no-common-core`로 전환하고 기존 평가 Core는 증거로 보존
  - [x] 관련 동기화·설치·프로젝트 설정·디자인 라우팅 테스트 실행
  - [x] README 한글·영문 설명과 검증 결론 갱신
  - [x] 실제 사용자 설치 `Check → Apply → Check` 완료
  - [x] 실제 증거 해시·Git diff·미완료 항목 최종 확인

## 현재 보고

- 활성 `common-core.md`는 아직 변경하지 않았다.
- 판정은 `별도 Common Core 비활성`으로 확정했다. 후보 토큰 증가율 중앙값은 `+4.57%`이며, hard fail은 없었지만 고유 핵심 이점 없이 항목별 후퇴가 남았다.
- 설치 구조는 빈 `no-common-core` 관리 슬롯으로 전환했고, 프로젝트별 `AGENTS.md`와 필요할 때만 쓰는 스킬은 유지했다.
- 저장소 검증: manifest/Core 6개, 디자인 라우팅 13개, project setup 계약, sync-harness 전체 계약이 모두 PASS했다.
- 실제 사용자 설치: `current`, 변경 필요 없음, blocker 0, unresolved target 0, 관리 payload는 공백뿐이다.
- 제한: rough 사례의 양쪽 제품 상호작용은 비교 미검증이다. 정적 JavaScript, 원격 참조, Edge 렌더는 양쪽 모두 확인했다. 원시 평가 폴더의 임시 Edge profile은 정책상 자동 삭제하지 못했으며 제품·승격 증거로 쓰지 않았다.
