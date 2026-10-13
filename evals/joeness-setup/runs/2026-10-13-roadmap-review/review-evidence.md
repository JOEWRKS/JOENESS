# F01/F02 묶음A — 구현·검증 기록

## 현재 상태

2026-10-13 묶음A 소스 구현·회귀·QA 독립 대조·격리 설치 소비 완료(한정). 배포·개인 설치·GEO 적용 아님.
승인: #Local QA Manager의 사용자 turn `01a134a6-3465-7ed1-8739-9d867153c874`를 직접 조회.
기준 HEAD `ee61bafcfe044bb567f371d920c901e505f99441`, 출시0.3.4 `5f16ea00c5c1f46c8c87999a3247739576dd537e`.
기존 `docs/ROADMAP.md` APP-001 수정과 미추적 `docs/ISSUES.md` 보존. 새 worktree/릴리스 없음.

## 구현 범위·순서

1. 실제 원본에 결속한 일회성 입력 계약과 신규 실패 시험.
2. 읽기 전용 진단/납품 요약, 관련 스킬 연결, 로컬 회귀.
3. QA에 exact patch/해시·실행 결과 인계, JOEFLOW/JOEDESIGN 원천 fixture 대조.
4. QA 소스 검토 뒤 격리 설치·생산소비 실행. 개인 설치는 아직 변경하지 않음.

F01: 현재 주장 간 충돌과 과거 기록 구분. 자유문장 의미·누락 없는 추출은 담당 검토의 책임이며 자동 인증하지 않는다.
F02: 필수 미완/범위 밖/참고 한계 분리. 범위·수락은 원본 권한, 요약은 JOENESS. 원본 승인 변경 없음.
F03/F04/F06 실제 CLI 연결과 F05 재사용 정책 변경은 이 묶음에서 제외.

## 실패·검증

- 변경 전 기존 소비·fixture 30/30 PASS (`node --test tests/joeness-review-gate.tests.mjs tests/joeness-setup-fixtures.tests.mjs`, exit0).
- 최초 신규 RED: `node --test tests/joeness-roadmap-review.tests.mjs`, exit1, 0 PASS / 16 FAIL. 원인: 새 CLI 미존재 `MODULE_NOT_FOUND`. 기대 답 수정으로 해결하지 않음.
- 최초 구현 GREEN: 같은16/16, exit0. 후속 원천 객체 대조/필수 집합 누락/현황 대조/명시 반려 회귀 추가 후20/20, exit0.
- QA 독립 반례: 초기 중간 소스 `5ca06c…`에서 필수 수락 낮춤/필수 lane 제거/과거 pointer를 현행으로 분류한3건이 잘못 rc0 complete. 근거는 Manager `evidence/t035-joe-implementation/f02-manager.json`. 실패가 있던 후보를 검증 완료로 채택하지 않음.
- 후속 수정: required 원천 객체의 id/lanes/acceptance/targets 직접 일치, JSON view pointer 포함관계 검사. 동일3반례 영구 회귀 추가. 의미·검토자 진위는 자동 인증 불가 경계 유지.

테스트 통과를 제품 승인·모델 성능·전체 완료로 해석하지 않는다. 전체 회귀·독립 소스 검토·격리 설치 결과는 완료 시 별도 추가한다.

## A 고정 결과

- CLI SHA256 `5dfb2d5a81df58d9e1c43651b43cc945356bbf61630b103877f9b8bcd13ba33f`.
- [정확 소스 patch](candidate-source.patch) SHA256 `bb9614ccc7a1d8ffc9c3930dbab65bc4863d3529eb003d44b5d0088a9a111cec`; [변경12파일·배포13파일](candidate-source.json). 기존 앱 이슈 변경 제외. 커밋·push·릴리스는 이번 단계에서 하지 않음.
- 38dc→5df: 다른 범위의 승인/범위본문 불일치, quote-view에 history JSON pointer를 섞는 우회 추가 차단. 신규 단위23/23.
- Manager 독립3반례: 초기 오류 보존 뒤 최종 소스에서 모두 거부, 정상 baseline 유지. `D:/JOEWRKS/JOEQASAM/evidence/t035-joe-implementation/f02-manager-red.json` 및 `f02-manager.json`.
- JOEDESIGN 원천 별도 제작13사례: [소스 소비13/13](producer-fixtures-source.json). 해당 담당의 최초 v2는12/13; P02 과거 제외 항목을 current observations에 넣은 매핑 오류를 원천·실패 보존 후 v3에서 역사로 분리. 소비기 기준 완화로 통과시킨 것이 아님.

최종 로컬 회귀(모두 exit0):

| 명령 | 결과 |
|---|---|
| `node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs tests/joeness-review-gate.tests.mjs tests/joeness-roadmap-review.tests.mjs` | 59 PASS / 0 FAIL |
| `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/joeness-release.tests.ps1` | PASS |
| `pwsh -NoProfile -File tests/joeness-project-setup.tests.ps1` 및 PowerShell5 동일 파일 | 각각27 PASS |
| `pwsh -NoProfile -File tests/joeness-install.tests.ps1` 및 PowerShell5 동일 파일 | 양쪽 수명주기·복구·사용자바이트 보존 PASS; 각 설치된 gate23/23 및 roadmap23/23 |
| `python -X utf8 C:/Users/tjdwo/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/joeness-setup` | Skill is valid |
| `git diff --check` | PASS |

Node26.3.0 / PowerShell7.6.5 및 Windows PowerShell5. 원격 exact-commit CI는 실행하지 않았으며 정식 출시 완료가 아니다.

## 실제 기록·설치 소비

- [실제 GEO 사본 진단](geo-readonly-result.json), [한 화면 출력](geo-readonly-report.txt), [원천 해석 검토](geo-mapping-review.md), [재실행 코드](verify-geo-readonly.mjs).
- 현재 마감/추가 필수 없음과 UNAPPROVED/운영·실검색 제외/미검증을 동시에 보존. 옛 '다음'을 현재 작업으로 오인하지 않음.
- 원본7파일 전후 SHA 불변. 임시사본4원본 약3.19MB를 읽었고 추가 모델세션0, 렌더·배포·제품변경0. 자유문장 분류·권한 의미는 실제 담당 검토가 필요하므로 무인 의미 인증 또는 토큰 절감으로 주장하지 않음.
- 초기 증거 추출 코드가 CRLF 과거절 분리에서 뒤쪽 이력까지 복사한 점은 `split(/\r?\n\r?\n/)`로 줄였다. 판단/원천은 그대로이며 수정 전후 성공 결과를 실패 개선으로 세지 않는다.
- [격리 설치](isolated-install.json): `C:/Users/tjdwo/AppData/Local/Temp/joeness-f01f02-install-LGhEB9`,13파일 정확일치·Check current. QA 소스 검토 및 진입 통지 후 실행.
- [설치된 소비기→생산fixture13/13](producer-fixtures-installed.json). 설치본은 검토용으로 유지, 개인 스킬11파일/state/전역AGENTS/config 불변, 신규2파일은 개인 설치에 없음.

## 남은 범위

문서 의미·추출 완전성·사용자 진위는 자동 입증하지 않는다. 새 문맥 지침 전달, 새 UI/실검색, F03/F04 실제 CLI 연결, F05 정밀 재사용, 개인설치 전환은 이 A 결과에 포함하지 않는다. Manager B 진입 통지에 따라 다음은 JOEFLOW 실행 결과의 소비 경계다.
