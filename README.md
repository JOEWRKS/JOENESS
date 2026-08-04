# JOENESS 0.1 Beta

[한국어](#한국어) · [English](#english)

## 한국어

JOENESS는 Windows용 Codex에 프로젝트 맥락 관리와 선별된 작업 스킬을 더하는 개인용 Beta 작업환경입니다. Codex 자체의 성능을 무조건 높이는 도구가 아니라, 긴 프로젝트에서 범위 이탈·허위 완료·불필요한 재작업을 줄이고 필요한 스킬을 필요한 순간에만 쓰도록 돕습니다.

> **현재 상태:** `personal-pilot Beta candidate`. 개인 실사용을 시작할 수 있는 단계지만 stable 또는 범용 배포판으로 인증되지는 않았습니다. 전역 Common Core 규칙은 검증 결과 비활성화되어 있습니다.

### 무엇을 해주나요?

- 프로젝트별 목표·제약·검증 기준을 `AGENTS.md`에 최소한으로 남깁니다.
- UI/UX 작업에는 디자인 스킬과 UI UX Pro Max·Apple Design 참고자료를 조건부로 사용합니다.
- 다음 작업이나 다른 사람에게 넘길 때 현재 파일과 Git 상태에 연결된 짧은 인수인계를 만들 수 있습니다.
- 설치 파일의 hash, 기존 파일 충돌, 외부 수정(drift)을 확인하고 모르는 파일을 강제로 덮어쓰지 않습니다.

다음 기능은 포함하지 않습니다.

- Codex, Figma, 브라우저 또는 외부 플러그인의 설치·로그인·설정
- 프로젝트 코드나 디자인의 자동 생성
- 자동 업데이트, Windows 앱 등록, 백업 자동 복원
- 모든 작업에 강제로 적용되는 긴 전역 프롬프트

### 준비물

- Windows와 Codex
- Windows PowerShell 5.1 이상(`powershell.exe`)
- 이 저장소의 신뢰할 수 있는 commit 또는 SHA-256을 확인한 ZIP

설치 자체에는 Node.js, Python, npm, Git 또는 관리자 권한이 필요하지 않습니다. Git은 저장소를 clone하거나 개발·공유할 때만 필요합니다.

### 1. 받기

Git을 사용한다면:

```powershell
git clone https://github.com/JOEWRKS/joewrks-work-harness.git
Set-Location .\joewrks-work-harness
```

ZIP을 받았다면 SHA-256을 제공자에게 받은 값과 비교한 뒤 압축을 풀고, `JOENESS-0.1.ps1`이 있는 폴더에서 아래 명령을 실행합니다.

### 2. 설치

```powershell
# 설치 예정 내용만 확인합니다. 파일을 변경하지 않습니다.
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check

# blocker가 없을 때 설치합니다.
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Apply

# 설치 상태가 current인지 확인합니다.
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

각 명령은 JSON 한 개를 출력합니다. 첫 `-Check`가 `ready`이면 설치할 변경이 있다는 뜻이고, 설치 뒤 `current`이면 현재 파일이 원하는 상태와 일치한다는 뜻입니다. `ready`도 정상 exit code `0`이므로 exit code만 보지 말고 `status`와 `blockers`를 확인하십시오.

설치가 끝나면 Codex에서 **새 작업을 하나 시작**해야 새 스킬이 확실히 검색됩니다. 기존 `harness.ps1`도 같은 설치기를 실행하지만 새 사용자는 `JOENESS-0.1.ps1`만 사용하면 됩니다.

### 3. 사용

평소처럼 Codex에 작업을 요청하면 됩니다. JOENESS는 별도의 대시보드나 실행 앱이 아닙니다.

| 상황 | 사용 방법 |
|---|---|
| 일반 개발·기획 작업 | 평소처럼 요청합니다. 전역 JOENESS 규칙은 개입하지 않습니다. |
| 프로젝트 목표와 장기 규칙을 저장 | `$joewrks-project-setup 이 프로젝트의 지속 규칙을 현재 파일 기준으로 설정해줘` |
| 의미 있는 UI/UX·프론트엔드 작업 | 관련성이 분명하면 자동 선택될 수 있습니다. 꼭 쓰려면 `$joewrks-design-frontend`를 명시합니다. |
| 다른 작업·사람에게 인수인계 | `$handoff 다음 작업이 검증된 현재 상태에서 이어가도록 정리해줘` |

`joewrks-project-setup`은 사용자가 명시적으로 요청할 때만 프로젝트 루트 `AGENTS.md`의 JOEWRKS 관리 블록을 만듭니다. 코드·디자인·의존성은 바꾸지 않습니다. `handoff`도 명시적으로 요청할 때만 임시 폴더에 인수인계 문서를 씁니다.

Figma나 브라우저 검증은 해당 플러그인과 권한이 실제로 있을 때만 사용할 수 있습니다. JOENESS가 플러그인을 대신 설치하거나 검증 결과를 보장하지 않습니다.

### 설치되는 항목

| 항목 | 기본 위치 | 상태 |
|---|---|---|
| 설치 상태 파일 | `%USERPROFILE%\.codex\joewrks-harness-state.json` | 설치·업데이트·제거의 소유권 증거 |
| 빈 JOEWRKS 관리 블록 | `%USERPROFILE%\.codex\AGENTS.md` | 전역 규칙 없음 |
| `handoff` | `%USERPROFILE%\.agents\skills` | 명시 호출 전용 |
| `joewrks-project-setup` | `%USERPROFILE%\.agents\skills` | 명시 호출 전용 candidate |
| `joewrks-design-frontend` | `%USERPROFILE%\.agents\skills` | 조건부 선택 가능한 candidate |
| UI UX Pro Max·Apple Design | `%USERPROFILE%\.agents\vendor` | 디자인 스킬용 고정 참고자료 |
| 실행별 백업 | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups` | 자동 삭제되지 않음 |

사용자 지정 위치가 필요하면 `-CodexHome`, `-AgentsHome`, `-BackupRoot`를 지정할 수 있습니다. 업데이트와 제거에도 처음 사용한 것과 같은 경로 인수를 사용해야 합니다.

### 결과 읽기

| `status` | exit | 의미 |
|---|---:|---|
| `current` | 0 | 설치 상태가 현재 소스와 일치 |
| `ready` | 0 | 안전하게 적용하거나 제거할 변경이 있음 |
| `removed` | 0 | 소유권이 확인된 항목 제거 완료 또는 no-state no-op |
| `failed` | 1 | 실행 실패, 확인 가능한 rollback 완료 |
| `blocked` | 2 | 충돌·drift·경로·소유권 문제로 쓰기 전 중단 |
| `unknown` | 3 | rollback 또는 대상 상태를 확정할 수 없음 |

`blocked`이면 `blockers`를 먼저 확인하고 기존 파일을 직접 덮어쓰지 마십시오. `unknown`이면 같은 명령을 반복하지 말고 `backupPath`, `rollback`, `unresolvedTargets`와 실제 파일을 확인하십시오.

### 업데이트와 제거

업데이트는 새 commit 또는 검증한 새 ZIP에서 다시 `-Check` → `-Apply` → `-Check` 순서로 실행합니다. 자동 updater는 없습니다.

설치한 항목을 제거하려면 설치에 사용한 소스 묶음 또는 호환되는 새 버전에서 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Remove
```

`-Remove`는 state와 현재 hash로 소유권이 확인된 파일과 관리 블록만 제거합니다. 다른 `AGENTS.md` 내용과 무관한 `.agents` 파일은 보존합니다. no-state `removed`는 유효한 state나 알려진 차단 증거를 찾지 못했고 관리 파일을 변경하지 않았다는 뜻일 뿐, 인식하지 못한 vendor residue까지 모두 없다는 증명은 아닙니다.

백업에는 이전 `AGENTS.md`와 state가 들어갈 수 있으므로 개인 정보처럼 취급하십시오. 성공 상태와 복구 필요 여부를 확인한 뒤에만 사용자가 직접 삭제합니다.

### 문제가 생겼을 때

- PowerShell ExecutionPolicy가 기본 명령을 막을 때만 출처의 commit 또는 ZIP hash를 먼저 확인하고 다음 fallback을 사용합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
```

- 비어 있지 않은 `.codex\AGENTS.override.md`, 같은 이름의 기존 unmanaged 스킬, 설치 뒤 수정된 관리 파일, 잘못된 marker, junction·symlink 경로는 안전을 위해 `blocked`가 될 수 있습니다. `--force` 옵션은 없습니다.
- `-Apply`는 실제 쓰기 직전에 전체 검사를 다시 수행하고, 대상 변경 전 실행별 백업을 만듭니다.

### 저장소 안내

| 경로 | 역할 |
|---|---|
| `JOENESS-0.1.ps1` | 사용자용 설치 진입점 |
| `scripts/sync-harness.ps1` | 설치·점검·제거 구현 |
| `skills/` | 설치되는 JOEWRKS 스킬 |
| `vendor/` | 고정된 외부 자료, manifest, 라이선스 고지 |
| `tests/` | 설치기·스킬·vendor 무결성 회귀 검사 |
| `evals/` | 후보와 과거 실험을 수정하지 않고 보존하는 증거 |
| `docs/superpowers/` | 설계 명세와 구현 계획 기록 |

루트 `common-core.md`는 비교에 사용한 평가 증거이며 현재 설치되지 않습니다. 별도 `HARNESS.md`를 만들지 않고, 사람용 설명은 README, 저장소·프로젝트 규칙은 해당 `AGENTS.md`, 조건부 절차는 `SKILL.md`에 둡니다.

현재 판정과 검증 범위는 [JOENESS 0.1 Beta 검증 원장](evals/JOENESS-0.1-BETA-VALIDATION.md), 설치 대상과 고정 hash는 [source manifest](vendor/source-manifest.json)에서 확인할 수 있습니다. 과거 A/B 결과는 현재 JOENESS의 성능 보증이 아닙니다.

개발자용 최소 회귀 명령:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs
```

## English

JOENESS is a personal Beta work environment that adds project-context management and selected task skills to Codex on Windows. It is not a guaranteed performance booster. Its purpose is to reduce scope drift, false completion claims, and avoidable rework in long projects while loading specialist guidance only when useful.

> **Current status:** `personal-pilot Beta candidate`. It is ready for personal pilots, but it is not certified as stable or share-ready. Validation disabled the global Common Core rule layer.

### What it does

- Persists a small project-specific contract in `AGENTS.md` when explicitly requested.
- Conditionally supplies UI/UX guidance from UI UX Pro Max and Apple Design.
- Creates an evidence-linked handoff when explicitly requested.
- Checks source hashes, collisions, and installed-file drift instead of force-overwriting unknown content.

It does not install Codex, Figma, browser capabilities, or external plugins. It does not generate project code or designs during installation, provide an automatic updater or backup restore command, or inject a long global prompt into every task.

### Requirements

- Windows and Codex
- Windows PowerShell 5.1 or later (`powershell.exe`)
- A trusted commit or a ZIP whose SHA-256 you verified

The installer itself does not require Node.js, Python, npm, Git, network access, or elevation. Git is only needed to clone, develop, or package the repository.

### Install

Run from the repository or verified ZIP root:

```powershell
# Read-only preview
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check

# Install when no blocker is reported
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Apply

# Confirm current state
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

Each command prints one JSON object. A first `ready` means changes are available; `current` after apply means the managed files match this source. `ready` also exits with code `0`, so inspect `status` and `blockers`, not only the process exit code.

Start a new Codex task after installation so skill discovery refreshes. `harness.ps1` remains a compatibility alias; new users should use `JOENESS-0.1.ps1`.

### Use

Use Codex normally for ordinary work. JOENESS has no separate dashboard or application.

| Situation | Request |
|---|---|
| Ordinary planning or development | Ask normally; no global JOENESS rules are injected. |
| Persist durable project facts and gates | `$joewrks-project-setup set up this project's durable contract from current evidence` |
| Meaningful UI/UX or frontend work | It may be selected automatically; use `$joewrks-design-frontend` to require it. |
| Resume in another task or with another person | `$handoff prepare a compact verified handoff for the next task` |

The package includes the explicit-only `handoff` skill. When the user explicitly requests `$joewrks-project-setup` or `setup`, `configure`, `persist`, or `apply` of a durable JOEWRKS project contract, that skill may update only its managed block in the project-root `AGENTS.md`; it does not change code, design, or dependencies.

Figma and browser verification require separately available plugins and permissions. JOENESS neither installs those capabilities nor certifies their output.

### Results

| `status` | exit | Meaning |
|---|---:|---|
| `current` | 0 | Installed state matches this source |
| `ready` | 0 | Safe apply or remove changes are available |
| `removed` | 0 | State-owned removal completed, or the no-state no-op below |
| `failed` | 1 | The operation failed and rollback was verified complete |
| `blocked` | 2 | A collision, drift, path, or ownership problem stopped writes |
| `unknown` | 3 | Final state cannot be established |

An unresolved target or incomplete rollback prevents a final-state claim. For `unknown`, do not blindly rerun: inspect `backupPath`, `rollback`, `unresolvedTargets`, and the actual files first.

### Update and remove

To update, obtain a new trusted revision and run Check → Apply → Check again with the same custom path arguments, if any. There is no automatic updater.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Remove
```

Removal deletes only files and the managed block whose ownership is proven by valid state and current hashes. A no-state `removed` result means no valid state or recognized blocking evidence was found and no managed files were changed; it does not prove that every unrecognized or vendor residue is absent.

Backups may contain prior state and the user's `AGENTS.md`; treat them as private. They are not pruned automatically and there is no automatic restore command.

If the default command is blocked by ExecutionPolicy, verify the source commit or ZIP hash before using this fallback:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
```

### Repository and evidence

- Repository `common-core.md`: retained evaluation evidence and not installed by the current manifest.
- Native Codex handles broad requests; persist only project-specific facts and gates in the project `AGENTS.md`.
- Do not add a separate `HARNESS.md`.
- `skills/` contains the installed skills; `vendor/` contains pinned references, the manifest, and third-party license notices.
- `evals/` preserves candidates and experiment results. Historical A/B results are not a performance guarantee for the current Beta.

See the [Beta validation ledger](evals/JOENESS-0.1-BETA-VALIDATION.md) for the current verdict and limitations, and the [source manifest](vendor/source-manifest.json) for the installed inventory and hashes.

For direct sharing, package only the exact committed revision:

```powershell
$revision = (git rev-parse --short=12 HEAD).Trim()
$archive = ".\JOENESS-0.1-$revision.zip"
git archive --format=zip --output $archive HEAD
Get-FileHash $archive -Algorithm SHA256
```

Before sharing, run and record an exact-HEAD archive review and deliver the archive SHA-256 out of band. The manifest proves internal source consistency; it does not authenticate who supplied the archive.
