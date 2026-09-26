# JOENESS 0.2

**얇은 Independent Judgment Core + `joeness-setup` 하나.**

Core는 사용자 반론을 무조건 정답으로 받아들이지 않고 근거와 권한을
다시 평가하게 한다. 설정 스킬은 프로젝트의 기존 원본·작업 기록·이슈
위치를 짧게 연결한다. 단계 라우터, vendor, 상시 작업 엔진은 포함하지 않는다.

## 빠른 시작

Windows PowerShell, Git, Codex를 사용하는 환경에서 저장소 경로를 연다.
먼저 읽기 전용 확인:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

설치를 원할 때만:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

기본 대상은 `CODEX_HOME` 또는 사용자 `.codex`다.
다른 대상을 시험하려면 **매 명령에** `-CodexHome <명시 경로>`를 붙인다.
설치기는 사용자 AGENTS의 소유 구역, 단일 스킬 폴더,
`joewrks-harness-state.json`과 `joeness-skills-state.json`만 관리한다.
프로젝트를 탐색하거나 프로젝트 문서를 자동 변경하지 않는다.

`ready`는 변경 가능, `current`는 정확한 현재 설치,
`blocked`는 변경 없이 충돌, `failed/partial`은 실패/미복구 대상이 있음을 뜻한다.
반복 Apply는 쓰기 없는 no-op이다. source hash와 소유 기준을 검증한다.
설치된 관리 파일을 편집했거나 이름만 같은 스킬이 있으면 덮어쓰지 않는다.
설치 상태가 현재 패키지와 일치하지 않으면 파일을 보존하고 충돌을 보고한다.
상태 파일을 지우거나 강제 덮어쓰기로 우회하지 말고 소유 범위를 먼저 확인한다.

설치 후 새 세션에서 프로젝트를 열고 말하면 된다.

> 이 프로젝트 작업 방식을 정리해줘. 기존 문서를 우선 쓰고 변경안부터 보여줘.

명시 호출 대안:

> `$joeness-setup`으로 이 프로젝트의 설정안을 만들어줘.

파일 목록과 기록 범위를 확인하고 적용을 승인하면 짧은 프로젝트 AGENTS
연결이 생긴다. 다섯 문서를 일괄 만들지 않으며 기존 경로가 우선이다.
현재 자동 적용 helper는 **Git root + UTF-8(선택적 BOM)**를 지원한다.
non-Git 폴더를 임의로 git init하지 않고 제안/수동 전달까지 제공한다.

## 평소에는 그냥 작업을 요청한다

> 로그인 오류 고쳐줘.
>
> 어디까지 끝났는지 알려줘.
>
> 이전에 해결한 재접속 문제를 찾아봐.

매번 setup을 호출할 필요는 없다. 새 세션은 프로젝트의 짧은 연결과 현재
파일을 따른다. TASK 역할에는 수행/검증, ISSUES 역할에는 원인·해결·남은
우회책을 기록한다. 실제 파일명은 프로젝트에서 선택한 것을 쓴다.
방향은 명시적 결정 때만 바꾸고 Product/승인 Design은 별도 권한을 유지한다.

질문·의견·설명 요청을 새 결정이나 기록 동의로 취급하지 않는다.

> 이건 의견만 줘. 파일은 수정하지 마.
>
> 코드는 고치되 이번 작업은 프로젝트 문서에 기록하지 마.
>
> 방금 기록의 원인은 추측이야. 확인된 사실로 교정해줘.

기록 금지는 별도로 허용된 코드 수정을 취소하지 않는다. 필요한 원본이
없거나 기록 쓰기가 실패하면 그 경계를 알리고 독립적으로 가능한 작업은
진행한다. 실패한 기록을 저장했다고 보고하지 않는다.

## 재개와 과거 조회

현재 코드/Git/실제 대상이 오래된 handoff보다 우선이다. 완료한 일을
다시 수행하거나 오래된 계획에서 새 작업 범위를 만들지 않는다.

버전 정리를 요청하면 해결 항목의 최신 상세가 실제로 읽히는
`commit:path`와 항목을 남길 수 있다. 커밋 후 추가한 미보존 상세,
활성 이슈와 유효한 우회책은 유지한다. ZIP/얕은 이력/잘못된 참조는
보존 증거가 아니다. 상세를 임의 삭제하거나 별도 아카이브 엔진을 만들지 않는다.

## 기록 중지 / 프로젝트 해제 / 도구 제거

- **“자동 기록만 중지해줘”**: 원본 위치 안내는 남기고 기록 규칙을 갱신한다.
- **“이 프로젝트에서 JOENESS 연결을 해제해줘”**: 변경되지 않은 관리 구역과
  일치하는 소유 구분자만 제거한다. TASK/ISSUES 등 일반 문서와 빈 AGENTS도 남긴다.
- **패키지 제거**:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

패키지 제거는 프로젝트 연결을 일괄 해제하지 않는다. 필요한 프로젝트는
먼저 별도로 해제한다. 설치/해제 후 이미 열려 있던 세션은 지침을 다시
읽지 않을 수 있으므로 새 세션에서 확인한다.

관리 구역 내부에 사용자가 편집한 문장이 있으면 새 Check를 실행해도
덮어쓰기 권한이 생기지 않는다. 상태 파일을 지워 우회하지 말고, 보존할
문장과 수정 범위를 확인한 뒤 별도 교정안을 검토한다. 부분 실패 뒤에도
현재 두 파일을 먼저 확인하며 무조건 재시도하지 않는다.

설정된 프로젝트를 clone할 때는 AGENTS와 `.joeness/setup-state.json`을 함께
보존한다. Git checkout의 LF/CRLF 변환은 커밋된 두 파일이 같은 적용 본문을
뒷받침할 때만 재결합한다. 실제 문장 변경이나 확인할 수 없는 적용 기준은
여전히 충돌이다. 구역 밖 사용자 내용은 현재 bytes 그대로 보존한다.

## 구현과 검증

- 배포 identity/hash: `vendor/source-manifest.json`
- Core: `astra-judgment-core.md` (기존 bytes 유지)
- 단일 skill: `skills/joeness-setup/`
- C1–C4 설계/계획: `docs/superpowers/{specs,plans}/2026-09-26-joeness-0.2-project-setup*.md`
- bounded evidence: `evals/joeness-setup/runs/2026-09-26-implementation/`

```powershell
powershell.exe -NoProfile -File tests/astra-judgment-sync.tests.ps1
powershell.exe -NoProfile -File tests/joeness-project-setup.tests.ps1
powershell.exe -NoProfile -File tests/joeness-install.tests.ps1
node --test tests/joeness-setup-contract.tests.mjs tests/joeness-setup-fixtures.tests.mjs
```

정적/파일 안전 테스트와 fresh 모델 행동 검증은 별개다. 실제 검증 결과와
미검증 범위는 evidence에 기록한다. implicit discovery, 데스크톱 지침 재로딩,
처음 쓰는 사람의 이해와 사용자 수용을 자동 테스트만으로 보증하지 않는다.
기존 Independent Judgment의 Bare Astra 대비 우월성 A/B는 여전히
`NOT-RUN`이며, 이 구현으로 그 결과를 만들었다고 주장하지 않는다.
