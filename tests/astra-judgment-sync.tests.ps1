Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$CurrentScript = Join-Path $RepoRoot 'JOENESS.ps1'
$BeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$EndMarker = '<!-- JOEWRKS-HARNESS:END -->'
$ControlCommit = '80c79e9f4be91d730b1b3cdc62d7bf51508895e8'

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

function New-TestRoot {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('joeness-astra-judgment-' + [guid]::NewGuid().ToString('N'))
    $null = New-Item -ItemType Directory -Path $root
    $codex = Join-Path $root 'codex'
    $agents = Join-Path $root 'agents'
    $backup = Join-Path $root 'backups'
    $null = New-Item -ItemType Directory -Path $codex
    $null = New-Item -ItemType Directory -Path $agents
    [pscustomobject] @{ Root = $root; Codex = $codex; Agents = $agents; Backup = $backup }
}

function Remove-TestRoot {
    param($Fixture)
    if ($null -ne $Fixture -and (Test-Path -LiteralPath $Fixture.Root)) {
        Remove-Item -LiteralPath $Fixture.Root -Recurse -Force
    }
}

function Invoke-Harness {
    param(
        [string] $Script,
        [ValidateSet('Check', 'Apply', 'Remove')] [string] $Mode,
        $Fixture
    )
    $args = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', $Script,
        "-$Mode",
        '-CodexHome', $Fixture.Codex,
        '-AgentsHome', $Fixture.Agents,
        '-BackupRoot', $Fixture.Backup
    )
    $lines = @(& powershell.exe @args 2>&1)
    $exitCode = $LASTEXITCODE
    $jsonLine = @($lines | ForEach-Object { [string] $_ } | Where-Object { $_.TrimStart().StartsWith('{') } | Select-Object -Last 1)
    if ($jsonLine.Count -ne 1) {
        throw "Harness returned no parseable JSON for $Mode. Exit=$exitCode Output=$($lines -join ' | ')"
    }
    [pscustomobject] @{
        ExitCode = $exitCode
        Result = ($jsonLine[0] | ConvertFrom-Json)
        Output = @($lines)
    }
}

function Write-OriginalAgents {
    param($Fixture)
    $bytes = (New-Object Text.UTF8Encoding($false)).GetBytes("user prefix`r`nuser suffix")
    [IO.File]::WriteAllBytes((Join-Path $Fixture.Codex 'AGENTS.md'), $bytes)
    $bytes
}

function Test-CurrentLifecycle {
    $f = New-TestRoot
    try {
        $original = Write-OriginalAgents $f

        $check = Invoke-Harness $CurrentScript Check $f
        Assert-Equal $check.ExitCode 0 'clean Check exits 0'
        Assert-Equal $check.Result.status 'ready' 'clean v0.2 target is ready for explicit Apply'
        Assert-Equal $check.Result.changesRequired $true 'clean v0.2 target requires Apply'
        Assert-Equal @($check.Result.activeSkills).Count 0 'v0.2 exposes no public skills'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Codex 'joewrks-harness-state.json'))) 'Check is read-only'

        $apply = Invoke-Harness $CurrentScript Apply $f
        Assert-Equal $apply.ExitCode 0 'Apply exits 0'
        Assert-Equal $apply.Result.status 'current' 'Apply installs current v0.2 state'
        Assert-Equal $apply.Result.changesRequired $false 'Apply reaches current'
        Assert-Equal @($apply.Result.activeSkills).Count 0 'Apply still exposes zero skills'

        $agentsPath = Join-Path $f.Codex 'AGENTS.md'
        $agentsText = [IO.File]::ReadAllText($agentsPath)
        Assert-True $agentsText.StartsWith("user prefix`r`nuser suffix") 'Apply preserves user prefix bytes/text'
        Assert-Equal ([regex]::Matches($agentsText, [regex]::Escape($BeginMarker))).Count 1 'Apply writes one begin marker'
        Assert-Equal ([regex]::Matches($agentsText, [regex]::Escape($EndMarker))).Count 1 'Apply writes one end marker'
        Assert-True $agentsText.Contains('# JOENESS — Independent Judgment') 'Apply installs Independent Judgment only'
        Assert-True $agentsText.Contains('Do not optimize for agreement.') 'Apply installs non-agreement rule'

        $statePath = Join-Path $f.Codex 'joewrks-harness-state.json'
        Assert-True (Test-Path -LiteralPath $statePath -PathType Leaf) 'Apply writes ownership state'
        $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
        Assert-Equal $state.schemaVersion 2 'state schema remains v2'
        Assert-Equal $state.sourceIdentities.commonCore.path 'astra-judgment-core.md' 'state binds active core source'
        Assert-Equal @($state.wholeFileTargets.PSObject.Properties.Name).Count 1 'state owns only installed manifest as whole file'
        Assert-True (@($state.wholeFileTargets.PSObject.Properties.Name) -contains 'vendor/source-manifest.json') 'state owns exact distribution manifest'
        Assert-True (Test-Path -LiteralPath (Join-Path $f.Agents 'vendor\source-manifest.json') -PathType Leaf) 'Apply materializes owned manifest'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Agents 'skills'))) 'Apply installs no skills directory'

        $post = Invoke-Harness $CurrentScript Check $f
        Assert-Equal $post.Result.status 'current' 'exact install checks current'
        Assert-Equal $post.Result.changesRequired $false 'exact install needs no changes'

        $beforeBackups = @($(if (Test-Path -LiteralPath $f.Backup) { Get-ChildItem -LiteralPath $f.Backup -Directory -Force } else { @() })).Count
        $repeat = Invoke-Harness $CurrentScript Apply $f
        Assert-Equal $repeat.Result.status 'current' 'repeat Apply is idempotent'
        Assert-Equal $repeat.Result.changesRequired $false 'repeat Apply makes no changes'
        $afterBackups = @($(if (Test-Path -LiteralPath $f.Backup) { Get-ChildItem -LiteralPath $f.Backup -Directory -Force } else { @() })).Count
        Assert-Equal $afterBackups $beforeBackups 'idempotent Apply creates no ceremony backup'

        $remove = Invoke-Harness $CurrentScript Remove $f
        Assert-Equal $remove.ExitCode 0 'Remove exits 0'
        Assert-Equal $remove.Result.status 'removed' 'exact current install removes cleanly'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $original 'Remove restores exact original AGENTS bytes'
        Assert-True (-not (Test-Path -LiteralPath $statePath)) 'Remove deletes ownership state'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Agents 'vendor\source-manifest.json'))) 'Remove deletes owned installed manifest'

        $final = Invoke-Harness $CurrentScript Check $f
        Assert-Equal $final.Result.status 'ready' 'post-Remove current release is ready for optional reinstall'
        Assert-Equal $final.Result.changesRequired $true 'post-Remove Check advertises explicit Apply'
    } finally {
        Remove-TestRoot $f
    }
}

function Test-UnownedAndDriftFailClosed {
    $f = New-TestRoot
    try {
        [IO.File]::WriteAllText((Join-Path $f.Codex 'AGENTS.md'), "$BeginMarker`nuser-owned content`n$EndMarker", (New-Object Text.UTF8Encoding($false)))
        $before = [IO.File]::ReadAllBytes((Join-Path $f.Codex 'AGENTS.md'))
        $check = Invoke-Harness $CurrentScript Check $f
        Assert-True ($check.ExitCode -ne 0) 'unowned marker exits nonzero'
        Assert-Equal $check.Result.status 'blocked' 'unowned marker blocks Check'
        Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $f.Codex 'AGENTS.md')) ) $before 'blocked Check preserves unowned bytes'
    } finally {
        Remove-TestRoot $f
    }

    $f = New-TestRoot
    try {
        $null = Write-OriginalAgents $f
        Assert-Equal (Invoke-Harness $CurrentScript Apply $f).Result.status 'current' 'drift fixture installs current'
        $agentsPath = Join-Path $f.Codex 'AGENTS.md'
        $text = [IO.File]::ReadAllText($agentsPath)
        [IO.File]::WriteAllText($agentsPath, $text.Replace('Do not optimize for agreement.', 'Do not optimize for automatic agreement.'), (New-Object Text.UTF8Encoding($false)))
        $driftBytes = [IO.File]::ReadAllBytes($agentsPath)

        foreach ($mode in @('Check', 'Remove')) {
            $run = Invoke-Harness $CurrentScript $mode $f
            Assert-True ($run.ExitCode -ne 0) "drifted $mode exits nonzero"
            Assert-Equal $run.Result.status 'blocked' "drifted owned block blocks $mode"
            Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $driftBytes "drifted $mode performs no repair"
        }
    } finally {
        Remove-TestRoot $f
    }
}

function Test-ApplyRollback {
    $f = New-TestRoot
    try {
        $original = Write-OriginalAgents $f
        $script = Join-Path $RepoRoot 'scripts\sync-harness.ps1'
        . $script
        $result = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.Codex -AgentsHome $f.Agents -BackupRoot $f.Backup -AfterReplace {
            param($operation)
            throw "injected failure after $($operation.TargetPath)"
        }
        Assert-Equal $result.status 'failed' 'injected Apply failure rolls back completely'
        Assert-Equal $result.rollback.status 'complete' 'rollback is complete'
        Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $f.Codex 'AGENTS.md'))) $original 'rollback restores original AGENTS bytes'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Codex 'joewrks-harness-state.json'))) 'rollback leaves no state'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.Agents 'vendor\source-manifest.json'))) 'rollback leaves no owned manifest'
    } finally {
        Remove-TestRoot $f
    }
}

function Test-ExactControlLegacyRemoval {
    $f = New-TestRoot
    try {
        $original = Write-OriginalAgents $f
        $controlRoot = Join-Path $f.Root 'control-source'
        $controlZip = Join-Path $f.Root 'control.zip'
        & git -C $RepoRoot archive --format=zip --output=$controlZip $ControlCommit
        if ($LASTEXITCODE -ne 0) { throw 'Unable to materialize exact historical Control commit' }
        Expand-Archive -LiteralPath $controlZip -DestinationPath $controlRoot
        $controlScript = Join-Path $controlRoot 'JOENESS.ps1'
        Assert-True (Test-Path -LiteralPath $controlScript -PathType Leaf) 'historical Control entrypoint materialized'

        $controlApply = Invoke-Harness $controlScript Apply $f
        Assert-Equal $controlApply.ExitCode 0 'historical Control fixture installs'
        Assert-Equal $controlApply.Result.status 'current' 'historical Control reaches current under its own runtime'

        $legacyCheck = Invoke-Harness $CurrentScript Check $f
        Assert-Equal $legacyCheck.ExitCode 0 'current Check recognizes exact Control'
        Assert-Equal $legacyCheck.Result.status 'legacy' 'exact Control is legacy, not auto-migrated'
        Assert-Equal $legacyCheck.Result.changesRequired $false 'legacy Check does not direct Apply over Control'

        $legacyApply = Invoke-Harness $CurrentScript Apply $f
        Assert-Equal $legacyApply.Result.status 'legacy' 'current Apply refuses implicit legacy migration'

        $remove = Invoke-Harness $CurrentScript Remove $f
        Assert-Equal $remove.ExitCode 0 'current Remove handles exact Control'
        Assert-Equal $remove.Result.status 'removed' 'exact Control removal succeeds'
        Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $f.Codex 'AGENTS.md'))) $original 'legacy Remove restores original user AGENTS bytes'

        $post = Invoke-Harness $CurrentScript Check $f
        Assert-Equal $post.Result.status 'ready' 'after legacy removal v0.2 is ready, not silently installed'
        Assert-Equal $post.Result.changesRequired $true 'after legacy removal explicit Apply is required'
    } finally {
        Remove-TestRoot $f
    }
}

Test-CurrentLifecycle
Test-UnownedAndDriftFailClosed
Test-ApplyRollback
Test-ExactControlLegacyRemoval
Write-Host 'PASS Astra Judgment sync contract'
