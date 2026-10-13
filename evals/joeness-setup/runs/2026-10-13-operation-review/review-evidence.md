# F03/F04 묶음B — 실행 결과 소비

2026-10-13 A 소스독립검토 후 Manager B진입 지시에 따라 시작.
기준은 A patch `bb9614ccc7a1d8ffc9c3930dbab65bc4863d3529eb003d44b5d0088a9a111cec`.
조플로의 원본/투영 판단과 수정은 그 담당 소유. JOENESS는 실제 실행 exit/출력/출처·최신성·필수범위와 상태 표현만 검증한다.
개인 설치·GEO·F05 gate·릴리스는 변경하지 않는다.

## 실패와 초기 회귀

- 최초 `node --test tests/joeness-operation-review.tests.mjs`: exit1,0/15, 원인 새CLI MODULE_NOT_FOUND. 실패 기대를 바꾸지 않고 구현.
- 최초 구현 같은15/15 PASS, exit0. 이는 합성 transport unit이며 실제 producer 호출 검증과 다름.
- source/요청/실행ID/exit/rawstdout/stderr 결속, UNKNOWN=null, 부분결과/승인 분리, 읽기전용 검증을 포함.
- 최종 producer `097a97930d85ffd267109914747276f46f8281c9`에 coverage/승인 projection_contract가 추가됨. 소비기 초기 샘플 구현은 이 축을 검사하지 않아 신규3반례에서15 PASS/3 FAIL(exit1). Manager 실제생산캡처의 coverageFAIL+COMPLETE/다른복구담당 2반례도 잘못 허용됨(`operation-manager-red.json`).
- approved coverage/복구담당/kind/필수marker와 현재바이트 대조를 추가한 후18/18 PASS(exit0). 의미 검토 진위는 이 구조검사로 대신하지 않음.

## 진행 경계

producer 소스·fixture가 변경 중이므로 최종 hash와 실제 출력 계약을 받은 뒤 실제 CLI→capture→consumer 연결을 실행한다. 초기 샘플의 정적 PASS를 관리 설치/의미검토 인증으로 승격하지 않는다.

- 최초 실제 연결 준비는 producer HEAD가097a979→fe869ad2로 바뀌어 실행 전 pin assertion에서 중단(exit1), 실제 Python 사례0건. 원인: 담당 최종 후보 갱신. 성공시험으로 세지 않는다.
- 담당이 새 exact SHA를 인계했고 변경은 승인 범위상 필수가 아닌 의미 검토를 NOT_REQUIRED로 반환하는 보정임을 직접 diff 대조. `fe869ad2c376ed5937f60da74fdc1eba4e994f61`로 고정 후 연결 재개.
- 실제 Python CLI 4건(F03 PASS/FAIL, F04 PASS/PARTIAL) → 새 capture → 소비기 실행 4/4 PASS. 원본 불변. `actual-source.json`에 명령·exit·SHA 및 임시 raw capture 위치 보존.
- 최종 양성 회귀 추가: 승인상 의미 검토가 NOT_REQUIRED인 projection에 불필요한 review.scope를 요구함. `node --test --test-name-pattern="approved nonrequired" tests/joeness-operation-review.tests.mjs`: exit1, 0/1. 필수 의미검토일 때만 선언 scope를 요구하도록 한 줄 보정. 전체 19/19 PASS 및 실제 연결 4/4 재통과. 소비기 SHA `5cc094925c22aab56bc4255ff037551991bab56a471dcd1116e5d2889d8e50cc`.
- 전체 Node78/78, PS5 출시계약·프로젝트27/27 PASS 후 PS5 설치시험 중 `Get-FileHash` CommandNotFound로 exit1. 설치본 gate23/23·roadmap23/23·operation19/19 자체는 통과했으나 수명주기는 실패로 보존(`package-regression.json`). 새 PS5 프로세스의 Get-Command에서는 명령 존재 확인. 제품 변경 없이 실패한 단계부터 별도 프로세스로 재실행하며 최초 실패를 덮지 않는다.
- 같은 PS5 설치시험 재실행도 같은 명령 탐색 오류로 실패(`package-regression-followup.json`). 단독 Get-FileHash는 정상이며 정확한 호스트 내부 원인은 미확정. 테스트가 사용하는 Utility 모듈을 테스트 스코프에서 명시적으로 불러오도록 좁게 보정. 제품/설치 runtime은 변경하지 않음. 재검사 결과는 별도 파일에 보존.
- 그 명시적 import도 실패(`package-regression-module.json`). 이후 원인 분리 성공: PS7→Node→PS5 실행에서 상속된 PSModulePath가 Utility7.0을 PS5에 노출, Get-FileHash 함수가 export되지 않음. PS5 직접 호출과 Node child에서 PSModulePath를 생략한 경우 정상. 임시 테스트 import 보정은 원복했고, 평가 실행기의 PS5 child만 기본 모듈 검색 경로를 쓰게 수정. 개인 환경/제품/시험 기대값 변경 없음. 앞선 PS5 성공도 정상 환경에서 재확인한다.
- 환경 보정 후 PS5 release/setup27/install 및 PS7 setup27/install 모두 PASS. 설치마다 gate23/roadmap23/operation19 PASS. 이어 skill validator는 기본cp949 파일읽기로 실패. 실패 그대로 보존하고 UTF-8 실행 옵션으로 재검증한다. 이것도 도구 호출 환경이며 제품 수정으로 세지 않는다.
- UTF-8 skill validator와 diff-check PASS(`package-regression-utf8.json`). B 종료: Node78/78, PS5/7 프로젝트각27/27·수명주기·설치 소비각65/65, 실제source4/4 및15파일isolated4/4. Manager 독립설치소비9/9(`JOEQASAM/evidence/t035-joe-implementation/operation-manager-isolated.json`)는 담당 직접 실행 근거로 구분. B누적patch `d48d3954e870af938e72c9324e194adad39b19eca95e9383b9cd0d01f00bafe2` 보존.
