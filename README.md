# JOEWRKS 작업 하네스

[한국어](#한국어) · [English](#english)

## 한국어

Windows Codex에 이미 내장된 계획·도구·권한·검증 체계를 대체하지 않고, 반복적으로 확인된 JOEWRKS 작업 이탈만 교정하는 얇은 공통 규칙과 개인 스킬 묶음을 한 PowerShell 진입점으로 점검·설치·업데이트·제거합니다. 에이전트 팀이나 프로젝트별 스킬을 자동 생성하는 메타 하네스가 아닙니다.

> **기본 `-Apply`는 `personal-pilot` 전체를 설치합니다.** Common Work Core, 명시 호출 전용 `handoff`, candidate 상태인 `joewrks-design-frontend`와 `joewrks-project-setup`, manifest가 선택한 UI UX Pro Max runtime·Apple Design reference가 함께 설치됩니다. 디자인 파일럿은 승격되거나 품질이 인증된 기능이 아닙니다. Python, Figma, browser capability 또는 외부 플러그인은 포함하거나 자동 설치·설정하지 않습니다.

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
| 관리 스킬 | `%USERPROFILE%\.agents\skills\<skill-name>` |
| vendored runtime·reference | `%USERPROFILE%\.agents\vendor\...` |
| 실행별 backup | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups\<run-id>` |

`-AgentsHome`과 `-BackupRoot`로 후자의 root를 명시할 수 있습니다. 신규 스킬은 `.agents`에 설치되며 legacy `<resolvedCodexHome>\skills`는 충돌 검사에만 사용됩니다.

### 파일별 역할

- 사용자 범위 `<resolvedCodexHome>\AGENTS.md`: 모든 작업에 자동 적용되는 짧은 Common Work Core만 둡니다.
- 각 프로젝트 루트 `AGENTS.md`: 그 프로젝트의 장기 목표, 비목표, 권한 경계, 표준 명령, 품질·출시 기준과 상세 문서 경로만 둡니다. Common Core를 복사하지 않습니다.
- 더 가까운 하위 `AGENTS.md`: 특정 하위 디렉터리에 실제로 다른 규칙이 있을 때만 둡니다.
- `README.md`: 사람이 설치·공유·복구 방식을 이해하기 위한 설명서입니다. 에이전트의 상시 실행 규칙으로 취급하지 않습니다.
- `SKILL.md`와 reference: 특정 작업에서만 필요한 절차와 전문 지식을 필요할 때 로드합니다.

별도 `HARNESS.md`는 만들지 않습니다. 공통 실행 규칙을 두 군데에 복제하면 어느 파일이 최신인지 불명확해지고 토큰도 중복됩니다. 프로젝트의 긴 명세·아키텍처·도메인 문서는 기존 위치에 유지하고, 프로젝트 `AGENTS.md`에서는 필요한 경로와 사용 조건만 가리킵니다.

큰 작업 단계가 바뀌고 현재 파일과 짧게 검증된 인수인계만으로 다음 단계를 독립 재개할 수 있으면, 다음 단계는 새 작업 또는 새 위임 문맥에서 이어갑니다. 목표·채택한 결정·실행한 검사·미확인 사항만 넘기고 이전 도구 로그와 폐기한 탐색 과정은 넘기지 않습니다. 아직 파일에 반영되지 않은 상태나 미해결 의존성이 있으면 같은 작업에서 계속합니다.

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

성공한 제거 뒤 남는 정확한 빈 관리 스킬 디렉터리 skeleton은 다음 `-Apply`가 재사용할 수 있습니다. 무관한 `.agents` 파일과 디렉터리는 제거하지 않습니다.

업데이트는 새 repository revision 또는 ZIP에서 `-Check` → `-Apply` → `-Check`를 다시 실행합니다. 같은 상태면 새 파일이나 backup 없이 `current`입니다. manifest에서 사라진 state-owned 파일도 현재 hash가 기록과 일치할 때만 제거합니다.

소스 폴더를 지운 뒤 제거해야 한다면 설치에 사용한 exact revision archive를 보관하거나, 해당 state schema를 지원하는 compatible newer revision을 다시 받아 `-Remove`를 실행하십시오. 별도 제거 프로그램이나 자동 updater는 설치되지 않습니다.

### 프로젝트별 설정

Common Core는 새 프로젝트 선언과 `해줘`·`계속해줘`를 현재 저장소 증거에 맞는 다음 실행 계약으로 자동 해석합니다. 프로젝트 설정 계약을 자동 생성하지는 않지만, 요청된 결과에 필요한 권한 범위 안의 로컬 작업은 계속 수행합니다.

장기간 재사용할 제품 목표, 권한, 명령, 아키텍처·도메인 참고자료, 품질 기준, 협업 및 출시 기준이 필요해 사용자가 `$joewrks-project-setup` 또는 내구성 JOEWRKS 프로젝트 계약의 `setup`·`configure`·`persist`·`apply`를 명시적으로 요청하면, 스킬이 프로젝트를 읽고 최소 계약을 적용합니다. helper의 `check`는 Git root와 `AGENTS.md` snapshot을 읽기 전용으로 확인하고, 쓰기 직전에 snapshot을 다시 검증한 뒤 루트 `AGENTS.md`의 JOEWRKS project marker 블록 하나만 변경합니다.

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

This project does not replace the planning, tools, permissions, or verification already built into Windows Codex. One PowerShell entry point checks, installs, updates, and removes a thin corrective overlay for recurring JOEWRKS workflow failures plus the personal skill bundle. It is not a meta-harness that automatically generates agent teams or per-project skills.

> **The default `-Apply` installs the full `personal-pilot`.** It includes the Common Work Core, the explicit-only `handoff` skill, the candidate `joewrks-design-frontend` and `joewrks-project-setup` skills, and the manifest-selected UI UX Pro Max runtime and Apple Design reference. The design pilot is not promoted or quality-certified. Python, Figma, browser capabilities, and external plugins are neither bundled nor installed or configured automatically.

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
| Managed skills | `%USERPROFILE%\.agents\skills\<skill-name>` |
| Vendored runtime and references | `%USERPROFILE%\.agents\vendor\...` |
| Per-run backups | `%LOCALAPPDATA%\JOEWRKS\work-harness\backups\<run-id>` |

`-AgentsHome` and `-BackupRoot` can override the latter roots. New skills go under `.agents`; legacy `<resolvedCodexHome>\skills` is inspected only for collisions.

### File responsibilities

- User-level `<resolvedCodexHome>\AGENTS.md`: contains only the short Common Work Core automatically applied to every task.
- Project-root `AGENTS.md`: contains that project's durable outcome, non-goals, authority boundaries, standard commands, quality and release criteria, and paths to detailed documents. It does not copy the Common Core.
- A closer nested `AGENTS.md`: exists only when a subdirectory genuinely needs different scoped rules.
- `README.md`: explains installation, sharing, and recovery to people. It is not an always-on agent instruction source.
- `SKILL.md` and references: load task-specific procedures and specialist knowledge only when relevant.

Do not add a separate `HARNESS.md`. Duplicating common runtime rules creates two sources of truth and spends context twice. Keep long product specifications, architecture, and domain documents in their existing project locations; the project `AGENTS.md` should point to the relevant path and state when it matters.

At a major phase boundary, use a fresh task or delegated context when current files plus a compact verified handoff are enough to resume independently. Carry only the target, selected decisions, checks run, and unknowns—not prior tool logs or rejected exploration. Continue in the same task when unresolved dependencies or unmaterialized state would otherwise be lost.

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

An exact empty managed-skill directory skeleton left after successful removal can be reused by a later `-Apply`. Unrelated `.agents` files and directories are preserved.

To update, use a new repository revision or ZIP and run `-Check` → `-Apply` → `-Check`. An already-current bundle creates no new files or backup. A state-owned file removed from the new manifest is deleted only if its current hash still matches recorded ownership.

If the source folder is gone, keep the exact revision archive used for installation or obtain a compatible newer revision that supports the state schema, then run `-Remove`. No separate uninstaller or automatic updater is installed.

### Per-project setup

The Common Core automatically interprets a new project declaration and broad `do it` or `continue` request as the next execution contract supported by current repository evidence. It does not auto-create a project setup contract, but it continues authorized local work needed for the requested outcome.

When the user explicitly requests `$joewrks-project-setup` or `setup`, `configure`, `persist`, or `apply` of a durable JOEWRKS project contract, the skill reads the project and applies a minimal durable contract for product goals, authority, commands, architecture and domain references, quality criteria, collaboration, and release criteria. Its helper `check` resolves the Git root and `AGENTS.md` snapshot without writing, revalidates that snapshot before the write, and changes only the single JOEWRKS project marker block in the root `AGENTS.md`.

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
