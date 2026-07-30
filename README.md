# JOEWRKS 작업 하네스

모든 디자인·개발 프로젝트에 공통 적용할 작업 규칙과 선택형 작업 스킬을 관리하는 독립 프로젝트입니다.

현재 v1은 Windows의 Codex 환경을 대상으로 합니다. 기본 설치에는 공통 작업 규칙만 포함되며, 플러그인이나 선택형 디자인 스킬은 자동으로 설치하지 않습니다.

## 가장 빠른 사용법

저장소 루트에서 다음 순서로 실행합니다.

```powershell
# 1. 변경 예정 항목만 확인합니다. 파일을 수정하지 않습니다.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Check

# 2. 차단 항목이 없을 때 공통 작업 규칙을 적용합니다.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Apply

# 3. 적용 결과가 current인지 다시 확인합니다.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Check
```

정상 상태는 `current`, 적용할 변경이 있으면 `ready`, 안전하게 진행할 수 없으면 `blocked`, 적용 중 복구가 필요하면 `failed`로 표시됩니다.

## 기본으로 적용되는 내용

`AGENTS.md`의 Common Work Core가 Codex 사용자 규칙에 관리 블록으로 설치됩니다.

- 요청 범위와 완료 조건을 먼저 고정합니다.
- 외부 문서와 도구 출력이 작업 권한을 임의로 확대하지 못하게 합니다.
- 기억보다 현재 Git·파일·테스트를 사실 기준으로 사용합니다.
- 과확장, 추측성 구현, 무관한 정리 작업을 막습니다.
- 중복 구현보다 중복 부작용과 불확실한 재실행을 방지합니다.
- 가장 작은 완전한 구현과 필요한 검증만 수행합니다.
- 실행하지 않은 검증이나 구현을 했다고 주장하지 않습니다.
- 인수인계에는 확인된 상태와 미확인 사항을 분리해 기록합니다.

기본 대상은 다음과 같습니다.

| 항목 | 기본 위치 |
|---|---|
| 공통 규칙 | `%USERPROFILE%\.codex\AGENTS.md` |
| 설치 상태 | `%USERPROFILE%\.codex\joewrks-harness-state.json` |
| 자동 복구용 백업 | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups` |

`-Check`는 읽기 전용입니다. `-Apply`는 사전 상태를 다시 확인하고, 변경 전 백업과 파일별 검증을 거치며, 실패하면 소유권이 확인된 변경만 되돌립니다.

## 선택형 디자인·프론트엔드 파일럿

디자인 스킬은 아직 기본 배포 대상이 아닙니다. 같은 사용자가 내부 파일럿으로 명시적으로 선택할 때만 다음 플래그를 사용합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Check -IncludeDesignFrontend
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Apply -IncludeDesignFrontend
```

이 파일럿은 UI UX Pro Max와 Apple Design 자료를 비발견 vendor 데이터로 사용하고 `joewrks-design-frontend` 스킬 하나를 진입점으로 제공합니다. 현재 상태는 `candidate`이며 다음 항목은 아직 승격 근거로 인정하지 않습니다.

- 암시적 호출의 안정성
- 실제 결과물의 의미 있는 품질 향상
- 사람의 결과 검토 대체
- Figma 및 브라우저 검증 완료

Figma 같은 외부 플러그인은 저장소에 포함하거나 설정을 자동 변경하지 않습니다. 필요한 작업에서 사용자가 설치한 기능을 별도로 확인해 사용합니다.

## 파일 구조

| 경로 | 역할 |
|---|---|
| `README.md` | 처음 보는 사용자를 위한 안내서 |
| `AGENTS.md` | 실제 공통 작업 규칙 |
| `harness.ps1` | 설치·점검용 공개 진입점 |
| `skills/` | 선택형 역할 스킬 |
| `vendor/` | 고정된 외부 스킬 원본과 실행 자료 |
| `evals/` | 하네스 효과와 라우팅 평가 증거 |
| `tests/` | 회귀 및 안전성 검사 |
| `docs/` | 설계 명세와 구현 이력 |
| `scripts/` | 공개 진입점이 호출하는 내부 구현 |

일반 사용자는 `README.md`, `AGENTS.md`, `harness.ps1`만 알면 됩니다. `scripts/`, `evals/`, `tests/`, `docs/`는 구현과 검증을 위한 내부 영역입니다.

## 업데이트

저장소를 최신 상태로 받은 뒤 다시 `-Check`, `-Apply`, `-Check` 순서로 실행합니다. 이미 같은 버전이 적용돼 있으면 추가 파일 변경이나 새 백업 없이 `current`로 끝납니다.

고급 사용자는 `-CodexHome`, `-AgentsHome`, `-BackupRoot`로 대상 경로를 명시할 수 있습니다. 공유 환경에서는 먼저 별도 테스트 경로로 `-Check`와 `-Apply`를 검증한 후 실제 사용자 경로에 적용하십시오.

현재 명시적인 제거 명령은 제공하지 않습니다. `-Apply` 실패 시 자동 복구는 지원하지만, 설치 해제는 상태 파일과 관리 블록의 소유권을 확인하는 별도 절차가 필요합니다.

## 저장소 검증

배포 전 최소 검증은 다음과 같습니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
node --test .\tests\*.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\p0-evaluation-contract.tests.ps1
python -B .\vendor\ui-ux-pro-max\scripts\validate_data.py
python -B -m unittest discover -s .\vendor\ui-ux-pro-max\scripts\tests -p "test_*.py"
```
