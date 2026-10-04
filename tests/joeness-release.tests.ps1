Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$EntryPoint = Join-Path $RepoRoot 'JOENESS.ps1'
$BeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$EndMarker = '<!-- JOEWRKS-HARNESS:END -->'
$PreCleanupMain = 'cb1bc9f9032cb8d1cc380369ca2305100e6c332b'
$HistoricalControl = '80c79e9f4be91d730b1b3cdc62d7bf51508895e8'
$BeforeSetupOnly = '7dc7cdfda184c0d3057aaa7d9925e383efa0fb81'

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw "ASSERT TRUE failed: $Message" }
}
function Assert-Equal($Actual, $Expected, [string] $Message) {
    if ($Actual -cne $Expected) { throw "ASSERT EQUAL failed: $Message`nExpected: $Expected`nActual: $Actual" }
}
function Assert-BytesEqual([byte[]] $Actual, [byte[]] $Expected, [string] $Message) {
    Assert-Equal ([Convert]::ToBase64String($Actual)) ([Convert]::ToBase64String($Expected)) $Message
}
function Assert-ExactNames([string] $Path, [string[]] $Expected, [string] $Message) {
    $actual = @((Get-ChildItem -LiteralPath $Path -Force | Where-Object {
        $_.Name -notin @('.git','.superpowers') -and
        -not ($Path -eq $RepoRoot -and $_.PSIsContainer -and $_.Name -eq '.worktrees')
    } | ForEach-Object { $_.Name }) | Sort-Object -CaseSensitive)
    $wanted = @($Expected | Sort-Object -CaseSensitive)
    Assert-Equal ($actual -join "`n") ($wanted -join "`n") $Message
}
function Get-Sha256([byte[]] $Bytes) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function New-TestRoot {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('joeness-release-' + [guid]::NewGuid().ToString('N'))
    $null = New-Item -ItemType Directory -Path $root
    [pscustomobject]@{ Root = $root; Codex = Join-Path $root 'codex' }
}
function Remove-TestRoot($Fixture) {
    if ($null -eq $Fixture) { return }
    $full = [IO.Path]::GetFullPath($Fixture.Root)
    $temp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($full.StartsWith($temp, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $full -Leaf) -like 'joeness-release-*' -and (Test-Path -LiteralPath $full)) {
        Remove-Item -LiteralPath $full -Recurse -Force
    }
}
function Invoke-JoenessCli([ValidateSet('Check','Apply','Remove')] [string] $Mode, $Fixture) {
    $args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$EntryPoint,"-$Mode",'-CodexHome',$Fixture.Codex)
    $start = New-Object Diagnostics.ProcessStartInfo
    $start.FileName = 'powershell.exe'
    $start.Arguments = ($args | ForEach-Object { '"' + $_ + '"' }) -join ' '
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardOutputEncoding = New-Object Text.UTF8Encoding($false)
    $start.StandardErrorEncoding = New-Object Text.UTF8Encoding($false)
    $process = New-Object Diagnostics.Process
    $process.StartInfo = $start
    try {
        $null = $process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        $process.WaitForExit()
        $lines = @($stdout.Result -split "`r?`n" | Where-Object { $_.Length })
        $guidance = $stderr.Result
        $exitCode = $process.ExitCode
    } finally { $process.Dispose() }
    $jsonLine = @($lines | Where-Object { $_.TrimStart().StartsWith('{') } | Select-Object -Last 1)
    if ($jsonLine.Count -ne 1) { throw "JOENESS returned no parseable JSON for $Mode. Exit=$exitCode Output=$($lines -join ' | ')" }
    [pscustomobject]@{ ExitCode = $exitCode; Result = ($jsonLine[0] | ConvertFrom-Json); Guidance = $guidance }
}

function Test-MinimalCurrentTree {
    $trackedWorktrees = @(& git -C $RepoRoot ls-files -- .worktrees)
    Assert-Equal $LASTEXITCODE 0 'worktree payload check succeeds'
    Assert-Equal $trackedWorktrees.Count 0 'local worktrees are not tracked payload'
    Assert-ExactNames $RepoRoot @('.gitattributes','.github','.gitignore','AGENTS.md','JOENESS.ps1','README.md','docs','fixtures','skills','evals','scripts','tests','vendor') 'root contains only setup-only surface'
    Assert-ExactNames (Join-Path $RepoRoot '.github') @('workflows') '.github only has workflows'
    Assert-ExactNames (Join-Path $RepoRoot '.github/workflows') @('windows-ci.yml') 'one release workflow'
    Assert-ExactNames (Join-Path $RepoRoot 'scripts') @('sync-harness.ps1') 'one package script'
    Assert-ExactNames (Join-Path $RepoRoot 'tests') @('joeness-release.tests.ps1','joeness-install.tests.ps1','joeness-project-setup.tests.ps1','joeness-setup-contract.tests.mjs','joeness-setup-fixtures.tests.mjs') 'current test surface'
    Assert-ExactNames (Join-Path $RepoRoot 'vendor') @('source-manifest.json') 'one active manifest'
    Assert-ExactNames (Join-Path $RepoRoot 'evals/experiments') @('joeness-astra-independent-judgment-ab-plan-v1.json','joeness-astra-independent-judgment-ab-run-2026-09-26.json','joeness-astra-independent-judgment-ab-invalid-preflight-2026-09-26.json','joeness-astra-independent-judgment-ab-results-2026-09-26.json') 'bounded A/B evidence remains'
    foreach ($removed in @('astra-judgment-core.md','JOENESS-0.1.ps1','harness.ps1','common-core.md','TASKS.md')) {
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $RepoRoot $removed))) "$removed is not active payload"
    }
}

function Test-HistoryStillOwnsOldFiles {
    foreach ($commit in @($PreCleanupMain,$HistoricalControl,$BeforeSetupOnly)) {
        & git -C $RepoRoot cat-file -e "$commit^{commit}"
        Assert-Equal $LASTEXITCODE 0 "historical commit $commit exists"
    }
    & git -C $RepoRoot cat-file -e "$PreCleanupMain`:common-core.md"
    Assert-Equal $LASTEXITCODE 0 'old Common Core exists in Git history'
    & git -C $RepoRoot cat-file -e "$PreCleanupMain`:skills/design/SKILL.md"
    Assert-Equal $LASTEXITCODE 0 'old public skill exists in Git history'
    & git -C $RepoRoot cat-file -e "$BeforeSetupOnly`:astra-judgment-core.md"
    Assert-Equal $LASTEXITCODE 0 'removed judgment Core exists in Git history'
}

function Test-ManifestAndEvidence {
    $manifest = [IO.File]::ReadAllText((Join-Path $RepoRoot 'vendor/source-manifest.json')) | ConvertFrom-Json
    Assert-Equal $manifest.schemaVersion 3 'manifest schema is v3'
    Assert-Equal $manifest.release.name 'JOENESS' 'release name'
    Assert-Equal $manifest.release.version '0.3.1' 'release identity'
    Assert-Equal $manifest.release.entrypoint 'JOENESS.ps1' 'entrypoint'
    Assert-Equal $manifest.target.model 'gpt-6-astra' 'target model'
    Assert-Equal $manifest.target.reasoningEffort 'xhigh' 'target reasoning'
    Assert-Equal $manifest.runtimeMode 'setup-only' 'no always-on Core mode'
    Assert-True ($null -eq $manifest.PSObject.Properties['activeCommonCore']) 'no active Core field'
    Assert-Equal @($manifest.managedRuntimeFiles).Count 0 'no managed runtime files'
    Assert-Equal ($manifest.publicSkills.name -join ',') 'joeness-setup' 'one public skill'
    Assert-Equal @($manifest.defaultVendors).Count 0 'no default vendors'
    Assert-True ($null -eq $manifest.pluginRouting) 'no plugin routing'
    Assert-True ($null -eq $manifest.PSObject.Properties['compatibility']) 'no compatibility archive'

    $ab = [IO.File]::ReadAllText((Join-Path $RepoRoot 'evals/experiments/joeness-astra-independent-judgment-ab-plan-v1.json')) | ConvertFrom-Json
    Assert-Equal $ab.status 'COMPLETED' 'A/B plan remains'
    Assert-Equal $ab.results.validRuns 16 'sixteen valid runs'
    Assert-Equal $ab.conclusion 'BARE-EQUIVALENT-OBSERVED' 'bounded conclusion'
    $protocolPath = Join-Path $RepoRoot 'evals/experiments/joeness-astra-independent-judgment-ab-run-2026-09-26.json'
    $protocol = [IO.File]::ReadAllText($protocolPath) | ConvertFrom-Json
    Assert-Equal $protocol.status 'PRE_REGISTERED' 'protocol was frozen'
    Assert-Equal @($protocol.cases).Count 8 'eight cases'
    $invalid = [IO.File]::ReadAllText((Join-Path $RepoRoot 'evals/experiments/joeness-astra-independent-judgment-ab-invalid-preflight-2026-09-26.json')) | ConvertFrom-Json
    Assert-Equal $invalid.status 'INVALIDATED_PREFLIGHT' 'invalid run remains'
    Assert-Equal @($invalid.runs).Count 16 'invalid runs preserved'
    $result = [IO.File]::ReadAllText((Join-Path $RepoRoot 'evals/experiments/joeness-astra-independent-judgment-ab-results-2026-09-26.json')) | ConvertFrom-Json
    Assert-Equal $result.status 'COMPLETED' 'valid result remains'
    Assert-Equal $result.preregisteredProtocolSha256 (Get-Sha256 ([IO.File]::ReadAllBytes($protocolPath))) 'valid result binds protocol bytes'
    Assert-Equal @($result.runs).Count 16 'valid result has sixteen runs'
    Assert-Equal @($result.caseScores).Count 8 'all cases scored'
    foreach ($case in $protocol.cases) {
        $pair = @($result.runs | Where-Object { $_.caseId -ceq $case.id })
        Assert-Equal $pair.Count 2 "paired runs for $($case.id)"
        Assert-Equal (($pair.arm | Sort-Object) -join ',') 'Bare,Core' "paired arms for $($case.id)"
    }
    foreach ($run in $result.runs) {
        Assert-Equal @($run.context).Count 2 "verified turns for $($run.caseId) $($run.arm)"
        Assert-Equal $run.toolEvents 0 "no tools for $($run.caseId) $($run.arm)"
        foreach ($context in $run.context) {
            Assert-Equal $context.cwd $result.runtime.sameFixture 'same fixture'
            Assert-Equal $context.model 'gpt-6-astra' 'evaluated model'
            Assert-Equal $context.effort 'xhigh' 'evaluated reasoning'
        }
    }
}

function Test-SetupOnlyLifecycle {
    $fixture = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $fixture.Codex
        $agents = Join-Path $fixture.Codex 'AGENTS.md'
        $original = (New-Object Text.UTF8Encoding($false)).GetBytes("user prefix`r`nuser suffix")
        [IO.File]::WriteAllBytes($agents, $original)
        $check = Invoke-JoenessCli Check $fixture
        Assert-Equal $check.ExitCode 0 'Check exit'
        Assert-Equal $check.Result.status 'ready' 'Check ready'
        Assert-Equal $check.Result.changesRequired $true 'Apply is explicit'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agents)) $original 'Check preserves AGENTS'
        $apply = Invoke-JoenessCli Apply $fixture
        Assert-Equal $apply.ExitCode 0 'Apply exit'
        Assert-Equal $apply.Result.status 'current' 'Apply current'
        Assert-Equal ($apply.Result.activeSkills -join ',') 'joeness-setup' 'only setup active'
        Assert-True ($apply.Guidance.Contains('$joeness-setup')) 'usage guide after success'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agents)) $original 'Apply preserves AGENTS'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fixture.Codex 'joewrks-harness-state.json'))) 'no Core state'
        Assert-True (Test-Path -LiteralPath (Join-Path $fixture.Codex 'joeness-skills-state.json')) 'skill state exists'
        $post = Invoke-JoenessCli Check $fixture
        Assert-Equal $post.Result.status 'current' 'post-Apply Check current'
        Assert-Equal $post.Result.changesRequired $false 'no changes needed'
        $repeat = Invoke-JoenessCli Apply $fixture
        Assert-Equal $repeat.Result.status 'current' 'repeat Apply current'
        Assert-Equal @($repeat.Result.changes).Count 0 'repeat Apply no writes'
        $remove = Invoke-JoenessCli Remove $fixture
        Assert-Equal $remove.ExitCode 0 'Remove exit'
        Assert-Equal $remove.Result.status 'removed' 'Remove succeeds'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agents)) $original 'Remove preserves AGENTS'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fixture.Codex 'joeness-skills-state.json'))) 'skill state removed'
        Assert-Equal (Invoke-JoenessCli Check $fixture).Result.status 'ready' 'post-Remove ready'
    } finally { Remove-TestRoot $fixture }
}

function Test-LegacyAndDriftFailClosed {
    foreach ($kind in @('marker','state')) {
        $fixture = New-TestRoot
        try {
            $null = New-Item -ItemType Directory -Path $fixture.Codex
            if ($kind -eq 'marker') { [IO.File]::WriteAllText((Join-Path $fixture.Codex 'AGENTS.md'), "$BeginMarker`nold`n$EndMarker") }
            else { [IO.File]::WriteAllText((Join-Path $fixture.Codex 'joewrks-harness-state.json'), '{}') }
            $path = if ($kind -eq 'marker') { Join-Path $fixture.Codex 'AGENTS.md' } else { Join-Path $fixture.Codex 'joewrks-harness-state.json' }
            $before = [IO.File]::ReadAllBytes($path)
            foreach ($mode in @('Check','Apply','Remove')) {
                $run = Invoke-JoenessCli $mode $fixture
                Assert-Equal $run.ExitCode 2 "$kind $mode blocked exit"
                Assert-Equal $run.Result.status 'blocked' "$kind $mode blocked"
                Assert-BytesEqual ([IO.File]::ReadAllBytes($path)) $before "$kind $mode preserves bytes"
                Assert-True (-not (Test-Path -LiteralPath (Join-Path $fixture.Codex 'joeness-skills-state.json'))) "$kind $mode does not install"
            }
        } finally { Remove-TestRoot $fixture }
    }
    $fixture = New-TestRoot
    try {
        Assert-Equal (Invoke-JoenessCli Apply $fixture).Result.status 'current' 'drift fixture installs'
        $skill = Join-Path $fixture.Codex 'skills/joeness-setup/SKILL.md'
        [IO.File]::AppendAllText($skill, 'USER')
        $before = [IO.File]::ReadAllBytes($skill)
        foreach ($mode in @('Check','Apply','Remove')) {
            $run = Invoke-JoenessCli $mode $fixture
            Assert-Equal $run.Result.status 'blocked' "owned drift blocks $mode"
            Assert-BytesEqual ([IO.File]::ReadAllBytes($skill)) $before "owned drift $mode preserves"
        }
    } finally { Remove-TestRoot $fixture }
}

function Test-ApplyRollback {
    $fixture = New-TestRoot
    try {
        $null = New-Item -ItemType Directory -Path $fixture.Codex
        $agents = Join-Path $fixture.Codex 'AGENTS.md'
        $original = (New-Object Text.UTF8Encoding($false)).GetBytes('rollback-user')
        [IO.File]::WriteAllBytes($agents, $original)
        . (Join-Path $RepoRoot 'scripts/sync-harness.ps1')
        $result = Invoke-JoenessHarnessSync -Apply -CodexHome $fixture.Codex -AfterWrite { throw 'injected skill write failure' }
        Assert-Equal $result.status 'failed' 'injected Apply failure'
        Assert-Equal $result.rollback.status 'complete' 'complete rollback'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agents)) $original 'rollback preserves AGENTS'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fixture.Codex 'joeness-skills-state.json'))) 'rollback leaves no skill state'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fixture.Codex 'skills/joeness-setup/SKILL.md'))) 'rollback leaves no skill'
    } finally { Remove-TestRoot $fixture }
}

Test-MinimalCurrentTree
Test-HistoryStillOwnsOldFiles
Test-ManifestAndEvidence
Test-SetupOnlyLifecycle
Test-LegacyAndDriftFailClosed
Test-ApplyRollback
Write-Host 'PASS JOENESS setup-only release contract'
