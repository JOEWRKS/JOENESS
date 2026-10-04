[CmdletBinding()]
param(
    [switch] $Check,
    [switch] $Apply,
    [switch] $Remove,
    [string] $CodexHome
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:JoenessRelease = '0.3.1'
$script:LegacyStateName = 'joewrks-harness-state.json'
$script:LegacyMarkers = @('<!-- JOEWRKS-HARNESS:BEGIN -->', '<!-- JOEWRKS-HARNESS:END -->')
$script:Utf8Strict = New-Object Text.UTF8Encoding($false, $true)
$script:Utf8NoBom = New-Object Text.UTF8Encoding($false)
$script:LegacyMarkerEncodings = @($script:Utf8NoBom, [Text.Encoding]::Unicode, [Text.Encoding]::BigEndianUnicode)

function Get-JoenessSha256 {
    param([byte[]] $Bytes)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function ConvertFrom-JoenessUtf8 {
    param([byte[]] $Bytes, [string] $Label)
    try { $script:Utf8Strict.GetString($Bytes) }
    catch { throw "$Label is not valid UTF-8" }
}

function Test-JoenessJsonInteger {
    param($Value)
    ($Value -is [int]) -or ($Value -is [long])
}

function Resolve-JoenessCodexHome {
    param([string] $Value)
    if (-not [string]::IsNullOrWhiteSpace($Value)) { return [IO.Path]::GetFullPath($Value) }
    if (-not [string]::IsNullOrWhiteSpace($env:CODEX_HOME)) { return [IO.Path]::GetFullPath($env:CODEX_HOME) }
    [IO.Path]::GetFullPath((Join-Path $HOME '.codex'))
}

function Get-JoenessSourceIdentity {
    param([string] $SourceRoot)
    $manifestPath = Join-Path $SourceRoot 'vendor/source-manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'Missing active distribution manifest' }
    $manifestBytes = [IO.File]::ReadAllBytes($manifestPath)
    $manifest = (ConvertFrom-JoenessUtf8 $manifestBytes 'Distribution manifest') | ConvertFrom-Json

    if (-not (Test-JoenessJsonInteger $manifest.schemaVersion) -or [long]$manifest.schemaVersion -ne 3) { throw 'Unsupported distribution schemaVersion' }
    if ([string]$manifest.release.name -cne 'JOENESS') { throw 'Unexpected release name' }
    if ([string]$manifest.release.version -cne $script:JoenessRelease) { throw 'Unexpected release version' }
    if ([string]$manifest.release.entrypoint -cne 'JOENESS.ps1') { throw 'Unexpected release entrypoint' }
    if ([string]$manifest.target.model -cne 'gpt-6-astra') { throw 'Unexpected target model' }
    if ([string]$manifest.target.reasoningEffort -cne 'xhigh') { throw 'Unexpected reasoning effort' }
    if ([string]$manifest.runtimeMode -cne 'setup-only') { throw 'Unexpected runtime mode' }
    if ($null -ne $manifest.PSObject.Properties['activeCommonCore']) { throw 'Unexpected active Common Core payload' }
    if ($null -eq $manifest.PSObject.Properties['managedRuntimeFiles'] -or @($manifest.managedRuntimeFiles).Count -ne 0) { throw 'Managed runtime files must remain empty' }
    if ($null -eq $manifest.PSObject.Properties['defaultVendors'] -or @($manifest.defaultVendors).Count -ne 0) { throw 'Default vendors must remain empty' }
    if ($null -eq $manifest.PSObject.Properties['pluginRouting'] -or $null -ne $manifest.pluginRouting) { throw 'Plugin routing must remain null' }
    if ($null -ne $manifest.PSObject.Properties['compatibility']) { throw 'Unexpected distribution manifest field: compatibility' }
    if (@($manifest.publicSkills).Count -ne 1 -or $manifest.publicSkills[0].name -cne 'joeness-setup') { throw 'Only joeness-setup may ship' }

    $expectedFiles = @('SKILL.md', 'agents/openai.yaml', 'assets/AGENTS.md', 'assets/DESIGN.md', 'assets/ISSUES.md', 'assets/ROADMAP.md', 'assets/TASK.md', 'references/usage.md', 'scripts/project-setup.ps1')
    $files = @($manifest.publicSkills[0].files)
    if ($files.Count -ne $expectedFiles.Count -or ((@($files.path | Sort-Object) -join ',') -cne (($expectedFiles | Sort-Object) -join ','))) {
        throw 'Unexpected skill source inventory'
    }
    foreach ($file in $files) {
        if ([string]$file.sha256 -cnotmatch '^[0-9a-f]{64}$') { throw "Invalid skill source hash: $($file.path)" }
        $path = Join-Path $SourceRoot ('skills/joeness-setup/' + $file.path)
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing skill source: $($file.path)" }
        if ((Get-JoenessSha256 ([IO.File]::ReadAllBytes($path))) -cne $file.sha256) { throw "Skill source hash mismatch: $($file.path)" }
    }
    [pscustomobject]@{ Skill = $manifest.publicSkills[0]; ManifestHash = Get-JoenessSha256 $manifestBytes }
}

function Test-JoenessContainsBytes {
    param([byte[]] $Haystack, [byte[]] $Needle)
    if ($Needle.Length -gt $Haystack.Length) { return $false }
    for ($i = 0; $i -le $Haystack.Length - $Needle.Length; $i++) {
        $found = $true
        for ($j = 0; $j -lt $Needle.Length; $j++) {
            if ($Haystack[$i + $j] -ne $Needle[$j]) { $found = $false; break }
        }
        if ($found) { return $true }
    }
    $false
}

function Get-JoenessLegacyObservation {
    param([string] $ResolvedCodexHome)
    $statePath = Join-Path $ResolvedCodexHome $script:LegacyStateName
    if (Test-Path -LiteralPath $statePath) {
        return [pscustomobject]@{ Status = 'blocked'; Message = 'Legacy Core state exists; use its exact package to review migration' }
    }
    $agentsPath = Join-Path $ResolvedCodexHome 'AGENTS.md'
    if (Test-Path -LiteralPath $agentsPath -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($agentsPath)
        foreach ($marker in $script:LegacyMarkers) {
            foreach ($encoding in $script:LegacyMarkerEncodings) {
                if (Test-JoenessContainsBytes $bytes ($encoding.GetBytes($marker))) {
                    return [pscustomobject]@{ Status = 'blocked'; Message = 'Legacy Core marker exists without current package ownership' }
                }
            }
        }
    }
    [pscustomobject]@{ Status = 'clear'; Message = $null }
}

function New-JoenessPublicResult {
    param([string] $Status, [string] $Mode, [string] $CodexHome, [object[]] $Warnings, [bool] $ChangesRequired, [object[]] $Changes, [object[]] $Blockers, $Rollback)
    [pscustomobject][ordered]@{
        status = $Status
        mode = $Mode
        codexHome = $CodexHome
        activeSkills = @()
        warnings = @($Warnings)
        changesRequired = $ChangesRequired
        changes = @($Changes)
        blockers = @($Blockers)
        rollback = $Rollback
    }
}

function Invoke-JoenessHarnessSync {
    [CmdletBinding()]
    param([switch]$Check, [switch]$Apply, [switch]$Remove, [string]$CodexHome, [scriptblock]$AfterWrite)
    $mode = if ($Apply) { 'apply' } elseif ($Remove) { 'remove' } else { 'check' }
    $resolved = Resolve-JoenessCodexHome $CodexHome
    $warnings = @()
    try {
        if (([int][bool]$Check + [int][bool]$Apply + [int][bool]$Remove) -gt 1) { throw 'Choose one mode' }
        $sourceRoot = Split-Path -Parent $PSScriptRoot
        $source = Get-JoenessSourceIdentity $sourceRoot
        $savedApply = $Apply; $savedRemove = $Remove; $savedCheck = $Check
        . (Join-Path $sourceRoot 'skills/joeness-setup/scripts/project-setup.ps1')
        $Apply = $savedApply; $Remove = $savedRemove; $Check = $savedCheck
        Assert-SetupPath $resolved
        Assert-SetupPath (Join-Path $resolved 'AGENTS.md')
        Assert-SetupPath (Join-Path $resolved $script:LegacyStateName)
        $legacy = Get-JoenessLegacyObservation $resolved
        if ($legacy.Status -eq 'blocked') { throw $legacy.Message }

        $skillRoot = Join-Path $resolved 'skills/joeness-setup'
        Assert-SetupPath $skillRoot
        $skillState = Get-SetupSnapshot (Join-Path $resolved 'joeness-skills-state.json')
        $files = @($source.Skill.files)
        $currentFiles = @()
        if (Test-Path -LiteralPath $skillRoot) {
            foreach ($item in Get-ChildItem -LiteralPath $skillRoot -Force -Recurse) {
                Assert-SetupPath $item.FullName
                if (-not $item.PSIsContainer) { $currentFiles += $item.FullName.Substring($skillRoot.Length + 1).Replace('\', '/') }
            }
        }
        $owned = $null
        if ($skillState.Hash -ne 'absent') {
            $owned = (ConvertFrom-JoenessUtf8 $skillState.Bytes 'Skill ownership state') | ConvertFrom-Json
            if ($owned.schemaVersion -ne 1 -or $owned.releaseVersion -cne $script:JoenessRelease -or $owned.manifestSha256 -cne $source.ManifestHash) {
                throw 'Skill ownership does not match this package; existing files were preserved'
            }
            if (($owned.files | ConvertTo-Json -Compress) -cne ($files | ConvertTo-Json -Compress)) { throw 'Skill ownership inventory mismatch' }
            if (($currentFiles | Sort-Object) -join ',' -cne (($files.path | Sort-Object) -join ',')) { throw 'Owned skill inventory drift' }
        } elseif ($currentFiles.Count) { throw 'Unowned skill files; preserve them and resolve explicitly' }

        $entries = New-Object Collections.Generic.List[object]
        foreach ($file in $files) {
            $target = Get-SetupSnapshot (Join-Path $skillRoot $file.path)
            if ($null -ne $owned -and $target.Hash -cne $file.sha256) { throw "Owned skill drift: $($file.path)" }
            if ($Remove) { $entries.Add((New-SetupEntry $target @() ('skills/joeness-setup/' + $file.path) -Delete)) }
            else { $entries.Add((New-SetupEntry $target ([IO.File]::ReadAllBytes((Join-Path $sourceRoot ('skills/joeness-setup/' + $file.path)))) ('skills/joeness-setup/' + $file.path))) }
        }
        if ($Remove) {
            $entries.Add((New-SetupEntry $skillState @() 'joeness-skills-state.json' -Delete))
        } else {
            $newState = [ordered]@{ schemaVersion = 1; releaseVersion = $script:JoenessRelease; manifestSha256 = $source.ManifestHash; files = $files }
            $stateBytes = $script:Utf8NoBom.GetBytes(($newState | ConvertTo-Json -Depth 5 -Compress) + "`n")
            $entries.Add((New-SetupEntry $skillState $stateBytes 'joeness-skills-state.json'))
        }
        $all = $entries.ToArray()
        $changes = @($all | Where-Object { $_.Before.Hash -cne $_.NewHash } | ForEach-Object { $_.Label })
        if (-not $Apply -and -not $Remove) {
            $status = if ($changes.Count) { 'ready' } else { 'current' }
            $result = New-JoenessPublicResult $status $mode $resolved $warnings ([bool]$changes.Count) $changes @() $null
        } else {
            $guard = {
                Assert-SetupPath $resolved
                Assert-SetupPath (Join-Path $resolved 'AGENTS.md')
                Assert-SetupPath (Join-Path $resolved $script:LegacyStateName)
                $rechecked = Get-JoenessLegacyObservation $resolved
                if ($rechecked.Status -eq 'blocked') { throw $rechecked.Message }
                $verified = Get-JoenessSourceIdentity $sourceRoot
                if ($verified.ManifestHash -cne $source.ManifestHash) { throw 'Source changed during operation' }
            }
            $tx = Invoke-SetupTransaction $all $AfterWrite $guard
            $status = if ($tx.Status -eq 'success') { if ($Remove) { 'removed' } else { 'current' } } else { $tx.Status }
            $rollback = if ($tx.Rollback) { [pscustomobject]@{ status = $tx.Rollback; problems = $tx.Unresolved } } else { $null }
            $blockers = if ($tx.Error) { @([pscustomobject]@{ kind = 'writeFailure'; message = $tx.Error }) } else { @() }
            $result = New-JoenessPublicResult $status $mode $resolved $warnings ($status -in @('failed', 'partial')) $tx.Changed $blockers $rollback
        }
        if ($result.status -eq 'current') { $result.activeSkills = @('joeness-setup') }
        $result
    } catch {
        New-JoenessPublicResult 'blocked' $mode $resolved $warnings $false @() @([pscustomobject]@{ kind = 'conflict'; message = $_.Exception.Message }) $null
    }
}

function Get-JoenessExitCode {
    param([string] $Status)
    if ($Status -in @('current', 'ready', 'removed')) { return 0 }
    if ($Status -eq 'failed') { return 1 }
    if ($Status -eq 'blocked') { return 2 }
    3
}

function Get-JoenessInstallGuide {
    param($Result)
    if ($Result.mode -eq 'apply' -and $Result.status -eq 'current') {
        $path = Join-Path $Result.codexHome 'skills/joeness-setup/references/usage.md'
        $script:Utf8Strict.GetString([IO.File]::ReadAllBytes($path))
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    [Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
    try {
        $result = Invoke-JoenessHarnessSync -Check:$Check -Apply:$Apply -Remove:$Remove -CodexHome $CodexHome
        $result | ConvertTo-Json -Depth 8 -Compress | Write-Output
        try {
            $guide = Get-JoenessInstallGuide $result
            if ($guide) { [Console]::Error.WriteLine($guide) }
        } catch {
            [Console]::Error.WriteLine('Installation is current; usage guide could not be displayed. See README.md.')
        }
        exit (Get-JoenessExitCode $result.status)
    } catch {
        $fallbackHome = Resolve-JoenessCodexHome $CodexHome
        $fallbackMode = if ($Apply) { 'apply' } elseif ($Remove) { 'remove' } else { 'check' }
        $failed = New-JoenessPublicResult 'failed' $fallbackMode $fallbackHome @() $false @() @([pscustomobject]@{ kind = 'unexpected'; message = $_.Exception.Message }) $null
        $failed | ConvertTo-Json -Depth 8 -Compress | Write-Output
        exit 1
    }
}
