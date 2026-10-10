Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
. (Join-Path $repo 'scripts/sync-harness.ps1')
$utf8 = New-Object Text.UTF8Encoding($false)

function Eq($actual, $expected, [string] $message) {
    if ($actual -cne $expected) { throw "$message expected=$expected actual=$actual" }
}
function BytesEqual([byte[]] $actual, [byte[]] $expected, [string] $message) {
    Eq ([Convert]::ToBase64String($actual)) ([Convert]::ToBase64String($expected)) $message
}
function Snapshot([string] $path) {
    if (-not (Test-Path -LiteralPath $path)) { return '' }
    (@(Get-ChildItem -LiteralPath $path -File -Recurse | Sort-Object FullName | ForEach-Object {
        $_.FullName.Substring($path.Length) + '=' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    }) -join ';')
}
function BlockedWithoutMutation([string] $homePath, [string] $label) {
    $before = Snapshot $homePath
    foreach ($mode in @('Check', 'Apply', 'Remove')) {
        $options = @{ CodexHome = $homePath }; $options[$mode] = $true
        $result = Invoke-JoenessHarnessSync @options
        Eq $result.status blocked "$label $mode"
        Eq (Snapshot $homePath) $before "$label $mode preserves all files"
    }
}

$root = Join-Path ([IO.Path]::GetTempPath()) ('joeness-install-test-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $root
try {
    # Clean install is skill-only; a repeated Apply is a true no-op.
    $clean = Join-Path $root clean
    Eq (Invoke-JoenessHarnessSync -Check -CodexHome $clean).status ready cleanCheck
    Eq (Test-Path (Join-Path $clean AGENTS.md)) $false checkNoAgents
    $installed = Invoke-JoenessHarnessSync -Apply -CodexHome $clean
    Eq $installed.status current cleanApply
    Eq ($installed.activeSkills -join ',') joeness-setup soleSkill
    Eq ([string](Get-JoenessInstallGuide $installed)).Contains('$joeness-setup') $true applyGuide
    Eq (Test-Path (Join-Path $clean AGENTS.md)) $false applyNoAgents
    Eq (Test-Path (Join-Path $clean joewrks-harness-state.json)) $false applyNoCoreState
    Eq (Test-Path (Join-Path $clean skills/joeness-setup/SKILL.md)) $true skillInstalled
    Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $clean -AfterWrite { throw 'no-op wrote' }).status current noOpApply
    Eq (Invoke-JoenessHarnessSync -Check -CodexHome $clean).status current currentCheck
    # Execute the installed consumer; source-only tests cannot catch missing shipped files.
    $priorGateCli = $env:JOENESS_TEST_GATE_CLI
    try {
        $env:JOENESS_TEST_GATE_CLI = Join-Path $clean skills/joeness-setup/scripts/review-gate.mjs
        & node --test (Join-Path $repo tests/joeness-review-gate.tests.mjs)
        if ($LASTEXITCODE -ne 0) { throw 'Installed review gate behavior failed' }
    } finally {
        $env:JOENESS_TEST_GATE_CLI = $priorGateCli
    }
    Eq (Invoke-JoenessHarnessSync -Remove -CodexHome $clean).status removed cleanRemove
    Eq (Test-Path (Join-Path $clean skills/joeness-setup/SKILL.md)) $false skillRemoved
    Eq (Test-Path (Join-Path $clean AGENTS.md)) $false removeNoAgents
    Eq (Test-Path (Join-Path $clean joewrks-harness-state.json)) $false removeNoCoreState

    # Existing user AGENTS bytes, even non-UTF-8, are not the new package's payload.
    $samples = @(
        [pscustomobject]@{ Name = 'ordinary'; Bytes = $utf8.GetBytes("user prefix`r`nuser suffix") },
        [pscustomobject]@{ Name = 'empty'; Bytes = [byte[]]@() },
        [pscustomobject]@{ Name = 'nonutf8'; Bytes = [byte[]]@(0xff, 0xfe, 0x00, 0x80) }
    )
    foreach ($sample in $samples) {
        $homePath = Join-Path $root $sample.Name
        $null = New-Item -ItemType Directory -Path $homePath
        $agents = Join-Path $homePath AGENTS.md
        [IO.File]::WriteAllBytes($agents, [byte[]]$sample.Bytes)
        Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $homePath).status current "$($sample.Name) Apply"
        BytesEqual ([IO.File]::ReadAllBytes($agents)) $sample.Bytes "$($sample.Name) Apply preserves AGENTS"
        Eq (Invoke-JoenessHarnessSync -Remove -CodexHome $homePath).status removed "$($sample.Name) Remove"
        BytesEqual ([IO.File]::ReadAllBytes($agents)) $sample.Bytes "$($sample.Name) Remove preserves AGENTS"
        Eq (Test-Path (Join-Path $homePath joewrks-harness-state.json)) $false "$($sample.Name) no Core state"
    }

    # Either half of an old global Core installation blocks all modes.
    $markerText = "user`n<!-- JOEWRKS-HARNESS:BEGIN -->"
    foreach ($encoding in @(
        [pscustomobject]@{ Name = 'utf8'; Value = $utf8 },
        [pscustomobject]@{ Name = 'utf16le'; Value = [Text.UnicodeEncoding]::new($false, $false) },
        [pscustomobject]@{ Name = 'utf16be'; Value = [Text.UnicodeEncoding]::new($true, $false) }
    )) {
        $markerHome = Join-Path $root ('marker-' + $encoding.Name)
        $null = New-Item -ItemType Directory -Path $markerHome
        [IO.File]::WriteAllBytes((Join-Path $markerHome AGENTS.md), $encoding.Value.GetBytes($markerText))
        BlockedWithoutMutation $markerHome ('markerOnly-' + $encoding.Name)
    }
    $stateHome = Join-Path $root legacyState
    $null = New-Item -ItemType Directory -Path $stateHome
    [IO.File]::WriteAllText((Join-Path $stateHome joewrks-harness-state.json), '{"legacy":true}', $utf8)
    BlockedWithoutMutation $stateHome stateOnly

    # A Core state arriving after the first skill write is not silently bypassed.
    foreach ($kind in @('state', 'marker')) {
        $late = Join-Path $root ('late-' + $kind)
        $latePath = if ($kind -eq 'state') { Join-Path $late joewrks-harness-state.json } else { Join-Path $late AGENTS.md }
        $lateBytes = if ($kind -eq 'state') { $utf8.GetBytes('{"arrived":"concurrently"}') } else { $utf8.GetBytes('<!-- JOEWRKS-HARNESS:BEGIN -->') }
        $lateResult = Invoke-JoenessHarnessSync -Apply -CodexHome $late -AfterWrite {
            param($stage)
            if ($stage -like 'skills/joeness-setup/*') { [IO.File]::WriteAllBytes($latePath, $lateBytes) }
        }
        Eq $lateResult.status failed "late $kind failure"
        Eq $lateResult.rollback.status complete "late $kind rollback"
        BytesEqual ([IO.File]::ReadAllBytes($latePath)) $lateBytes "late $kind preserved exactly"
        Eq (Snapshot $late) (('/' + (Split-Path $latePath -Leaf) + '=' + (Get-FileHash -LiteralPath $latePath -Algorithm SHA256).Hash).Replace('/', '\')) "late $kind leaves only external file"
    }

    # Foreign files and owned drift are never overwritten or removed.
    $collision = Join-Path $root collision
    $null = New-Item -ItemType Directory -Path (Join-Path $collision skills/joeness-setup) -Force
    [IO.File]::WriteAllText((Join-Path $collision skills/joeness-setup/SKILL.md), 'user-owned', $utf8)
    BlockedWithoutMutation $collision unownedSkill
    $drift = Join-Path $root drift
    Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $drift).status current driftFixtureApply
    [IO.File]::AppendAllText((Join-Path $drift skills/joeness-setup/SKILL.md), 'USER', $utf8)
    BlockedWithoutMutation $drift ownedFileDrift
    $ownedState = Join-Path $root ownedState
    Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $ownedState).status current stateFixtureApply
    $skillStatePath = Join-Path $ownedState joeness-skills-state.json
    $tampered = [IO.File]::ReadAllText($skillStatePath) | ConvertFrom-Json
    $tampered.releaseVersion = 'foreign'
    [IO.File]::WriteAllText($skillStatePath, ($tampered | ConvertTo-Json -Depth 6 -Compress), $utf8)
    BlockedWithoutMutation $ownedState ownedStateDrift

    # Manifest validation rejects extra active payload before any target operation.
    $sourceRoot = Join-Path $root source
    $null = New-Item -ItemType Directory -Path (Join-Path $sourceRoot vendor) -Force
    Copy-Item -LiteralPath (Join-Path $repo skills) -Destination (Join-Path $sourceRoot skills) -Recurse
    $manifestPath = Join-Path $sourceRoot vendor/source-manifest.json
    $manifestText = [IO.File]::ReadAllText((Join-Path $repo vendor/source-manifest.json))
    [IO.File]::WriteAllText($manifestPath, $manifestText, $utf8)
    $null = Get-JoenessSourceIdentity $sourceRoot
    foreach ($kind in @('core', 'runtime', 'vendor', 'secondSkill')) {
        $manifest = $manifestText | ConvertFrom-Json
        switch ($kind) {
            core { $manifest | Add-Member -NotePropertyName activeCommonCore -NotePropertyValue ([pscustomobject]@{path='old.md';sha256=('0'*64)}) }
            runtime { $manifest.managedRuntimeFiles = @('foreign.md') }
            vendor { $manifest.defaultVendors = @('foreign') }
            secondSkill { $manifest.publicSkills = @($manifest.publicSkills[0], $manifest.publicSkills[0]) }
        }
        [IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 10), $utf8)
        $rejected = $false
        try { $null = Get-JoenessSourceIdentity $sourceRoot } catch { $rejected = $true }
        Eq $rejected $true "manifest rejects $kind"
    }

    $failed = Join-Path $root failed
    $failure = Invoke-JoenessHarnessSync -Apply -CodexHome $failed -AfterWrite { throw 'injected write failure' }
    Eq $failure.status failed transactionFailure
    Eq $failure.rollback.status complete transactionRollback
    Eq ($null -eq (Get-JoenessInstallGuide $failure)) $true failedNoGuide

    foreach ($unsupported in @('AgentsHome','BackupRoot','IncludeDesignFrontend')) {
        $options = @{ Check = $true; CodexHome = (Join-Path $root unsupported) }
        $options[$unsupported] = if ($unsupported -eq 'IncludeDesignFrontend') { $true } else { Join-Path $root unused }
        $rejected = $false
        try { $null = Invoke-JoenessHarnessSync @options } catch [System.Management.Automation.ParameterBindingException] { $rejected = $true }
        Eq $rejected $true "$unsupported is not a current interface"
    }
    Write-Host 'PASS setup-only lifecycle, user bytes, legacy fail-closed, drift, rollback, manifest boundaries'
} finally {
    $full = [IO.Path]::GetFullPath($root)
    $temp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($full.StartsWith($temp, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $full -Leaf) -like 'joeness-install-test-*') {
        Remove-Item -LiteralPath $full -Recurse -Force
    }
}
