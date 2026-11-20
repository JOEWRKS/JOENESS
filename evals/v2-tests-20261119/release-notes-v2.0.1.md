# JOENESS 2.0.1 — 검수 게이트 fail-open 수정·설치기 정리·문서 (2026-11-20)

2.0.0 게시 뒤 돌린 두 시험(QUICKSTART 특성화 시험, 세 도구 통합 시험)이 찾은 결함을 고친 판이다. `SKILL.md`·연결문 `assets/AGENTS.md`·`project-setup.ps1`은 바이트 단위로 같다. 스킬 폴더에서 바뀐 파일은 검수 `.mjs` 4개와 `references/review-gate.md`다.

- **검수 게이트 fail-open 수정(중대).** `review-gate`·`roadmap-review`·`operation-review`·`impact-review`의 진입 판정이 실제 모듈 경로와 호출 경로를 그대로 비교해서, junction·심볼릭 링크 설치 경로(Claude Code 스킬 폴더)로 부르면 main이 돌지 않고 **출력 없이 exit 0**이었다. 양쪽을 실제 경로로 풀어 비교하고, 이름은 같은데 비교가 어긋나면 stderr 경고와 exit 2를 낸다. 조용한 exit 0은 더 없다.
- `review-gate.mjs`: 고정값 불일치가 CRLF→LF 변환으로 설명되면 오류 문구에 그 원인을 덧붙인다(판정은 그대로 차단). `references/review-gate.md`에 고정 파일을 `.gitattributes`로 `-text`/`eol=lf` 묶으라는 안내, `node <joeness-setup>/scripts/review-gate.mjs` 자리표시자 표기, DESIGN `Result` 칸 갱신 절차(과업 완료 뒤 JOEDESIGN 기준선이 stale이 되는 것은 정상, 다음 과업 검수가 새로 세움 — 사용자 결정).
- 설치기 `scripts/sync-harness.ps1`(스킬 밖): `-Remove` 뒤 비게 된 폴더 트리를 지운다. 결과 JSON에 `packageRelease`·`installedRelease`. 소유 불일치 `blocked` 메시지에 두 버전을 덧붙인다.
- 문서: QUICKSTART(옵션 안내 위치, 설치 위치 변수, 업그레이드 절 실행 폴더·태그 체크아웃 대안·설치본 버전 확인, 실제 `blocked` 메시지와 exit 2, `-Apply` 인자, `-Detach` 뒤 남는 것, stderr usage), installation.md, README.

**확인된 것.** 새 `tests/joeness-entry-link.tests.mjs`가 2.0.0 코드에서 5/5 실패(링크 경로 stdout 빈 문자열·exit 0), 수정 뒤 5/5 통과. 부모 세션이 junction 경로로 엉터리 인자를 주어 재현: 2.0.0 exit 0·출력 없음 → 2.0.1 JSON·exit 2. 통합 시험 프로젝트 사본에서 JOEDESIGN 2.0.1 영수증(상대 경로 evidence)을 2.0.1 게이트가 `allowed:true`로 소비. Node 113/113, Windows PowerShell 5.1 release·install·project-setup 종료 0. 스테이징한 줄에 사용자 이름·메일·`C:` 사용자 폴더 0건.

**확인되지 않은 것.** PowerShell 7은 GitHub Windows CI로만 돈다. macOS·Linux 심볼릭 링크 경로(테스트는 Windows junction). 행동 시험 없음(매 턴 읽히는 글은 변경 없음).

**업그레이드.** 2.0.0 개인 설치본에서 2.0.1 `-Check`는 `blocked`(이제 `installedRelease` 2.0.0을 보여 준다). 2.0.0 패키지로 `-Remove`한 뒤 2.0.1로 `-Apply`. 연결된 프로젝트는 연결문이 같아 갱신할 것이 없다. **Claude Code 사용자는 이 판부터 게이트가 실제로 검사한다**: 2.0.0 이하에서 junction 경로로 돌린 게이트 결과는 신뢰할 수 없다.

**세션이 대신 내린 결정.** `-Apply`에서 `.gitattributes` 부재 경고는 넣지 않았다(연결 시점엔 고정 파일이 없음). 기록: [report-201.md](report-201.md), 입력 시험 [docs-joeness-report.md](docs-joeness-report.md)·[integration-report.md](integration-report.md).
