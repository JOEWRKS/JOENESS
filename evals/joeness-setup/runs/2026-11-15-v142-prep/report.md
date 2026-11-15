# JOENESS 1.4.2 준비 보고 (2026-11-15)

범위: 연결문(관리 블록 본문, `skills/joeness-setup/assets/AGENTS.md`)에 Rule Coverage Result 열 규칙 한 줄을 넣는 패치. 게시·태그·Release·개인 설치·push는 하지 않았다.

## 계기

45차 행동 A/B(`../2026-11-15-v141-behavior-ab2/report.md`) S2 장면(JOEDESIGN DESIGN 템플릿 선설치)에서 B(1.4.1) 4회 중 기존 Rule Coverage 표에 Result 열을 더한 run은 0/4. 규칙이 `SKILL.md`·`assets/DESIGN.md`에만 있고 매 턴 읽히는 연결문에는 없었다(SKILL.md를 읽은 run 2/4). 사용자가 연결문에 넣기로 결정.

## 변경

- `assets/AGENTS.md` Done 절, `<joedesign>` 안내(`Keep <joedesign> literal ... Never commit an absolute path.`) 바로 뒤 두 줄:

  ```
  Where JOEDESIGN's DESIGN template is already used, its Rule Coverage table is the DESIGN rule
  table: add a Result column (latest TASK link, no copied log) if absent; never add a second table.
  ```

  본문 5,148바이트·823단어 → 5,344바이트·856단어(32 KiB 창 안).
- 표현 대조: `SKILL.md` "its Rule Coverage table with a Result column added; do not duplicate rules across two tables", `assets/DESIGN.md` "Result links the latest TASK entry; no copied log ... keep one DESIGN.md and its Rule Coverage table as this table (add Result if absent); never keep two rule tables". 뜻이 같아 두 파일은 고치지 않았다.
- `vendor/source-manifest.json`: `assets/AGENTS.md`의 `sha256`만 `4282fec7…` → `5abed921…`. `release.version`은 1.4.1 그대로.
- `tests/joeness-setup-contract.tests.mjs`: Rule coverage 테스트에 연결문 새 줄 존재 단언 1개. 관리 블록 본문 전체를 바이트로 고정하는 테스트는 없다(manifest 파일 해시가 그 역할).
- `docs/CHANGELOG.md`: 1.4.2(준비, 미게시) 항목.

## 결정

- 위치: Done 절의 JOEDESIGN 안내 바로 뒤(과제 지시). Recording 절의 "DESIGN rule table" 문장보다 앞이라, 그 문장이 가리키는 표가 무엇인지 먼저 정해진다.
- "규칙 표는 프로젝트에 하나만"은 `never add a second table`로 줄였다. 앞 절이 "its Rule Coverage table is the DESIGN rule table"이라 범위가 분명하고, 기존 본문 한 줄 길이(약 95자)에 맞췄다.
- manifest 파일 해시 갱신은 버전 핀이 아니라 파일 무결성 값이므로 지금 갱신했다(1.3.0 때와 같은 방식).

## 돌린 테스트

| 테스트 | 결과 |
| --- | --- |
| `node --test` CI 목록 7파일 | 106/106 pass (1.4.1 기준 106에서 새 테스트는 없고 기존 테스트에 단언 1개 추가) |
| `tests/joeness-release.tests.ps1` (Windows PowerShell 5.1) | PASS setup-only release contract |
| `tests/joeness-project-setup.tests.ps1` (5.1) | PASS 28 project safety cases |
| `tests/joeness-install.tests.ps1` (5.1) | PASS lifecycle/user bytes/legacy/drift/rollback/manifest |
| 같은 두 스크립트 `pwsh` (PowerShell 7) | 이 기계에 pwsh 없음, 실행 안 함(CI가 실행) |

## 임시 프로젝트 -Apply/-Check (`<temp>`, 저장소 밖)

각 폴더는 `git init`한 빈 저장소. 본문은 자산 파일을 그대로 base64로 보냄.

| 장면 | 단계 | 결과 |
| --- | --- | --- |
| A 빈 프로젝트 | `-Check` | exit 0, `ready`, blockState `absent` |
| | `-Apply` 1.4.2 본문 | exit 0, `current`, `clean` |
| | `-Check` | exit 0, `current`, warnings 없음 |
| | 내용 | 새 줄 있음, 기계 경로 없음, `node <joedesign>/scripts/report-check.mjs` 글자 유지 |
| B 사용자 AGENTS.md + 1.4.1 블록 | `-Apply` 1.4.1 본문 → `-Check` | `current`, `clean`, 새 줄 없음 |
| | `-Apply` 1.4.2 본문 | exit 0, `current` |
| | `-Check` | exit 0, `current`, warnings 없음 |
| | 내용 | 새 줄 있음, 사용자 텍스트 유지, BEGIN 마커 1개, 기계 경로 없음 |

발견: `-Check`는 블록을 그 프로젝트의 마지막 적용 기준선(`.joeness/setup-state.json`)과만 비교한다. 1.4.1 블록이 든 프로젝트도 `current`로 나오고 stale/outdated 같은 상태는 없다. 갱신은 에이전트가 새 본문으로 `-Apply`해야 일어나며, 그 경우 정상 교체된다. 기존 연결은 자동 갱신하지 않는다는 정책(AGENTS.md)과 맞지만, "자산보다 낡은 블록"을 `-Check`가 알려 주지는 않는다.

## 확인된 것

- 연결문에 새 두 줄이 있고, SKILL.md·assets/DESIGN.md와 뜻이 어긋나지 않는다.
- `-Apply`가 새 본문을 그대로 쓰고(기계 경로 거부에 걸리지 않음) 뒤 `-Check`가 `current`.
- 1.4.1 블록이 든 프로젝트에 1.4.2 본문 `-Apply`가 블록만 교체하고 사용자 텍스트를 지킨다.
- node 106/106, PowerShell 5.1 세 스크립트 통과.

## 확인되지 않은 것

- 행동 효과: 유료 모델 A/B를 돌리지 않았다. 연결문의 새 줄이 JOEDESIGN 템플릿 선설치 장면에서 Result 열 추가(45차 B 0/4)를 바꾸는지는 모른다.
- PowerShell 7(`pwsh`) 실행과 Windows CI 결과(이 커밋은 push 안 함).
- 실제 프로젝트 적용(하지 않음).
- `-Check`가 자산보다 낡은 블록을 알리지 않는 점은 그대로 두었다(이번 범위 밖).

## 게시 때 올릴 버전 핀 (1.4.1 → 1.4.2)

`git grep 1.4.1`(evals·CHANGELOG·AGENTS.md 기록 제외)로 다시 찾은 위치:

- `README.md:1` (`# JOENESS 1.4.1`)
- `README.md:19` (Source version, 영문 설명)
- `README.md:134` (소스 버전, 한글 설명)
- `docs/installation.md:3` (현재 소스)
- `docs/installation.md:11` (현재 소스 버전 표)
- `scripts/sync-harness.ps1:11` (`$script:JoenessRelease`)
- `tests/joeness-release.tests.ps1:107` (release identity)
- `tests/joeness-setup-contract.tests.mjs:63` (`m.release.version`)
- `vendor/source-manifest.json:5` (`release.version`)
- 그 밖에 저장소 `AGENTS.md` 1행(Current release 기록)과 `docs/CHANGELOG.md` 1.4.2 제목의 "준비, 미게시"는 게시 상태에 맞게 고친다.
