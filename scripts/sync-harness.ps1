[CmdletBinding(DefaultParameterSetName = 'None')]
param(
    [Parameter(ParameterSetName = 'Check')] [switch] $Check,
    [Parameter(ParameterSetName = 'Apply')] [switch] $Apply,
    [switch] $IncludeDesignFrontend,
    [string] $CodexHome,
    [string] $AgentsHome,
    [string] $BackupRoot
)

$ErrorActionPreference = 'Stop'
$script:HarnessBeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$script:HarnessEndMarker = '<!-- JOEWRKS-HARNESS:END -->'

function Get-HarnessSha256 {
    param([byte[]] $Bytes)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function Read-HarnessUtf8 {
    param([string] $Path)
    $bytes = [IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -ge 2 -and (($bytes[0] -eq 0xff -and $bytes[1] -eq 0xfe) -or ($bytes[0] -eq 0xfe -and $bytes[1] -eq 0xff))) {
        throw 'UTF-16 is not supported'
    }
    $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xef -and $bytes[1] -eq 0xbb -and $bytes[2] -eq 0xbf
    $offset = if ($hasBom) { 3 } else { 0 }
    $payload = if ($offset -lt $bytes.Length) { [byte[]] $bytes[$offset..($bytes.Length - 1)] } else { [byte[]] @() }
    $text = (New-Object Text.UTF8Encoding($false, $true)).GetString($payload)
    [pscustomobject] @{ Bytes = $bytes; Text = $text; HasBom = $hasBom }
}

function Get-HarnessByteOffsets {
    param([byte[]] $Bytes, [byte[]] $Needle)
    $found = @()
    for ($i = 0; $i -le $Bytes.Length - $Needle.Length; $i++) {
        $matches = $true
        for ($j = 0; $j -lt $Needle.Length; $j++) {
            if ($Bytes[$i + $j] -ne $Needle[$j]) { $matches = $false; break }
        }
        if ($matches) { $found += $i; $i += $Needle.Length - 1 }
    }
    $found
}

function Get-HarnessByteSlice {
    param([byte[]] $Bytes, [int] $Start, [int] $Length)
    if ($Length -le 0) { return ,([byte[]] @()) }
    ,([byte[]] $Bytes[$Start..($Start + $Length - 1)])
}

function Resolve-HarnessPath {
    param([string] $Value, [string] $Fallback)
    [IO.Path]::GetFullPath($(if ([string]::IsNullOrWhiteSpace($Value)) { $Fallback } else { $Value }))
}

function Resolve-HarnessSourceFile {
    param([string] $Root, [string] $RelativePath)
    if ([string]::IsNullOrWhiteSpace($RelativePath) -or [IO.Path]::IsPathRooted($RelativePath)) {
        throw "Source path is not relative: $RelativePath"
    }
    $segments = $RelativePath -split '[\\/]'
    if ($segments -contains '' -or $segments -contains '.' -or $segments -contains '..') {
        throw "Source path is not a normalized file path: $RelativePath"
    }
    $rootPath = [IO.Path]::GetFullPath($Root).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    $path = [IO.Path]::GetFullPath((Join-Path $Root ($segments -join [IO.Path]::DirectorySeparatorChar)))
    if (-not $path.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Source path escapes the repository: $RelativePath"
    }
    $path
}

function Get-HarnessStateHash {
    param($Value)
    if ($null -eq $Value) { return $null }
    if ($Value -is [string]) { return $Value.ToLowerInvariant() }
    if ($Value.PSObject.Properties.Name -contains 'sha256') { return ([string] $Value.sha256).ToLowerInvariant() }
    $null
}

function Get-HarnessFrontmatterCollisions {
    param(
        [string[]] $SkillRoots,
        [string] $ManagedSkillFile,
        [bool] $ManagedOptionalBundle
    )
    $collisions = [Collections.Generic.List[string]]::new()
    foreach ($root in $SkillRoots) {
        if (-not (Test-Path -LiteralPath $root -PathType Container)) { continue }
        foreach ($directory in Get-ChildItem -LiteralPath $root -Directory -Recurse) {
            $relative = $directory.FullName.Substring($root.Length).TrimStart('\', '/')
            if (($relative -split '[\\/]') -contains '.system') { continue }
            if ($directory.Name -ieq 'joewrks-design-frontend') {
                $managedDirectory = Split-Path -Parent $ManagedSkillFile
                if (-not ($ManagedOptionalBundle -and $directory.FullName -ieq $managedDirectory)) {
                    $null = $collisions.Add("Duplicate skill directory: $($directory.FullName)")
                }
            }
        }
        foreach ($skillFile in Get-ChildItem -LiteralPath $root -Filter 'SKILL.md' -File -Recurse) {
            $relative = $skillFile.FullName.Substring($root.Length).TrimStart('\', '/')
            if (($relative -split '[\\/]') -contains '.system') { continue }
            if ($ManagedOptionalBundle -and $skillFile.FullName -ieq $ManagedSkillFile) { continue }
            try {
                $text = (Read-HarnessUtf8 $skillFile.FullName).Text
                if ($text -match '(?ms)\A---\s*\r?\n.*?^\s*name\s*:\s*[''"]?joewrks-design-frontend[''"]?\s*$.*?^---\s*$') {
                    $null = $collisions.Add("Duplicate skill frontmatter name: $($skillFile.FullName)")
                }
            } catch {
                $null = $collisions.Add("Cannot inspect skill frontmatter as UTF-8: $($skillFile.FullName)")
            }
        }
    }
    $collisions.ToArray()
}

function Invoke-JoewrksHarnessSync {
    [CmdletBinding(DefaultParameterSetName = 'Check')]
    param(
        [Parameter(Mandatory, ParameterSetName = 'Check')] [switch] $Check,
        [Parameter(Mandatory, ParameterSetName = 'Apply')] [switch] $Apply,
        [switch] $IncludeDesignFrontend,
        [string] $CodexHome,
        [string] $AgentsHome,
        [string] $BackupRoot
    )

    $userProfile = if ([string]::IsNullOrWhiteSpace($env:USERPROFILE)) { [Environment]::GetFolderPath('UserProfile') } else { $env:USERPROFILE }
    $localAppData = if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) { [Environment]::GetFolderPath('LocalApplicationData') } else { $env:LOCALAPPDATA }
    $codexDefault = if ([string]::IsNullOrWhiteSpace($env:CODEX_HOME)) { Join-Path $userProfile '.codex' } else { $env:CODEX_HOME }
    $resolvedCodexHome = Resolve-HarnessPath $CodexHome $codexDefault
    $resolvedAgentsHome = Resolve-HarnessPath $AgentsHome (Join-Path $userProfile '.agents')
    $resolvedBackupRoot = Resolve-HarnessPath $BackupRoot (Join-Path $localAppData 'JOEWRKS\work-harness\backups')
    $sourceRoot = Split-Path -Parent $PSScriptRoot
    $agentsPath = Join-Path $resolvedCodexHome 'AGENTS.md'
    $overridePath = Join-Path $resolvedCodexHome 'AGENTS.override.md'
    $statePath = Join-Path $resolvedCodexHome 'joewrks-harness-state.json'
    $optionalRoot = $resolvedAgentsHome
    $managedSkillFile = Join-Path $optionalRoot 'skills\joewrks-design-frontend\SKILL.md'
    $blockers = [Collections.Generic.List[object]]::new()
    $changes = [Collections.Generic.List[object]]::new()
    $optionalEntries = [Collections.Generic.List[object]]::new()
    $manifest = $null
    $sourceCore = $null

    try {
        $manifestPath = Resolve-HarnessSourceFile $sourceRoot 'vendor/source-manifest.json'
        if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'Missing vendor/source-manifest.json' }
        $manifest = (Read-HarnessUtf8 $manifestPath).Text | ConvertFrom-Json
        $coreEntry = $manifest.evaluation.current.commonCore
        $corePath = Resolve-HarnessSourceFile $sourceRoot ([string] $coreEntry.path)
        if (-not (Test-Path -LiteralPath $corePath -PathType Leaf)) { throw "Missing Common Core source: $($coreEntry.path)" }
        $sourceCoreRead = Read-HarnessUtf8 $corePath
        $sourceCore = $sourceCoreRead.Text.TrimEnd("`r", "`n")
        if ((Get-HarnessSha256 $sourceCoreRead.Bytes) -cne ([string] $coreEntry.sha256).ToLowerInvariant()) {
            throw "Common Core source hash mismatch: $($coreEntry.path)"
        }

        $selected = [Collections.Generic.List[object]]::new()
        foreach ($skill in @($manifest.activeSkills.PSObject.Properties.Value)) {
            foreach ($file in @($skill.files)) { $null = $selected.Add($file) }
            foreach ($sourceName in @($skill.sourceDependencies)) {
                $source = $manifest.sources.PSObject.Properties[[string] $sourceName]
                if ($null -eq $source) { throw "Missing declared source dependency: $sourceName" }
                foreach ($file in @($source.Value.files)) { $null = $selected.Add($file) }
            }
        }
        $seen = @{}
        foreach ($entry in $selected) {
            $relative = ([string] $entry.localPath).Replace('\', '/')
            $path = Resolve-HarnessSourceFile $sourceRoot $relative
            if ($seen.ContainsKey($relative)) { throw "Duplicate source-manifest path: $relative" }
            $seen[$relative] = $true
            if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing manifest source file: $relative" }
            $bytes = [IO.File]::ReadAllBytes($path)
            if ($bytes.Length -ne [long] $entry.bytes) { throw "Source size mismatch: $relative" }
            $hash = Get-HarnessSha256 $bytes
            if ($hash -cne ([string] $entry.sha256).ToLowerInvariant()) { throw "Source hash mismatch: $relative" }
            $null = $optionalEntries.Add([pscustomobject] @{ RelativePath = $relative; SourcePath = $path; Hash = $hash })
        }
        $manifestBytes = [IO.File]::ReadAllBytes($manifestPath)
        $null = $optionalEntries.Add([pscustomobject] @{
            RelativePath = 'vendor/source-manifest.json'
            SourcePath = $manifestPath
            Hash = Get-HarnessSha256 $manifestBytes
        })
    } catch {
        $null = $blockers.Add([pscustomobject] @{ kind = 'sourceIntegrity'; message = $_.Exception.Message })
    }

    $state = $null
    $stateCoreHash = $null
    $stateWholeFiles = @{}
    if (Test-Path -LiteralPath $statePath -PathType Leaf) {
        try {
            $state = (Read-HarnessUtf8 $statePath).Text | ConvertFrom-Json
            foreach ($property in @($state.managedBlocks.PSObject.Properties)) {
                $candidate = Get-HarnessStateHash $property.Value
                if ($candidate) { $stateCoreHash = $candidate; break }
            }
            foreach ($property in @($state.wholeFileTargets.PSObject.Properties)) {
                $relative = ([string] $property.Name).Replace('\', '/')
                $null = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
                $hash = Get-HarnessStateHash $property.Value
                if (-not $hash) { throw "State target has no SHA-256: $relative" }
                $stateWholeFiles[$relative] = $hash
            }
        } catch {
            $null = $blockers.Add([pscustomobject] @{ kind = 'invalidState'; message = $_.Exception.Message })
        }
    }
    $priorOptionalOptIn = $stateWholeFiles.Count -gt 0

    if (Test-Path -LiteralPath $overridePath -PathType Leaf) {
        try {
            if ((Get-Item -LiteralPath $overridePath).Length -gt 0) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'overrideShadow'; message = "Nonempty override blocks Common Core: $overridePath" })
            }
        } catch {
            $null = $blockers.Add([pscustomobject] @{ kind = 'overrideInspection'; message = $_.Exception.Message })
        }
    }

    $plannedAgentBytes = $null
    if ($null -ne $sourceCore) {
        try {
            $targetExists = Test-Path -LiteralPath $agentsPath -PathType Leaf
            $target = if ($targetExists) { Read-HarnessUtf8 $agentsPath } else { [pscustomobject] @{ Bytes = [byte[]] @(); Text = ''; HasBom = $false } }
            $beginBytes = [Text.Encoding]::UTF8.GetBytes($script:HarnessBeginMarker)
            $endBytes = [Text.Encoding]::UTF8.GetBytes($script:HarnessEndMarker)
            $beginOffsets = @(Get-HarnessByteOffsets $target.Bytes $beginBytes)
            $endOffsets = @(Get-HarnessByteOffsets $target.Bytes $endBytes)
            if ($beginOffsets.Count -gt 1 -or $endOffsets.Count -gt 1) { throw 'Duplicate Common Core markers' }
            if ($beginOffsets.Count -ne $endOffsets.Count -or ($beginOffsets.Count -eq 1 -and $endOffsets[0] -lt $beginOffsets[0])) {
                throw 'Incomplete or misordered Common Core markers'
            }
            $newline = if ($target.Text.Contains("`r`n")) { "`r`n" } else { "`n" }
            $normalizedCore = ($sourceCore -replace "`r`n|`r|`n", $newline)
            $blockBytes = [Text.Encoding]::UTF8.GetBytes("$($script:HarnessBeginMarker)$newline$normalizedCore$newline$($script:HarnessEndMarker)")
            $blockHash = Get-HarnessSha256 $blockBytes
            $existingBlockHash = $null

            if ($beginOffsets.Count -eq 1) {
                $blockLength = $endOffsets[0] + $endBytes.Length - $beginOffsets[0]
                $existingBlock = Get-HarnessByteSlice $target.Bytes $beginOffsets[0] $blockLength
                $existingBlockHash = Get-HarnessSha256 $existingBlock
                $prefix = Get-HarnessByteSlice $target.Bytes 0 $beginOffsets[0]
                $suffixStart = $endOffsets[0] + $endBytes.Length
                $suffix = Get-HarnessByteSlice $target.Bytes $suffixStart ($target.Bytes.Length - $suffixStart)
                $plannedAgentBytes = [byte[]] @($prefix + $blockBytes + $suffix)
            } else {
                $prefix = $target.Bytes
                $contentOffset = if ($target.HasBom) { 3 } else { 0 }
                $contentLength = $target.Bytes.Length - $contentOffset
                $separator = if ($contentLength -eq 0 -or $target.Text.EndsWith("`n") -or $target.Text.EndsWith("`r")) { [byte[]] @() } else { [Text.Encoding]::UTF8.GetBytes($newline) }
                $plannedAgentBytes = [byte[]] @($prefix + $separator + $blockBytes)
            }

            if ($stateCoreHash) {
                if (-not $existingBlockHash -or $existingBlockHash -cne $stateCoreHash) { throw 'Installed Common Core block drifted from prior state' }
                if ($existingBlockHash -cne $blockHash) {
                    $null = $changes.Add([pscustomobject] @{ kind = 'commonCore'; action = 'update'; target = 'AGENTS.md'; planned = $true })
                }
            } elseif ($existingBlockHash) {
                if ($existingBlockHash -cne $blockHash) { throw 'Unowned Common Core managed block already exists' }
                $null = $changes.Add([pscustomobject] @{ kind = 'commonCore'; action = 'recordOwnership'; target = 'AGENTS.md'; planned = $true })
            } else {
                $null = $changes.Add([pscustomobject] @{ kind = 'commonCore'; action = 'install'; target = 'AGENTS.md'; planned = $true })
            }
            if ($plannedAgentBytes.Length -gt 32KB) { throw 'Planned AGENTS.md exceeds 32 KiB' }
        } catch {
            $null = $blockers.Add([pscustomobject] @{ kind = 'commonCorePreflight'; message = $_.Exception.Message })
        }
    }

    foreach ($relative in @($stateWholeFiles.Keys)) {
        try {
            $targetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
            if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) { throw "Installed optional target is missing: $relative" }
            $actualHash = Get-HarnessSha256 ([IO.File]::ReadAllBytes($targetPath))
            if ($actualHash -cne $stateWholeFiles[$relative]) { throw "Installed optional target drifted: $relative" }
        } catch {
            $null = $blockers.Add([pscustomobject] @{ kind = 'optionalDrift'; message = $_.Exception.Message })
        }
    }

    foreach ($entry in $optionalEntries) {
        $targetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $entry.RelativePath
        $owned = $stateWholeFiles.ContainsKey($entry.RelativePath)
        $targetExists = Test-Path -LiteralPath $targetPath -PathType Leaf
        if ($IncludeDesignFrontend) {
            if ($targetExists -and -not $owned) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'optionalCollision'; message = "Unmanaged optional target exists: $($entry.RelativePath)" })
            } elseif (-not $targetExists) {
                $null = $changes.Add([pscustomobject] @{ kind = 'designFrontend'; action = 'install'; target = $entry.RelativePath; planned = $true })
            } elseif ($entry.Hash -cne $stateWholeFiles[$entry.RelativePath]) {
                $null = $changes.Add([pscustomobject] @{ kind = 'designFrontend'; action = 'update'; target = $entry.RelativePath; planned = $true })
            }
        } elseif ($priorOptionalOptIn -and $owned -and $entry.Hash -cne $stateWholeFiles[$entry.RelativePath]) {
            $null = $changes.Add([pscustomobject] @{ kind = 'designFrontend'; action = 'sourceUpdateAvailable'; target = $entry.RelativePath; planned = $false })
        } elseif ($priorOptionalOptIn -and -not $owned) {
            $null = $changes.Add([pscustomobject] @{ kind = 'designFrontend'; action = 'sourceUpdateAvailable'; target = $entry.RelativePath; planned = $false })
        }
    }

    $skillRoots = @((Join-Path $resolvedAgentsHome 'skills'), (Join-Path $resolvedCodexHome 'skills'))
    foreach ($collision in @(Get-HarnessFrontmatterCollisions $skillRoots $managedSkillFile $priorOptionalOptIn)) {
        $null = $blockers.Add([pscustomobject] @{ kind = 'duplicateSkill'; message = $collision })
    }

    $plannedChanges = @($changes | Where-Object { $_.planned })
    $status = if ($blockers.Count -gt 0) { 'blocked' } elseif ($plannedChanges.Count -gt 0) { 'ready' } else { 'current' }
    if ($Apply -and $blockers.Count -eq 0) {
        $status = 'blocked'
        $null = $blockers.Add([pscustomobject] @{ kind = 'applyNotImplemented'; message = 'Apply is reserved for the next implementation task; no target writes occurred.' })
    }

    [pscustomobject] @{
        status = $status
        changesRequired = [bool] ($plannedChanges.Count -gt 0)
        changes = @($changes)
        blockers = @($blockers)
        targets = [pscustomobject] @{
            codexHome = $resolvedCodexHome
            agentsHome = $resolvedAgentsHome
            backupRoot = $resolvedBackupRoot
            commonCore = $agentsPath
            state = $statePath
            designFrontendRoot = $optionalRoot
        }
        capabilities = [pscustomobject] @{
            python = 'observed-only'
            figma = 'checked-at-task-time'
            browser = 'checked-at-task-time'
        }
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try {
        if ($Check -eq $Apply) { throw 'Specify exactly one of -Check or -Apply.' }
        $result = Invoke-JoewrksHarnessSync @PSBoundParameters
    } catch {
        $result = [pscustomobject] @{
            status = 'blocked'
            changesRequired = $false
            changes = @()
            blockers = @([pscustomobject] @{ kind = 'invocation'; message = $_.Exception.Message })
            targets = $null
            capabilities = [pscustomobject] @{ python = 'observed-only'; figma = 'checked-at-task-time'; browser = 'checked-at-task-time' }
        }
    }
    $result | ConvertTo-Json -Compress -Depth 16
    if ($result.status -eq 'blocked') { exit 1 }
}
