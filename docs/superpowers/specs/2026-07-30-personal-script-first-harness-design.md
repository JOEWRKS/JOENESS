# 개인 중심 스크립트 단일 설치 하네스 설계

**상태:** 대화 방향 승인, 서면 명세 검토 대기
**대상:** Windows의 Codex Desktop/CLI를 주로 사용하는 현재 사용자와 필요할 때 직접 공유받는 소수 사용자

## 1. 목적

기존 JOEWRKS Common Work Core와 검증된 설치 안전장치를 유지하면서,
플러그인·실행 파일·패키지 관리자를 추가하지 않고 저장소의 PowerShell
진입점 하나로 현재 JOEWRKS 작업환경을 설치한다.

이 변경은 하네스를 공개 마켓플레이스 제품으로 만드는 작업이 아니다.
현재 사용자가 여러 디자인·개발 프로젝트에서 재사용하는 것이 우선이며,
공유는 저장소 접근 또는 고정된 ZIP을 직접 전달하는 수준으로 한정한다.

## 2. 선행 명세와 우선순위

이 명세는 다음 기존 결정을 유지한다.

- `2026-07-27-common-work-harness-design.md`의 Common Core, 신뢰 경계,
  최소 변경, 중복 부작용 방지, 현재 증거 우선, 완료 증거 계약
- `2026-07-30-design-frontend-vendor-router-design.md`의 vendor 무결성,
  라우팅, Figma·브라우저 검증, candidate 평가 상태
- 완료된 `2026-07-30-codex-distribution-v1.md`의 PowerShell 5.1,
  읽기 전용 검사, 관리 블록, 상태 해시, 백업, 조건부 rollback,
  충돌 차단과 멱등성 계약

다음 항목에 한해서는 이 명세가 기존 배포 결정보다 우선한다.

- 대상 사용자는 불특정 개인·팀이 아니라 현재 사용자 중심이다.
- Windows Codex만 현재 지원한다.
- 공개 저장소, 공개 플러그인 디렉터리, macOS/Linux, Claude,
  Copilot 배포는 현재 범위가 아니다.
- 현재 JOEWRKS 개인 번들은 한 PowerShell 진입점에서 함께 설치한다.
- 프로젝트별 설정은 설치기가 추측해서 쓰지 않고 전용 스킬의
  `check`와 명시적 `apply`로 분리한다.

완료된 과거 계획과 평가 파일은 당시 사실 기록이므로 다시 쓰지 않는다.
실사용 안내인 `README.md`와 현재 설치 동작만 이 명세에 맞춘다.

## 3. 결정

### 3.1 채택

- 기존 루트 `harness.ps1`을 유일한 사람용 설치 진입점으로 재사용한다.
- PowerShell 5.1과 .NET 표준 라이브러리만 사용한다.
- Common Core, 현재 설치 대상으로 명시된 `joewrks-*` 스킬, 그 스킬에
  필요한 고정 vendor 자료와 고지를 한 로컬 설치 트랜잭션으로 다룬다.
- 설치 대상은 Codex 사용자 지침과 공용 사용자 스킬 디렉터리다.
- 설치 후 상주 프로세스나 별도 런타임을 실행하지 않는다.
- 업데이트는 저장소 또는 ZIP을 새 버전으로 바꾼 뒤 같은 명령을 다시
  실행한다.

### 3.2 제외

- `.exe`, MSI, Go CLI
- npm, `npx`, Node 기반 설치기
- Codex 플러그인 패키징과 마켓플레이스 등록
- 외부 플러그인 자동 설치 또는 설정 변경
- 실행 중 외부 저장소에서 스킬이나 vendor 자료 다운로드
- 자동 업데이트 서비스, daemon, 범용 lock 서비스
- macOS/Linux 설치 스크립트
- Claude Code, GitHub Copilot 어댑터
- 공개 Git 히스토리 재작성과 공개 release 파이프라인
- `-Force`, 자동 충돌 덮어쓰기, drift 무시 repair

독립 스킬 설치는 Codex가 지원하는 정식 사용 방식이다. 플러그인은
설치·업데이트·공개 유통을 호스트가 관리해야 할 때 추가할 수 있는 배포
포장이다. 현재 범위에서는 이미 필요한 전역 지침 설치를 PowerShell이
담당하므로 플러그인을 별도로 추가하지 않는다.

## 4. 설치 단위

“모든 스킬”은 외부 저장소 전체나 설치된 모든 플러그인을 뜻하지 않는다.
현재 저장소에서 설치 대상으로 명시하고 검증한 JOEWRKS 스킬과 그
런타임 자료만 뜻한다.

개인 번들의 구성은 다음과 같다.

1. 루트 `AGENTS.md`의 Common Work Core
2. 기존 `joewrks-design-frontend`
3. 이 명세에서 추가할 `joewrks-project-setup`
4. 설치본 source manifest와 위 스킬이 참조하는 고정 vendor 파일·고지

`vendor/source-manifest.json`의 `activeSkills`가 설치할 스킬의 유일한
루트 목록이다. 각 항목의 `files`와 `sourceDependencies`가 가리키는
manifest 고정 파일만 전이적으로 설치한다. 디렉터리 검색이나 이름
패턴으로 설치 대상을 늘리지 않는다.

Karpathy 계열의 assumption checking·surgical changes와 handoff의 필요한
원칙은 이미 Common Core에 정규화되어 있다. 같은 내용을 별도 스킬로
다시 설치하지 않는다. UI UX Pro Max와 Apple Design은 각각 독립
사용자 스킬로 중복 설치하지 않고 `joewrks-design-frontend`의
비노출 vendor 자료로 유지한다. Superpowers, Ponytail, Figma 같은 외부
플러그인은 번들에 포함하지 않는다.

`joewrks-design-frontend`의 평가 상태는 계속 `candidate`,
`promotionPass = false`다. 개인 번들 설치는 같은 사용자의 명시적
파일럿 선택일 뿐 암묵 호출의 신뢰성, 결과 품질 향상, 사람 검토 대체,
Figma 또는 브라우저 검증 완료의 증거가 아니다. 설치 및 결과에는 이
상태를 그대로 표시한다.

## 5. 사용자 흐름

### 5.1 빠른 개인 설치

README의 빠른 설치 명령 바로 앞에는 기본 `-Apply`가 candidate 디자인
스킬을 포함한 같은 사용자의 전체 개인 파일럿 선택임을 표시한다.
저장소 루트에서 다음 한 명령을 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Apply
```

`-Apply`는 쓰기 전에 `-Check`와 같은 전체 preflight를 다시 실행한다.
차단 항목이 있으면 어떤 대상도 쓰지 않는다. 따라서 별도 `-Check`는
필수 설치 단계가 아니라 원하는 사용자를 위한 읽기 전용 미리보기다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Check
```

기존 `-IncludeDesignFrontend`는 이미 복사된 명령과의 입력 호환만 위해
받되 선택 기능은 없앤다. 플래그 유무와 관계없이 `-Check`와 `-Apply`는
같은 전체 개인 번들을 대상으로 하며 상태·해시도 같아야 한다.

설치 뒤 새 Codex 작업을 시작해야 새 스킬 탐색 상태가 확실히 갱신된다.

### 5.2 업데이트

새 저장소 revision 또는 전달받은 새 ZIP에서 `-Check` 또는 `-Apply`를
다시 실행한다. 현재 상태와 같으면 파일과 백업을 만들지 않고
`current`로 끝난다. 소스가 변경됐다면 전체 preflight와 소유권 검사를
통과한 관리 대상만 업데이트한다.

기존 V1의 Common Core 전용 상태와 디자인 opt-in 상태는 정상
마이그레이션 입력이다. Core 전용 상태에는 전체 개인 번들을 추가하고,
opt-in 상태에는 기존 소유 파일을 검증·업데이트하면서 새 프로젝트
setup 스킬을 추가한다. 설치본 drift나 알 수 없는 state schema는
마이그레이션하지 않고 차단한다. 마이그레이션 중 실패하면 대상과
상태를 실행 전 V1 상태로 복구하며 일부만 새 상태로 남기지 않는다.

### 5.3 제거

같은 진입점에 `-Remove`를 제공한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Remove
```

제거는 설치 상태가 소유한다고 증명하는 관리 블록과 whole-file 대상만
다룬다. 현재 해시가 기록된 설치 해시와 다르거나 소유권이 불명확하면
삭제하지 않고 `blocked`로 종료한다. 실제 제거 전 백업을 만들고,
Common Core 밖의 사용자 지침은 byte 단위로 보존하며, 상태 파일은
다른 제거가 모두 검증된 뒤 마지막에 없앤다.

성공 상태는 `removed`다. 설치 상태와 소유 대상이 모두 없는 재실행도
파일이나 백업을 만들지 않는 `removed` no-op이다. 상태는 있는데
기록된 대상 일부가 없으면 불완전 설치로 보고 쓰기 전에 차단한다.
Common Core 관리 블록 제거 뒤 외부 byte가 0이어도 `AGENTS.md` 파일은
삭제하지 않는다. 제거 중 실패하면 이번 실행이 바꿨다고 증명되는
대상만 역순 복구하고 상태 파일을 보존한다.

별도 self-updater, repair, force 모드는 만들지 않는다.

## 6. 설치 대상과 소유권

기본 대상은 다음과 같다.

| 대상 | 기본 위치 | 소유 범위 |
|---|---|---|
| 공통 규칙 | `%USERPROFILE%\.codex\AGENTS.md` | JOEWRKS marker 사이의 관리 블록 |
| 사용자 스킬 | `%USERPROFILE%\.agents\skills\joewrks-*` | 상태 파일에 기록된 whole files |
| 설치 상태 | `%USERPROFILE%\.codex\joewrks-harness-state.json` | 파일 전체 |
| 백업 | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups` | 실행별 새 백업 디렉터리 |

`CODEX_HOME`이 설정된 경우 Codex 대상 해석에 사용하되, 신규 사용자
스킬은 현재 공용 경로인 사용자 홈의 `.agents\skills`에 설치한다.
legacy Codex skill root는 충돌 검사만 하며 신규 설치 대상으로 사용하지
않는다.

새 설치·runtime 파일과 설치 상태에는 개인 절대경로를 기록하지 않는다.
완료된 과거 계획과 평가 증거에 기록된 당시 로컬 경로는 사실 기록으로
유지하되 설치 입력으로 사용하지 않는다. 현재 checkout은 canonical
source이고 설치본은 배포 복사본이다.

## 7. 설치 안전 계약

기존 동기화 계약을 그대로 재사용한다.

- `-Check`는 대상·상태·백업 디렉터리가 없어도 생성하지 않는다.
- 소스 manifest의 상대경로, 크기, SHA-256을 쓰기 전에 검증한다.
- 관리 marker 누락·중복, unsupported encoding, 32 KiB 초과,
  `AGENTS.override.md` shadow, 같은 이름의 사용자·legacy·프로젝트·
  플러그인 스킬, unmanaged target, 설치본 drift를 차단한다.
- UTF-8 BOM, newline, 관리 블록 밖의 byte를 보존한다.
- 적용 직전 대상을 preflight snapshot과 다시 비교한다.
- 같은 revision의 두 번째 적용은 target hash와 backup을 바꾸지 않는다.
- 실패 시 이번 실행이 적용했다고 증명되는 대상만 역순 복구한다.
- 응답 유실이나 불명확한 현재 상태를 미적용으로 가정하고 재시도하지
  않는다.
- 상태와 출력은 `current`, `ready`, `removed`, `blocked`, `failed`를
  구분한다.
- 실행하지 않은 설치, 검사, Python 검색, Figma·브라우저 검증을
  완료했다고 보고하지 않는다.

설치 대상 목록은 명시적으로 관리하고 테스트한다. 단순히 `skills/`
아래의 모든 폴더를 자동 검색해 설치하지 않는다.

## 8. 프로젝트 설정 스킬

`joewrks-project-setup`은 설치 후 사용자가 프로젝트마다 필요할 때
명시적으로 호출하는 사용자 스킬이다. 설치기와 별개로 다음 계약만
담당한다.

### `check`

- 현재 프로젝트의 Git root와 관련 `AGENTS.md`를 확인한다.
- package manifest, framework, 기존 명령, 디자인 시스템, 테스트와
  현재 프로젝트 규칙에서 필요한 최소 증거만 읽는다.
- 목적·스택·권위·표준 명령·검증 방법을 근거와 함께 제안한다.
- 정규화한 Git root, 대상 파일의 존재 여부와 SHA-256을 결과에 묶는다.
- 프로젝트 파일을 만들거나 수정하지 않는다.
- 제품 방향이 달라지는 모호성이 있을 때만 한 가지 질문을 한다.

### `apply`

- 사용자가 해당 프로젝트와 적용을 명시적으로 요청한 경우에만 실행한다.
- 쓰기 직전에 Git root, 대상 존재 여부와 hash를 다시 계산해 `check`
  결과와 다르면 차단한다.
- 프로젝트 루트 `AGENTS.md`의 JOEWRKS project marker 블록만 만들거나
  갱신한다.
- 기존 지침과 사용자 작업을 보존하고 불완전·중복 marker를 덮어쓰지
  않는다.
- Common Core 설치기와 같은 UTF-8·BOM·newline·32 KiB·
  `AGENTS.override.md` shadow 계약을 적용한다.
- Common Core 전체를 프로젝트에 복제하지 않는다.
- 프로젝트에서 확인한 사실만 기록하고 개인 절대경로를 넣지 않는다.
- 의존성 설치, 코드 구현, 디자인 변경, 외부 쓰기까지 확대하지 않는다.
- 한 파일만 원자적으로 바꾸고 적용 뒤 marker와 diff를 다시 읽어
  관찰된 결과만 보고한다. 검증 실패 시 현재 hash가 이번 실행의
  출력과 같을 때만 실행 전 byte로 복구하며, 아니면 상태를 unknown으로
  보고하고 덮어쓰지 않는다.

프로젝트 setup 스킬은 설치된 Common Core의 권한을 늘리지 않으며,
과거 프로젝트나 다른 대화의 승인을 새 프로젝트로 이전하지 않는다.

## 9. 디자인 런타임과 외부 capability

PowerShell 설치에는 Node, npm, Python, Figma 또는 브라우저 플러그인이
필요하지 않다.

UI UX Pro Max 검색은 Python 3 표준 라이브러리를 사용할 수 있을 때만
실행한다. Python이 없으면 설치를 실패시키거나 자동 설치하지 않는다.
대신 Apple Design과 정적 quick reference로 가능한 범위만 수행하고
UI UX 검색을 실행하지 못했다고 명시한다.

Figma와 브라우저는 설치 대상이 아니다. 실제 작업에서 디자인 권위나
완료 기준상 필요하고 capability가 있을 때만 사용한다. 필요한
capability가 없으면 독립적으로 가능한 작업만 진행하고 해당 검증을
미완료로 보고한다.

## 10. 공유 경계

현재 저장소는 개인용 canonical source로 유지한다. 공유는 다음 중
하나로 제한한다.

- 특정 Git revision을 직접 공유
- 해당 exact revision의 source archive ZIP을 직접 전달

공개 마켓플레이스 제출, 공개 패키지 관리자 등록, 설치 통계, 코드
서명, 다중 OS release matrix는 만들지 않는다. 기존 Git 히스토리의
개인 경로를 공개 배포 목적으로 재작성하지 않는다.

공유 전에는 archive 전체에서 credential과 의도하지 않은 비밀 파일의
부재를 검사하고, 설치 대상 파일의 source hash와 고지를 별도로
확인한다. 과거 계획·평가의 로컬 경로는 runtime 입력이 아님을 README에
밝힌다. 친구가 설치하더라도 외부 플러그인, Python 또는 프로젝트
쓰기를 자동 승인하지 않는다.

## 11. 오류 처리

- invocation 오류는 `blocked`와 nonzero exit로 끝낸다.
- preflight blocker가 하나라도 있으면 백업과 대상 디렉터리를 만들지
  않는다.
- 적용 또는 제거 실패는 backup path, rollback 결과와 unresolved
  target을 구조화해 보고한다.
- 대상이 다른 작성자에 의해 다시 바뀌면 복구로 덮어쓰지 않는다.
- 같은 원인으로 두 번 실패하면 세 번째 실행 전에 원인을 진단한다.
- 스킬 collision은 자동 삭제·이동하지 않고 정확한 경로와 이름을
  보고한다.

## 12. 검증

기존 검사를 재사용하고 새 동작에 필요한 최소 fixture만 추가한다.

### 설치기

- 빈 임시 사용자 경로에서 기본 `-Check`가 전체 개인 번들을 제안하고
  아무 파일도 만들지 않는다.
- 기본 `-Apply` 하나가 Common Core, 명시된 모든 JOEWRKS 스킬과 필요한
  vendor 자료를 같은 트랜잭션으로 설치한다.
- V1 Core 전용 상태와 V1 디자인 opt-in 상태가 각각 전체 번들로
  마이그레이션되고, 실패 fixture는 파일과 상태를 V1 snapshot으로
  복구한다.
- `Apply -> Check -> Apply`가 `current -> current`이며 두 번째 적용은
  target과 backup을 바꾸지 않는다.
- candidate 상태와 미검증 항목이 설치 결과에 유지된다.
- Python과 외부 플러그인이 없어도 설치는 성공하고 capability 제한을
  정확히 표시한다.
- 충돌, drift, encoding, source hash, 동시 변경과 rollback fixture가
  계속 통과한다.
- `-Remove`가 소유 대상만 제거하고 외부 byte를 보존하며, drifted
  target은 삭제하지 않는다.
- 미설치 remove는 백업 없는 `removed` no-op이고, 일부 대상 누락은
  쓰기 전에 차단되며, 중간 실패는 상태 파일을 남기고 변경분을
  복구한다.

### 프로젝트 setup 스킬

- 기존 `AGENTS.md`가 없는 프로젝트와 있는 프로젝트를 각각 검사한다.
- `check` 전후 파일 tree가 동일하다.
- `apply`가 marker 밖의 내용과 newline을 보존한다.
- 중복·불완전 marker와 모호한 프로젝트 목적에서 안전하게 멈춘다.
- check 뒤 root·파일 hash 변경, unsupported encoding, 32 KiB 초과,
  `AGENTS.override.md` shadow와 동시 편집을 쓰기 전에 차단한다.
- 적용 후 검증 실패와 concurrent edit에서 증명되지 않은 복구
  덮어쓰기가 발생하지 않는다.
- Common Core 복제, 코드 변경, 의존성 설치와 외부 쓰기가 발생하지
  않는다.
- 현재 파일에서 확인할 수 없는 명령이나 검증을 만들어내지 않는다.

### 회귀와 문서

- PowerShell sync contract
- Node 기반 기존 라우팅·vendor 무결성 검사
- P0 evaluation contract
- UI UX Pro Max 데이터 검증과 Python 단위 검사
- skill validator
- `git diff --check`
- README 한글·영문 내용과 실제 동작 대조

Node와 Python 검사는 저장소 개발·검증용이며 PowerShell 설치기의
필수 런타임이 아니다.

## 13. 합격 기준

- Windows 사용자가 저장소 또는 ZIP에서 PowerShell 한 명령으로 개인
  번들을 설치할 수 있다.
- 설치를 위해 EXE, Node/npm 또는 플러그인 설치가 필요하지 않다.
- `-Check`는 완전한 읽기 전용이고 `-Apply`와 `-Remove`는 소유권과
  복구 계약을 지킨다.
- 현재 명시된 모든 JOEWRKS 스킬과 필요한 runtime 자료만 설치된다.
- 같은 원칙을 반복하는 외부 스킬이나 플러그인이 중복 설치되지 않는다.
- 프로젝트 파일은 setup 스킬의 명시적 `apply` 없이는 바뀌지 않는다.
- candidate와 capability 제한을 품질 또는 검증 완료로 부풀리지 않는다.
- 설치본·상태·새 runtime 파일에 개인 절대경로가 추가되지 않고 공유
  archive 전체에 credential이나 의도하지 않은 비밀 파일이 없다.
- README의 한글·영문 설치 및 지원 범위가 실제 동작과 일치한다.

## 14. 나중에 다시 검토할 조건

다음 중 실제 필요가 생길 때만 별도 설계를 시작한다.

- 공개 또는 조직 단위 배포가 필요함: Codex skills-only plugin 검토
- 실제 macOS/Linux 사용자가 생김: 해당 OS 설치 어댑터와 CI 검토
- Claude 또는 Copilot 사용자가 생김: 호스트별 경로와 capability 검증
- Python 없는 환경에서 UI UX 검색이 반드시 필요함: 런타임 대안 측정
- 수동 업데이트가 반복 문제를 일으킴: 최소 업데이트 채널 검토

현재 단계에서는 위 항목을 위한 scaffold를 만들지 않는다.
