# 다음 작업 선정 — 좁은 보완 및 검증

판정: **후보 소스 보완·중립3사례 통과. 실제 긴 이력의 재발 방지는 미검증.**

## 변경

T500은 존재하던 T478 근거를 누락했고 본 검토도 이를 놓쳤다. 그 실패와 T501 정정은 [기존 기록](../2026-10-04-roadmap-operation/review-evidence.md)에 유지한다.

기존 다음 작업 문단만 보강했다. 항목의 근거와 관련 작업/보고서 색인을 대조하고, 최신 요약과 원근거가 충돌하면 해소한다. 못 찾았다는 사실을 검사한 적 없다는 결론으로 바꾸지 않는다. 유효한 결과를 재사용하며 바뀐 코드/대상·실패·새 조건이 있으면 그 차이만 확인한다. 새 단계 엔진·검사기·상시 전역 지침·승인 절차는 추가하지 않았다.

- `skills/joeness-setup/SKILL.md`: SHA256 `9823b1daedcec01a865eda02ec0c0c6e0e2c140d936d33944c4052925da58392`.
- `skills/joeness-setup/assets/AGENTS.md`: `5168125f85d13f32ded62de5ec14df7b46844c94a78b9e3c2ca8ccd209111288`.
- `skills/joeness-setup/assets/ROADMAP.md`: `223de12b55d75ea6351d87a6a784d5db679b9eab7d7ca2cc3895c37560ac4785`.
- manifest의 해당3개 해시 갱신. 공개 스킬1개/setup-only/전역 payload 없음 유지. 기존 다른 변경은 보존.

skill-creator의 좁은 수정·독립 forward-testing 지침을 적용했다. 설치된 개인 스킬과 게임 연결은 변경하지 않았다.

## 행동 확인

[사전 계획](plan.md), [원입력](inputs.json), [실제 출력·변경 해시·채점](observed.json).

독립 맥락(fork_turns=none)3개에 각 중립 프로젝트와 같은 작업 요청만 제공했다. 기대 정답·실패 원인·패치 이유는 제공하지 않았다. 평가자에게는 ROADMAP/TASK 사실 정정만 허용했고 제품 코드/검사 실행/승인은 금지했다. 따라서 제품 실행 성능이 아니라 근거 조회·다음 작업 선정·기록 동작의 시험이다.

| 사례 | 실제 선택 | 판정 |
| --- | --- | --- |
| 현행과 일치하는 기존 검증 | Q17 재사용, 잘못된 최신 요약 정정, 다음은 사용자 수락 | 통과 |
| 승인된 구분자 변경 | 과거 쉼표 증거와 현재 세미콜론 변경 구분, 변경 부분 확인만 다음으로 선정 | 통과 |
| 완료 기록은 있으나 원자료 없음 | 미확인 경계 유지, 근거 복구·대조를 다음으로 선정 | 통과 |

직접 파일 대조: 17개 입력 중 각 ROADMAP/TASK만 변경(6파일), 나머지11개 내용 동일, 예상 밖 파일0. 세 사례 모두 사용자 수락을 생성하지 않았고 단계 완료로 승격하지 않았다. alpha는 Q22 요약을 정정하며 원문 자체는 이 evidence의 inputs에 보존했다. gamma는 기존 실패/부재를 없애지 않았다. 중립 원자료는 시험용으로 작성된 것이며 실제 제품 실행 결과를 주장하지 않는다.

실행 식별: Codex collaboration subagents `/root/next_proof_alpha`, `/root/next_proof_beta`, `/root/next_proof_gamma`. 모델/추론 설정의 독립 조회가 없어 정확한 모델명 주장은 하지 않는다. 저장된 앱 새 채팅의 자동 지침 전달 시험이나 Bare 대비 개선 A/B가 아니다.

## 기계 검사

- `node --test tests/joeness-setup-contract.tests.mjs`: 3/3 통과.
- `node --test tests/joeness-setup-fixtures.tests.mjs`: 6/6 통과.
- Windows PowerShell `tests/joeness-project-setup.tests.ps1`: 27/27 통과.
- Windows PowerShell `tests/joeness-install.tests.ps1`: setup-only 설치/해제·사용자 bytes·legacy fail-closed·drift·rollback·manifest 통과.
- Windows PowerShell `tests/joeness-release.tests.ps1`: 로컬 출시 계약 통과. 원격 Windows CI·정확한 출시 커밋 검증을 대신하지 않는다.
- `quick_validate.py`: 첫 실행은 Windows 기본 cp949가 UTF-8 SKILL을 읽지 못해 UnicodeDecodeError. 실패 보존. 도구나 제품 파일 변경 없이 `python -X utf8 ...`로 재실행하여 `Skill is valid!` 확인.
- `git diff --check`, 입력/관측 JSON parse 통과.

검사는 임시 설치/프로젝트를 사용했다. 개인 설치·실제 게임 프로젝트·commit/push·원격 CI·배포는 실행하지 않았다.

## 남은 경계

작은3사례의 성공은 긴 작업 이력에서 근거를 항상 발견한다거나 압축 후 지침이 유지된다는 증거가 아니다. 실제 게임의 이전 실패 판정은 바꾸지 않는다. 다음은 후보 연결을 승인된 실제 프로젝트에 반영한 뒤, 정답을 주지 않은 새 담당자가 기존 완료/변경/미완을 구분하는지 한정 확인하는 것이다. 이번에는 그 적용이나 시험을 실행하지 않았다.
