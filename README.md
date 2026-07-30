# JOEWRKS 작업 하네스

[한국어](#한국어) · [English](#english)

## 한국어

Windows Codex 사용자의 공통 작업 규칙과 현재 JOEWRKS 개인 스킬 묶음을 한 PowerShell 진입점으로 점검·설치·업데이트·제거합니다.

> **기본 `-Apply`는 `personal-pilot` 전체를 설치합니다.** Common Work Core, candidate 상태인 `joewrks-design-frontend`와 `joewrks-project-setup`, manifest가 선택한 UI UX Pro Max runtime·Apple Design reference·고지가 함께 설치됩니다. 디자인 파일럿은 승격되거나 품질이 인증된 기능이 아닙니다. Python, Figma, browser capability 또는 외부 플러그인은 포함하거나 자동 설치·설정하지 않습니다.

### 빠른 시작

저장소 또는 검증한 ZIP의 루트에서 다음 순서로 실행합니다.

```powershell
# 1. 전체 계획을 읽기 전용으로 확인
powershell.exe -NoProfile -File .\harness.ps1 -Check

# 2. blocker가 없으면 personal-pilot 적용
powershell.exe -NoProfile -File .\harness.ps1 -Apply

# 3. current 확인
powershell.exe -NoProfile -File .\harness.ps1 -Check

# 선택: 이 state가 소유한 설치만 제거
powershell.exe -NoProfile -File .\harness.ps1 -Remove
```

`-Apply`도 쓰기 직전에 전체 preflight를 다시 수행하므로 `-Check`는 안전한 미리보기이지 필수 선행 단계는 아닙니다. 설치 뒤에는 새 Codex 작업을 시작해야 스킬 탐색 상태가 확실히 갱신됩니다.

기존 `-IncludeDesignFrontend`는 입력 호환용 deprecated no-op입니다. 플래그 유무 모두 같은 `personal-pilot`을 선택하며, 사용하면 JSON에 다음 warning이 남습니다.

```text
DEPRECATED: -IncludeDesignFrontend no longer changes selection; personal-pilot already includes joewrks-design-frontend.
```

### 설치 위치와 상태

`resolvedCodexHome`은 명시한 `-CodexHome`, 유효한 `CODEX_HOME`, `%USERPROFILE%\.codex` 순으로 결정됩니다.

| 대상 | 기본 위치 |
|---|---|
| Common Work Core 관리 블록 | `<resolvedCodexHome>\AGENTS.md` |
| 설치 state | `<resolvedCodexHome>\joewrks-harness-state.json` |
| JOEWRKS 스킬 | `%USERPROFILE%\.agents\skills\joewrks-*` |
| vendored runtime·reference | `%USERPROFILE%\.agents\vendor\...` |
| 실행별 backup | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups\<run-id>` |

`-AgentsHome`과 `-BackupRoot`로 후자의 root를 명시할 수 있습니다. 신규 스킬은 `.agents`에 설치되며 legacy `<resolvedCodexHome>\skills`는 충돌 검사에만 사용됩니다.

state schema v2는 `personal-pilot`, Common Core와 bundle manifest의 source identity, 관리 대상 hash, 정규화한 AgentsHome의 SHA-256 identity를 기록합니다. 개인 절대경로는 state에 저장하지 않습니다. 같은 state를 다른 AgentsHome과 함께 사용하면 적용·제거 전에 차단됩니다.

### 결과와 exit code

stdout은 한 JSON 결과입니다.

| status | exit | 의미 |
|---|---:|---|
| `current` | 0 | 원하는 설치 상태와 일치 |
| `ready` | 0 | 안전하게 적용하거나 제거할 변경이 있음 |
| `removed` | 0 | state-owned 제거 완료 또는 아래 no-state no-op |
| `failed` | 1 | 실행 실패 후 확인 가능한 rollback 완료 |
| `blocked` | 2 | 충돌·drift·불명확한 소유권 등으로 쓰기 전 중단 |
| `unknown` | 3 | unresolved target 또는 불완전 rollback으로 최종 상태를 확정할 수 없음 |

`unknown`이면 자동 복구 완료로 가정하거나 새 실행을 반복하지 마십시오. JSON의 `backupPath`, `rollback`, `unresolvedTargets`와 현재 파일을 먼저 확인합니다. 실패 중 생성된 디렉터리는 외부 내용이나 검사 불확실성을 덮어쓰지 않기 위해 보수적으로 남을 수 있습니다.

### 제거와 업데이트

`-Remove`는 유효한 state가 소유한다고 증명하는 whole files와 Common Core marker 블록만 제거합니다. Common Core 밖의 기존 `AGENTS.md` byte를 보존하고, 외부 내용이 없어도 `AGENTS.md` 파일 자체는 남기며, state는 다른 제거가 모두 검증된 뒤 마지막에 삭제합니다. drift, 누락된 owned target, state 없는 marker·관리 namespace 같은 unowned evidence가 있으면 삭제하지 않고 `blocked`로 끝납니다.

no-state `removed`는 유효한 state나 알려진 차단 증거를 찾지 못했고 관리 파일을 변경하지 않았다는 뜻일 뿐, 인식하지 못한 vendor residue까지 모두 없다는 증명은 아닙니다.

성공한 제거 뒤 남는 정확한 빈 `.agents\skills\joewrks-*` 디렉터리 skeleton은 다음 `-Apply`가 재사용할 수 있습니다. 무관한 `.agents` 파일과 디렉터리는 제거하지 않습니다.

업데이트는 새 repository revision 또는 ZIP에서 `-Check` → `-Apply` → `-Check`를 다시 실행합니다. 같은 상태면 새 파일이나 backup 없이 `current`입니다. manifest에서 사라진 state-owned 파일도 현재 hash가 기록과 일치할 때만 제거합니다.

소스 폴더를 지운 뒤 제거해야 한다면 설치에 사용한 exact revision archive를 보관하거나, 해당 state schema를 지원하는 compatible newer revision을 다시 받아 `-Remove`를 실행하십시오. 별도 제거 프로그램이나 자동 updater는 설치되지 않습니다.

### 프로젝트별 설정

프로젝트 파일은 설치 과정에서 자동으로 바뀌지 않습니다. 해당 프로젝트에서 `$joewrks-project-setup`을 명시적으로 호출하고 helper의 `check`를 먼저 실행합니다. `check`는 Git root와 `AGENTS.md` snapshot을 읽기 전용으로 확인합니다. 그 프로젝트에 대한 명시적 `apply` 요청이 있을 때만 snapshot을 다시 검증하고 루트 `AGENTS.md`의 JOEWRKS project marker 블록 하나를 씁니다.

이 스킬은 Common Core를 복제하거나 의존성·코드·디자인을 변경하지 않으며, 다른 프로젝트나 과거 대화의 승인을 가져오지 않습니다.

### Backup과 복구

실제 변경 전 backup은 실행별 디렉터리에 생성되고 자동 삭제되지 않습니다. 이전 state와 사용자 `AGENTS.md` 내용이 포함될 수 있으므로 개인 정보처럼 취급하십시오. 성공한 설치·제거를 확인하고 수동 복구 필요가 끝난 뒤 사용자가 직접 삭제합니다. 이전 backup의 state에서 당시 source manifest identity와 owned target hash를 확인할 수 있지만, backup 존재만으로 복구 완료를 뜻하지는 않습니다.

### 직접 공유

공유할 exact committed revision에서 다음을 실행합니다.

```powershell
$revision = (git rev-parse --short=12 HEAD).Trim()
$archive = ".\joewrks-work-harness-$revision.zip"
git archive --format=zip --output $archive HEAD
Get-FileHash $archive -Algorithm SHA256
```

`git archive HEAD`는 현재 commit의 tracked 파일만 담습니다. working tree의 미커밋 변경은 포함하지 않으므로 공유하려는 내용이 현재 revision에 commit됐는지 먼저 확인합니다. 수신자는 압축을 풀기 전에 archive와 다른 신뢰된 채널로 받은 SHA-256을 `Get-FileHash` 결과와 비교해야 합니다. archive 안의 manifest hash만으로 archive 출처를 증명할 수는 없습니다.

공유 전에는 exact HEAD archive를 대상으로 민감 filename denylist, 알려진 credential pattern, Git tracked/archive 파일 목록을 검사하고 결과를 기록해야 합니다. pattern hit는 exact synthetic fixture인지 사람이 확인하고, 그 밖의 미검토 발견은 모두 해결한 뒤 공유합니다. 이 bounded review를 완료해도 모든 비밀이 없다는 증명은 아닙니다. 과거 계획·평가 파일의 로컬 경로는 기록일 뿐 runtime 입력이 아닙니다.

### ExecutionPolicy fallback과 저장소 검증

기본 명령이 ExecutionPolicy에 막힌 경우에만 source commit 또는 별도 채널의 ZIP hash를 확인한 뒤 `ExecutionPolicy Bypass`를 fallback으로 사용합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Check
```

저장소 자체의 격리된 회귀 검사는 재현성을 위해 Bypass를 사용합니다. Node와 Python은 이 저장소 검증 또는 선택적인 UI UX 검색에만 쓰이며 PowerShell 설치기의 필수 runtime이 아닙니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs
```

---

## English

This project checks, installs, updates, and removes shared working rules and the current JOEWRKS personal skill bundle for Windows Codex through one PowerShell entry point.

> **The default `-Apply` installs the full `personal-pilot`.** It includes the Common Work Core, the candidate `joewrks-design-frontend` and `joewrks-project-setup` skills, and the manifest-selected UI UX Pro Max runtime, Apple Design reference, and notices. The design pilot is not promoted or quality-certified. Python, Figma, browser capabilities, and external plugins are neither bundled nor installed or configured automatically.

### Quick start

Run these commands in order from the root of the repository or a verified ZIP:

```powershell
# 1. Read-only preview of the full plan
powershell.exe -NoProfile -File .\harness.ps1 -Check

# 2. Apply the personal-pilot when no blocker is reported
powershell.exe -NoProfile -File .\harness.ps1 -Apply

# 3. Confirm current
powershell.exe -NoProfile -File .\harness.ps1 -Check

# Optional: remove only content owned by this state
powershell.exe -NoProfile -File .\harness.ps1 -Remove
```

`-Apply` repeats the full preflight immediately before writing, so `-Check` is a safe preview rather than a mandatory installation step. Start a new Codex task after installation so skill discovery is refreshed.

The deprecated `-IncludeDesignFrontend` flag is now a compatibility no-op. With or without it, the selected bundle is the same `personal-pilot`; supplying it adds this JSON warning:

```text
DEPRECATED: -IncludeDesignFrontend no longer changes selection; personal-pilot already includes joewrks-design-frontend.
```

### Paths and state

`resolvedCodexHome` is resolved from explicit `-CodexHome`, a valid `CODEX_HOME`, then `%USERPROFILE%\.codex`.

| Target | Default location |
|---|---|
| Common Work Core managed block | `<resolvedCodexHome>\AGENTS.md` |
| Installation state | `<resolvedCodexHome>\joewrks-harness-state.json` |
| JOEWRKS skills | `%USERPROFILE%\.agents\skills\joewrks-*` |
| Vendored runtime and references | `%USERPROFILE%\.agents\vendor\...` |
| Per-run backups | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups\<run-id>` |

`-AgentsHome` and `-BackupRoot` can override the latter roots. New skills go under `.agents`; legacy `<resolvedCodexHome>\skills` is inspected only for collisions.

State schema v2 records `personal-pilot`, the Common Core and bundle-manifest source identities, owned hashes, and a SHA-256 identity of the normalized AgentsHome. It does not store personal absolute paths. Pairing the same state with another AgentsHome is blocked before apply or remove.

### Results and exit codes

stdout is one JSON result.

| status | exit | Meaning |
|---|---:|---|
| `current` | 0 | Installed state matches the desired state |
| `ready` | 0 | Safe apply or remove changes are available |
| `removed` | 0 | State-owned removal completed, or the no-state no-op below |
| `failed` | 1 | The operation failed and rollback was verified complete |
| `blocked` | 2 | A collision, drift, or uncertain ownership stopped all writes |
| `unknown` | 3 | An unresolved target or incomplete rollback prevents a final-state claim. |

For `unknown`, do not assume recovery or blindly rerun. Inspect `backupPath`, `rollback`, `unresolvedTargets`, and the current files first. Directories created during a failed operation may remain conservatively when external content or inspection uncertainty prevents safe cleanup.

### Remove and update

`-Remove` deletes only whole files and the Common Core marker block proven to be owned by valid state. It preserves the exact bytes outside that block, keeps `AGENTS.md` even when the remaining external content is empty, and removes state last after every other removal is verified. Drift, a missing owned target, or unowned evidence such as a marker or managed namespace without state causes `blocked` without deletion.

A no-state `removed` result means no valid state or recognized blocking evidence was found and no managed files were changed; it does not prove that every unrecognized or vendor residue is absent.

An exact empty `.agents\skills\joewrks-*` directory skeleton left after successful removal can be reused by a later `-Apply`. Unrelated `.agents` files and directories are preserved.

To update, use a new repository revision or ZIP and run `-Check` → `-Apply` → `-Check`. An already-current bundle creates no new files or backup. A state-owned file removed from the new manifest is deleted only if its current hash still matches recorded ownership.

If the source folder is gone, keep the exact revision archive used for installation or obtain a compatible newer revision that supports the state schema, then run `-Remove`. No separate uninstaller or automatic updater is installed.

### Per-project setup

Installation never mutates project files automatically. Explicitly invoke `$joewrks-project-setup` for the target project and run its helper `check` first. The check resolves the Git root and `AGENTS.md` snapshot without writing. Only an explicit `apply` request for that project allows the helper to revalidate the snapshot and write the single JOEWRKS project marker block in the root `AGENTS.md`.

The skill does not copy the Common Core, install dependencies, change code or design, or reuse authorization from another project or conversation.

### Backups and recovery

Backups are created in a per-run directory before changes and are never pruned automatically. Backups may contain prior state and the user's `AGENTS.md`; treat them as private. Delete them manually only after confirming a successful install or removal and finishing any needed recovery. A prior backup state can identify the source manifest and owned hashes for that run; its existence alone does not prove recovery.

### Direct sharing

Run the following from the exact committed revision you intend to share:

```powershell
$revision = (git rev-parse --short=12 HEAD).Trim()
$archive = ".\joewrks-work-harness-$revision.zip"
git archive --format=zip --output $archive HEAD
Get-FileHash $archive -Algorithm SHA256
```

`git archive HEAD` includes only tracked files from that commit, not uncommitted working-tree changes. Confirm the intended content is committed. Before extraction, the recipient must compare `Get-FileHash` with a SHA-256 delivered through a separate trusted channel. Manifest hashes inside the archive prove internal consistency, not archive provenance.

Before sharing, run and record an exact-HEAD archive review and deliver the archive SHA-256 out of band. The review must scan the defined sensitive-filename denylist and known credential patterns, have a human classify exact synthetic-fixture hits, compare the Git tracked and archived file lists, and resolve every other unreviewed finding. Even this bounded review does not prove that every possible secret is absent. Local paths in historical plans and evaluations are records, not runtime inputs.

### ExecutionPolicy fallback and repository checks

Only if the default command is blocked by ExecutionPolicy, verify the source commit or the ZIP hash from a separate channel before using `ExecutionPolicy Bypass` as a fallback:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Check
```

Isolated repository regression commands may retain Bypass for reproducibility. Node and Python are used only for repository verification or optional UI UX search; they are not required by the PowerShell installer.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs
```
