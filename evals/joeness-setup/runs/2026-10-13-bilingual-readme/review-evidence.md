# T042 English-first README

- 기준 커밋: `182006b72e92654b730af59c3d96c7c3af912579`.
- 사용자 승인: Manager turn `01a1358c-97fb-73a2-a822-fad221347d65`. 영어 메인 설명, 탭 대신 위 영어·아래 한국어 유지 대안 적용.
- 변경: README 상단 영어 전체 설명·언어 이동 링크·이름 앵커 추가. 제품 H1 유지, 하단 한국어 본문 원문 보존.
- 범위 제외: 상세 문서, runtime·manifest·코드·검사·버전·태그·Release·개인 설치. 기존 APP-001 ROADMAP dirty와 docs/ISSUES.md 미추적 자료 보존.

## 번역 대조

- 공통 여섯 영어 절: Summary / Design Purpose / Key Features / Usage / Tool Integration / Limitations. 각 절 1~6 번호 유지.
- 프로젝트 정리·현재 상태·기록 책임·승인 후 변경·단독 사용·비자동 실행/승인 경계 보존.
- 설치 ready/current/blocked 의미와 업데이트·복구 안내 연결 유지. 사용자 요청·보고 예시만 자연스러운 영어로 번역, 실행 명령·식별자 보존.
- 설치/연결/문서/작업/수락의 구분, Node18+·Windows·Git·UTF-8 조건, CSS/동적 변경·미입증 성능·민감정보 제외 유지.
- 공통 역할: JOEFLOW `Requirements, rules, exceptions, and acceptance criteria`; JOEDESIGN `UI creation, visual standards, and design review`; JOENESS `Task sequence, progress, and completion evidence`.
- 한국어 상세 사용·설치·변경 이력·로드맵 링크에 `(Korean)` 표시. 영어 실행 계약·검증 기록은 해당 원문 연결.

## 검증 결과

- 한국어 구역에서 H1 제외 원본 본문 정확 일치: 5,724 UTF-8 bytes, SHA-256 `b9a473dd71d7ca3faaf8feb9c4278709859c0e3096ebce1be0c2995c7d699af4`.
- 원래 제목 앵커9개 유지. 영어 H2 여섯 제목·순서 일치. `english`/`korean` 이름 앵커·상하 이동 링크 존재.
- 영어·한국어 PowerShell 코드 블록 각2개, 기준 커밋 실행 명령과 정확 일치.
- README 내 로컬 링크·앵커22개 존재 확인. 외부 저장소 링크 유지.
- `node --test --test-name-pattern='manifest pins' tests/joeness-setup-contract.tests.mjs`: 1/1 PASS. 기존 검사 기대값 수정 없음.
- `git diff --check`: PASS. README와 이 기록 외 신규 변경 없음. 기존 ROADMAP/ISSUES dirty는 commit 제외.
- docs/ISSUES.md SHA 유지: `d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7`.
- 정적 링크·원문 검증과 GitHub 실제 렌더링 구분. 실제 렌더링·이동 검수는 Manager 담당, 이 기록에서 완료 주장 없음.

## 인계 상태

로컬 후보 commit 후 Manager 독립 검토 대기. push/main·태그·Release·개인 설치 변경 없음. 기능·행동 성능 또는 새로운 런타임 검증 주장 없음.

## 번역 의미 보완

- Manager 검토: Summary의 `Separate document owners`가 사람별 소유자 분리로 오해될 가능성.
- 수정: `Dedicated documents for plans, results, issues, and design, with task-specific reading priorities.`로 교체. 문서 역할과 읽기 우선순위라는 원래 의미에 한정.
- 검증: 직전 후보 f099cca 대비 해당 문장만 변경, 한국어 본문 hash 유지·diff 검사 통과. 추가 범위 변경 없음.
