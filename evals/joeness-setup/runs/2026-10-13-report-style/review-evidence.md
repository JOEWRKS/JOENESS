# T041 사용자 안내 문체 정비

- 기준: `7a8f4e6b296f9aaa5a1ee198b0b69e3a206b630f`, 작업 브랜치 `codex/qa-recording-boundaries`.
- 승인 근거: Manager 채팅 사용자 turn `01a13577-0c76-78e0-b626-fe0aa8decce9`. 보고서 문체·전체 사용자 안내 정비 요청. 후보 commit까지만 수행, push는 QA 검토 후 별도 단계.
- 목적: 서술·홍보 표현을 짧은 명사형으로 변경. 기능·지원 범위·사용자 승인·복구 경계 유지. 런타임 규칙 추가 없음.

## 검토·수정 범위

| 파일 | 처리 | 근거 |
|---|---|---|
| README.md | 전문 검토·수정 | 핵심 요약 → 설계 목적 → 주요 기능 → 사용 방법 → 도구 간 연결 → 한계. 설치·역할·인계·보고 예시 보존 |
| docs/installation.md | 전문 검토·수정 | 설치·업데이트·복구·결과 해석의 보고서 문체 적용. 명령·중단·소유권 경계 유지 |
| docs/CHANGELOG.md | 현재 절 확인·수정 제외 | 버전 이력 보존 대상 |
| docs/ROADMAP.md | 현행 위치·dirty 확인, 수정 제외 | 제품 작업 기록·기존 APP-001 미커밋 변경 보존 |
| docs/ISSUES.md | 존재·hash 확인, 수정 제외 | 기존 사용자 미추적 문제 기록 |
| AGENTS.md | 전문 확인·수정 제외 | 저장소 작업 지침. 사용자 소개 문서 아님 |
| skills/joeness-setup/references/usage.md | 배포 목록·연결 확인, 수정 제외 | 설치기에 포함된 런타임 배포물. 별도 개인 설치 변경 금지 |
| skills/joeness-setup/references/review-gate.md, roadmap-review.md, operation-review.md, impact-review.md | 배포 목록·연결 확인, 수정 제외 | 실행 계약·검증 참조. 이번 문체 정비에서 byte 변경 제외 |
| docs/superpowers/specs/*.md, docs/superpowers/plans/*.md | 파일 목록 확인, 수정 제외 | 과거 설계·계획, 현재 소개 문서 아님 |
| 기존 evals/**, 태그·Release | 수정 제외 | 과거 증거·릴리스 보존. Release 본문은 Manager 담당 |

## 변경·보존 판단

- README: ‘이게 뭐냐/언제 쓰냐/무엇을 받게 되냐’ 제목과 ‘합니다/한다’ 설명문 제거. 요청된 여섯 대단락 적용.
- 설계 목적: 진행표 단일화·현재 상태 복원·업무 인계에 집중. 제품 기획·디자인 판정·개발·승인 대체 주장 없음.
- 연결표: 공통 확정 문구 적용. JOENESS의 전 과정 사용·각 도구 단독 사용·자동 실행/승인 없음 유지.
- 설치 안내: 5단계 업데이트, exact 이전 패키지 확인, 외부 백업, 소유권·사용자 수정 중단, 실패 후 선확인 유지.
- 결과·한계: 설치/연결/문서 적합/실제 검증/수락 구분 유지. CSS·동적 변경 한계, 토큰·성능 미입증 유지.
- 문체와 배치만 변경. 사람의 이해도 개선이나 모델 행동 개선을 새로 입증한 결과 아님.

## 검증

- 두 문서의 PowerShell 코드 블록 각2개: 기준 커밋과 정확한 문자열 대조 통과.
- 사용자 요청 예시: 기존 원문 유지. 명령 예제의 자연어를 보고서 문체로 변경하지 않음.
- 링크: README12개·설치 안내1개 원본 대상 보존, 로컬 대상·문서 절 확인 통과.
- 제목: README 최상위6절 순서 대조 통과. 두 문서의 ‘합니다/한다./해요/입니다/하세요/쉽게’ 표현 검색 결과 없음.
- `node --test --test-name-pattern='manifest pins' tests/joeness-setup-contract.tests.mjs`: 1/1 PASS. 제품1.0.0·manifest·README 제목·17파일 해시 일치.
- `git diff --check`: PASS. skills/scripts/tests/vendor/.github 변경 없음. 전체 런타임 회귀 재실행 불필요.
- 기존 docs/ISSUES.md SHA: `d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7`. APP-001 ROADMAP 변경과 함께 commit 제외.
- 개인 설치·버전·태그·Release 변경 없음. 후보 full SHA는 Manager 인계 메시지에서 확인.
