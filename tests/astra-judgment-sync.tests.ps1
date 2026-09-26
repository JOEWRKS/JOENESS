Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$EntryPoint = Join-Path $RepoRoot 'JOENESS.ps1'
$BeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$EndMarker = '<!-- JOEWRKS-HARNESS:END -->'
$PreCleanupMain = 'cb1bc9f9032cb8d1cc380369ca2305100e6c332b'
$HistoricalControl = '80c79e9f4be91d730b1b3cdc62d7bf51508895e8'

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw "ASSERT TRUE failed: $Message" }
}

function Assert-Equal {
    param($Actual, $Expected, [string] $Message)
    if ($Actual -cne $Expected) {
        throw "ASSERT EQUAL failed: $Message`nExpected: $Expected`nActual: $Actual"
    }
}

function Assert-BytesEqual {
    param([byte[]] $Actual, [byte[]] $Expected, [string] $Message)
    if ($Actual.Length -ne $Expected.Length) {
        throw "ASSERT BYTES failed: $Message (length $($Actual.Length) != $($Expected.Length))"
    }
    for ($i = 0; $i -lt $Actual.Length; $i++) {
        if ($Actual[$i] -ne $Expected[$i]) {
            throw "ASSERT BYTES failed: $Message (byte $i differs)"
        }
    }
}

function Assert-ExactNames {
    param([string] $Path, [string[]] $Expected, [string] $Message)
    $actual = @((Get-ChildItem -LiteralPath $Path -Force | Where-Object { $_.Name -notin @('.git','.superpowers') } | ForEach-Object { $_.Name }) | Sort-Object -CaseSensitive)
    $wanted = @($Expected | Sort-Object -CaseSensitive)
    Assert-Equal ($actual -join "`n") ($wanted -join "`n") $Message
}

function Get-Sha256 {
    param([byte[]] $Bytes)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function New-TestRoot {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('joeness-current-' + [guid]::NewGuid().ToString('N'))
    $null = New-Item -ItemType Directory -Path $root
    [pscustomobject] @{
        Root = $root
        Codex = Join-Path $root 'codex'
    }
}

function Remove-TestRoot {
    param($Fixture)
    if ($null -ne $Fixture -and (Test-Path -LiteralPath $Fixture.Root)) {
        Remove-Item -LiteralPath $Fixture.Root -Recurse -Force
    }
}

function Invoke-JoenessCli {
    param([ValidateSet('Check', 'Apply', 'Remove')] [string] $Mode, $Fixture)
    $args = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', $EntryPoint,
        "-$Mode",
        '-CodexHome', $Fixture.Codex
    )
    $lines = @(& powershell.exe @args 2>&1)
    $exitCode = $LASTEXITCODE
    $jsonLine = @($lines | ForEach-Object { [string] $_ } | Where-Object { $_.TrimStart().StartsWith('{') } | Select-Object -Last 1)
    if ($jsonLine.Count -ne 1) {
        throw "JOENESS returned no parseable JSON for $Mode. Exit=$exitCode Output=$($lines -join ' | ')"
    }
    [pscustomobject] @{
        ExitCode = $exitCode
        Result = ($jsonLine[0] | ConvertFrom-Json)
        Output = @($lines)
    }
}

function Test-MinimalCurrentTree {
    Assert-ExactNames $RepoRoot @(
        '.gitattributes',
        '.github',
        '.gitignore',
        'AGENTS.md',
        'JOENESS.ps1',
        'README.md',
        'astra-judgment-core.md',
        'docs',
        'fixtures',
        'skills',
        'evals',
        'scripts',
        'tests',
        'vendor'
    ) 'root contains only current JOENESS surface'

    Assert-ExactNames (Join-Path $RepoRoot '.github') @('workflows') '.github contains only workflows'
    Assert-ExactNames (Join-Path $RepoRoot '.github\workflows') @('windows-ci.yml') 'workflow surface is current-only'
    Assert-ExactNames (Join-Path $RepoRoot 'evals') @('experiments','joeness-setup') 'eval surface contains only current experiments'
    Assert-ExactNames (Join-Path $RepoRoot 'evals\experiments') @('joeness-astra-independent-judgment-ab-plan-v1.json') 'only current behavioral A/B plan remains'
    Assert-ExactNames (Join-Path $RepoRoot 'scripts') @('sync-harness.ps1') 'script surface is current-only'
    Assert-ExactNames (Join-Path $RepoRoot 'tests') @('astra-judgment-sync.tests.ps1','joeness-install.tests.ps1','joeness-project-setup.tests.ps1','joeness-setup-contract.tests.mjs','joeness-setup-fixtures.tests.mjs') 'test surface is current-only'
    Assert-ExactNames (Join-Path $RepoRoot 'vendor') @('source-manifest.json') 'vendor directory contains only active manifest'

    foreach ($removed in @('JOENESS-0.1.ps1', 'harness.ps1', 'common-core.md', 'TASKS.md')) {
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $RepoRoot $removed))) "$removed is absent from current main tree"
    }
}

function Test-HistoryStillOwnsOldFiles {
    foreach ($commit in @($PreCleanupMain, $HistoricalControl)) {
        & git -C $RepoRoot cat-file -e "$commit^{commit}"
        Assert-Equal $LASTEXITCODE 0 "historical commit $commit remains available"
    }

    & git -C $RepoRoot cat-file -e "$PreCleanupMain`:common-core.md"
    Assert-Equal $LASTEXITCODE 0 'removed common-core.md remains in pre-cleanup Git history'
    & git -C $RepoRoot cat-file -e "$PreCleanupMain`:skills/design/SKILL.md"
    Assert-Equal $LASTEXITCODE 0 'removed public skill remains in pre-cleanup Git history'
}

function Test-ManifestAndCoreIdentity {
    $manifestPath = Join-Path $RepoRoot 'vendor\source-manifest.json'
    $manifest = [IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
    Assert-Equal $manifest.schemaVersion 2 'manifest schema is v2'
    Assert-Equal $manifest.release.name 'JOENESS' 'manifest release name'
    Assert-Equal $manifest.release.version '0.2' 'manifest release version'
    Assert-Equal $manifest.target.model 'gpt-6-astra' 'manifest target model'
    Assert-Equal $manifest.target.reasoningEffort 'xhigh' 'manifest reasoning effort'
    Assert-Equal $manifest.runtimeMode 'common-core+setup' 'manifest runtime mode'
    Assert-Equal $manifest.activeCommonCore.path 'astra-judgment-core.md' 'manifest active core'
    Assert-Equal @($manifest.managedRuntimeFiles).Count 0 'no managed runtime files'
    Assert-Equal ($manifest.publicSkills.name -join ',') 'joeness-setup' 'sole approved setup skill'
    Assert-Equal @($manifest.defaultVendors).Count 0 'no default vendors'
    Assert-True ($null -eq $manifest.pluginRouting) 'plugin routing remains null'
    Assert-True ($null -eq $manifest.PSObject.Properties['compatibility']) 'historical compatibility payload is absent'

    $coreBytes = [IO.File]::ReadAllBytes((Join-Path $RepoRoot 'astra-judgment-core.md'))
    Assert-Equal (Get-Sha256 $coreBytes) 'f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9' 'active core remains byte-identical'
    Assert-Equal $manifest.activeCommonCore.sha256 (Get-Sha256 $coreBytes) 'manifest binds exact core bytes'

    $ab = [IO.File]::ReadAllText((Join-Path $RepoRoot 'evals\experiments\joeness-astra-independent-judgment-ab-plan-v1.json')) | ConvertFrom-Json
    Assert-Equal $ab.status 'NOT-RUN' 'behavioral A/B remains not run'
    Assert-True ($null -eq $ab.results) 'behavioral A/B has no results'
    Assert-True ($null -eq $ab.conclusion) 'behavioral A/B has no conclusion'
}

function Test-CurrentLifecycleAndUserBytes {
    $f = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $f.Codex
        $agentsPath = Join-Path $f.Codex 'AGENTS.md'
        $original = (New-Object Text.UTF8Encoding($false)).GetBytes("user prefix`r`nuser suffix")
        [IO.File]::WriteAllBytes($agentsPath, $original)

        $check = Invoke-JoenessCli Check $f
        Assert-Equal $check.ExitCode 0 'clean Check exits 0'
        Assert-Equal $check.Result.status 'ready' 'clean Check is ready'
        Assert-Equal $check.Result.changesRequired $true 'clean Check advertises explicit Apply'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $original 'Check is byte-read-only'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Codex 'joewrks-harness-state.json'))) 'Check writes no state'

        $apply = Invoke-JoenessCli Apply $f
        Assert-Equal $apply.ExitCode 0 'Apply exits 0'
        Assert-Equal $apply.Result.status 'current' 'Apply reaches current'
        $installedText = [IO.File]::ReadAllText($agentsPath)
        Assert-Equal ([regex]::Matches($installedText, [regex]::Escape($BeginMarker))).Count 1 'one begin marker installed'
        Assert-Equal ([regex]::Matches($installedText, [regex]::Escape($EndMarker))).Count 1 'one end marker installed'
        Assert-True $installedText.Contains('Do not optimize for agreement.') 'exact Independent Judgment content installed'

        $post = Invoke-JoenessCli Check $f
        Assert-Equal $post.Result.status 'current' 'post-Apply Check is current'
        Assert-Equal $post.Result.changesRequired $false 'current install needs no changes'

        $beforeRepeat = [IO.File]::ReadAllBytes($agentsPath)
        $repeat = Invoke-JoenessCli Apply $f
        Assert-Equal $repeat.Result.status 'current' 'repeat Apply is current'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $beforeRepeat 'repeat Apply is idempotent'

        $edited = $installedText.Replace('user suffix', 'user suffix edited after install')
        [IO.File]::WriteAllText($agentsPath, $edited, (New-Object Text.UTF8Encoding($false)))
        $remove = Invoke-JoenessCli Remove $f
        Assert-Equal $remove.ExitCode 0 'Remove exits 0'
        Assert-Equal $remove.Result.status 'removed' 'Remove succeeds'
        $expectedEditedPrefix = (New-Object Text.UTF8Encoding($false)).GetBytes("user prefix`r`nuser suffix edited after install")
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $expectedEditedPrefix 'Remove preserves user prefix edits made after install'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Codex 'joewrks-harness-state.json'))) 'Remove deletes current ownership state'

        $final = Invoke-JoenessCli Check $f
        Assert-Equal $final.Result.status 'ready' 'post-Remove Check is ready'
    } finally {
        Remove-TestRoot $f
    }
}

function Test-EmptyExistingAgentsLifecycle {
    $f = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $f.Codex
        $agentsPath = Join-Path $f.Codex 'AGENTS.md'
        [IO.File]::WriteAllBytes($agentsPath, [byte[]] @())

        $check = Invoke-JoenessCli Check $f
        Assert-Equal $check.ExitCode 0 'empty AGENTS Check exits 0'
        Assert-Equal $check.Result.status 'ready' 'empty AGENTS Check is ready'
        Assert-Equal (Get-Item -LiteralPath $agentsPath).Length 0 'Check preserves empty user file'

        $apply = Invoke-JoenessCli Apply $f
        Assert-Equal $apply.ExitCode 0 'empty AGENTS Apply exits 0'
        Assert-Equal $apply.Result.status 'current' 'empty AGENTS Apply reaches current'
        Assert-Equal (Invoke-JoenessCli Check $f).Result.status 'current' 'empty AGENTS install checks current'

        $remove = Invoke-JoenessCli Remove $f
        Assert-Equal $remove.ExitCode 0 'empty AGENTS Remove exits 0'
        Assert-Equal $remove.Result.status 'removed' 'empty AGENTS Remove succeeds'
        Assert-Equal (Get-Item -LiteralPath $agentsPath).Length 0 'Remove restores empty user file'
        Assert-Equal (Invoke-JoenessCli Check $f).Result.status 'ready' 'empty AGENTS post-Remove Check is ready'
    } finally {
        Remove-TestRoot $f
    }
}

function Test-UnownedMarkersFailClosed {
    $f = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $f.Codex
        $agentsPath = Join-Path $f.Codex 'AGENTS.md'
        [IO.File]::WriteAllText($agentsPath, "$BeginMarker`nuser-owned content`n$EndMarker", (New-Object Text.UTF8Encoding($false)))
        $before = [IO.File]::ReadAllBytes($agentsPath)
        foreach ($mode in @('Check', 'Apply', 'Remove')) {
            $run = Invoke-JoenessCli $mode $f
            Assert-True ($run.ExitCode -ne 0) "unowned-marker $mode exits nonzero"
            Assert-Equal $run.Result.status 'blocked' "unowned-marker $mode is blocked"
            Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $before "blocked $mode preserves bytes"
        }
    } finally {
        Remove-TestRoot $f
    }
}

function Test-DriftAndStateTamperFailClosed {
    $f = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $f.Codex
        $agentsPath = Join-Path $f.Codex 'AGENTS.md'
        [IO.File]::WriteAllText($agentsPath, 'user', (New-Object Text.UTF8Encoding($false)))
        Assert-Equal (Invoke-JoenessCli Apply $f).Result.status 'current' 'drift fixture installs current'
        $text = [IO.File]::ReadAllText($agentsPath)
        [IO.File]::WriteAllText($agentsPath, $text.Replace('Do not optimize for agreement.', 'Do not optimize for automatic agreement.'), (New-Object Text.UTF8Encoding($false)))
        $drift = [IO.File]::ReadAllBytes($agentsPath)
        foreach ($mode in @('Check', 'Remove')) {
            $run = Invoke-JoenessCli $mode $f
            Assert-Equal $run.Result.status 'blocked' "managed drift blocks $mode"
            Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $drift "managed drift $mode does not mutate"
        }
    } finally {
        Remove-TestRoot $f
    }

    $f = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $f.Codex
        [IO.File]::WriteAllText((Join-Path $f.Codex 'AGENTS.md'), 'user', (New-Object Text.UTF8Encoding($false)))
        Assert-Equal (Invoke-JoenessCli Apply $f).Result.status 'current' 'state fixture installs current'
        $statePath = Join-Path $f.Codex 'joewrks-harness-state.json'
        $state = [IO.File]::ReadAllText($statePath) | ConvertFrom-Json
        $state.releaseVersion = 'forged'
        [IO.File]::WriteAllText($statePath, (($state | ConvertTo-Json -Compress) + "`n"), (New-Object Text.UTF8Encoding($false)))
        $agentsBefore = [IO.File]::ReadAllBytes((Join-Path $f.Codex 'AGENTS.md'))
        $stateBefore = [IO.File]::ReadAllBytes($statePath)
        foreach ($mode in @('Check', 'Remove')) {
            $run = Invoke-JoenessCli $mode $f
            Assert-Equal $run.Result.status 'blocked' "tampered state blocks $mode"
            Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $f.Codex 'AGENTS.md'))) $agentsBefore "tampered state $mode preserves AGENTS"
            Assert-BytesEqual ([IO.File]::ReadAllBytes($statePath)) $stateBefore "tampered state $mode preserves state"
        }
    } finally {
        Remove-TestRoot $f
    }
}

function Test-ApplyRollback {
    $f = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $f.Codex
        $agentsPath = Join-Path $f.Codex 'AGENTS.md'
        $original = (New-Object Text.UTF8Encoding($false)).GetBytes('rollback-user')
        [IO.File]::WriteAllBytes($agentsPath, $original)

        . (Join-Path $RepoRoot 'scripts\sync-harness.ps1')
        $result = Invoke-JoenessHarnessSync -Apply -CodexHome $f.Codex -AfterWrite {
            param($Stage)
            if ($Stage -eq 'AGENTS.md') { throw 'injected failure after AGENTS write' }
        }
        Assert-Equal $result.status 'failed' 'injected Apply failure reports failed'
        Assert-Equal $result.rollback.status 'complete' 'injected Apply failure rolls back completely'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $original 'rollback restores original AGENTS bytes'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Codex 'joewrks-harness-state.json'))) 'rollback leaves no state'
    } finally {
        Remove-TestRoot $f
    }
}

Test-MinimalCurrentTree
Test-HistoryStillOwnsOldFiles
Test-ManifestAndCoreIdentity
Test-CurrentLifecycleAndUserBytes
Test-EmptyExistingAgentsLifecycle
Test-UnownedMarkersFailClosed
Test-DriftAndStateTamperFailClosed
Test-ApplyRollback
Write-Host 'PASS JOENESS current-only release contract'
