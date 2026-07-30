# Personal Script-First Harness V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Windows Codex 사용자가 기존 `harness.ps1` 한 진입점으로 Common Core, 개인 파일럿 스킬과 runtime을 안전하게 설치·업데이트·제거하고, 프로젝트별 규칙은 명시 호출한 결정론적 helper로만 적용하게 한다.

**Architecture:** 기존 `scripts/sync-harness.ps1`의 manifest allowlist, byte 보존, 전체 preflight, 파일별 원자 교체와 조건부 rollback을 재사용한다. 설치 bundle은 `.agents` 아래에 저장소 상대 배치를 그대로 복사하고 state schema v2가 그 소유권과 AgentsHome identity를 기록한다. 새 `joewrks-project-setup`은 의미 판단을 Markdown에 두되 실제 `AGENTS.md` 변환은 함께 설치되는 독립 PowerShell helper가 맡는다.

**Tech Stack:** Windows PowerShell 5.1, .NET 표준 라이브러리, JSON source manifest, 기존 Node.js 표준 라이브러리 검사, Python 3 표준 라이브러리 vendor 검사

## Global Constraints

- 기준 명세는 `docs/superpowers/specs/2026-07-30-personal-script-first-harness-design.md`다.
- 기준 commit은 `d7dde5d`; 구현 시작 전 현재 branch, HEAD, origin과 clean worktree를 다시 확인한다.
- 모든 shell 명령은 먼저 `D:\JOEWRKS\작업하네스`로 이동하고 Git root가 같은지 확인한다.
- 실제 `%USERPROFILE%` 설치는 하지 않는다. 모든 installer·project helper 쓰기 검증은 임시 root에서 수행한다.
- PowerShell 5.1과 .NET 표준 라이브러리만 사용하며 새 dependency, EXE, npm installer, plugin package와 다른 OS adapter를 추가하지 않는다.
- 루트 `AGENTS.md`의 7,933 bytes와 SHA-256 `5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495`를 바꾸지 않는다.
- `vendor/source-manifest.json`만 source file/hash ledger로 사용하고 두 번째 distribution manifest를 만들지 않는다.
- manifest `localPath`를 checkout root와 installed AgentsHome 양쪽의 동일 상대경로로 사용한다. `sourcePath`·`installPath` 필드와 self-contained vendor 재패키징은 추가하지 않는다.
- `joewrks-design-frontend`의 `allow_implicit_invocation: true`와 hybrid personal pilot을 유지한다. stable/shared profile과 `activeSkills` rename을 추가하지 않는다.
- `joewrks-project-setup`만 `allow_implicit_invocation: false`로 둔다.
- installer stdout은 계속 단일 JSON이다. `-OutputFormat` 옵션을 추가하지 않는다.
- Git remote·dirty 여부를 설치 state에 저장하거나 dirty checkout을 일반 설치에서 차단하지 않는다.
- 현재 manifest에는 재귀 dependency graph가 없으므로 cycle resolver와 cycle fixture를 만들지 않는다.
- 기존 테스트를 삭제해 새 동작을 통과시키지 않는다. 바뀐 계약만 명시적으로 수정하고 안전·rollback 회귀는 유지한다.
- 각 task는 해당 failing test, 최소 구현, focused pass, commit 순서로 끝낸다.

## Review Disposition

| 리뷰 항목 | 판정 | 이 계획의 처리 |
|---|---|---|
| vendor 설치 경로 | 수정 수용 | 기존 `.agents\skills` + `.agents\vendor` mirror를 문서·설치 smoke test로 고정 |
| candidate는 implicit 금지 | 거절 | 승인된 hybrid implicit pilot 유지, 상태와 경고를 더 명확히 표시 |
| project setup의 결정론적 writer | 수용 | 전용 `project-setup.ps1` 추가 |
| obsolete reconciliation 누락 | 전제는 거짓, 회귀 방지 수용 | 기존 owned-minus-desired 제거를 전체 bundle 경로에서 유지·확장 |
| CODEX_HOME/state 불일치 | 전제는 거짓, identity 보강 수용 | state는 resolved CodexHome 유지, schema v2에 AgentsHome hash 추가 |
| 다중 파일 transaction 표현 | 수용 | 파일별 원자 교체 + 조건부 rollback, 불완전 결과는 `unknown` |
| Git/ZIP trust | 수정 수용 | runtime Git 의존성 없이 `git archive` + out-of-band SHA-256 문서화 |
| GitHub branch 상태 | 사실관계 수정 | `origin/codex/codex-distribution-v1`의 `a14698a`는 존재하고 `origin/main`은 이전 상태다. 구현·검증과 push를 분리 |
| Windows path/reparse | 수용 | 공통 validator와 focused fixtures 추가 |
| deprecated flag | 수용 | no-op 호환과 JSON warning·실제 bundle 선택 출력 |
| exit code/JSON option | 부분 수용 | 상태별 exit code만 추가, 기존 상시 JSON 유지 |
| uninstall·backup·ExecutionPolicy·secret claim | 수용 | lifecycle과 양언어 README 계약에 반영 |

## File Map

| 경로 | 책임 | 작업 |
|---|---|---|
| `scripts/sync-harness.ps1` | 사용자 bundle의 check/apply/remove, state와 rollback | 수정 |
| `tests/sync-harness.tests.ps1` | installer lifecycle·path·migration 회귀 | 수정 |
| `skills/joewrks-project-setup/SKILL.md` | 프로젝트 의미 판단과 helper 호출 계약 | 생성 |
| `skills/joewrks-project-setup/agents/openai.yaml` | 명시 호출 전용 Codex metadata | 생성 |
| `skills/joewrks-project-setup/scripts/project-setup.ps1` | 결정론적 project marker check/apply | 생성 |
| `tests/project-setup.tests.ps1` | project helper의 byte·snapshot·rollback 계약 | 생성 |
| `vendor/source-manifest.json` | 설치 active skills와 exact bytes/hash | 수정 |
| `tests/design-vendor-integrity.tests.mjs` | manifest·active skill·vendor 무결성 | 수정 |
| `.gitattributes` | 새 skill의 checkout byte 안정성 | 수정 |
| `README.md` | 한글·영문 설치·공유·복구 안내 | 수정 |
| `docs/superpowers/specs/2026-07-30-personal-script-first-harness-design.md` | 구현 기준 계약 | 이미 본 계획과 함께 보강됨 |

---

### Task 1: Windows manifest path와 reparse 경계 고정

**Files:**
- Modify: `scripts/sync-harness.ps1:54-118`
- Modify: `tests/sync-harness.tests.ps1:12-17,222-240,489-503`

**Interfaces:**
- Produces: `Get-HarnessSafeRelativePath([string] $Value, [string] $Label) -> string`
- Produces: `Assert-HarnessNoReparsePoint([string] $Root, [string] $Path, [string] $Label)`
- Preserves: `Resolve-HarnessSourceFile([string] $Root, [string] $RelativePath) -> string`
- Changes: `Get-HarnessManifestSelections` rejects every exact or case-insensitive duplicate destination and every file-directory prefix collision.

- [ ] **Step 1: 예외 assertion과 failing path table을 추가한다**

```powershell
function Assert-ThrowsLike {
    param([scriptblock] $Action, [string] $Pattern, [string] $Message)
    try { & $Action; throw "Assertion failed: $Message did not throw" }
    catch {
        if ($_.Exception.Message -notlike $Pattern) {
            throw "Assertion failed: $Message; expected [$Pattern], got [$($_.Exception.Message)]"
        }
    }
}

function Test-ManifestPathSafety {
    . $Implementation
    $cases = @(
        @{ Path = 'C:\absolute.txt'; Pattern = '*relative*' },
        @{ Path = '\\server\share.txt'; Pattern = '*relative*' },
        @{ Path = '\\?\C:\device.txt'; Pattern = '*relative*' },
        @{ Path = '../escape.txt'; Pattern = '*normalized*' },
        @{ Path = 'safe/file.txt:stream'; Pattern = '*alternate data stream*' },
        @{ Path = 'safe/na*me.txt'; Pattern = '*invalid character*' },
        @{ Path = 'safe/CON.txt'; Pattern = '*reserved*' },
        @{ Path = 'safe/name. '; Pattern = '*trailing dot or space*' }
    )
    foreach ($case in $cases) {
        Assert-ThrowsLike {
            Get-HarnessSafeRelativePath $case.Path 'test path'
        } $case.Pattern "rejects $($case.Path)"
    }
}
```

- [ ] **Step 2: focused test가 새 validator 부재로 실패하는지 확인한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: FAIL because `Get-HarnessSafeRelativePath` is not defined.

- [ ] **Step 3: 한 relative-path validator와 reparse walker를 구현한다**

```powershell
function Get-HarnessSafeRelativePath {
    param([string] $Value, [string] $Label)
    if ([string]::IsNullOrWhiteSpace($Value) -or [IO.Path]::IsPathRooted($Value)) {
        throw "$Label is not relative: $Value"
    }
    $segments = @($Value -split '[\\/]')
    foreach ($segment in $segments) {
        if ([string]::IsNullOrEmpty($segment) -or $segment -in @('.', '..')) {
            throw "$Label is not normalized: $Value"
        }
        if ($segment.Contains(':')) { throw "$Label contains an alternate data stream separator: $Value" }
        if ($segment.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -ge 0) {
            throw "$Label contains an invalid character: $Value"
        }
        if ($segment.EndsWith('.') -or $segment.EndsWith(' ')) {
            throw "$Label has a trailing dot or space: $Value"
        }
        $baseName = $segment.Split('.')[0]
        if ($baseName -match '\A(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])\z') {
            throw "$Label contains a Windows reserved name: $Value"
        }
    }
    $segments -join '/'
}

function Assert-HarnessNoReparsePoint {
    param([string] $Root, [string] $Path, [string] $Label)
    $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
    $pathFull = [IO.Path]::GetFullPath($Path)
    $relative = $pathFull.Substring($rootFull.Length).TrimStart('\', '/')
    $current = $rootFull
    foreach ($segment in @($relative -split '[\\/]')) {
        if (Test-Path -LiteralPath $current) {
            $item = Get-Item -LiteralPath $current -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "$Label contains a reparse point: $current"
            }
        }
        if (-not [string]::IsNullOrEmpty($segment)) { $current = Join-Path $current $segment }
    }
    if (Test-Path -LiteralPath $current) {
        $item = Get-Item -LiteralPath $current -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "$Label contains a reparse point: $current"
        }
    }
}
```

`Resolve-HarnessSourceFile`은 먼저 canonical `/` path를 받고 containment를 확인한 뒤 위 reparse 검사를 호출한다. target planning도 Common Core·state에는 resolved CodexHome, whole files에는 resolved AgentsHome, backup destination에는 resolved BackupRoot를 root로 같은 검사를 호출한다. root 밖의 조상이나 무관한 sibling은 검사하지 않으며 `-Check`는 기존 구성요소만 읽고 아무 경로도 만들지 않는다.

- [ ] **Step 4: duplicate·prefix·junction fixtures를 추가한다**

```powershell
$manifestPath = Join-Path $f.SourceRoot 'vendor\source-manifest.json'
$exactDuplicateManifest = ([IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json)
$exactFile = $exactDuplicateManifest.activeSkills.'joewrks-design-frontend'.files[0]
$exactDuplicateManifest.activeSkills.'joewrks-design-frontend'.files = @($exactFile, $exactFile)
Assert-ThrowsLike {
    Get-HarnessManifestSelections $exactDuplicateManifest $f.SourceRoot
} '*duplicate*' 'exact duplicate blocks'

$caseAliasManifest = ([IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json)
$firstFile = $caseAliasManifest.activeSkills.'joewrks-design-frontend'.files[0]
$aliasFile = [pscustomobject] @{
    localPath = ([string] $firstFile.localPath).ToUpperInvariant()
    bytes = $firstFile.bytes
    sha256 = $firstFile.sha256
    exactUpstreamCopy = $firstFile.exactUpstreamCopy
}
$caseAliasManifest.activeSkills.'joewrks-design-frontend'.files = @($firstFile, $aliasFile)
Assert-ThrowsLike {
    Get-HarnessManifestSelections $caseAliasManifest $f.SourceRoot
} '*case-insensitive destination*' 'case-only aliases block'

$prefixManifest = [pscustomobject] @{
    activeSkills = [pscustomobject] @{
        'collision-test' = [pscustomobject] @{
            sourceDependencies = @()
            files = @(
                [pscustomobject] @{ localPath = 'skills/collision'; bytes = 1; sha256 = ('0' * 64); exactUpstreamCopy = $false },
                [pscustomobject] @{ localPath = 'skills/collision/file.txt'; bytes = 1; sha256 = ('0' * 64); exactUpstreamCopy = $false }
            )
        }
    }
    sources = [pscustomobject] @{}
}
Assert-ThrowsLike {
    Get-HarnessManifestSelections $prefixManifest $f.SourceRoot
} '*file-directory collision*' 'file-directory prefix collision blocks'

$real = Join-Path $f.Root 'real-vendor'
$junction = Join-Path $f.SourceRoot 'linked-vendor'
[IO.Directory]::CreateDirectory($real) | Out-Null
New-Item -ItemType Junction -Path $junction -Target $real | Out-Null
Assert-ThrowsLike {
    Resolve-HarnessSourceFile $f.SourceRoot 'linked-vendor/file.txt'
} '*reparse point*' 'source junction blocks'

$targetFixture = New-Fixture
try {
    $realTarget = Join-Path $targetFixture.Root 'real-target-vendor'
    [IO.Directory]::CreateDirectory($targetFixture.AgentsHome) | Out-Null
    [IO.Directory]::CreateDirectory($realTarget) | Out-Null
    New-Item -ItemType Junction -Path (Join-Path $targetFixture.AgentsHome 'vendor') -Target $realTarget | Out-Null
    $beforeTarget = Get-TreeHashes $realTarget
    $targetCheck = Invoke-Harness $targetFixture Check -IncludeDesignFrontend
    $targetResult = Read-Result $targetCheck 'target junction check'
    Assert-Equal $targetResult.status 'blocked' 'target junction blocks full check'
    Assert-True (@($targetResult.blockers | Where-Object { $_.message -like '*reparse point*' }).Count -gt 0) 'target junction is reported'
    Assert-TreeEqual (Get-TreeHashes $realTarget) $beforeTarget 'target junction check writes nothing'
    Assert-True (-not (Test-Path -LiteralPath $targetFixture.State)) 'target junction writes no state'
    Assert-True (-not (Test-Path -LiteralPath $targetFixture.BackupRoot)) 'target junction creates no backup'
} finally {
    Remove-Fixture $targetFixture
}
```

manifest의 모든 destination을 먼저 정규화·중복 검사한 다음 source file을 연다. 같은 source dependency를 둘 이상의 스킬이 공유해야 하는 실제 요구가 생기기 전에는 duplicate merge 규칙을 만들지 않고 exact·case-only duplicate를 모두 차단한다.

- [ ] **Step 5: sync contract를 다시 실행한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: `PASS sync-harness contract`

- [ ] **Step 6: Task 1을 커밋한다**

```powershell
git add -- scripts/sync-harness.ps1 tests/sync-harness.tests.ps1
git diff --cached --check
git commit -m "fix: harden harness manifest paths"
```

---

### Task 2: 결정론적 project setup helper와 명시 호출 스킬 추가

**Files:**
- Modify: `.gitattributes`
- Create: `skills/joewrks-project-setup/SKILL.md`
- Create: `skills/joewrks-project-setup/agents/openai.yaml`
- Create: `skills/joewrks-project-setup/scripts/project-setup.ps1`
- Create: `tests/project-setup.tests.ps1`

**Interfaces:**
- Produces CLI: `project-setup.ps1 -Check -ProjectPath <path>`
- Produces CLI: `project-setup.ps1 -Apply -ProjectPath <path> -ExpectedRoot <root> -ExpectedTargetHash <sha256-or-absent> -ManagedBodyBase64 <base64>`
- Produces function for tests: `Invoke-JoewrksProjectSetup` with internal-only `-AfterReplace`
- Output: one JSON object with `status`, `projectRoot`, `target`, `targetHash`, `changesRequired`, `blockers`, `rollback`, `unresolvedTargets`

- [ ] **Step 1: helper 계약의 failing standalone test를 작성한다**

`tests/project-setup.tests.ps1`은 임시 Git repository를 만들고 다음을 순서대로 검증한다.

```powershell
$RepositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Implementation = Join-Path $RepositoryRoot 'skills\joewrks-project-setup\scripts\project-setup.ps1'
if (-not (Test-Path -LiteralPath $Implementation -PathType Leaf)) {
    throw 'Missing required project setup helper'
}

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

function Assert-Equal {
    param($Actual, $Expected, [string] $Message)
    if ($Actual -cne $Expected) {
        throw "Assertion failed: $Message; expected [$Expected], got [$Actual]"
    }
}

function New-ProjectFixture {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('joewrks-project-' + [Guid]::NewGuid().ToString('N'))
    $project = Join-Path $root 'project'
    [IO.Directory]::CreateDirectory($project) | Out-Null
    & git -C $project init --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Could not initialize project fixture' }
    [pscustomobject] @{ Root = $root; Project = $project; Helper = $Implementation }
}

function Remove-ProjectFixture {
    param($Fixture)
    if (Test-Path -LiteralPath $Fixture.Root) { [IO.Directory]::Delete($Fixture.Root, $true) }
}

function Get-TreeHashes {
    param([string] $Root)
    $result = [ordered] @{}
    foreach ($file in @(Get-ChildItem -LiteralPath $Root -File -Recurse | Sort-Object FullName)) {
        $relative = $file.FullName.Substring($Root.Length).TrimStart('\', '/').Replace('\', '/')
        if ($relative -eq '.git' -or $relative.StartsWith('.git/')) { continue }
        $result[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $result
}

function Assert-TreeEqual {
    param($Actual, $Expected, [string] $Message)
    if (($Actual | ConvertTo-Json -Compress) -cne ($Expected | ConvertTo-Json -Compress)) {
        throw "Assertion failed: $Message"
    }
}

function Invoke-ProjectHelper {
    param(
        $Fixture,
        [ValidateSet('Check', 'Apply')] [string] $Mode,
        [string] $ExpectedRoot,
        [string] $ExpectedTargetHash,
        [string] $ManagedBodyBase64
    )
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $Fixture.Helper, "-$Mode", '-ProjectPath', $Fixture.Project)
    if ($Mode -eq 'Apply') {
        $arguments += @(
            '-ExpectedRoot', $ExpectedRoot,
            '-ExpectedTargetHash', $ExpectedTargetHash,
            '-ManagedBodyBase64', $ManagedBodyBase64
        )
    }
    $output = @(& powershell.exe @arguments 2>&1)
    $exitCode = $LASTEXITCODE
    [pscustomobject] @{
        ExitCode = $exitCode
        Result = (($output -join "`n") | ConvertFrom-Json)
    }
}

$f = New-ProjectFixture
$before = Get-TreeHashes $f.Project
$check = Invoke-ProjectHelper $f Check
Assert-Equal $check.ExitCode 0 'check succeeds'
Assert-Equal $check.Result.status 'ready' 'safe project is ready'
Assert-Equal $check.Result.targetHash 'absent' 'missing AGENTS uses absent snapshot'
Assert-TreeEqual (Get-TreeHashes $f.Project) $before 'check is read-only'

$body = "# Project Contract`n- Test: ``npm test``"
$encoded = [Convert]::ToBase64String((New-Object Text.UTF8Encoding($false)).GetBytes($body))
$apply = Invoke-ProjectHelper $f Apply -ExpectedRoot $check.Result.projectRoot `
    -ExpectedTargetHash $check.Result.targetHash -ManagedBodyBase64 $encoded
Assert-Equal $apply.Result.status 'current' 'apply reaches current'
```

같은 파일에서 BOM·CRLF·marker 밖 byte 보존, 8 KiB body, 32 KiB final file, incomplete marker, nonempty `AGENTS.override.md`, check 뒤 hash 변경, 다른 Git root, concurrent edit와 rollback incomplete를 검증한다.

- [ ] **Step 2: 새 helper 파일이 없어 test가 실패하는지 확인한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
```

Expected: FAIL with `Missing required project setup helper`.

- [ ] **Step 3: PowerShell parameter sets와 결과 계약을 구현한다**

helper source를 만들기 전에 `.gitattributes`에 다음을 추가하고, 세 새 파일을 UTF-8 no-BOM LF로 작성한다.

```gitattributes
/skills/joewrks-project-setup/** text eol=lf
```

사람이 실행하는 script의 outer parameter는 loose하게 받아 recognized argument의 누락·충돌도 JSON으로 변환한다. strict parameter set과 test-only `-AfterReplace`는 dot-source 가능한 내부 함수에 둔다.

```powershell
[CmdletBinding()]
param(
    [switch] $Check,
    [switch] $Apply,
    [string] $ProjectPath,
    [string] $ExpectedRoot,
    [string] $ExpectedTargetHash,
    [string] $ManagedBodyBase64
)

$script:ProjectBeginMarker = '<!-- JOEWRKS-PROJECT:BEGIN -->'
$script:ProjectEndMarker = '<!-- JOEWRKS-PROJECT:END -->'
```

내부 `Invoke-JoewrksProjectSetup`은 `Check`와 `Apply` 두 mandatory parameter set, 공통 mandatory `ProjectPath`, Apply 전용 mandatory snapshot 세 필드, parameter set 밖의 test-only `[scriptblock] $AfterReplace`를 가진다. Step 3의 root·encoding·marker 검사는 이 함수에서 check 결과를 만들고 Step 4의 snapshot·write·rollback도 같은 함수에서 이어서 처리한다.

`git -C <ProjectPath> rev-parse --show-toplevel`의 한 줄 결과만 root로 받고, 실패·복수 줄·root 밖 target·reparse point를 차단한다. check 결과의 missing target은 문자열 `absent`, 존재 target은 lowercase SHA-256으로 출력한다.

script bottom은 정확히 한 mode와 mode별 필드를 직접 검증한 뒤에만 내부 함수를 splat한다. 누락된 `ProjectPath`, `-Check -Apply` 동시 입력, Apply snapshot 필드 누락을 각각 `status=blocked`, exit 2의 단일 JSON으로 반환하는 raw CLI test를 추가한다. PowerShell 자체가 script body 전에 거부하는 문법 오류나 알 수 없는 parameter name은 이 JSON 계약의 범위가 아니다.

- [ ] **Step 4: apply의 snapshot·byte 변환·rollback을 구현한다**

```powershell
if ($resolvedRoot -cne [IO.Path]::GetFullPath($ExpectedRoot)) {
    throw 'Git root changed after check'
}
$snapshot = Get-ProjectFileSnapshot $targetPath
$actualExpected = if ($snapshot.Exists) { $snapshot.Hash } else { 'absent' }
if ($actualExpected -cne $ExpectedTargetHash) {
    throw 'AGENTS.md changed after check'
}
$managedBodyBytes = [Convert]::FromBase64String($ManagedBodyBase64)
if ($managedBodyBytes.Length -gt 8KB) { throw 'Managed body exceeds 8 KiB' }
```

body는 strict UTF-8로 decode하고 두 marker 포함을 거부한다. 기존 target의 BOM과 newline을 보존해 marker block을 생성하며 planned file이 32 KiB를 넘으면 쓰지 않는다. 같은 디렉터리 temp file을 hash 검증한 뒤 `File.Replace` 또는 `File.Move`하고 post-write hash를 확인한다. 실패 후 current hash가 applied hash와 같을 때만 pre-write bytes를 복구하며 아니면 `unknown`을 반환한다.

- [ ] **Step 5: SKILL.md와 explicit-only metadata를 작성한다**

`SKILL.md`는 다음 순서를 고정한다.

1. 명시 호출이 아니면 project file을 쓰지 않는다.
2. helper `-Check`를 먼저 실행한다.
3. package manifest, 현재 명령, 디자인 시스템과 검증 근거를 최소 범위로 읽는다.
4. 확인된 사실만 8 KiB 이하 관리 body로 제안한다.
5. 사용자가 `apply`를 명시한 경우 check의 exact root/hash와 body를 helper에 전달한다.
6. helper JSON과 실제 diff만 완료 증거로 보고한다.

`agents/openai.yaml`의 정책은 정확히 다음을 포함한다.

```yaml
policy:
  allow_implicit_invocation: false
```

- [ ] **Step 6: helper test와 skill validator를 실행한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
$resolvedCodexHome = if ([string]::IsNullOrWhiteSpace($env:CODEX_HOME)) { Join-Path $env:USERPROFILE '.codex' } else { $env:CODEX_HOME }
python -B (Join-Path $resolvedCodexHome 'skills\.system\skill-creator\scripts\quick_validate.py') .\skills\joewrks-project-setup
```

Expected: project setup contract PASS and skill validator success.

- [ ] **Step 7: Task 2를 커밋한다**

```powershell
git add -- .gitattributes skills/joewrks-project-setup tests/project-setup.tests.ps1
git diff --cached --check
git commit -m "feat: add deterministic project setup skill"
```

---

### Task 3: 새 스킬을 manifest bundle과 설치 layout에 등록

**Files:**
- Modify: `vendor/source-manifest.json`
- Modify: `tests/design-vendor-integrity.tests.mjs`
- Modify: `tests/sync-harness.tests.ps1`
- Modify: `scripts/sync-harness.ps1:216-250,522-525`

**Interfaces:**
- Manifest keeps: `activeSkills`
- Adds per active skill: `activationPolicy`
- Adds active skill: `joewrks-project-setup`
- Generalizes collision check to all manifest-selected skill names.

- [ ] **Step 1: manifest integrity의 failing expectation을 추가한다**

```javascript
assert.equal(
  manifest.activeSkills['joewrks-design-frontend'].activationPolicy,
  'hybrid-personal-pilot',
);
assert.equal(
  manifest.activeSkills['joewrks-project-setup'].activationPolicy,
  'explicit-only',
);
assert.equal(
  manifest.activeSkills['joewrks-project-setup'].evaluationState,
  'candidate',
);

for (const skillName of ['joewrks-design-frontend', 'joewrks-project-setup']) {
  for (const entry of manifest.activeSkills[skillName].files) {
    const text = readFileSync(path.join(ROOT, entry.localPath), 'utf8');
    assert.doesNotMatch(
      text,
      /(?:^|[\s'"`(])(?:[A-Za-z]:[\\/]|\/Users\/|\/home\/)/m,
      `${entry.localPath} contains a personal absolute path`,
    );
  }
}
```

project setup entry의 `files`는 `SKILL.md`, `agents/openai.yaml`, `scripts/project-setup.ps1` 세 파일과 정확히 일치하고 `sourceDependencies`는 빈 배열이어야 한다.

- [ ] **Step 2: Node integrity test가 새 entry 부재로 실패하는지 확인한다**

Run:

```powershell
node --test .\tests\design-vendor-integrity.tests.mjs
```

Expected: FAIL because `joewrks-project-setup` is absent.

- [ ] **Step 3: 실제 bytes와 SHA-256을 측정한다**

Run:

```powershell
$paths = @(
  'skills\joewrks-project-setup\SKILL.md',
  'skills\joewrks-project-setup\agents\openai.yaml',
  'skills\joewrks-project-setup\scripts\project-setup.ps1'
)
$paths | ForEach-Object {
  $item = Get-Item -LiteralPath $_
  [pscustomobject]@{
    localPath = $_.Replace('\','/')
    bytes = $item.Length
    sha256 = (Get-FileHash -LiteralPath $_ -Algorithm SHA256).Hash.ToLowerInvariant()
  }
} | ConvertTo-Json
```

측정 출력의 exact bytes/hash만 manifest와 test constant에 넣는다. design skill의 기존 file bytes/hash와 current evaluation router hash는 바꾸지 않는다.

- [ ] **Step 4: manifest entry를 추가한다**

project setup entry는 다음 고정 metadata를 사용한다.

```json
{
  "authorship": "joewrks-canonical",
  "evaluationState": "candidate",
  "activationPolicy": "explicit-only",
  "sourceDependencies": [],
  "intentionalDifferences": [
    "Explicit-only project inspection and deterministic managed-block writer."
  ],
  "validatorSha256": "5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7"
}
```

design entry에는 `"activationPolicy": "hybrid-personal-pilot"`만 추가한다. Task 2에서 고정한 LF 파일을 다시 읽어 Step 3의 bytes/hash와 일치하는지 확인한 뒤 manifest를 저장한다.

- [ ] **Step 5: collision 검사를 manifest skill 전체로 일반화한다**

`Get-HarnessFrontmatterCollisions`는 hard-coded design 이름 대신 다음 입력을 받는다.

```powershell
param(
    [string[]] $SkillRoots,
    [hashtable] $ManagedSkillFiles
)
```

key는 active skill name, value는 설치될 `SKILL.md` absolute path다. 같은 이름의 directory 또는 frontmatter가 current `.agents\skills`나 legacy Codex skills root에 있고 exact managed file이 아니면 차단한다.

- [ ] **Step 6: installed layout smoke와 두 스킬 collision test를 추가한다**

```powershell
$installedDesign = Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md'
$installedRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $installedDesign))
Assert-True (Test-Path (Join-Path $installedRoot 'vendor\ui-ux-pro-max\scripts\search.py')) 'installed UIUX runtime resolves'
Assert-True (Test-Path (Join-Path $installedRoot 'vendor\apple-design\SKILL.md')) 'installed Apple reference resolves'
Assert-True (Test-Path (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\scripts\project-setup.ps1')) 'project helper installs'
```

이 smoke는 Task 4 전까지 기존 `-IncludeDesignFrontend` opt-in 경로로 실행한다.

- [ ] **Step 7: focused tests를 실행한다**

Run:

```powershell
node --test .\tests\design-vendor-integrity.tests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
```

Expected: all three pass.

- [ ] **Step 8: Task 3을 커밋한다**

```powershell
git add -- vendor/source-manifest.json tests/design-vendor-integrity.tests.mjs tests/sync-harness.tests.ps1 scripts/sync-harness.ps1
git diff --cached --check
git commit -m "feat: register personal harness skills"
```

---

### Task 4: 전체 personal-pilot 기본 선택과 state schema v2 migration

**Files:**
- Modify: `scripts/sync-harness.ps1:252-623`
- Modify: `tests/sync-harness.tests.ps1:18-45,50-88,242-365`

**Interfaces:**
- State v2 exact top-level keys: `schemaVersion`, `bundleSelection`, `agentsHomeIdentitySha256`, `sourceIdentities`, `managedBlocks`, `wholeFileTargets`
- `sourceIdentities` exact keys: `commonCore`, `bundleManifest`
- Result adds: `bundleSelection`, `warnings`
- `-IncludeDesignFrontend`: accepted compatibility no-op

- [ ] **Step 1: default full-bundle와 v1 migration failing tests를 작성한다**

기존 core-only default assertions를 다음 계약으로 바꾼다.

```powershell
$check = Read-Result (Invoke-Harness $f Check) 'default full check'
Assert-Equal $check.bundleSelection 'personal-pilot' 'default selects personal pilot'
Assert-PilotDisclosure $check.designFrontendPilot 'default-personal-pilot' 'default discloses pilot'

$apply = Read-Result (Invoke-Harness $f Apply) 'default full apply'
Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) (Get-OptionalFiles $f.SourceRoot) 'default installs full manifest unit'
```

기존 `Write-Utf8`, `Copy-RelativeFile`, `Get-Hash`를 재사용해 실제 V1 design-opt-in shape를 만드는 helper를 추가한다. Task 3 이후의 current manifest를 복제한 뒤 V2에서 추가한 project skill과 두 activation policy만 제거하면 기존 V1의 active skill·vendor selection이 된다.

```powershell
function Get-V1SelectedFiles {
    param($Manifest)
    $paths = @()
    foreach ($skill in @($Manifest.activeSkills.PSObject.Properties.Value)) {
        $paths += @($skill.files | ForEach-Object { ([string] $_.localPath).Replace('/', '\') })
        foreach ($sourceName in @($skill.sourceDependencies)) {
            $source = $Manifest.sources.PSObject.Properties[[string] $sourceName].Value
            $paths += @($source.files | ForEach-Object { ([string] $_.localPath).Replace('/', '\') })
        }
    }
    @($paths | Sort-Object -Unique)
}

function Write-V1FixtureState {
    param($Fixture, [switch] $WithBundle)
    $manifestPath = Join-Path $Fixture.SourceRoot 'vendor\source-manifest.json'
    $legacyManifest = [IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
    $legacyManifest.activeSkills.PSObject.Properties.Remove('joewrks-project-setup')
    $legacyManifest.activeSkills.'joewrks-design-frontend'.PSObject.Properties.Remove('activationPolicy')
    $legacyManifestText = $legacyManifest | ConvertTo-Json -Depth 100
    $corePath = Join-Path $Fixture.SourceRoot 'AGENTS.md'
    $core = [IO.File]::ReadAllText($corePath).TrimEnd("`r", "`n")
    $block = "$BeginMarker`n$core`n$EndMarker"
    $agentsPath = Join-Path $Fixture.CodexHome 'AGENTS.md'
    Write-Utf8 $agentsPath $block

    $sourceIdentities = [ordered] @{
        commonCore = [ordered] @{ path = 'AGENTS.md'; sha256 = Get-Hash $corePath }
    }
    $wholeFileTargets = [ordered] @{}
    if ($WithBundle) {
        Assert-Equal (($legacyManifest.activeSkills.PSObject.Properties.Name | Sort-Object) -join ',') 'joewrks-design-frontend' 'V1 fixture has only the historical design skill'
        Assert-True (-not ($legacyManifest.activeSkills.'joewrks-design-frontend'.PSObject.Properties.Name -contains 'activationPolicy')) 'V1 fixture predates activationPolicy'
        foreach ($relative in Get-V1SelectedFiles $legacyManifest) {
            Copy-RelativeFile $Fixture.SourceRoot $Fixture.AgentsHome $relative
            $canonical = $relative.Replace('\', '/')
            $wholeFileTargets[$canonical] = Get-Hash (Join-Path $Fixture.AgentsHome $relative)
        }
        $installedManifest = Join-Path $Fixture.AgentsHome 'vendor\source-manifest.json'
        Write-Utf8 $installedManifest ($legacyManifestText + "`n")
        $wholeFileTargets['vendor/source-manifest.json'] = Get-Hash $installedManifest
        $sourceIdentities.designFrontend = [ordered] @{
            path = 'vendor/source-manifest.json'
            sha256 = $wholeFileTargets['vendor/source-manifest.json']
        }
    }

    $state = [ordered] @{
        schemaVersion = 1
        sourceIdentities = $sourceIdentities
        managedBlocks = [ordered] @{ 'AGENTS.md' = Get-Hash $agentsPath }
        wholeFileTargets = $wholeFileTargets
    }
    Write-Utf8 $Fixture.State (($state | ConvertTo-Json -Depth 16) + "`n")
}
```

core-only와 design-only opt-in 각각에서 migration 성공 후 exact v2 key set, 새 project skill 설치와 AgentsHome identity를 검증한다. target operation 중간 실패는 설치 tree와 untouched V1 state를 보존해야 한다. 별도 fixture에서는 state write 직후에 실패를 주입해 exact V1 state bytes와 전체 tree가 복구되는지 검증한다.

```powershell
$beforeTree = @{
    codex = Get-TreeHashes $f.CodexHome
    agents = Get-TreeHashes $f.AgentsHome
}
$beforeState = [IO.File]::ReadAllBytes($f.State)
. $f.Script
$failedAfterState = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome `
    -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace {
        param($replacement)
        if ($replacement.TargetPath -ieq $f.State) { throw 'failure after V2 state replacement' }
    }
Assert-Equal $failedAfterState.status 'failed' 'state-write failure is reported'
Assert-Equal $failedAfterState.rollback.status 'complete' 'state-write rollback completes'
Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'exact V1 state bytes return'
Assert-TreeEqual (Get-TreeHashes $f.CodexHome) $beforeTree.codex 'Codex tree returns to V1'
Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $beforeTree.agents 'Agents tree returns to V1'
```

이 helper가 만드는 schema가 현재 V1 parser의 네 top-level key와 design-only source-identity 규칙을 그대로 대표하므로 별도 역사 fixture 파일은 추가하지 않는다.

- [ ] **Step 2: 새 default 계약 때문에 기존 구현이 실패하는지 확인한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: FAIL because default apply still installs Common Core only and writes schema v1.

- [ ] **Step 3: path identity와 state v2 shape를 구현한다**

```powershell
function Get-HarnessPathIdentity {
    param([string] $Path)
    $normalized = [IO.Path]::GetFullPath($Path).TrimEnd('\', '/').Replace('/', '\').ToUpperInvariant()
    Get-HarnessSha256 ([Text.Encoding]::UTF8.GetBytes($normalized))
}

$desiredState = [ordered] @{
    schemaVersion = 2
    bundleSelection = 'personal-pilot'
    agentsHomeIdentitySha256 = Get-HarnessPathIdentity $resolvedAgentsHome
    sourceIdentities = [ordered] @{
        commonCore = [ordered] @{ path = 'AGENTS.md'; sha256 = ([string] $coreEntry.sha256).ToLowerInvariant() }
        bundleManifest = [ordered] @{ path = 'vendor/source-manifest.json'; sha256 = $manifestHash }
    }
    managedBlocks = [ordered] @{ 'AGENTS.md' = $blockHash }
    wholeFileTargets = $desiredWholeFiles
}
```

v2 state는 whole-file target을 resolve하기 전에 current AgentsHome identity와 비교한다. v1은 기존 exact shape와 installed hashes를 검증한 경우에만 internal normalized state로 읽고 다음 성공 apply에서 v2가 된다.

- [ ] **Step 4: optional selection branch를 하나의 desired set으로 줄인다**

`$IncludeDesignFrontend`와 `$priorOptionalOptIn`에 따른 설치 선택 branch를 제거한다. 현재 manifest selections + installed manifest file이 항상 desired set이며, existing owned set과 비교해 install/update/remove를 계획한다.

```powershell
$desiredWholeFiles = [ordered] @{}
foreach ($entry in $optionalEntries) {
    $desiredWholeFiles[$entry.RelativePath] = $entry.Hash
}
```

기존 obsolete deletion과 rollback operation은 재사용한다. 새 manifest에 없는 owned target은 hash가 prior state와 일치할 때만 제거한다.

- [ ] **Step 5: compatibility warning과 pilot disclosure를 추가한다**

```powershell
$warnings = @()
if ($IncludeDesignFrontend) {
    $warnings += 'DEPRECATED: -IncludeDesignFrontend no longer changes selection; personal-pilot already includes joewrks-design-frontend.'
}
$bundleSelection = 'personal-pilot'
```

플래그 유무의 desired state bytes와 target hashes가 같고 warning 배열만 다른지 test한다.

- [ ] **Step 6: CODEX_HOME와 AgentsHome identity fixtures를 추가한다**

한 fixture는 process의 `CODEX_HOME`만 임시 root로 바꾸고 explicit `-CodexHome` 없이 실행해 `AGENTS.md`와 state가 같은 root에 생기는지 검증한다. 다른 fixture는 v2 state를 유지한 채 `-AgentsHome`만 바꾸고 `invalidState` 또는 `rootIdentity` blocker가 쓰기 전에 발생하는지 검증한다. 기존 state privacy assertion을 v2 key set에도 유지해 state JSON에 drive letter, 사용자 profile 또는 CodexHome·AgentsHome 원문이 들어가지 않는지 확인한다.

- [ ] **Step 7: migration·default·reconciliation focused tests를 실행한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: `PASS sync-harness contract`

- [ ] **Step 8: Task 4를 커밋한다**

```powershell
git add -- scripts/sync-harness.ps1 tests/sync-harness.tests.ps1
git diff --cached --check
git commit -m "feat: install the personal pilot bundle by default"
```

---

### Task 5: ownership 기반 Remove와 정확한 terminal status

**Files:**
- Modify: `scripts/sync-harness.ps1:1-9,252-261,579-835`
- Modify: `tests/sync-harness.tests.ps1:50-88,368-469,472-520`

**Interfaces:**
- Adds CLI: `harness.ps1 -Remove`
- Adds function parameter set: `Invoke-JoewrksHarnessSync -Remove`
- Updates script mode guard and test `Invoke-Harness` helper from two modes to exact `Check|Apply|Remove`.
- Status/exit: `current|ready|removed=0`, `failed=1`, `blocked=2`, `unknown=3`

- [ ] **Step 1: remove와 exit code failing tests를 추가한다**

```powershell
$empty = Invoke-Harness $f Remove
Assert-Equal $empty.ExitCode 0 'empty remove succeeds'
Assert-Equal (Read-Result $empty 'empty remove').status 'removed' 'empty remove is a no-op'
Assert-True (-not (Test-Path $f.BackupRoot)) 'empty remove creates no backup'

Invoke-Harness $f Apply | Out-Null
$removed = Invoke-Harness $f Remove
Assert-Equal $removed.ExitCode 0 'owned remove succeeds'
Assert-Equal (Read-Result $removed 'owned remove').status 'removed' 'owned remove reports removed'
Assert-True (-not (Test-Path $f.State)) 'state is removed last'
```

test helper의 mode 선언을 `[ValidateSet('Check', 'Apply', 'Remove')]`로 바꾸고 public `harness.ps1`의 Remove 전달도 위 no-op과 owned remove 두 경우로 확인한다. mode 없음, `Check+Apply`, `Check+Remove`, `Apply+Remove`는 모두 단일 `blocked` JSON과 exit 2여야 한다.

외부 `AGENTS.md` prefix/suffix 보존, 빈 외부 byte일 때 파일 유지, optional drift 차단, missing owned target 차단, mid-remove complete rollback, concurrent edit incomplete rollback을 추가한다.

- [ ] **Step 2: 현재 CLI가 Remove를 거부해 failing인지 확인한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: FAIL because `-Remove` is not defined.

- [ ] **Step 3: Remove parameter set과 no-op preflight를 추가한다**

```powershell
[switch] $Remove

# Inside Invoke-JoewrksHarnessSync:
[Parameter(Mandatory, ParameterSetName = 'Remove')] [switch] $Remove
```

script bottom의 기존 `$Check -eq $Apply` guard는 제거하고 outer mode 세 개를 직접 센다.

```powershell
$modeCount = ([int] $Check.IsPresent) + ([int] $Apply.IsPresent) + ([int] $Remove.IsPresent)
if ($modeCount -ne 1) { throw 'Specify exactly one of -Check, -Apply, or -Remove.' }
```

outer script, 내부 함수, test helper와 public forwarding 네 층이 같은 세 mode를 받는지 한 test table로 고정한다.

실제 제거는 valid state가 있을 때만 그 state의 managed block과 whole-file targets를 대상으로 한다. state가 없고 JOEWRKS marker와 known managed skill directory도 없으면 backup 없는 `removed`를 반환한다. state가 없는데 owned-looking target이 있으면 자동 삭제하지 않고 `blocked`다.

- [ ] **Step 4: remove operation ordering을 구현한다**

1. 모든 state-owned target hash와 managed block hash를 preflight한다.
2. 모든 existing target과 state를 backup한다.
3. whole-file targets를 제거한다.
4. Common Core block만 제거하고 외부 bytes가 없어도 `AGENTS.md` 파일은 유지한다.
5. 다른 post-write 검증이 모두 끝난 뒤 state를 마지막으로 제거한다.

기존 `Set-HarnessFile`, snapshots, backup과 reverse rollback을 재사용한다. drift 또는 missing owned target은 operation을 만들기 전에 차단한다.

- [ ] **Step 5: incomplete rollback을 unknown으로 분리한다**

```powershell
$terminalStatus = if ($unresolved.Count -eq 0) { 'failed' } else { 'unknown' }
```

CLI exit mapping은 한 함수로 고정한다.

```powershell
function Get-HarnessExitCode {
    param([string] $Status)
    switch ($Status) {
        { $_ -in @('current', 'ready', 'removed') } { 0; break }
        'failed' { 1; break }
        'blocked' { 2; break }
        'unknown' { 3; break }
        default { 3 }
    }
}
```

- [ ] **Step 6: remove·rollback·exit tests를 실행한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: `PASS sync-harness contract`

- [ ] **Step 7: Task 5를 커밋한다**

```powershell
git add -- scripts/sync-harness.ps1 tests/sync-harness.tests.ps1
git diff --cached --check
git commit -m "feat: add ownership-safe harness removal"
```

---

### Task 6: 양언어 README와 전체 배포 검증

**Files:**
- Modify: `README.md`
- Modify: `tests/sync-harness.tests.ps1`

**Interfaces:**
- Documents public CLI: `-Check`, `-Apply`, `-Remove`
- Documents fallback: `-ExecutionPolicy Bypass`
- Documents project skill: explicit `$joewrks-project-setup`
- Documents direct sharing: exact `git archive` + out-of-band SHA-256

- [ ] **Step 1: README contract assertions를 먼저 추가한다**

```powershell
function Test-ReadmeContract {
    $readme = [IO.File]::ReadAllText((Join-Path $RepositoryRoot 'README.md'))
    foreach ($required in @(
        'powershell.exe -NoProfile -File .\harness.ps1 -Apply',
        'powershell.exe -NoProfile -File .\harness.ps1 -Remove',
        'personal-pilot',
        'unknown',
        '$joewrks-project-setup',
        'git archive',
        'Get-FileHash',
        'ExecutionPolicy Bypass'
    )) {
        Assert-True $readme.Contains($required) "README contains $required"
    }
    Assert-True (($readme -split '## English').Count -eq 2) 'README keeps Korean and English sections'
}
```

- [ ] **Step 2: README assertion이 기존 안내에서 실패하는지 확인한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
```

Expected: FAIL because the current README documents core-only install and no remove.

- [ ] **Step 3: 한국어 quick start와 lifecycle을 실제 동작에 맞춘다**

한국어 section은 다음 순서로 쓴다.

1. 기본 `-Apply`는 Common Core, 두 JOEWRKS candidate와 vendor runtime을 설치하는 `personal-pilot`임을 명령 바로 앞에 경고한다.
2. 기본 명령은 `powershell.exe -NoProfile -File`을 사용한다.
3. `-Check`, `-Apply`, `-Check`, 필요 시 `-Remove`를 설명한다.
4. deprecated flag, 상태·exit code, resolved CodexHome·`.agents` layout을 설명한다.
5. project setup은 `$joewrks-project-setup` 명시 호출 후 `check`, 명시적 `apply`로만 쓴다고 설명한다.
6. Python·Figma·browser는 자동 설치되지 않음을 유지한다.

- [ ] **Step 4: 업데이트·제거·backup·공유 절차를 문서화한다**

README에 다음 exact commands를 포함한다.

```powershell
$revision = (git rev-parse --short=12 HEAD).Trim()
$archive = ".\joewrks-work-harness-$revision.zip"
git archive --format=zip --output $archive HEAD
Get-FileHash $archive -Algorithm SHA256
```

checksum은 archive와 다른 신뢰된 채널로 전달해야 의미가 있음을 적는다. source 삭제 후 remove는 exact archive를 보관하거나 compatible newer revision을 다시 받는다고 설명한다. backup은 자동 삭제하지 않고 이전 state와 사용자 `AGENTS.md`가 포함될 수 있으며 복구 필요가 끝난 뒤 수동 삭제한다고 설명한다.

민감정보 검사는 filename denylist에서 발견이 없고 credential pattern의 hit가 exact synthetic fixture로 검토됐으며 그 밖의 발견이 없고, tracked/archive 목록을 사람이 검토했다는 범위만 주장한다.

- [ ] **Step 5: ExecutionPolicy fallback과 English parity를 작성한다**

기본 명령이 정책에 막힌 경우 source commit 또는 ZIP hash를 확인한 뒤에만 다음을 fallback으로 안내한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\harness.ps1 -Check
```

English section은 한국어와 같은 bundle, candidate warning, paths, statuses, exit codes, remove, backup, sharing과 fallback 내용을 포함한다. 저장소 검증 명령은 격리된 test 실행의 재현성을 위해 `-ExecutionPolicy Bypass`를 유지할 수 있다.

- [ ] **Step 6: README contract와 focused runtime tests를 실행한다**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
node --test .\tests\design-vendor-integrity.tests.mjs
```

Expected: all pass.

- [ ] **Step 7: Task 6을 커밋한다**

```powershell
git add -- README.md tests/sync-harness.tests.ps1
git diff --cached --check
git commit -m "docs: explain the personal harness lifecycle"
```

---

### Task 7: 전체 회귀, 설치 fixture와 독립 review

**Files:**
- Modify only if a demonstrated defect is found in files already owned by Tasks 1-6.

**Interfaces:**
- Consumes all prior task outputs.
- Produces verified release candidate evidence; does not install into the real user profile.

- [ ] **Step 1: PowerShell contracts를 실행한다**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\project-setup.tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\p0-evaluation-contract.tests.ps1
```

Expected: all three report PASS with zero failures.

- [ ] **Step 2: Node routing·integrity 회귀를 실행한다**

```powershell
node --test .\tests\*.tests.mjs
```

Expected: zero failed tests. Historical evaluation artifacts remain byte-identical.

- [ ] **Step 3: vendor Python 검사를 실행한다**

```powershell
python -B .\vendor\ui-ux-pro-max\scripts\validate_data.py
python -B -m unittest discover -s .\vendor\ui-ux-pro-max\scripts\tests -p "test_*.py"
```

Expected: data validation succeeds and all unit tests pass.

- [ ] **Step 4: 두 JOEWRKS skill을 검증한다**

```powershell
$resolvedCodexHome = if ([string]::IsNullOrWhiteSpace($env:CODEX_HOME)) { Join-Path $env:USERPROFILE '.codex' } else { $env:CODEX_HOME }
$validator = Join-Path $resolvedCodexHome 'skills\.system\skill-creator\scripts\quick_validate.py'
python -B $validator .\skills\joewrks-design-frontend
python -B $validator .\skills\joewrks-project-setup
```

Expected: both validators succeed.

- [ ] **Step 5: isolated end-to-end lifecycle을 다시 실행한다**

새 temp CodexHome, AgentsHome과 BackupRoot에서 public `harness.ps1`로 다음을 실행한다.

```text
Check -> ready
Apply -> current
Check -> current
Apply -> current with no new backup
Remove -> removed
Remove -> removed with no new backup
```

설치 중 `.agents\skills` 두 개, `.agents\vendor`, state와 Common Core marker가 존재하고 제거 후 state-owned whole files와 marker만 사라지는지 hash tree로 확인한다.

- [ ] **Step 6: repository invariants를 확인한다**

```powershell
git diff --check
git status --short
(Get-Item .\AGENTS.md).Length
(Get-FileHash .\AGENTS.md -Algorithm SHA256).Hash.ToLowerInvariant()
git diff d7dde5d -- .\evals
```

Expected: diff check clean; `AGENTS.md` is 7,933 bytes with the required hash; historical evals have no diff; status contains only intended implementation files.

- [ ] **Step 7: exact HEAD의 임시 공유 archive를 한 번 검증한다**

새 배포 도구는 만들지 않는다. 임시 ZIP만 만들고, tracked/archive 목록 일치와 정의된 최소 denylist·credential pattern을 검사한 뒤 사람이 목록을 훑는다.

```powershell
$shareRoot = Join-Path ([IO.Path]::GetTempPath()) ('joewrks-share-check-' + [Guid]::NewGuid().ToString('N'))
$archive = Join-Path $shareRoot 'joewrks-work-harness.zip'
$expanded = Join-Path $shareRoot 'expanded'
[IO.Directory]::CreateDirectory($expanded) | Out-Null
try {
    git archive --format=zip --output $archive HEAD
    if ($LASTEXITCODE -ne 0) { throw 'git archive failed' }
    $archiveHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    Expand-Archive -LiteralPath $archive -DestinationPath $expanded

    $tracked = @(git ls-tree -r --name-only HEAD | Sort-Object)
    if ($LASTEXITCODE -ne 0) { throw 'git ls-tree failed' }
    $archived = @(Get-ChildItem -LiteralPath $expanded -File -Recurse |
        ForEach-Object { $_.FullName.Substring($expanded.Length).TrimStart('\', '/').Replace('\', '/') } |
        Sort-Object)
    if (($tracked -join "`n") -cne ($archived -join "`n")) { throw 'archive list differs from tracked HEAD' }

    $deniedNames = '(?i)(^|/)(\.env|\.env\.local|\.env\.production|credentials\.json|service-account\.json|id_rsa|id_ed25519)$|(?i)\.(pem|pfx|p12|key)$'
    $deniedFiles = @($archived | Where-Object { $_ -match $deniedNames })
    if ($deniedFiles.Count -gt 0) { throw "denied archive filenames: $($deniedFiles -join ', ')" }

    $credentialPattern = 'AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|sk-(proj|svcacct)-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{48}|BEGIN [A-Z ]{0,20}PRIVATE KEY|(?i)(password|passwd|secret|token)\s*[:=]\s*[''"][^''"]{8,}'
    $credentialMatches = @(& rg -n -I --with-filename --pcre2 $credentialPattern $expanded)
    $scanExit = $LASTEXITCODE
    if ($scanExit -notin @(0, 1)) { throw 'credential scan did not complete' }

    $reviewedSyntheticFiles = @(
        'tests/design-frontend-routing.tests.mjs',
        'tests/codex-app-server-collector.tests.mjs'
    )
    $unreviewedMatches = @()
    foreach ($match in $credentialMatches) {
        $relativeMatch = $match.Substring($expanded.Length).TrimStart('\', '/').Replace('\', '/')
        if ($relativeMatch -notmatch '\A(.+?):\d+:') { throw "unparseable credential match: $relativeMatch" }
        if ($reviewedSyntheticFiles -cnotcontains $Matches[1]) { $unreviewedMatches += $relativeMatch }
    }
    if ($unreviewedMatches.Count -gt 0) {
        throw "unreviewed credential pattern matches:`n$($unreviewedMatches -join "`n")"
    }

    [pscustomobject] @{
        revision = (git rev-parse HEAD).Trim()
        archiveSha256 = $archiveHash
        files = $archived
        reviewedSyntheticMatches = $credentialMatches
    }
} finally {
    $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\', '/')
    $resolvedShare = [IO.Path]::GetFullPath($shareRoot)
    if ($resolvedShare.StartsWith($resolvedTemp + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedShare).StartsWith('joewrks-share-check-', [StringComparison]::Ordinal)) {
        if (Test-Path -LiteralPath $resolvedShare) { [IO.Directory]::Delete($resolvedShare, $true) }
    } else {
        throw "Refusing to clean unexpected share-check path: $resolvedShare"
    }
}
```

최종 검증 보고에는 exact revision, archive SHA-256, 정의된 검사 결과와 tracked/archive 목록을 사람이 검토했다는 사실만 적는다. 이를 “모든 비밀이 없음”으로 표현하지 않는다.

- [ ] **Step 8: independent reviewer에게 diff와 기준만 제공한다**

`superpowers:requesting-code-review`로 reviewer에게 다음을 제공한다.

- 기준 명세와 본 plan
- `git diff d7dde5d...HEAD`
- Tasks 1-7에서 실제 실행한 명령과 결과
- path/reparse, v1 migration, default bundle, remove/unknown, project helper acceptance criteria

writer의 상세 추론은 전달하지 않는다. reviewer가 제기한 항목은 현재 code와 test로 다시 검증하고, 실제 결함만 수정한다.

- [ ] **Step 9: review 수정이 있었다면 affected test와 전체 최소 회귀를 다시 실행하고 커밋한다**

```powershell
$allowed = @(
  '.gitattributes',
  'README.md',
  'scripts/sync-harness.ps1',
  'tests/sync-harness.tests.ps1',
  'tests/project-setup.tests.ps1',
  'tests/design-vendor-integrity.tests.mjs',
  'vendor/source-manifest.json',
  'skills/joewrks-project-setup/SKILL.md',
  'skills/joewrks-project-setup/agents/openai.yaml',
  'skills/joewrks-project-setup/scripts/project-setup.ps1'
)
$changed = @(git diff --name-only)
foreach ($path in $changed) {
  if ($allowed -cnotcontains $path) { throw "Review changed an unauthorized path: $path" }
}
git add -- $changed
git diff --cached --check
git commit -m "fix: close personal harness review gaps"
```

수정 commit 뒤에는 Step 6의 repository invariants와 Step 7의 archive 검증을 새 HEAD에서 다시 실행한다. 수정이 없으면 빈 commit을 만들지 않는다. 실제 사용자 profile 설치와 push는 별도 사용자 지시 전까지 수행하지 않는다.
