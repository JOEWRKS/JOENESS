[CmdletBinding()]
param(
    [switch] $Check,
    [switch] $Apply,
    [switch] $Remove,
    [switch] $IncludeDesignFrontend,
    [string] $CodexHome,
    [string] $AgentsHome,
    [string] $BackupRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:JoenessBeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$script:JoenessEndMarker = '<!-- JOEWRKS-HARNESS:END -->'
$script:JoenessStateFile = 'joewrks-harness-state.json'
$script:JoenessRelease = '0.2-astra-judgment'
$script:Utf8Strict = New-Object Text.UTF8Encoding($false, $true)
$script:Utf8NoBom = New-Object Text.UTF8Encoding($false)

function Get-JoenessSha256 {
    param([byte[]] $Bytes)
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant()
    } finally {
        $sha.Dispose()
    }
}

function Read-JoenessBytes {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return ,([byte[]] @()) }
    return ,([IO.File]::ReadAllBytes($Path))
}

function ConvertFrom-JoenessUtf8 {
    param([byte[]] $Bytes, [string] $Label)
    try {
        $script:Utf8Strict.GetString($Bytes)
    } catch {
        throw "$Label is not valid UTF-8"
    }
}

function Write-JoenessBytesAtomic {
    param([string] $Path, [byte[]] $Bytes)

    $parent = Split-Path -Parent $Path
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        $null = New-Item -ItemType Directory -Path $parent -Force
    }

    $token = [guid]::NewGuid().ToString('N')
    $temp = "$Path.joeness.$token.tmp"
    $backup = "$Path.joeness.$token.bak"

    try {
        [IO.File]::WriteAllBytes($temp, $Bytes)
        if (Test-Path -LiteralPath $Path -PathType Leaf) {
            [IO.File]::Replace($temp, $Path, $backup, $true)
            if (Test-Path -LiteralPath $backup) {
                Remove-Item -LiteralPath $backup -Force
            }
        } else {
            [IO.File]::Move($temp, $Path)
        }
    } finally {
        if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force }
        if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Force }
    }
}

function Get-JoenessSnapshot {
    param([string] $Path)
    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        [pscustomobject] @{ Exists = $true; Bytes = [IO.File]::ReadAllBytes($Path) }
    } else {
        [pscustomobject] @{ Exists = $false; Bytes = [byte[]] @() }
    }
}

function Restore-JoenessSnapshot {
    param([string] $Path, $Snapshot)
    if ($Snapshot.Exists) {
        Write-JoenessBytesAtomic $Path ([byte[]] $Snapshot.Bytes)
    } elseif (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Force
    }
}

function Test-JoenessJsonInteger {
    param($Value)
    ($Value -is [int]) -or ($Value -is [long])
}

function Resolve-JoenessCodexHome {
    param([string] $Value)
    if (-not [string]::IsNullOrWhiteSpace($Value)) {
        return [IO.Path]::GetFullPath($Value)
    }
    if (-not [string]::IsNullOrWhiteSpace($env:CODEX_HOME)) {
        return [IO.Path]::GetFullPath($env:CODEX_HOME)
    }
    [IO.Path]::GetFullPath((Join-Path $HOME '.codex'))
}

function Get-JoenessSourceIdentity {
    param([string] $SourceRoot)

    $manifestPath = Join-Path $SourceRoot 'vendor\source-manifest.json'
    $corePath = Join-Path $SourceRoot 'astra-judgment-core.md'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'Missing active distribution manifest' }
    if (-not (Test-Path -LiteralPath $corePath -PathType Leaf)) { throw 'Missing active Independent Judgment source' }

    $manifestBytes = [IO.File]::ReadAllBytes($manifestPath)
    $manifestText = ConvertFrom-JoenessUtf8 $manifestBytes 'Distribution manifest'
    $manifest = $manifestText | ConvertFrom-Json

    if (-not (Test-JoenessJsonInteger $manifest.schemaVersion) -or [long] $manifest.schemaVersion -ne 2) { throw 'Unsupported distribution schemaVersion' }
    if ([string] $manifest.release.name -cne 'JOENESS') { throw 'Unexpected release name' }
    if ([string] $manifest.release.version -cne $script:JoenessRelease) { throw 'Unexpected release version' }
    if ([string] $manifest.release.entrypoint -cne 'JOENESS.ps1') { throw 'Unexpected release entrypoint' }
    if ([string] $manifest.target.model -cne 'gpt-6-astra') { throw 'Unexpected target model' }
    if ([string] $manifest.target.reasoningEffort -cne 'xhigh') { throw 'Unexpected reasoning effort' }
    if ([string] $manifest.runtimeMode -cne 'common-core') { throw 'Unexpected runtime mode' }
    if ($null -eq $manifest.activeCommonCore) { throw 'Missing active Common Core identity' }
    if ([string] $manifest.activeCommonCore.path -cne 'astra-judgment-core.md') { throw 'Unexpected active Common Core path' }
    if (@($manifest.managedRuntimeFiles).Count -ne 0) { throw 'Managed runtime files must remain empty' }
    if (@($manifest.publicSkills).Count -ne 0) { throw 'Public skills must remain empty' }
    if (@($manifest.defaultVendors).Count -ne 0) { throw 'Default vendors must remain empty' }
    if ($null -ne $manifest.pluginRouting) { throw 'Plugin routing must remain null' }
    if ($null -ne $manifest.PSObject.Properties['compatibility']) { throw 'Historical compatibility payload is not allowed in the current manifest' }

    $coreBytes = [IO.File]::ReadAllBytes($corePath)
    $coreText = ConvertFrom-JoenessUtf8 $coreBytes 'Independent Judgment source'
    $coreHash = Get-JoenessSha256 $coreBytes
    if ([string] $manifest.activeCommonCore.sha256 -cne $coreHash) { throw 'Active Common Core hash does not match source bytes' }

    [pscustomobject] @{
        ManifestHash = Get-JoenessSha256 $manifestBytes
        CoreHash = $coreHash
        CoreText = $coreText.TrimEnd("`r", "`n")
    }
}

function Get-JoenessNewline {
    param([byte[]] $Bytes)
    if ($Bytes.Length -eq 0) { return "`n" }
    $text = ConvertFrom-JoenessUtf8 $Bytes 'AGENTS.md'
    if ($text.Contains("`r`n")) { return "`r`n" }
    "`n"
}

function Get-JoenessSeparatorCount {
    param([byte[]] $Bytes)
    if ($Bytes.Length -eq 0) { return 0 }
    $text = ConvertFrom-JoenessUtf8 $Bytes 'AGENTS.md'
    if ($text.EndsWith("`r`n") -or $text.EndsWith("`n") -or $text.EndsWith("`r")) { return 1 }
    2
}

function Get-JoenessBlockBytes {
    param($Source, [string] $Newline)
    $normalized = $Source.CoreText -replace "`r`n|`r|`n", $Newline
    $text = "$($script:JoenessBeginMarker)$Newline$normalized$Newline$($script:JoenessEndMarker)$Newline"
    $script:Utf8NoBom.GetBytes($text)
}

function Get-JoenessManagedSuffixBytes {
    param($Source, [string] $Newline, [int] $SeparatorCount)

    $block = Get-JoenessBlockBytes $Source $Newline
    $separatorText = ''
    for ($i = 0; $i -lt $SeparatorCount; $i++) {
        $separatorText += $Newline
    }
    $separator = $script:Utf8NoBom.GetBytes($separatorText)
    $bytes = New-Object byte[] ($separator.Length + $block.Length)
    [Array]::Copy($separator, 0, $bytes, 0, $separator.Length)
    [Array]::Copy($block, 0, $bytes, $separator.Length, $block.Length)
    $bytes
}

function Test-JoenessEndsWithBytes {
    param([byte[]] $Whole, [byte[]] $Suffix)
    if ($Whole.Length -lt $Suffix.Length) { return $false }
    $offset = $Whole.Length - $Suffix.Length
    for ($i = 0; $i -lt $Suffix.Length; $i++) {
        if ($Whole[$offset + $i] -ne $Suffix[$i]) { return $false }
    }
    $true
}

function Get-JoenessMarkerCounts {
    param([byte[]] $Bytes)
    $text = ConvertFrom-JoenessUtf8 $Bytes 'AGENTS.md'
    [pscustomobject] @{
        Begin = ([regex]::Matches($text, [regex]::Escape($script:JoenessBeginMarker))).Count
        End = ([regex]::Matches($text, [regex]::Escape($script:JoenessEndMarker))).Count
    }
}

function Read-JoenessState {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }

    $bytes = [IO.File]::ReadAllBytes($Path)
    $text = ConvertFrom-JoenessUtf8 $bytes 'JOENESS state'
    $state = $text | ConvertFrom-Json

    if (-not (Test-JoenessJsonInteger $state.schemaVersion) -or [long] $state.schemaVersion -ne 1) { throw 'Unsupported current state schemaVersion' }
    if ([string] $state.releaseVersion -cne $script:JoenessRelease) { throw 'State release identity mismatch' }
    if ($state.originalAgentsExisted -isnot [bool]) { throw 'State originalAgentsExisted is invalid' }
    if ([string] $state.newline -cnotin @('lf', 'crlf')) { throw 'State newline is invalid' }
    if (-not (Test-JoenessJsonInteger $state.separatorCount) -or [long] $state.separatorCount -lt 0 -or [long] $state.separatorCount -gt 2) { throw 'State separatorCount is invalid' }
    if ([string] $state.manifestSha256 -notmatch '^[0-9a-f]{64}$') { throw 'State manifest hash is invalid' }
    if ([string] $state.coreSha256 -notmatch '^[0-9a-f]{64}$') { throw 'State core hash is invalid' }
    if ([string] $state.blockSha256 -notmatch '^[0-9a-f]{64}$') { throw 'State block hash is invalid' }
    $state
}

function New-JoenessPublicResult {
    param(
        [string] $Status,
        [string] $Mode,
        [string] $CodexHome,
        [object[]] $Warnings,
        [bool] $ChangesRequired,
        [object[]] $Changes,
        [object[]] $Blockers,
        $Rollback
    )
    [pscustomobject][ordered] @{
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

function Get-JoenessInstallObservation {
    param([string] $ResolvedCodexHome, $Source)

    $agentsPath = Join-Path $ResolvedCodexHome 'AGENTS.md'
    $statePath = Join-Path $ResolvedCodexHome $script:JoenessStateFile
    $blockers = @()
    $state = $null
    $agentsBytes = Read-JoenessBytes $agentsPath

    try {
        $state = Read-JoenessState $statePath
    } catch {
        $blockers += [pscustomobject] @{ kind = 'invalidState'; message = $_.Exception.Message }
    }

    if ($blockers.Count -eq 0 -and $null -eq $state) {
        if ($agentsBytes.Length -gt 0) {
            try {
                $counts = Get-JoenessMarkerCounts $agentsBytes
                if ($counts.Begin -ne 0 -or $counts.End -ne 0) {
                    $blockers += [pscustomobject] @{ kind = 'unownedMarker'; message = 'JOENESS marker exists without current ownership state' }
                }
            } catch {
                $blockers += [pscustomobject] @{ kind = 'invalidAgents'; message = $_.Exception.Message }
            }
        }
        if ($blockers.Count -gt 0) {
            return [pscustomobject] @{ Status = 'blocked'; Blockers = $blockers; State = $null; AgentsBytes = $agentsBytes; SuffixBytes = $null }
        }
        return [pscustomobject] @{ Status = 'ready'; Blockers = @(); State = $null; AgentsBytes = $agentsBytes; SuffixBytes = $null }
    }

    if ($blockers.Count -eq 0) {
        if ([string] $state.manifestSha256 -cne $Source.ManifestHash) {
            $blockers += [pscustomobject] @{ kind = 'sourceDrift'; message = 'State manifest identity does not match current source' }
        }
        if ([string] $state.coreSha256 -cne $Source.CoreHash) {
            $blockers += [pscustomobject] @{ kind = 'sourceDrift'; message = 'State core identity does not match current source' }
        }
    }

    $suffix = $null
    if ($blockers.Count -eq 0) {
        $newline = if ([string] $state.newline -ceq 'crlf') { "`r`n" } else { "`n" }
        $suffix = Get-JoenessManagedSuffixBytes $Source $newline ([int] $state.separatorCount)
        $block = Get-JoenessBlockBytes $Source $newline
        if ((Get-JoenessSha256 $block) -cne [string] $state.blockSha256) {
            $blockers += [pscustomobject] @{ kind = 'stateDrift'; message = 'State block identity does not match current source' }
        }
    }

    if ($blockers.Count -eq 0) {
        if (-not (Test-Path -LiteralPath $agentsPath -PathType Leaf)) {
            $blockers += [pscustomobject] @{ kind = 'missingTarget'; message = 'Owned AGENTS.md is missing' }
        } else {
            try {
                $counts = Get-JoenessMarkerCounts $agentsBytes
                if ($counts.Begin -ne 1 -or $counts.End -ne 1) {
                    $blockers += [pscustomobject] @{ kind = 'markerDrift'; message = 'Owned AGENTS.md does not contain exactly one managed marker pair' }
                } elseif (-not (Test-JoenessEndsWithBytes $agentsBytes $suffix)) {
                    $blockers += [pscustomobject] @{ kind = 'managedBlockDrift'; message = 'Owned JOENESS managed suffix drifted' }
                }
            } catch {
                $blockers += [pscustomobject] @{ kind = 'invalidAgents'; message = $_.Exception.Message }
            }
        }
    }

    if ($blockers.Count -gt 0) {
        return [pscustomobject] @{ Status = 'blocked'; Blockers = $blockers; State = $state; AgentsBytes = $agentsBytes; SuffixBytes = $suffix }
    }
    [pscustomobject] @{ Status = 'current'; Blockers = @(); State = $state; AgentsBytes = $agentsBytes; SuffixBytes = $suffix }
}

function Invoke-JoenessHarnessSync {
    [CmdletBinding()]
    param(
        [switch] $Check,
        [switch] $Apply,
        [switch] $Remove,
        [string] $CodexHome,
        [string] $AgentsHome,
        [string] $BackupRoot,
        [switch] $IncludeDesignFrontend,
        [scriptblock] $AfterWrite
    )

    $modeCount = [int] [bool] $Check + [int] [bool] $Apply + [int] [bool] $Remove
    if ($modeCount -eq 0) { $Check = $true; $modeCount = 1 }
    if ($modeCount -ne 1) { throw 'Choose exactly one of -Check, -Apply, or -Remove' }
    $mode = if ($Apply) { 'apply' } elseif ($Remove) { 'remove' } else { 'check' }

    $warnings = @()
    if ($IncludeDesignFrontend) { $warnings += '-IncludeDesignFrontend is ignored; JOENESS 0.2 installs no public skills or design vendors.' }
    if (-not [string]::IsNullOrWhiteSpace($AgentsHome)) { $warnings += '-AgentsHome is ignored by the current minimal release.' }
    if (-not [string]::IsNullOrWhiteSpace($BackupRoot)) { $warnings += '-BackupRoot is ignored; current 0.2 owns only an exact suffix and minimal state.' }

    $resolved = Resolve-JoenessCodexHome $CodexHome
    $sourceRoot = Split-Path -Parent $PSScriptRoot
    try {
        $source = Get-JoenessSourceIdentity $sourceRoot
    } catch {
        return New-JoenessPublicResult 'blocked' $mode $resolved $warnings $false @() @([pscustomobject] @{ kind = 'sourceIntegrity'; message = $_.Exception.Message }) $null
    }

    $observation = Get-JoenessInstallObservation $resolved $source

    if ($Check) {
        if ($observation.Status -eq 'ready') {
            return New-JoenessPublicResult 'ready' $mode $resolved $warnings $true @([pscustomobject] @{ kind = 'managedBlock'; action = 'apply'; target = 'AGENTS.md' }) @() $null
        }
        if ($observation.Status -eq 'current') {
            return New-JoenessPublicResult 'current' $mode $resolved $warnings $false @() @() $null
        }
        return New-JoenessPublicResult 'blocked' $mode $resolved $warnings $false @() $observation.Blockers $null
    }

    if ($Apply) {
        if ($observation.Status -eq 'current') {
            return New-JoenessPublicResult 'current' $mode $resolved $warnings $false @() @() $null
        }
        if ($observation.Status -eq 'blocked') {
            return New-JoenessPublicResult 'blocked' $mode $resolved $warnings $false @() $observation.Blockers $null
        }

        $agentsPath = Join-Path $resolved 'AGENTS.md'
        $statePath = Join-Path $resolved $script:JoenessStateFile
        $agentsSnapshot = Get-JoenessSnapshot $agentsPath
        $stateSnapshot = Get-JoenessSnapshot $statePath

        try {
            if (-not (Test-Path -LiteralPath $resolved)) {
                $null = New-Item -ItemType Directory -Path $resolved -Force
            }

            $original = [byte[]] $agentsSnapshot.Bytes
            $newline = Get-JoenessNewline $original
            $separatorCount = Get-JoenessSeparatorCount $original
            $suffix = Get-JoenessManagedSuffixBytes $source $newline $separatorCount
            $newBytes = New-Object byte[] ($original.Length + $suffix.Length)
            [Array]::Copy($original, 0, $newBytes, 0, $original.Length)
            [Array]::Copy($suffix, 0, $newBytes, $original.Length, $suffix.Length)

            Write-JoenessBytesAtomic $agentsPath $newBytes
            if ($null -ne $AfterWrite) { & $AfterWrite 'agents' }

            $newlineName = if ($newline -ceq "`r`n") { 'crlf' } else { 'lf' }
            $blockHash = Get-JoenessSha256 (Get-JoenessBlockBytes $source $newline)
            $stateObject = [ordered] @{
                schemaVersion = 1
                releaseVersion = $script:JoenessRelease
                manifestSha256 = $source.ManifestHash
                coreSha256 = $source.CoreHash
                originalAgentsExisted = [bool] $agentsSnapshot.Exists
                newline = $newlineName
                separatorCount = $separatorCount
                blockSha256 = $blockHash
            }
            $stateJson = ($stateObject | ConvertTo-Json -Depth 4 -Compress) + "`n"
            Write-JoenessBytesAtomic $statePath ($script:Utf8NoBom.GetBytes($stateJson))
            if ($null -ne $AfterWrite) { & $AfterWrite 'state' }

            $post = Get-JoenessInstallObservation $resolved $source
            if ($post.Status -ne 'current') { throw 'Post-Apply verification did not reach current state' }
            return New-JoenessPublicResult 'current' $mode $resolved $warnings $false @([pscustomobject] @{ kind = 'managedBlock'; action = 'installed'; target = 'AGENTS.md' }) @() $null
        } catch {
            $writeError = $_.Exception.Message
            $rollbackProblems = @()
            try { Restore-JoenessSnapshot $agentsPath $agentsSnapshot } catch { $rollbackProblems += $_.Exception.Message }
            try { Restore-JoenessSnapshot $statePath $stateSnapshot } catch { $rollbackProblems += $_.Exception.Message }
            $rollbackStatus = if ($rollbackProblems.Count -eq 0) { 'complete' } else { 'incomplete' }
            $rollback = [pscustomobject] @{ status = $rollbackStatus; problems = @($rollbackProblems) }
            return New-JoenessPublicResult 'failed' $mode $resolved $warnings $true @() @([pscustomobject] @{ kind = 'writeFailure'; message = $writeError }) $rollback
        }
    }

    if ($observation.Status -eq 'ready') {
        return New-JoenessPublicResult 'removed' $mode $resolved $warnings $false @() @() $null
    }
    if ($observation.Status -eq 'blocked') {
        return New-JoenessPublicResult 'blocked' $mode $resolved $warnings $false @() $observation.Blockers $null
    }

    $agentsPath = Join-Path $resolved 'AGENTS.md'
    $statePath = Join-Path $resolved $script:JoenessStateFile
    $agentsSnapshot = Get-JoenessSnapshot $agentsPath
    $stateSnapshot = Get-JoenessSnapshot $statePath

    try {
        $suffix = [byte[]] $observation.SuffixBytes
        $currentBytes = [byte[]] $observation.AgentsBytes
        $prefixLength = $currentBytes.Length - $suffix.Length
        if ($prefixLength -lt 0) { throw 'Managed suffix is larger than AGENTS.md' }

        $prefix = New-Object byte[] $prefixLength
        if ($prefixLength -gt 0) {
            [Array]::Copy($currentBytes, 0, $prefix, 0, $prefixLength)
        }

        if (-not [bool] $observation.State.originalAgentsExisted -and $prefix.Length -eq 0) {
            Remove-Item -LiteralPath $agentsPath -Force
        } else {
            Write-JoenessBytesAtomic $agentsPath $prefix
        }
        if ($null -ne $AfterWrite) { & $AfterWrite 'agents' }

        Remove-Item -LiteralPath $statePath -Force
        if ($null -ne $AfterWrite) { & $AfterWrite 'state' }

        $post = Get-JoenessInstallObservation $resolved $source
        if ($post.Status -ne 'ready') { throw 'Post-Remove verification did not reach ready state' }
        return New-JoenessPublicResult 'removed' $mode $resolved $warnings $false @([pscustomobject] @{ kind = 'managedBlock'; action = 'removed'; target = 'AGENTS.md' }) @() $null
    } catch {
        $writeError = $_.Exception.Message
        $rollbackProblems = @()
        try { Restore-JoenessSnapshot $agentsPath $agentsSnapshot } catch { $rollbackProblems += $_.Exception.Message }
        try { Restore-JoenessSnapshot $statePath $stateSnapshot } catch { $rollbackProblems += $_.Exception.Message }
        $rollbackStatus = if ($rollbackProblems.Count -eq 0) { 'complete' } else { 'incomplete' }
        $rollback = [pscustomobject] @{ status = $rollbackStatus; problems = @($rollbackProblems) }
        return New-JoenessPublicResult 'failed' $mode $resolved $warnings $true @() @([pscustomobject] @{ kind = 'writeFailure'; message = $writeError }) $rollback
    }
}

function Get-JoenessExitCode {
    param([string] $Status)
    if ($Status -in @('current', 'ready', 'removed')) { return 0 }
    if ($Status -eq 'failed') { return 1 }
    if ($Status -eq 'blocked') { return 2 }
    3
}

if ($MyInvocation.InvocationName -ne '.') {
    try {
        $result = Invoke-JoenessHarnessSync -Check:$Check -Apply:$Apply -Remove:$Remove -CodexHome $CodexHome -AgentsHome $AgentsHome -BackupRoot $BackupRoot -IncludeDesignFrontend:$IncludeDesignFrontend
        $result | ConvertTo-Json -Depth 8 -Compress | Write-Output
        exit (Get-JoenessExitCode $result.status)
    } catch {
        $fallbackHome = Resolve-JoenessCodexHome $CodexHome
        $fallbackMode = if ($Apply) { 'apply' } elseif ($Remove) { 'remove' } else { 'check' }
        $failed = New-JoenessPublicResult 'failed' $fallbackMode $fallbackHome @() $false @() @([pscustomobject] @{ kind = 'unexpected'; message = $_.Exception.Message }) $null
        $failed | ConvertTo-Json -Depth 8 -Compress | Write-Output
        exit 1
    }
}
