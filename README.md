# JOENESS 0.1 Beta

[한국어](#한국어-설명) · [English](#english-guide)

## 한국어 설명

JOENESS는 Windows용 Codex에 프로젝트 맥락 관리, 디자인 참고자료, 인수인계 기능을 더하는 작업환경입니다. 모델 자체를 강화하는 도구가 아니라 긴 프로젝트에서 범위 이탈, 허위 완료, 불필요한 재작업을 줄이는 것이 목적입니다.

> 현재는 개인 실사용용 Beta입니다. 정식 안정 배포판으로 인증된 버전은 아닙니다.

### 1. 준비

필요한 것은 다음 세 가지입니다.

- Windows와 Codex
- Windows PowerShell 5.1 이상(`powershell.exe`)
- 신뢰할 수 있는 곳에서 받은 **JOENESS 전체 파일이 들어 있는 ZIP**

설치에는 Node.js, Python, npm, Git, 관리자 권한이 필요하지 않습니다. 단, 나중에 프로젝트 지속 규칙을 설정하려면 해당 프로젝트가 Git 저장소여야 합니다.

### 2. JOENESS 설치

#### 압축 풀기

1. 받은 ZIP 파일을 마우스 오른쪽 버튼으로 누릅니다.
2. **모두 압축 풀기**를 누릅니다.
3. 압축을 푼 폴더를 열고 `JOENESS-0.1.ps1`이 보이는지 확인합니다.

`JOENESS-0.1.ps1`만 다른 곳으로 옮기지 마세요. 같은 폴더의 내부 파일도 설치에 필요합니다.

#### PowerShell 열기

1. `JOENESS-0.1.ps1`이 보이는 파일 탐색기 창에서 위쪽 **주소창**을 클릭합니다.
2. 주소를 지우고 `powershell`을 입력한 뒤 Enter를 누릅니다.
3. 열린 PowerShell 창에 아래 명령을 한 줄씩 입력합니다.

먼저 설치 가능한지 확인합니다. 이 명령은 아직 설치하지 않습니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

- `"status":"ready"`이면 다음 명령을 실행합니다.
- `"status":"current"`이면 이미 현재 받은 버전이 설치되어 있으므로 `-Apply`를 건너뜁니다.
- `blocked`, `failed`, `unknown`이면 멈추고 PowerShell 출력 전체를 Codex에 붙여 넣습니다.

`ready`일 때만 설치합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Apply
```

결과가 `"status":"current"`이면 마지막 확인을 실행합니다. 다른 상태라면 더 실행하지 말고 출력 전체를 Codex에 붙여 넣습니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

마지막 결과가 `"status":"current"`이면 JOENESS 파일 설치가 끝난 것입니다. 이 상태는 아래 외부 플러그인의 설치 여부까지 확인한 결과는 아닙니다.

### 3. 필수 플러그인 설치

전체 JOENESS 작업환경에는 다음 세 플러그인이 모두 필요합니다. JOENESS 설치 스크립트가 대신 설치하지 않으므로 다음 순서로 직접 설치합니다.

1. Codex의 설정 또는 플러그인 메뉴에서 플러그인 목록을 엽니다.
2. 아래 검색 이름을 하나씩 입력하고 **Install(설치)** 버튼을 누릅니다.
3. 이미 **Installed(설치됨)** 또는 **Enabled(활성화됨)**로 표시된 항목은 건너뜁니다.

| 검색 이름 | 담당 역할 |
|---|---|
| **Figma** — `figma@openai-curated-remote` | 실제 Figma 파일 읽기·생성·수정·검증 |
| **Superpowers** — `superpowers@openai-curated-remote` | 복잡한 기획, 체계적인 디버깅, 테스트 우선 개발, 코드 검토 |
| **Ponytail** — `ponytail@ponytail` | 최소 구현, 과설계 방지, 불필요한 코드·의존성 감사 |

세 플러그인은 모두 설치하지만 매 작업에서 전부 실행하지는 않습니다. Figma 작업에는 Figma, 복잡한 계획·디버깅에는 관련 Superpowers 기능, 과설계 점검에는 Ponytail만 사용합니다. Figma는 처음 사용할 때 계정 연결이 필요할 수 있습니다.

### 4. Codex에서 처음 사용하기

JOENESS와 세 플러그인을 모두 설치한 다음 새 Codex 작업을 **한 번만** 엽니다. 그래야 새 스킬과 플러그인 목록을 다시 읽습니다.

JOENESS가 추가하는 도우미는 세 가지입니다.

- `joewrks-project-setup`: 프로젝트의 목표·중요 문서·실행·테스트 방법을 지속 규칙으로 정리합니다.
- `joewrks-design-frontend`: 의미 있는 UI/UX 작업에서 UI UX Pro Max와 Apple Design 참고자료를 필요한 만큼 사용합니다.
- `handoff`: 다른 작업이나 사람이 이어갈 때 현재 파일·Git·검사 결과를 짧게 정리합니다.

또한 실패할 때만 적용되는 짧은 재시도 안전 규칙이 설치됩니다. 네이티브 크래시는 같은 방식으로 자동 재시도하지 않고, 명확한 컴파일·테스트 오류와 멱등인 일시 오류만 원인을 확인한 뒤 한 번 다시 시도합니다. 선택적인 외부 GUI 검증은 최초 방식과 서로 다른 대안 한 번까지만 허용합니다.

설치만으로 프로젝트 코드나 디자인은 바뀌지 않습니다.

Git 프로젝트에 지속 규칙을 남기고 싶을 때만 프로젝트 폴더를 열고 다음 문장을 입력합니다.

```text
$joewrks-project-setup 이 프로젝트의 목표, 현재 구조, 실행·테스트 방법을 읽고 지속 작업 규칙으로 최소 설정해줘.
```

그 뒤에는 평소처럼 `로그인 화면을 만들어줘`처럼 요청하면 됩니다. 디자인 도우미는 관련 작업에서 자동으로 선택될 수 있으며, 반드시 적용하고 싶을 때만 `$joewrks-design-frontend`를 지정합니다. `$handoff`와 `$joewrks-project-setup`은 필요할 때 직접 요청합니다.

### 5. 설치 결과와 문제 해결

아래 상태는 Codex 채팅 답변이 아니라 **PowerShell에 출력되는 `"status":"단어"`**입니다.

| 상태 | 뜻 | 할 일 |
|---|---|---|
| `ready` | 설치 또는 업데이트 가능 | `-Apply`를 실행합니다. |
| `current` | 현재 연 ZIP 또는 저장소 버전과 설치 상태가 일치 | 설치를 마치고 Codex를 사용합니다. 인터넷의 최신 버전을 뜻하지는 않습니다. |
| `blocked` | 충돌을 발견해 덮어쓰지 않고 중단 | 강제로 진행하지 말고 출력 전체를 Codex에 붙여 넣습니다. |
| `failed` | 설치가 실패하고 변경 내용을 되돌림 | 출력 전체를 Codex에 붙여 넣습니다. |
| `unknown` | 설치 또는 복구 결과를 확정할 수 없음 | 같은 명령을 반복하지 말고 출력 전체를 Codex에 붙여 넣습니다. |
| `removed` | 제거 완료 또는 제거할 설치 기록 없음 | 제거가 목적이었다면 끝냅니다. |

ExecutionPolicy 오류로 기본 명령이 막힐 때만 받은 ZIP이나 commit의 출처를 다시 확인한 뒤 다음 형식을 사용합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
```

이 방식이 필요하면 출처를 확인한 뒤 마지막 `-Check`만 `-Apply`, `-Check`, `-Remove` 중 필요한 작업으로 바꿉니다. `--force` 옵션은 없습니다.

### 6. 업데이트와 제거

업데이트하려면 신뢰할 수 있는 새 ZIP을 다시 압축 해제하고 그 새 폴더에서 `-Check`를 실행합니다. `ready`이면 `-Apply` 후 `-Check`를 다시 실행하고, `current`이면 끝냅니다. 자동 업데이트 기능은 없습니다.

제거하려면 설치에 사용한 전체 폴더 또는 호환되는 새 버전의 전체 폴더에서 다음 명령을 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Remove
```

`-Remove`는 미리보기가 아니라 즉시 제거를 시도합니다. JOENESS 소유가 확인된 파일과 관리 구역만 제거하며 다른 파일은 건드리지 않습니다. 백업은 자동으로 복원되거나 삭제되지 않으므로 개인 정보처럼 보관합니다.

### 7. 고급 정보와 개발자용 내용

<details>
<summary>경로·안전 규칙·검증 정보 보기</summary>

일반 사용자는 `README.md`와 `JOENESS-0.1.ps1`만 직접 사용하면 됩니다. 나머지 폴더와 파일은 설치기가 사용하므로 이름을 바꾸거나 삭제하지 마세요.

기본 설치 위치는 사용자 프로필의 `.codex`와 `.agents`이며, 실행별 백업은 `%LOCALAPPDATA%\JOEWRKS\work-harness\backups`에 저장됩니다. 사용자 지정 위치가 필요하면 `-CodexHome`, `-AgentsHome`, `-BackupRoot`를 사용하고 업데이트·제거에도 같은 값을 사용합니다.

no-state `removed`는 유효한 state나 알려진 차단 증거를 찾지 못했고 관리 파일을 변경하지 않았다는 뜻일 뿐, 인식하지 못한 vendor residue까지 모두 없다는 증명은 아닙니다.

현재 판정과 제한은 [JOENESS 0.1 Beta 검증 원장](evals/JOENESS-0.1-BETA-VALIDATION.md), 설치 파일과 해시는 [source manifest](vendor/source-manifest.json)에 기록되어 있습니다.

저장소의 `common-core.md`는 과거 평가 증거로 남아 있고 설치되지 않습니다. 현재 manifest는 실패 경계만 다루는 작은 `retry-safety-core-v1.md`만 설치합니다.

</details>

## English Guide

JOENESS is a Windows Codex work environment for project context, selected design guidance, and evidence-linked handoffs. It does not strengthen the model itself; it aims to reduce scope drift, false completion claims, and avoidable rework in long projects.

> This is a personal-use Beta, not a certified stable or general distribution.

### 1. Requirements

You need:

- Windows and Codex
- Windows PowerShell 5.1 or later (`powershell.exe`)
- A trusted ZIP containing the **complete JOENESS package**

Installation does not require Node.js, Python, npm, Git, or administrator rights. The optional durable project setup step later requires a Git repository.

### 2. Install JOENESS

#### Extract the package

1. Right-click the downloaded ZIP and select **Extract All**.
2. Open the extracted folder.
3. Confirm that `JOENESS-0.1.ps1` is visible.

Do not move `JOENESS-0.1.ps1` by itself. Installation also needs the internal files beside it.

#### Open PowerShell

1. In the File Explorer window that shows `JOENESS-0.1.ps1`, click the address bar.
2. Replace the address with `powershell` and press Enter.
3. Enter the following commands one at a time in the PowerShell window.

Check first. This command does not install anything.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

- If the status is `ready`, continue below.
- If it is `current`, this package version is already installed; skip Apply.
- If it is `blocked`, `failed`, or `unknown`, stop and paste the complete PowerShell output into Codex.

Run Apply only after `ready`:

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Apply
```

If Apply reports `"status":"current"`, run the final check. For any other status, stop and paste the complete output into Codex.

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check
```

The final result must be `"status":"current"`. This proves the JOENESS files match the package you opened; it does not check the external plugins below.

### 3. Install the required plugins

The complete JOENESS working environment requires all three plugins below. The JOENESS installer does not install them, so install them as follows:

1. Open the plugin list from Codex settings or its plugin menu.
2. Enter each search name below and select **Install**.
3. Skip an item already marked **Installed** or **Enabled**.

| Search name | Responsibility |
|---|---|
| **Figma** — `figma@openai-curated-remote` | Read, create, edit, and verify real Figma files |
| **Superpowers** — `superpowers@openai-curated-remote` | Complex planning, systematic debugging, test-driven development, and code review |
| **Ponytail** — `ponytail@ponytail` | Minimal implementation, over-engineering prevention, and audits of unnecessary code or dependencies |

Install all three, but do not run all three on every task. Use Figma for real Figma work, the relevant Superpowers capability for complex planning or debugging, and Ponytail for over-engineering checks. Figma may request an account connection the first time it is used.

### 4. Start using Codex

After JOENESS and all three plugins are installed, open **one new Codex task** so Codex refreshes the available skills and plugins.

JOENESS adds three helpers:

- `joewrks-project-setup`: Records project goals, important documents, run commands, and tests as a durable project contract.
- `joewrks-design-frontend`: Uses the relevant UI UX Pro Max and Apple Design material for meaningful UI/UX work.
- `handoff`: Creates a compact continuation note tied to current files, Git, and observed checks.

Installation also adds a compact retry safety rule that activates only after failure. It performs no automatic same-mechanism retry after a native crash; a diagnosed compile or test error and a known transient idempotent failure get one retry. Optional external GUI verification gets the primary approach plus one materially different fallback.

Installation alone does not change project code or design.

Open the Git project folder. Use this only when you want to persist durable project rules:

```text
$joewrks-project-setup read this project's goal, structure, run commands, and tests, then persist the smallest durable work contract.
```

Then request work normally. The design helper may be selected automatically for relevant work; name `$joewrks-design-frontend` only when you want to require it. Request `$handoff` and `$joewrks-project-setup` explicitly when needed.

### 5. Read results and solve problems

The statuses below appear in **PowerShell as `"status":"word"`**. They are not Codex chat responses.

| Status | Meaning | Action |
|---|---|---|
| `ready` | Installation or update can proceed | Run Apply. |
| `current` | Installed state matches the ZIP or commit currently open | Finish setup and use Codex. It does not mean the newest internet release. |
| `blocked` | A conflict was found and nothing unknown was force-overwritten | Stop and paste the complete output into Codex. |
| `failed` | Installation failed and its changes were rolled back | Paste the complete output into Codex. |
| `unknown` | Installation or recovery cannot be determined | Do not repeat the command; paste the complete output into Codex. |
| `removed` | Removal completed or no owned installation state was found | Stop if removal was your goal. |

If ExecutionPolicy blocks the normal command, verify the ZIP or commit source before using this form:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check
```

After verification, change only the final mode to the required `-Apply`, `-Check`, or `-Remove`. There is no `--force` option.

### 6. Update and remove

To update, extract a new trusted ZIP, open PowerShell in that new folder, and run Check. If it reports `ready`, run Apply and then Check again. If it reports `current`, stop. There is no automatic updater.

To remove JOENESS, open PowerShell in the complete package folder used for installation, or a compatible newer complete package, and run:

```powershell
powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Remove
```

Remove is not a preview; it immediately attempts removal. It deletes only files and managed areas proven to belong to JOENESS. Backups are not restored or deleted automatically.

Backups may contain prior state and the user's `AGENTS.md`; treat them as private.

### 7. Advanced and developer information

<details>
<summary>Show paths, safety contracts, and verification information</summary>

Regular users need to operate only `README.md` and `JOENESS-0.1.ps1`. Do not rename or delete the other files and folders used by the installer.

Default installation uses the user profile's `.codex` and `.agents` directories. Per-run backups are stored under `%LOCALAPPDATA%\JOEWRKS\work-harness\backups`. When custom locations are necessary, use `-CodexHome`, `-AgentsHome`, and `-BackupRoot`, then reuse the same values for updates and removal.

`harness.ps1` remains a compatibility alias; new users should use `JOENESS-0.1.ps1`.

A no-state `removed` result means no valid state or recognized blocking evidence was found and no managed files were changed; it does not prove that every unrecognized or vendor residue is absent.

An unresolved target or incomplete rollback prevents a final-state claim.

The package includes the explicit-only `handoff` skill. When the user explicitly requests `$joewrks-project-setup` or `setup`, `configure`, `persist`, or `apply` of a durable JOEWRKS project contract, that skill may update only its managed block in the project-root `AGENTS.md`; it does not change code, design, or dependencies.

Repository `common-core.md` remains retained evaluation evidence and is not installed. The current manifest installs only the compact `retry-safety-core-v1.md` failure-boundary rule.

Native Codex handles broad requests; persist only project-specific facts and gates in the project `AGENTS.md`.

Do not add a separate `HARNESS.md`.

See the [Beta validation ledger](evals/JOENESS-0.1-BETA-VALIDATION.md) for the current verdict and limitations, and the [source manifest](vendor/source-manifest.json) for installed files and hashes.

Before sharing, run and record an exact-HEAD archive review and deliver the archive SHA-256 out of band.

</details>
