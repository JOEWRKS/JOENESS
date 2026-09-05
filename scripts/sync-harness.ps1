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

$ErrorActionPreference = 'Stop'
$script:HarnessBeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$script:HarnessEndMarker = '<!-- JOEWRKS-HARNESS:END -->'

function Get-HarnessSha256 {
    param([byte[]] $Bytes)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function Get-HarnessWholeFileSelectionSha256 {
    param($WholeFiles)
    [string[]] $paths = @($WholeFiles.Keys | ForEach-Object { [string] $_ })
    [Array]::Sort($paths, [StringComparer]::Ordinal)
    $lines = @($paths | ForEach-Object {
        "$_=$($WholeFiles[$_])"
    })
    $bytes = (New-Object Text.UTF8Encoding($false)).GetBytes(($lines -join "`n"))
    Get-HarnessSha256 $bytes
}

function Get-HarnessPathIdentity {
    param([string] $Path)
    $normalized = [IO.Path]::GetFullPath($Path).TrimEnd('\', '/').Replace('/', '\').ToUpperInvariant()
    Get-HarnessSha256 ([Text.Encoding]::UTF8.GetBytes($normalized))
}

function Get-HarnessExitCode {
    param([string] $Status)
    switch ($Status) {
        { $_ -in @('current', 'ready', 'removed', 'legacy', 'unsupported') } { return 0 }
        'failed' { return 1 }
        'blocked' { return 2 }
        'unknown' { return 3 }
        default { return 3 }
    }
}

function New-HarnessPublicResult {
    param(
        [string] $Status, [string] $Mode, [string] $AgentsRoot, [string] $SkillsRoot,
        [string[]] $ActiveSkills, [object[]] $Warnings, [bool] $ChangesRequired,
        [object[]] $Changes, [object[]] $Blockers, $BackupPath, $Rollback,
        [string[]] $UnresolvedTargets
    )
    [pscustomobject][ordered]@{
        status = $Status
        mode = $Mode
        agentsRoot = $AgentsRoot
        skillsRoot = $SkillsRoot
        activeSkills = @($ActiveSkills | Sort-Object -CaseSensitive)
        warnings = @($Warnings)
        changesRequired = $ChangesRequired
        changes = @($Changes)
        blockers = @($Blockers)
        backupPath = $BackupPath
        rollback = $Rollback
        unresolvedTargets = @($UnresolvedTargets)
    }
}

function Get-HarnessPublicActiveSkills {
    param([string] $SourceRoot)
    try {
        $manifestPath = Join-Path $SourceRoot 'vendor\source-manifest.json'
        $manifestRead = Read-HarnessUtf8 $manifestPath
        $manifest = $manifestRead.Text | ConvertFrom-Json
        if ($null -eq $manifest.publicSkills) { throw 'Missing public skills' }
        [pscustomobject]@{ ActiveSkills = @($manifest.publicSkills | ForEach-Object { [string] $_ }); Warning = $null }
    } catch {
        [pscustomobject]@{ ActiveSkills = @(); Warning = 'Unable to determine active skills because the source manifest could not be read.' }
    }
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
        $deviceNumber = '1-9' + [char]0x00b9 + [char]0x00b2 + [char]0x00b3
        if ($baseName -match ("\A(?i:CON|PRN|AUX|NUL|COM[$deviceNumber]|LPT[$deviceNumber])\z")) {
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
        $item = $null
        try {
            $item = Get-Item -LiteralPath $current -Force -ErrorAction Stop
        } catch [Management.Automation.ItemNotFoundException] {
            $item = $null
        }
        if ($null -ne $item) {
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "$Label contains a reparse point: $current"
            }
        }
        if (-not [string]::IsNullOrEmpty($segment)) { $current = Join-Path $current $segment }
    }
    $item = $null
    try {
        $item = Get-Item -LiteralPath $current -Force -ErrorAction Stop
    } catch [Management.Automation.ItemNotFoundException] {
        $item = $null
    }
    if ($null -ne $item) {
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "$Label contains a reparse point: $current"
        }
    }
}

function Resolve-HarnessSourceFile {
    param([string] $Root, [string] $RelativePath)
    $relative = Get-HarnessSafeRelativePath $RelativePath 'Source path'
    $rootPath = [IO.Path]::GetFullPath($Root).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    $path = [IO.Path]::GetFullPath((Join-Path $Root ($relative -replace '/', [IO.Path]::DirectorySeparatorChar)))
    if (-not $path.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Source path escapes the repository: $RelativePath"
    }
    Assert-HarnessNoReparsePoint $Root $path 'Source path'
    $path
}

function Get-HarnessValidSha256 {
    param($Value, [string] $Label)
    if ($Value -isnot [string] -or $Value -cnotmatch '\A[0-9a-f]{64}\z') {
        throw "$Label is not a SHA-256"
    }
    $Value.ToLowerInvariant()
}

function Assert-HarnessObjectShape {
    param($Value, [string[]] $Properties, [string] $Label)
    if ($null -eq $Value) { throw "$Label is missing" }
    $actual = @($Value.PSObject.Properties.Name | Sort-Object -CaseSensitive)
    $expected = @($Properties | Sort-Object -CaseSensitive)
    if (($actual -join "`n") -cne ($expected -join "`n")) {
        throw "$Label has an unexpected shape"
    }
}

function Get-HarnessManifestSelections {
    param($Manifest, [string] $Root)
    $selected = [Collections.Generic.List[object]]::new()
    foreach ($skillProperty in @($Manifest.activeSkills.PSObject.Properties)) {
        $skill = $skillProperty.Value
        foreach ($file in @($skill.files)) { $null = $selected.Add($file) }
        foreach ($sourceName in @($skill.sourceDependencies)) {
            $source = $Manifest.sources.PSObject.Properties[[string] $sourceName]
            if ($null -eq $source) { throw "Missing declared source dependency: $sourceName" }
            foreach ($file in @($source.Value.files)) { $null = $selected.Add($file) }
        }
    }
    $normalized = [Collections.Generic.List[object]]::new()
    $exactDestinations = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    $caseInsensitiveDestinations = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($entry in $selected) {
        $relative = Get-HarnessSafeRelativePath ([string] $entry.localPath) 'Manifest destination'
        if (-not $exactDestinations.Add($relative)) { throw "Duplicate source-manifest destination: $relative" }
        if (-not $caseInsensitiveDestinations.Add($relative)) { throw "Case-insensitive destination collision: $relative" }
        $null = $normalized.Add([pscustomobject] @{ RelativePath = $relative; Entry = $entry })
    }
    foreach ($destination in $normalized) {
        foreach ($otherDestination in $normalized) {
            if ($destination.RelativePath -cne $otherDestination.RelativePath -and $otherDestination.RelativePath.StartsWith($destination.RelativePath + '/', [StringComparison]::OrdinalIgnoreCase)) {
                throw "Manifest file-directory collision: $($destination.RelativePath)"
            }
        }
    }
    foreach ($destination in $normalized) {
        $relative = $destination.RelativePath
        $entry = $destination.Entry
        $path = Resolve-HarnessSourceFile $Root $relative
        [pscustomobject] @{
            RelativePath = $relative
            Path = $path
            Hash = Get-HarnessValidSha256 $entry.sha256 "Manifest hash for $relative"
            Entry = $entry
        }
    }
}

function Get-HarnessLegacyInstallSelections {
    param($LegacyEntry, $Manifest, [string] $SourceRoot)
    $selected = [Collections.Generic.List[object]]::new()
    foreach ($file in @($LegacyEntry.files)) {
        $sourceRelative = Get-HarnessSafeRelativePath ([string] $file.sourcePath) 'Legacy source path'
        $targetRelative = Get-HarnessSafeRelativePath ([string] $file.localPath) 'Legacy target path'
        $sourcePath = Resolve-HarnessSourceFile $SourceRoot $sourceRelative
        $hash = Get-HarnessValidSha256 $file.sha256 'Legacy source hash'
        $bytes = [IO.File]::ReadAllBytes($sourcePath)
        if ($bytes.Length -ne [long] $file.bytes -or (Get-HarnessSha256 $bytes) -cne $hash) {
            throw "Legacy compatibility source mismatch: $sourceRelative"
        }
        $null = $selected.Add([pscustomobject]@{
            RelativePath = $targetRelative
            Path = $sourcePath
            Hash = $hash
            Entry = $file
        })
    }
    $dependencyProperty = $LegacyEntry.PSObject.Properties['sourceDependencies']
    foreach ($sourceName in @($(if ($null -ne $dependencyProperty) { $dependencyProperty.Value }))) {
        $sourceProperty = $Manifest.sources.PSObject.Properties[[string] $sourceName]
        if ($null -eq $sourceProperty) { throw "Missing legacy source dependency: $sourceName" }
        foreach ($file in @($sourceProperty.Value.files)) {
            $relative = Get-HarnessSafeRelativePath ([string] $file.localPath) 'Legacy dependency path'
            $path = Resolve-HarnessSourceFile $SourceRoot $relative
            $hash = Get-HarnessValidSha256 $file.sha256 "Legacy dependency hash for $relative"
            $bytes = [IO.File]::ReadAllBytes($path)
            if ($bytes.Length -ne [long] $file.bytes -or (Get-HarnessSha256 $bytes) -cne $hash) {
                throw "Legacy dependency source mismatch: $relative"
            }
            $null = $selected.Add([pscustomobject]@{
                RelativePath = $relative
                Path = $path
                Hash = $hash
                Entry = $file
            })
        }
    }
    $destinations = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($selection in $selected) {
        if (-not $destinations.Add($selection.RelativePath)) {
            throw "Duplicate legacy install target: $($selection.RelativePath)"
        }
    }
    $selected.ToArray()
}

function Get-HarnessFileSnapshot {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject] @{ Exists = $false; Hash = $null; Bytes = [byte[]] @() }
    }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Target path is not a file: $Path"
    }
    $bytes = [IO.File]::ReadAllBytes($Path)
    [pscustomobject] @{ Exists = $true; Hash = Get-HarnessSha256 $bytes; Bytes = $bytes }
}

function Get-HarnessParentFileCollision {
    param([string] $Path)
    $current = Split-Path -Parent ([IO.Path]::GetFullPath($Path))
    while (-not [string]::IsNullOrWhiteSpace($current)) {
        if (Test-Path -LiteralPath $current) {
            if (-not (Test-Path -LiteralPath $current -PathType Container)) { return $current }
            return $null
        }
        $parent = Split-Path -Parent $current
        if ($parent -eq $current) { return $null }
        $current = $parent
    }
    $null
}

function Assert-HarnessFileSnapshot {
    param([string] $Path, $Snapshot)
    if (-not (Test-Path -LiteralPath $Path)) {
        if ($Snapshot.Exists) { throw "Target disappeared after preflight: $Path" }
        return
    }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Target type changed after preflight: $Path"
    }
    if (-not $Snapshot.Exists) { throw "Target appeared after preflight: $Path" }
    $currentHash = Get-HarnessSha256 ([IO.File]::ReadAllBytes($Path))
    if ($currentHash -cne $Snapshot.Hash) { throw "Target changed after preflight: $Path" }
}

function New-HarnessTargetDirectory {
    param([string] $Path, [Collections.Generic.List[string]] $CreatedDirectories)
    if (Test-Path -LiteralPath $Path) {
        if (-not (Test-Path -LiteralPath $Path -PathType Container)) { throw "Target parent is not a directory: $Path" }
        return
    }
    $missing = [Collections.Generic.List[string]]::new()
    $current = [IO.Path]::GetFullPath($Path)
    while (-not (Test-Path -LiteralPath $current)) {
        $missing.Add($current)
        $current = Split-Path -Parent $current
    }
    if (-not (Test-Path -LiteralPath $current -PathType Container)) { throw "Target parent is not a directory: $current" }
    for ($i = $missing.Count - 1; $i -ge 0; $i--) {
        $directory = $missing[$i]
        New-Item -ItemType Directory -Path $directory -ErrorAction Stop | Out-Null
        if ($null -ne $CreatedDirectories) { $CreatedDirectories.Add($directory) }
    }
}

function Remove-HarnessEmptyDirectories {
    param([string] $BoundaryRoot, [string[]] $Directories)
    $removed = [Collections.Generic.List[string]]::new()
    $nonEmpty = [Collections.Generic.List[string]]::new()
    $failed = [Collections.Generic.List[string]]::new()
    $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $unique = [Collections.Generic.List[string]]::new()
    $boundary = [IO.Path]::GetFullPath($BoundaryRoot)
    $boundaryPathRoot = [IO.Path]::GetPathRoot($boundary)
    if ($boundary.Length -gt $boundaryPathRoot.Length) { $boundary = $boundary.TrimEnd('\', '/') }
    $boundaryPrefix = if ($boundary.EndsWith([string] [IO.Path]::DirectorySeparatorChar)) { $boundary } else { $boundary + [IO.Path]::DirectorySeparatorChar }
    foreach ($candidate in @($Directories)) {
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
        try {
            $full = [IO.Path]::GetFullPath($candidate)
            $pathRoot = [IO.Path]::GetPathRoot($full)
            if ($full.Length -gt $pathRoot.Length) { $full = $full.TrimEnd('\', '/') }
            if ($full -ieq $pathRoot) { throw "Directory cleanup target is a filesystem root: $full" }
            if ($full -ine $boundary -and -not $full.StartsWith($boundaryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                throw "Directory cleanup target escapes its boundary: $full"
            }
            if ($seen.Add($full)) { $null = $unique.Add($full) }
        } catch {
            $null = $failed.Add([string] $candidate)
        }
    }
    $ordered = @($unique | Sort-Object @{ Expression = { $_.Length }; Descending = $true }, @{ Expression = { $_ }; Descending = $true })
    foreach ($directory in $ordered) {
        try {
            Assert-HarnessNoReparsePoint $boundary $directory 'Directory cleanup target'
            $item = Get-Item -LiteralPath $directory -Force -ErrorAction Stop
            if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "Directory cleanup target is unsafe: $directory"
            }
            if (@(Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop).Count -ne 0) {
                $null = $nonEmpty.Add($directory)
                continue
            }
            $deletePath = [IO.Path]::GetFullPath($directory)
            $deletePathRoot = [IO.Path]::GetPathRoot($deletePath)
            if ($deletePath.Length -gt $deletePathRoot.Length) { $deletePath = $deletePath.TrimEnd('\', '/') }
            if ($deletePath -ine $boundary -and -not $deletePath.StartsWith($boundaryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                throw "Directory cleanup target escapes its boundary before deletion: $deletePath"
            }
            Assert-HarnessNoReparsePoint $boundary $deletePath 'Directory cleanup target before deletion'
            [IO.Directory]::Delete($deletePath, $false)
            $null = $removed.Add($directory)
        } catch [Management.Automation.ItemNotFoundException] {
            continue
        } catch {
            $null = $failed.Add($directory)
        }
    }
    [pscustomobject] @{ removed = @($removed); nonEmpty = @($nonEmpty); failed = @($failed) }
}

function Set-HarnessFile {
    param($Operation, [Collections.Generic.List[string]] $CreatedDirectories)
    $temporaryPath = $null
    $tombstonePath = $null
    try {
        if (-not $Operation.DesiredExists) {
            Assert-HarnessFileSnapshot $Operation.TargetPath $Operation.Snapshot
            $directory = Split-Path -Parent $Operation.TargetPath
            $tombstonePath = Join-Path $directory ('.' + [IO.Path]::GetFileName($Operation.TargetPath) + '.joewrks-' + [guid]::NewGuid().ToString('N') + '.delete')
            [IO.File]::Move($Operation.TargetPath, $tombstonePath)
            if ((Get-HarnessSha256 ([IO.File]::ReadAllBytes($tombstonePath))) -cne $Operation.Snapshot.Hash) {
                throw "Moved target changed after preflight: $($Operation.TargetPath)"
            }
            [IO.File]::Delete($tombstonePath)
            if (Test-Path -LiteralPath $tombstonePath) { throw "Deleted tombstone still exists: $tombstonePath" }
            $tombstonePath = $null
            $Operation.Committed = $true
            if (Test-Path -LiteralPath $Operation.TargetPath) { throw "Deleted target still exists: $($Operation.TargetPath)" }
            return
        }
        $directory = Split-Path -Parent $Operation.TargetPath
        New-HarnessTargetDirectory $directory $CreatedDirectories
        $temporaryPath = Join-Path $directory ('.' + [IO.Path]::GetFileName($Operation.TargetPath) + '.joewrks-' + [guid]::NewGuid().ToString('N') + '.tmp')
        [IO.File]::WriteAllBytes($temporaryPath, $Operation.DesiredBytes)
        if ((Get-HarnessSha256 ([IO.File]::ReadAllBytes($temporaryPath))) -cne $Operation.AppliedHash) {
            throw "Temporary file verification failed: $($Operation.TargetPath)"
        }
        Assert-HarnessFileSnapshot $Operation.TargetPath $Operation.Snapshot
        if ($Operation.Snapshot.Exists) {
            [IO.File]::Replace($temporaryPath, $Operation.TargetPath, [Management.Automation.Language.NullString]::Value)
        } else {
            [IO.File]::Move($temporaryPath, $Operation.TargetPath)
        }
        $Operation.Committed = $true
        $actualHash = Get-HarnessSha256 ([IO.File]::ReadAllBytes($Operation.TargetPath))
        if ($actualHash -cne $Operation.AppliedHash) {
            throw "Applied file verification failed: $($Operation.TargetPath)"
        }
    } finally {
        if ($tombstonePath -and (Test-Path -LiteralPath $tombstonePath -PathType Leaf)) {
            if (-not (Test-Path -LiteralPath $Operation.TargetPath)) {
                try {
                    [IO.File]::Move($tombstonePath, $Operation.TargetPath)
                    $tombstonePath = $null
                } catch {
                    $Operation.Unresolved = $true
                }
            } else {
                $Operation.Unresolved = $true
            }
        }
        if ($temporaryPath -and (Test-Path -LiteralPath $temporaryPath -PathType Leaf)) { Remove-Item -LiteralPath $temporaryPath -Force }
    }
}

function Get-HarnessSkillSkeletonState {
    param([string] $BoundaryRoot, [string] $Root, [string[]] $AllowedDirectories)
    $allowed = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($path in $AllowedDirectories) { $null = $allowed.Add([IO.Path]::GetFullPath($path).TrimEnd('\', '/')) }
    try {
        Assert-HarnessNoReparsePoint $BoundaryRoot $Root 'Managed skill skeleton'
    } catch {
        return [pscustomobject] @{ Exists = $true; Reusable = $false; Message = $_.Exception.Message }
    }
    try {
        $rootItem = Get-Item -LiteralPath $Root -Force -ErrorAction Stop
    } catch [Management.Automation.ItemNotFoundException] {
        return [pscustomobject] @{ Exists = $false; Reusable = $true; Message = $null }
    } catch {
        return [pscustomobject] @{ Exists = $true; Reusable = $false; Message = "Cannot inspect managed skill skeleton: $($_.Exception.Message)" }
    }
    try {
        if (-not $rootItem.PSIsContainer) { throw "Managed skill namespace is not a directory: $Root" }
        if (($rootItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Managed skill skeleton contains a reparse point: $Root" }
        $pending = [Collections.Generic.Queue[string]]::new()
        $pending.Enqueue([IO.Path]::GetFullPath($Root).TrimEnd('\', '/'))
        while ($pending.Count -gt 0) {
            $directory = $pending.Dequeue()
            if (-not $allowed.Contains($directory)) { throw "Managed skill skeleton contains an unexpected directory: $directory" }
            foreach ($entry in @(Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop)) {
                if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                    throw "Managed skill skeleton contains a reparse point: $($entry.FullName)"
                }
                if (-not $entry.PSIsContainer) { throw "Managed skill skeleton contains a file: $($entry.FullName)" }
                $pending.Enqueue([IO.Path]::GetFullPath($entry.FullName).TrimEnd('\', '/'))
            }
        }
        [pscustomobject] @{ Exists = $true; Reusable = $true; Message = $null }
    } catch {
        [pscustomobject] @{ Exists = $true; Reusable = $false; Message = $_.Exception.Message }
    }
}

function Get-HarnessFrontmatterCollisions {
    param(
        [string[]] $SkillRoots,
        [hashtable] $ManagedSkillFiles,
        [string[]] $OwnedSkillFiles = @()
    )
    $collisions = [Collections.Generic.List[string]]::new()
    $reservedNames = @($ManagedSkillFiles.Keys) + @('joewrks-project-setup', 'joewrks-design-frontend')
    foreach ($root in $SkillRoots) {
        if (-not (Test-Path -LiteralPath $root -PathType Container)) { continue }
        foreach ($skillFile in Get-ChildItem -LiteralPath $root -Filter 'SKILL.md' -File -Recurse -Force -ErrorAction Stop) {
            $relative = $skillFile.FullName.Substring($root.Length).TrimStart('\', '/')
            if (($relative -split '[\\/]') -contains '.system') { continue }
            $isOwned = @($OwnedSkillFiles | Where-Object { $skillFile.FullName -ieq $_ }).Count -gt 0
            if ($isOwned) { continue }
            try {
                $text = (Read-HarnessUtf8 $skillFile.FullName).Text
                $frontmatter = [regex]::Match(
                    $text,
                    '\A---[ \t]*\r?\n(?<body>.*?)(?:\r?\n)---[ \t]*(?:\r?\n|\z)',
                    [Text.RegularExpressions.RegexOptions]::Singleline
                )
                if (-not $frontmatter.Success) { continue }
                foreach ($skillName in $reservedNames) {
                    $escapedName = [regex]::Escape([string] $skillName)
                    $pattern = '(?m)^[ \t]*name[ \t]*:[ \t]*(?:' + $escapedName + '|''' + $escapedName + '''|"' + $escapedName + '")(?:[ \t]+#.*)?[ \t]*$'
                    if ($frontmatter.Groups['body'].Value -match $pattern) {
                        $null = $collisions.Add("Duplicate skill frontmatter name: $($skillFile.FullName)")
                        break
                    }
                }
            } catch {
                $isReservedParent = @($reservedNames | Where-Object { $skillFile.Directory.Name -ieq $_ }).Count -gt 0
                if ($isReservedParent) {
                    $null = $collisions.Add("Cannot inspect skill frontmatter as UTF-8: $($skillFile.FullName)")
                }
            }
        }
    }
    $collisions.ToArray()
}

function Invoke-JoewrksHarnessSync {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ParameterSetName = 'Check')] [switch] $Check,
        [Parameter(Mandatory, ParameterSetName = 'Apply')] [switch] $Apply,
        [Parameter(Mandatory, ParameterSetName = 'Remove')] [switch] $Remove,
        [switch] $IncludeDesignFrontend,
        [string] $CodexHome,
        [string] $AgentsHome,
        [string] $BackupRoot,
        [scriptblock] $AfterReplace
    )

    $modeCount = ([int] $Check.IsPresent) + ([int] $Apply.IsPresent) + ([int] $Remove.IsPresent)
    if ($modeCount -ne 1) { throw 'Specify exactly one of -Check, -Apply, or -Remove.' }
    $mode = if ($Check) { 'check' } elseif ($Apply) { 'apply' } else { 'remove' }

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
    $codexSkillsPath = Join-Path $resolvedCodexHome 'skills'
    $blockers = [Collections.Generic.List[object]]::new()
    $changes = [Collections.Generic.List[object]]::new()
    $optionalEntries = [Collections.Generic.List[object]]::new()
    $manifestSkillRelativePaths = @{}
    $manifestSkillSkeletons = @{}
    $manifest = $null
    $manifestHash = $null
    $historicalV1WholeFiles = @{}
    $historicalV1SkillName = $null
    $release01WholeFiles = @{}
    $release01SkillFiles = @{}
    $release01SkillNames = @()
    $release01LegacySkillNames = @()
    $release01LegacyPrefixes = @()
    $release01Dependencies = @()
    $controlV2ManifestHash = $null
    $controlV2ManifestBytes = $null
    $controlV2CorePath = $null
    $controlV2CoreHash = $null
    $controlV2SkillNames = @()
    $controlV2WholeFileCount = $null
    $controlV2SelectionHash = $null
    $isExactControlInstall = $false
    $astraNative = $false
    $sourceCore = $null
    $blockHash = $null
    $agentSnapshot = $null
    $stateSnapshot = $null
    $optionalSnapshots = @{}
    $targetPathSafetyBlocked = $false
    $bundleSelection = 'personal-pilot'
    $warnings = @()
    if ($IncludeDesignFrontend) {
        $warnings += 'DEPRECATED: -IncludeDesignFrontend is ignored; the current JOENESS bundle already installs all active skills.'
    }

    foreach ($target in @(
        [pscustomobject] @{ Root = $resolvedCodexHome; Path = $agentsPath; Label = 'Common Core target' },
        [pscustomobject] @{ Root = $resolvedCodexHome; Path = $overridePath; Label = 'Common Core override' },
        [pscustomobject] @{ Root = $resolvedCodexHome; Path = $statePath; Label = 'State target' },
        [pscustomobject] @{ Root = $resolvedCodexHome; Path = $codexSkillsPath; Label = 'Codex skills' },
        [pscustomobject] @{ Root = $resolvedAgentsHome; Path = $resolvedAgentsHome; Label = 'Agents home' },
        [pscustomobject] @{ Root = $resolvedBackupRoot; Path = $resolvedBackupRoot; Label = 'Backup root' }
    )) {
        try {
            Assert-HarnessNoReparsePoint $target.Root $target.Path $target.Label
        } catch {
            $targetPathSafetyBlocked = $true
            $null = $blockers.Add([pscustomobject] @{ kind = 'targetSafety'; message = $_.Exception.Message })
        }
    }

    try {
        $manifestPath = Resolve-HarnessSourceFile $sourceRoot 'vendor/source-manifest.json'
        if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'Missing vendor/source-manifest.json' }
        $manifestRead = Read-HarnessUtf8 $manifestPath
        $manifestHash = Get-HarnessSha256 $manifestRead.Bytes
        $manifest = $manifestRead.Text | ConvertFrom-Json
        $astraNative = [string] $manifest.runtimeMode -ceq 'none'
        if (-not $astraNative -or [string] $manifest.target.model -cne 'gpt-6-astra' -or [string] $manifest.target.reasoningEffort -cne 'xhigh') {
            throw 'Active distribution is not the supported Astra-native identity'
        }
        if ($null -ne $manifest.activeCommonCore -or
            @($manifest.managedRuntimeFiles).Count -ne 0 -or
            @($manifest.publicSkills).Count -ne 0 -or
            @($manifest.defaultVendors).Count -ne 0 -or
            $null -ne $manifest.pluginRouting) {
            throw 'Astra-native distribution must have zero managed runtime payload'
        }
        $coreEntry = $manifest.activeCommonCore
        $controlV2 = $manifest.compatibility.installIdentities.controlSixSkill
        Assert-HarnessObjectShape $controlV2 @('commit', 'distributionManifest', 'activeCommonCore', 'selection') 'Control V2 compatibility identity'
        if ([string] $controlV2.commit -cnotmatch '\A[0-9a-f]{40}\z') { throw 'Control V2 compatibility commit is not a Git identity' }
        Assert-HarnessObjectShape $controlV2.distributionManifest @('path', 'bytes', 'sha256') 'Control V2 manifest identity'
        $controlV2ManifestPath = Get-HarnessSafeRelativePath ([string] $controlV2.distributionManifest.path) 'Control V2 manifest path'
        if ($controlV2ManifestPath -cne 'vendor/source-manifest.json') { throw 'Control V2 manifest path is invalid' }
        $controlV2ManifestBytes = [long] $controlV2.distributionManifest.bytes
        if ($controlV2ManifestBytes -le 0) { throw 'Control V2 manifest byte count is invalid' }
        $controlV2ManifestHash = Get-HarnessValidSha256 $controlV2.distributionManifest.sha256 'Control V2 manifest hash'
        Assert-HarnessObjectShape $controlV2.activeCommonCore @('path', 'sha256') 'Control V2 Common Core identity'
        $controlV2CorePath = Get-HarnessSafeRelativePath ([string] $controlV2.activeCommonCore.path) 'Control V2 Common Core path'
        $controlV2CoreHash = Get-HarnessValidSha256 $controlV2.activeCommonCore.sha256 'Control V2 Common Core hash'
        Assert-HarnessObjectShape $controlV2.selection @('canonicalization', 'activeSkillNames', 'wholeFileCount', 'sha256') 'Control V2 selection identity'
        if ([string] $controlV2.selection.canonicalization -cne 'ordinal-sorted localPath=sha256 UTF-8 lines joined by LF without trailing LF') {
            throw 'Control V2 selection canonicalization is unsupported'
        }
        $controlV2SkillNames = @($controlV2.selection.activeSkillNames | ForEach-Object { [string] $_ })
        if ($controlV2SkillNames.Count -eq 0 -or ($controlV2SkillNames -join "`n") -cne (@($controlV2SkillNames | Sort-Object -CaseSensitive -Unique) -join "`n")) {
            throw 'Control V2 active skill names are not uniquely sorted'
        }
        $controlV2WholeFileCount = [long] $controlV2.selection.wholeFileCount
        if ($controlV2WholeFileCount -le 0) { throw 'Control V2 selection count is invalid' }
        $controlV2SelectionHash = Get-HarnessValidSha256 $controlV2.selection.sha256 'Control V2 selection hash'
        if ($null -ne $coreEntry) { throw 'Astra-native manifest unexpectedly selects a Common Core' }
    } catch {
        $null = $blockers.Add([pscustomobject] @{ kind = 'sourceIntegrity'; message = $_.Exception.Message })
    }
    if ($null -ne $manifest) {
        foreach ($skillName in @($manifestSkillRelativePaths.Keys)) {
            try {
                $rootRelative = Get-HarnessSafeRelativePath "skills/$skillName" 'Managed skill namespace'
                $agentsRootPrefix = [IO.Path]::GetFullPath($resolvedAgentsHome).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
                $rootPath = [IO.Path]::GetFullPath((Join-Path $resolvedAgentsHome ($rootRelative -replace '/', [IO.Path]::DirectorySeparatorChar)))
                if (-not $rootPath.StartsWith($agentsRootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                    throw "Managed skill namespace escapes AgentsHome: $rootRelative"
                }
                $allowed = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
                $null = $allowed.Add($rootPath.TrimEnd('\', '/'))
                foreach ($entry in @($optionalEntries | Where-Object {
                    $_.RelativePath.StartsWith($rootRelative + '/', [StringComparison]::OrdinalIgnoreCase)
                })) {
                    $entryPath = [IO.Path]::GetFullPath((Join-Path $resolvedAgentsHome ($entry.RelativePath -replace '/', [IO.Path]::DirectorySeparatorChar)))
                    if (-not $entryPath.StartsWith($agentsRootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                        throw "Managed skill target escapes AgentsHome: $($entry.RelativePath)"
                    }
                    $parent = Split-Path -Parent $entryPath
                    while ($parent.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
                        $null = $allowed.Add($parent.TrimEnd('\', '/'))
                        if ($parent -ieq $rootPath) { break }
                        $parent = Split-Path -Parent $parent
                    }
                }
                $manifestSkillSkeletons[$skillName] = [pscustomobject] @{
                    RootPath = $rootPath
                    AllowedDirectories = @($allowed)
                }
            } catch {
                $null = $blockers.Add([pscustomobject] @{ kind = 'sourceIntegrity'; message = $_.Exception.Message })
            }
        }
    }

    $state = $null
    $stateCoreHash = $null
    $stateWholeFiles = @{}
    if (-not $targetPathSafetyBlocked -and (Test-Path -LiteralPath $statePath)) {
        $stateRootIdentityMismatch = $false
        try {
            if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) { throw "State path is not a file: $statePath" }
            $stateRead = Read-HarnessUtf8 $statePath
            $stateSnapshot = [pscustomobject] @{ Exists = $true; Hash = Get-HarnessSha256 $stateRead.Bytes; Bytes = $stateRead.Bytes }
            $state = $stateRead.Text | ConvertFrom-Json
            if ($state.schemaVersion -isnot [int] -or $state.schemaVersion -notin @(1, 2)) { throw 'Unsupported state schemaVersion' }
            if ($state.schemaVersion -eq 1) {
                Assert-HarnessObjectShape $state @('schemaVersion', 'sourceIdentities', 'managedBlocks', 'wholeFileTargets') 'State'
            } else {
                Assert-HarnessObjectShape $state @('schemaVersion', 'bundleSelection', 'agentsHomeIdentitySha256', 'sourceIdentities', 'managedBlocks', 'wholeFileTargets') 'State'
                if ([string] $state.bundleSelection -cne $bundleSelection) { throw 'State bundle selection is invalid' }
                $stateAgentsHomeIdentity = Get-HarnessValidSha256 $state.agentsHomeIdentitySha256 'State AgentsHome identity'
                if ($stateAgentsHomeIdentity -cne (Get-HarnessPathIdentity $resolvedAgentsHome)) {
                    $stateRootIdentityMismatch = $true
                    throw 'State AgentsHome identity does not match the resolved AgentsHome'
                }
            }
            Assert-HarnessObjectShape $state.managedBlocks @('AGENTS.md') 'State managedBlocks'
            $stateCoreHash = Get-HarnessValidSha256 $state.managedBlocks.'AGENTS.md' 'State AGENTS.md managed-block hash'
            if ($state.wholeFileTargets -isnot [Management.Automation.PSCustomObject]) {
                throw 'State wholeFileTargets is not an object'
            }
            foreach ($property in @($state.wholeFileTargets.PSObject.Properties)) {
                $relative = ([string] $property.Name).Replace('\', '/')
                $null = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
                if ($property.Name -cne $relative -or $stateWholeFiles.ContainsKey($relative)) {
                    throw "State target is not uniquely normalized: $($property.Name)"
                }
                $stateWholeFiles[$relative] = Get-HarnessValidSha256 $property.Value "State target hash for $relative"
            }

            $identityNames = if ($state.schemaVersion -eq 2) {
                if ($stateWholeFiles.Count -eq 0) { throw 'V2 state has no bundle targets' }
                @('commonCore', 'bundleManifest')
            } elseif ($stateWholeFiles.Count -gt 0) {
                @('commonCore', 'designFrontend')
            } else {
                @('commonCore')
            }
            Assert-HarnessObjectShape $state.sourceIdentities $identityNames 'State sourceIdentities'
            Assert-HarnessObjectShape $state.sourceIdentities.commonCore @('path', 'sha256') 'State commonCore source identity'
            $stateCommonCoreSourcePath = Get-HarnessSafeRelativePath ([string] $state.sourceIdentities.commonCore.path) 'State commonCore source path'
            if ($state.schemaVersion -eq 1 -and $stateCommonCoreSourcePath -cne 'AGENTS.md') {
                throw 'V1 State commonCore source path is not historical'
            }
            $stateCommonCoreSourceHash = Get-HarnessValidSha256 $state.sourceIdentities.commonCore.sha256 'State commonCore source hash'
            if ($state.schemaVersion -eq 1 -and ($null -eq $historicalCoreEntry -or $stateCommonCoreSourceHash -cne ([string] $historicalCoreEntry.sha256).ToLowerInvariant())) {
                throw 'V1 State commonCore source identity is not historical'
            }

            if ($stateWholeFiles.Count -gt 0) {
                $installedManifestRelative = 'vendor/source-manifest.json'
                if (-not $stateWholeFiles.ContainsKey($installedManifestRelative)) {
                    throw 'Optional state does not own vendor/source-manifest.json'
                }
                $manifestIdentityName = if ($state.schemaVersion -eq 2) { 'bundleManifest' } else { 'designFrontend' }
                $manifestIdentity = $state.sourceIdentities.PSObject.Properties[$manifestIdentityName].Value
                Assert-HarnessObjectShape $manifestIdentity @('path', 'sha256') "State $manifestIdentityName source identity"
                if ([string] $manifestIdentity.path -cne $installedManifestRelative) {
                    throw "State $manifestIdentityName source path is invalid"
                }
                $stateManifestSourceHash = Get-HarnessValidSha256 $manifestIdentity.sha256 "State $manifestIdentityName source hash"
                if ($stateManifestSourceHash -cne $stateWholeFiles[$installedManifestRelative]) {
                    throw "State $manifestIdentityName identity does not match its manifest target"
                }

                $installedManifestPath = Resolve-HarnessSourceFile $resolvedAgentsHome $installedManifestRelative
                if (-not (Test-Path -LiteralPath $installedManifestPath -PathType Leaf)) { throw 'Installed source manifest is missing' }
                $installedManifestRead = Read-HarnessUtf8 $installedManifestPath
                if ((Get-HarnessSha256 $installedManifestRead.Bytes) -cne $stateManifestSourceHash) {
                    throw 'Installed source manifest drifted from state'
                }
                $installedManifest = $installedManifestRead.Text | ConvertFrom-Json
                $installedActiveCore = $installedManifest.PSObject.Properties['activeCommonCore']
                $installedCore = if ($null -eq $installedActiveCore) {
                    $installedManifest.evaluation.current.commonCore
                } else {
                    $installedActiveCore.Value
                }
                $installedCorePath = Get-HarnessSafeRelativePath ([string] $installedCore.path) 'Installed manifest Common Core path'
                if ($installedCorePath -cne $stateCommonCoreSourcePath) {
                    throw 'State commonCore source path does not match its installed manifest'
                }
                $installedCoreHash = Get-HarnessValidSha256 $installedCore.sha256 'Installed manifest Common Core hash'
                if ($stateCommonCoreSourceHash -cne $installedCoreHash) {
                    throw 'State commonCore source identity does not match its installed manifest'
                }
                $installedSkillNames = @($installedManifest.activeSkills.PSObject.Properties.Name | Sort-Object -CaseSensitive)
                if ($state.schemaVersion -eq 1) {
                    if (($installedSkillNames -join "`n") -cne $historicalV1SkillName) {
                        throw 'V1 installed manifest active skill set is not historical'
                    }
                    $installedDesignSkill = $installedManifest.activeSkills.PSObject.Properties[$historicalV1SkillName].Value
                    if ($installedDesignSkill.PSObject.Properties.Name -contains 'activationPolicy') {
                        throw 'V1 installed manifest design skill has a non-historical activationPolicy'
                    }
                    if ($null -eq $historicalCoreEntry -or $installedCoreHash -cne ([string] $historicalCoreEntry.sha256).ToLowerInvariant()) {
                        throw 'V1 installed manifest Common Core identity is not historical'
                    }
                }

                $installedWholeFiles = @{}
                foreach ($selection in @(Get-HarnessManifestSelections $installedManifest $resolvedAgentsHome)) {
                    $installedWholeFiles[$selection.RelativePath] = $selection.Hash
                }
                $isRelease01V2 = $false
                $isCurrentV2 = $false
                $isControlV2 = $false
                $isPriorLeanV2 = $false
                if ($state.schemaVersion -eq 2) {
                    $isRelease01V2 = @($installedSkillNames | Where-Object { $release01LegacySkillNames -ccontains $_ }).Count -gt 0
                    if (-not $isRelease01V2) {
                        foreach ($relative in @($installedWholeFiles.Keys)) {
                            if (@($release01LegacyPrefixes | Where-Object { $relative.StartsWith($_, [StringComparison]::OrdinalIgnoreCase) }).Count -gt 0) {
                                $isRelease01V2 = $true
                                break
                            }
                        }
                    }
                    if ($isRelease01V2) {
                        if (($installedSkillNames -join "`n") -cne ($release01SkillNames -join "`n")) {
                            throw 'Release 0.1 installed manifest active skill set is not pinned'
                        }
                        if ($installedCorePath -cne $releaseCoreSource -or $installedCoreHash -cne $releaseCoreHash) {
                            throw 'Release 0.1 installed manifest Common Core identity is not pinned'
                        }
                        foreach ($skillName in $release01SkillNames) {
                            $installedSkill = $installedManifest.activeSkills.PSObject.Properties[$skillName].Value
                            $expectedDependencies = if ($skillName -ceq $historicalV1SkillName) { @($release01Dependencies) } else { @() }
                            $installedDependencies = @($installedSkill.sourceDependencies | ForEach-Object { [string] $_ })
                            if (($installedDependencies -join "`n") -cne ($expectedDependencies -join "`n")) {
                                throw "Release 0.1 installed manifest dependencies are not pinned: $skillName"
                            }
                            $expectedFiles = @($release01SkillFiles[$skillName])
                            $installedFiles = @($installedSkill.files)
                            if ($installedFiles.Count -ne $expectedFiles.Count) {
                                throw "Release 0.1 installed manifest file descriptor count is not pinned: $skillName"
                            }
                            for ($fileIndex = 0; $fileIndex -lt $expectedFiles.Count; $fileIndex++) {
                                $expectedFile = $expectedFiles[$fileIndex]
                                $installedFile = $installedFiles[$fileIndex]
                                $installedFilePath = Get-HarnessSafeRelativePath ([string] $installedFile.localPath) "Release 0.1 installed file path for $skillName"
                                $installedFileHash = Get-HarnessValidSha256 $installedFile.sha256 "Release 0.1 installed file hash for $skillName"
                                if ($installedFilePath -cne ([string] $expectedFile.localPath) -or
                                    [long] $installedFile.bytes -ne [long] $expectedFile.bytes -or
                                    $installedFileHash -cne ([string] $expectedFile.sha256).ToLowerInvariant()) {
                                    throw "Release 0.1 installed manifest file descriptor is not pinned: $installedFilePath"
                                }
                            }
                        }
                        $installedNames = @($installedWholeFiles.Keys | Sort-Object -CaseSensitive)
                        $releaseNames = @($release01WholeFiles.Keys | Sort-Object -CaseSensitive)
                        if (($installedNames -join "`n") -cne ($releaseNames -join "`n")) {
                            throw 'Release 0.1 installed manifest selection is not pinned'
                        }
                        foreach ($relative in $releaseNames) {
                            if ($installedWholeFiles[$relative] -cne $release01WholeFiles[$relative]) {
                                throw "Release 0.1 installed manifest target hash is not pinned: $relative"
                            }
                        }
                    } elseif ($stateManifestSourceHash -ceq $manifestHash) {
                        $isCurrentV2 = $true
                    } elseif ($stateManifestSourceHash -ceq $controlV2ManifestHash) {
                        if ($installedManifestRead.Bytes.Length -ne $controlV2ManifestBytes) {
                            throw 'Control V2 installed manifest byte count is not pinned'
                        }
                        if ($installedCorePath -cne $controlV2CorePath -or $installedCoreHash -cne $controlV2CoreHash) {
                            throw 'Control V2 installed manifest Common Core identity is not pinned'
                        }
                        if (($installedSkillNames -join "`n") -cne ($controlV2SkillNames -join "`n")) {
                            throw 'Control V2 installed manifest active skill set is not pinned'
                        }
                        if ($installedWholeFiles.Count -ne $controlV2WholeFileCount -or
                            (Get-HarnessWholeFileSelectionSha256 $installedWholeFiles) -cne $controlV2SelectionHash) {
                            throw 'Control V2 installed manifest selection is not pinned'
                        }
                        $isControlV2 = $true
                        $isExactControlInstall = $true
                    } elseif ($installedSkillNames.Count -eq 0 -and $installedWholeFiles.Count -eq 0) {
                        $isPriorLeanV2 = $true
                    } else {
                        throw 'V2 installed manifest identity is not trusted'
                    }
                }
                if ($state.schemaVersion -eq 1) {
                    $installedNames = @($installedWholeFiles.Keys | Sort-Object -CaseSensitive)
                    $historicalNames = @($historicalV1WholeFiles.Keys | Sort-Object -CaseSensitive)
                    if (($installedNames -join "`n") -cne ($historicalNames -join "`n")) {
                        throw 'V1 installed manifest selection is not historical'
                    }
                    foreach ($relative in $historicalNames) {
                        if ($installedWholeFiles[$relative] -cne $historicalV1WholeFiles[$relative]) {
                            throw "V1 installed manifest target hash is not historical: $relative"
                        }
                    }
                }
                $expectedWholeFiles = if ($state.schemaVersion -eq 1) {
                    $historicalV1WholeFiles.Clone()
                } elseif ($isRelease01V2) {
                    $release01WholeFiles.Clone()
                } elseif ($isCurrentV2 -or $isControlV2 -or $isPriorLeanV2) {
                    $installedWholeFiles
                } else {
                    throw 'Installed manifest ownership identity was not established'
                }
                $expectedWholeFiles[$installedManifestRelative] = $stateManifestSourceHash
                $actualNames = @($stateWholeFiles.Keys | Sort-Object -CaseSensitive)
                $expectedNames = @($expectedWholeFiles.Keys | Sort-Object -CaseSensitive)
                if (($actualNames -join "`n") -cne ($expectedNames -join "`n")) {
                    throw 'State wholeFileTargets does not match its installed manifest'
                }
                foreach ($relative in $expectedNames) {
                    if ($stateWholeFiles[$relative] -cne $expectedWholeFiles[$relative]) {
                        throw "State target hash does not match its installed manifest: $relative"
                    }
                }
            }
        } catch {
            $state = $null
            $stateCoreHash = $null
            $stateWholeFiles = @{}
            $kind = if ($stateRootIdentityMismatch) { 'rootIdentity' } else { 'invalidState' }
            $null = $blockers.Add([pscustomobject] @{ kind = $kind; message = $_.Exception.Message })
        }
    } else {
        $stateSnapshot = [pscustomobject] @{ Exists = $false; Hash = $null; Bytes = [byte[]] @() }
    }
    if ($null -ne $state -and -not $isExactControlInstall) {
        $state = $null
        $stateCoreHash = $null
        $stateWholeFiles = @{}
        $null = $blockers.Add([pscustomobject] @{ kind = 'invalidState'; message = 'Installed JOENESS state is not the exact supported Control identity' })
    }
    $removeAgentBytes = $null
    if ($Remove -or $isExactControlInstall) {
        if ($null -eq $state -and -not $stateSnapshot.Exists) {
            if (Test-Path -LiteralPath $agentsPath) {
                try {
                    if (-not (Test-Path -LiteralPath $agentsPath -PathType Leaf)) { throw "AGENTS.md path is not a file: $agentsPath" }
                    $agentBytes = [IO.File]::ReadAllBytes($agentsPath)
                    $beginCount = @(Get-HarnessByteOffsets $agentBytes ([Text.Encoding]::UTF8.GetBytes($script:HarnessBeginMarker))).Count
                    $endCount = @(Get-HarnessByteOffsets $agentBytes ([Text.Encoding]::UTF8.GetBytes($script:HarnessEndMarker))).Count
                    if ($beginCount -gt 0 -or $endCount -gt 0) {
                        $null = $blockers.Add([pscustomobject] @{ kind = 'unownedEvidence'; message = "Unowned Common Core marker exists: $agentsPath" })
                    }
                } catch {
                    $null = $blockers.Add([pscustomobject] @{ kind = 'commonCorePreflight'; message = $_.Exception.Message })
                }
            }
            $unownedManifestPath = Join-Path $resolvedAgentsHome 'vendor\source-manifest.json'
            if (Test-Path -LiteralPath $unownedManifestPath) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'unownedEvidence'; message = "Unowned JOENESS manifest exists: $unownedManifestPath" })
            }
            foreach ($skillName in @($manifestSkillSkeletons.Keys)) {
                $skeleton = $manifestSkillSkeletons[$skillName]
                $skeletonState = Get-HarnessSkillSkeletonState $resolvedAgentsHome $skeleton.RootPath $skeleton.AllowedDirectories
                if ($skeletonState.Exists -and -not $skeletonState.Reusable) {
                    $null = $blockers.Add([pscustomobject] @{ kind = 'unownedEvidence'; message = $skeletonState.Message })
                }
            }
        } elseif ($null -ne $state) {
            try {
                if (-not (Test-Path -LiteralPath $agentsPath -PathType Leaf)) { throw "Installed Common Core target is missing: $agentsPath" }
                $target = Read-HarnessUtf8 $agentsPath
                $agentSnapshot = [pscustomobject] @{ Exists = $true; Hash = Get-HarnessSha256 $target.Bytes; Bytes = $target.Bytes }
                $beginBytes = [Text.Encoding]::UTF8.GetBytes($script:HarnessBeginMarker)
                $endBytes = [Text.Encoding]::UTF8.GetBytes($script:HarnessEndMarker)
                $beginOffsets = @(Get-HarnessByteOffsets $target.Bytes $beginBytes)
                $endOffsets = @(Get-HarnessByteOffsets $target.Bytes $endBytes)
                if ($beginOffsets.Count -ne 1 -or $endOffsets.Count -ne 1 -or $endOffsets[0] -lt $beginOffsets[0]) {
                    throw 'Installed Common Core markers are missing, duplicate, or misordered'
                }
                $blockLength = $endOffsets[0] + $endBytes.Length - $beginOffsets[0]
                $existingBlock = Get-HarnessByteSlice $target.Bytes $beginOffsets[0] $blockLength
                if ((Get-HarnessSha256 $existingBlock) -cne $stateCoreHash) { throw 'Installed Common Core block drifted from prior state' }
                $prefix = Get-HarnessByteSlice $target.Bytes 0 $beginOffsets[0]
                $suffixStart = $endOffsets[0] + $endBytes.Length
                $suffix = Get-HarnessByteSlice $target.Bytes $suffixStart ($target.Bytes.Length - $suffixStart)
                $removeAgentBytes = [byte[]] @($prefix + $suffix)
                $null = $changes.Add([pscustomobject] @{ kind = 'commonCore'; action = 'remove'; target = 'AGENTS.md'; planned = $true })
            } catch {
                $null = $blockers.Add([pscustomobject] @{ kind = 'commonCorePreflight'; message = $_.Exception.Message })
            }
            foreach ($relative in @($stateWholeFiles.Keys)) {
                try {
                    $targetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
                    $snapshot = Get-HarnessFileSnapshot $targetPath
                    $optionalSnapshots[$relative] = $snapshot
                    if (-not $snapshot.Exists) { throw "Installed optional target is missing: $relative" }
                    if ($snapshot.Hash -cne $stateWholeFiles[$relative]) { throw "Installed optional target drifted: $relative" }
                    $null = $changes.Add([pscustomobject] @{ kind = 'managedFile'; action = 'remove'; target = $relative; planned = $true })
                } catch {
                    $null = $blockers.Add([pscustomobject] @{ kind = 'managedDrift'; message = $_.Exception.Message })
                }
            }
            if ($blockers.Count -eq 0) {
                if ((Test-Path -LiteralPath $resolvedBackupRoot) -and -not (Test-Path -LiteralPath $resolvedBackupRoot -PathType Container)) {
                    $null = $blockers.Add([pscustomobject] @{ kind = 'backupCollision'; message = "Backup root is not a directory: $resolvedBackupRoot" })
                } else {
                    $collision = Get-HarnessParentFileCollision $resolvedBackupRoot
                    if ($collision) {
                        $null = $blockers.Add([pscustomobject] @{ kind = 'backupCollision'; message = "Backup parent is not a directory: $collision" })
                    }
                }
            }
        }
    } elseif (-not $targetPathSafetyBlocked -and $null -eq $state) {
        if (Test-Path -LiteralPath $agentsPath) {
            try {
                if (-not (Test-Path -LiteralPath $agentsPath -PathType Leaf)) { throw "AGENTS.md path is not a file: $agentsPath" }
                $agentBytes = [IO.File]::ReadAllBytes($agentsPath)
                $beginCount = @(Get-HarnessByteOffsets $agentBytes ([Text.Encoding]::UTF8.GetBytes($script:HarnessBeginMarker))).Count
                $endCount = @(Get-HarnessByteOffsets $agentBytes ([Text.Encoding]::UTF8.GetBytes($script:HarnessEndMarker))).Count
                if ($beginCount -gt 0 -or $endCount -gt 0) {
                    $null = $blockers.Add([pscustomobject] @{ kind = 'unownedEvidence'; message = "Unowned Common Core marker exists: $agentsPath" })
                }
            } catch {
                $null = $blockers.Add([pscustomobject] @{ kind = 'commonCorePreflight'; message = $_.Exception.Message })
            }
        }
        $unownedManifestPath = Join-Path $resolvedAgentsHome 'vendor\source-manifest.json'
        if (Test-Path -LiteralPath $unownedManifestPath) {
            $null = $blockers.Add([pscustomobject] @{ kind = 'unownedEvidence'; message = "Unowned JOENESS manifest exists: $unownedManifestPath" })
        }
    }

    $plannedAgentBytes = $null
    if (-not $Remove -and $null -ne $sourceCore -and -not $targetPathSafetyBlocked) {
        try {
            if ((Test-Path -LiteralPath $agentsPath) -and -not (Test-Path -LiteralPath $agentsPath -PathType Leaf)) {
                throw "AGENTS.md path is not a file: $agentsPath"
            }
            $targetExists = Test-Path -LiteralPath $agentsPath -PathType Leaf
            $target = if ($targetExists) { Read-HarnessUtf8 $agentsPath } else { [pscustomobject] @{ Bytes = [byte[]] @(); Text = ''; HasBom = $false } }
            $agentSnapshot = [pscustomobject] @{
                Exists = [bool] $targetExists
                Hash = if ($targetExists) { Get-HarnessSha256 $target.Bytes } else { $null }
                Bytes = $target.Bytes
            }
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
                $plannedAgentBytes = [byte[]] @($prefix + $blockBytes)
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

    foreach ($relative in @($(if ($Remove) { @() } else { $stateWholeFiles.Keys }))) {
        try {
            $targetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
            $snapshot = Get-HarnessFileSnapshot $targetPath
            $optionalSnapshots[$relative] = $snapshot
            if (-not $snapshot.Exists) { throw "Installed optional target is missing: $relative" }
            if ($snapshot.Hash -cne $stateWholeFiles[$relative]) { throw "Installed optional target drifted: $relative" }
        } catch {
            $null = $blockers.Add([pscustomobject] @{ kind = 'managedDrift'; message = $_.Exception.Message })
        }
    }

    $currentOptionalPaths = @{}
    foreach ($entry in @($(if ($Remove) { @() } else { $optionalEntries }))) {
        try {
            $currentOptionalPaths[$entry.RelativePath] = $true
            $targetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $entry.RelativePath
            $owned = $stateWholeFiles.ContainsKey($entry.RelativePath)
            $targetExists = Test-Path -LiteralPath $targetPath
            $targetIsFile = Test-Path -LiteralPath $targetPath -PathType Leaf
            if (-not $optionalSnapshots.ContainsKey($entry.RelativePath) -and (-not $targetExists -or $targetIsFile)) {
                $optionalSnapshots[$entry.RelativePath] = Get-HarnessFileSnapshot $targetPath
            }
            if ($targetExists -and -not $owned) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'managedCollision'; message = "Unmanaged optional target exists: $($entry.RelativePath)" })
            } elseif (-not $targetExists) {
                $null = $changes.Add([pscustomobject] @{ kind = 'managedFile'; action = 'install'; target = $entry.RelativePath; planned = $true })
            } elseif ($targetIsFile -and $entry.Hash -cne $stateWholeFiles[$entry.RelativePath]) {
                $null = $changes.Add([pscustomobject] @{ kind = 'managedFile'; action = 'update'; target = $entry.RelativePath; planned = $true })
            }
        } catch {
            $targetPathSafetyBlocked = $true
            $null = $blockers.Add([pscustomobject] @{ kind = 'targetSafety'; message = $_.Exception.Message })
        }
    }
    foreach ($relative in @($(if ($Remove) { @() } else { $stateWholeFiles.Keys }))) {
        if (-not $currentOptionalPaths.ContainsKey($relative)) {
            $null = $changes.Add([pscustomobject] @{ kind = 'managedFile'; action = 'remove'; target = $relative; planned = $true })
        }
    }

    $managedSkillFiles = @{}
    $ownedSkillFiles = @()
    foreach ($relative in @($stateWholeFiles.Keys)) {
        if ([IO.Path]::GetFileName($relative) -ieq 'SKILL.md') {
            $ownedSkillFiles += Resolve-HarnessSourceFile $resolvedAgentsHome $relative
        }
    }
    foreach ($skillName in @($(if ($Remove) { @() } else { $manifestSkillRelativePaths.Keys }))) {
        try {
            $relative = [string] $manifestSkillRelativePaths[$skillName]
            $managedSkillFile = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
            $skeleton = $manifestSkillSkeletons[$skillName]
            $skeletonState = Get-HarnessSkillSkeletonState $resolvedAgentsHome $skeleton.RootPath $skeleton.AllowedDirectories
            $reusableSkeleton = -not $stateWholeFiles.ContainsKey($relative) -and $skeletonState.Exists -and $skeletonState.Reusable
            $managedSkillFiles[$skillName] = if ($stateWholeFiles.ContainsKey($relative) -or $reusableSkeleton) { $managedSkillFile } else { $null }
            if (-not $stateWholeFiles.ContainsKey($relative) -and $skeletonState.Exists -and -not $skeletonState.Reusable) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'duplicateSkill'; message = $skeletonState.Message })
            }
            if ((Test-Path -LiteralPath $managedSkillFile) -and -not $stateWholeFiles.ContainsKey($relative)) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'duplicateSkill'; message = "Duplicate skill directory: $(Split-Path -Parent $managedSkillFile)" })
            }
        } catch {
            $targetPathSafetyBlocked = $true
            $null = $blockers.Add([pscustomobject] @{ kind = 'targetSafety'; message = $_.Exception.Message })
        }
    }
    $skillRoots = @((Join-Path $resolvedAgentsHome 'skills'), $codexSkillsPath)
    if (-not $Remove -and -not $targetPathSafetyBlocked) {
        foreach ($collision in @(Get-HarnessFrontmatterCollisions $skillRoots $managedSkillFiles $ownedSkillFiles)) {
            $null = $blockers.Add([pscustomobject] @{ kind = 'duplicateSkill'; message = $collision })
        }
    }

    $plannedChanges = @($changes | Where-Object { $_.planned })
    if (-not $Remove -and -not $isExactControlInstall -and $plannedChanges.Count -gt 0 -and $blockers.Count -eq 0) {
        $writeParents = @($agentsPath, $statePath)
        $writeParents += @($optionalEntries | ForEach-Object { Resolve-HarnessSourceFile $resolvedAgentsHome $_.RelativePath })
        $writeParents += @($stateWholeFiles.Keys | ForEach-Object { Resolve-HarnessSourceFile $resolvedAgentsHome $_ })
        foreach ($targetPath in $writeParents) {
            $collision = Get-HarnessParentFileCollision $targetPath
            if ($collision) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'targetCollision'; message = "Target parent is not a directory: $collision" })
            }
        }
        if ((Test-Path -LiteralPath $resolvedBackupRoot) -and -not (Test-Path -LiteralPath $resolvedBackupRoot -PathType Container)) {
            $null = $blockers.Add([pscustomobject] @{ kind = 'backupCollision'; message = "Backup root is not a directory: $resolvedBackupRoot" })
        } else {
            $collision = Get-HarnessParentFileCollision $resolvedBackupRoot
            if ($collision) {
                $null = $blockers.Add([pscustomobject] @{ kind = 'backupCollision'; message = "Backup parent is not a directory: $collision" })
            }
        }
    }

    if ($blockers.Count -eq 0 -and $isExactControlInstall -and -not $Remove) {
        $warnings += 'Legacy GPT-5.6 Control installation detected. Apply is a no-op; use explicit Remove for the supported safe removal path.'
        return New-HarnessPublicResult -Status 'legacy' -Mode $mode -AgentsRoot $resolvedAgentsHome -SkillsRoot (Join-Path $resolvedAgentsHome 'skills') -ActiveSkills @() -Warnings @($warnings) -ChangesRequired $false -Changes @([pscustomobject] @{ kind = 'legacyInstallation'; action = 'removeAvailable'; target = 'GPT-5.6 Control'; planned = $false }) -Blockers @() -BackupPath $null -Rollback $null -UnresolvedTargets @()
    }
    if ($blockers.Count -eq 0 -and $Apply) {
        $warnings += 'Apply is unsupported for the Astra-native zero-runtime distribution; no files were changed.'
        return New-HarnessPublicResult -Status 'unsupported' -Mode $mode -AgentsRoot $resolvedAgentsHome -SkillsRoot (Join-Path $resolvedAgentsHome 'skills') -ActiveSkills @() -Warnings @($warnings) -ChangesRequired $false -Changes @() -Blockers @() -BackupPath $null -Rollback $null -UnresolvedTargets @()
    }

    $status = if ($blockers.Count -gt 0) {
        'blocked'
    } elseif ($Remove) {
        if ($null -eq $state) { 'removed' } else { 'ready' }
    } elseif ($plannedChanges.Count -gt 0) {
        'ready'
    } else {
        'current'
    }
    if ((-not $Apply -and -not $Remove) -or $status -ne 'ready') {
        return New-HarnessPublicResult -Status $status -Mode $mode -AgentsRoot $resolvedAgentsHome -SkillsRoot (Join-Path $resolvedAgentsHome 'skills') -ActiveSkills @() -Warnings @($warnings) -ChangesRequired ([bool] ($plannedChanges.Count -gt 0)) -Changes @($changes) -Blockers @($blockers) -BackupPath $null -Rollback $null -UnresolvedTargets @()
    }

    $operations = [Collections.Generic.List[object]]::new()
    $removeCleanupDirectories = [Collections.Generic.List[string]]::new()
    if ($Remove) {
        foreach ($relative in @($stateWholeFiles.Keys | Sort-Object)) {
            $cleanupDirectory = [IO.Path]::GetDirectoryName((Resolve-HarnessSourceFile $resolvedAgentsHome $relative))
            while ($cleanupDirectory) {
                $null = $removeCleanupDirectories.Add($cleanupDirectory)
                if ($cleanupDirectory -ieq $resolvedAgentsHome) { break }
                $cleanupDirectory = [IO.Path]::GetDirectoryName($cleanupDirectory)
            }
            $null = $operations.Add([pscustomobject] @{
                TargetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
                DesiredExists = $false
                DesiredBytes = [byte[]] @()
                AppliedHash = $null
                Snapshot = $optionalSnapshots[$relative]
                BackupRelativePath = Join-Path 'agents' ($relative -replace '/', '\')
                BackupPath = $null
                Committed = $false
                Unresolved = $false
            })
        }
        $removeAgentHash = Get-HarnessSha256 $removeAgentBytes
        $null = $operations.Add([pscustomobject] @{
            TargetPath = $agentsPath
            DesiredExists = $true
            DesiredBytes = $removeAgentBytes
            AppliedHash = $removeAgentHash
            Snapshot = $agentSnapshot
            BackupRelativePath = 'codex\AGENTS.md'
            BackupPath = $null
            Committed = $false
        })
        $null = $operations.Add([pscustomobject] @{
            TargetPath = $statePath
            DesiredExists = $false
            DesiredBytes = [byte[]] @()
            AppliedHash = $null
            Snapshot = $stateSnapshot
            BackupRelativePath = 'codex\joewrks-harness-state.json'
            BackupPath = $null
            Committed = $false
            Unresolved = $false
        })
    } else {
        $desiredWholeFiles = [ordered] @{}
        foreach ($entry in $optionalEntries) { $desiredWholeFiles[$entry.RelativePath] = $entry.Hash }
        $sourceIdentities = [ordered] @{
            commonCore = [ordered] @{
                path = ([string] $coreEntry.path).Replace('\', '/')
                sha256 = ([string] $coreEntry.sha256).ToLowerInvariant()
            }
            bundleManifest = [ordered] @{
                path = 'vendor/source-manifest.json'
                sha256 = $manifestHash
            }
        }
        $desiredState = [ordered] @{
            schemaVersion = 2
            bundleSelection = $bundleSelection
            agentsHomeIdentitySha256 = Get-HarnessPathIdentity $resolvedAgentsHome
            sourceIdentities = $sourceIdentities
            managedBlocks = [ordered] @{ 'AGENTS.md' = $blockHash }
            wholeFileTargets = $desiredWholeFiles
        }
        $stateJson = $desiredState | ConvertTo-Json -Depth 16
        $stateBytes = (New-Object Text.UTF8Encoding($false)).GetBytes($stateJson + "`n")
        $plannedAgentHash = Get-HarnessSha256 $plannedAgentBytes
        if (-not $agentSnapshot.Exists -or $agentSnapshot.Hash -cne $plannedAgentHash) {
            $null = $operations.Add([pscustomobject] @{
                TargetPath = $agentsPath
                DesiredExists = $true
                DesiredBytes = $plannedAgentBytes
                AppliedHash = $plannedAgentHash
                Snapshot = $agentSnapshot
                BackupRelativePath = 'codex\AGENTS.md'
                BackupPath = $null
                Committed = $false
            })
        }
        foreach ($entry in $optionalEntries) {
            $snapshot = $optionalSnapshots[$entry.RelativePath]
            if (-not $snapshot.Exists -or $snapshot.Hash -cne $entry.Hash) {
                $null = $operations.Add([pscustomobject] @{
                    TargetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $entry.RelativePath
                    DesiredExists = $true
                    DesiredBytes = $entry.Bytes
                    AppliedHash = $entry.Hash
                    Snapshot = $snapshot
                    BackupRelativePath = Join-Path 'agents' ($entry.RelativePath -replace '/', '\')
                    BackupPath = $null
                    Committed = $false
                })
            }
        }
        foreach ($relative in @($stateWholeFiles.Keys | Sort-Object)) {
            if (-not $currentOptionalPaths.ContainsKey($relative)) {
                $cleanupDirectory = [IO.Path]::GetDirectoryName((Resolve-HarnessSourceFile $resolvedAgentsHome $relative))
                while ($cleanupDirectory) {
                    $null = $removeCleanupDirectories.Add($cleanupDirectory)
                    if ($cleanupDirectory -ieq $resolvedAgentsHome) { break }
                    $cleanupDirectory = [IO.Path]::GetDirectoryName($cleanupDirectory)
                }
                $null = $operations.Add([pscustomobject] @{
                    TargetPath = Resolve-HarnessSourceFile $resolvedAgentsHome $relative
                    DesiredExists = $false
                    DesiredBytes = [byte[]] @()
                    AppliedHash = $null
                    Snapshot = $optionalSnapshots[$relative]
                    BackupRelativePath = Join-Path 'agents' ($relative -replace '/', '\')
                    BackupPath = $null
                    Committed = $false
                    Unresolved = $false
                })
            }
        }
        $stateHash = Get-HarnessSha256 $stateBytes
        if (-not $stateSnapshot.Exists -or $stateSnapshot.Hash -cne $stateHash) {
            $null = $operations.Add([pscustomobject] @{
                TargetPath = $statePath
                DesiredExists = $true
                DesiredBytes = $stateBytes
                AppliedHash = $stateHash
                Snapshot = $stateSnapshot
                BackupRelativePath = 'codex\joewrks-harness-state.json'
                BackupPath = $null
                Committed = $false
            })
        }
    }

    $runId = ([DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ') + '-' + [guid]::NewGuid().ToString('N'))
    $backupPath = Join-Path $resolvedBackupRoot $runId
    $applied = [Collections.Generic.List[object]]::new()
    $restored = [Collections.Generic.List[string]]::new()
    $removed = [Collections.Generic.List[string]]::new()
    $unresolved = [Collections.Generic.List[string]]::new()
    $unresolvedSeen = @{}
    $createdDirectories = [Collections.Generic.List[string]]::new()
    try {
        [IO.Directory]::CreateDirectory($backupPath) | Out-Null
        foreach ($operation in $operations) {
            if (-not $operation.Snapshot.Exists) { continue }
            $operation.BackupPath = Join-Path $backupPath $operation.BackupRelativePath
            [IO.Directory]::CreateDirectory((Split-Path -Parent $operation.BackupPath)) | Out-Null
            [IO.File]::WriteAllBytes($operation.BackupPath, $operation.Snapshot.Bytes)
            if ((Get-HarnessSha256 ([IO.File]::ReadAllBytes($operation.BackupPath))) -cne $operation.Snapshot.Hash) {
                throw "Backup verification failed: $($operation.TargetPath)"
            }
        }

        foreach ($operation in $operations) {
            try {
                Set-HarnessFile $operation $createdDirectories
                $null = $applied.Add($operation)
                if ($null -ne $AfterReplace) { & $AfterReplace $operation | Out-Null }
            } catch {
                if (-not ($applied -contains $operation)) {
                    if ($operation.Committed) {
                        $null = $applied.Add($operation)
                    } elseif (($operation.PSObject.Properties.Name -contains 'Unresolved') -and $operation.Unresolved) {
                        $unresolvedSeen[$operation.TargetPath] = $true
                        $null = $unresolved.Add($operation.TargetPath)
                    } else {
                        try {
                            $current = Get-HarnessFileSnapshot $operation.TargetPath
                            if (($current.Exists -ne $operation.Snapshot.Exists) -or ($current.Exists -and $current.Hash -cne $operation.Snapshot.Hash)) {
                                $unresolvedSeen[$operation.TargetPath] = $true
                                $null = $unresolved.Add($operation.TargetPath)
                            }
                        } catch {
                            $unresolvedSeen[$operation.TargetPath] = $true
                            $null = $unresolved.Add($operation.TargetPath)
                        }
                    }
                }
                throw
            }
        }
        if ($removeCleanupDirectories.Count -gt 0) {
            $cleanupResult = Remove-HarnessEmptyDirectories $resolvedAgentsHome $removeCleanupDirectories
            if (@($cleanupResult.failed).Count -gt 0) {
                $failedCleanupTargets = @($cleanupResult.failed | Sort-Object -Unique)
                throw "Obsolete directory cleanup failed: $($failedCleanupTargets -join ', ')"
            }
        }
        return New-HarnessPublicResult -Status $(if ($Remove) { 'removed' } else { 'current' }) -Mode $mode -AgentsRoot $resolvedAgentsHome -SkillsRoot (Join-Path $resolvedAgentsHome 'skills') -ActiveSkills @($manifestSkillRelativePaths.Keys) -Warnings @($warnings) -ChangesRequired $false -Changes @($changes) -Blockers @() -BackupPath $backupPath -Rollback $null -UnresolvedTargets @()
    } catch {
        $failureMessage = $_.Exception.Message
        for ($i = $applied.Count - 1; $i -ge 0; $i--) {
            $operation = $applied[$i]
            try {
                $current = Get-HarnessFileSnapshot $operation.TargetPath
                $stillApplied = if ($operation.DesiredExists) {
                    $current.Exists -and $current.Hash -ceq $operation.AppliedHash
                } else {
                    -not $current.Exists
                }
                if (-not $stillApplied) {
                    if (-not $unresolvedSeen.ContainsKey($operation.TargetPath)) {
                        $unresolvedSeen[$operation.TargetPath] = $true
                        $null = $unresolved.Add($operation.TargetPath)
                    }
                    continue
                }
                if ($operation.Snapshot.Exists) {
                    $backupBytes = [IO.File]::ReadAllBytes($operation.BackupPath)
                    if ((Get-HarnessSha256 $backupBytes) -cne $operation.Snapshot.Hash) {
                        throw "Backup changed before rollback: $($operation.TargetPath)"
                    }
                    Set-HarnessFile ([pscustomobject] @{
                        TargetPath = $operation.TargetPath
                        DesiredExists = $true
                        DesiredBytes = $backupBytes
                        AppliedHash = $operation.Snapshot.Hash
                        Snapshot = $current
                        Committed = $false
                    }) $null
                    $null = $restored.Add($operation.TargetPath)
                } else {
                    Set-HarnessFile ([pscustomobject] @{
                        TargetPath = $operation.TargetPath
                        DesiredExists = $false
                        DesiredBytes = [byte[]] @()
                        AppliedHash = $null
                        Snapshot = $current
                        Committed = $false
                        Unresolved = $false
                    }) $null
                    $null = $removed.Add($operation.TargetPath)
                }
            } catch {
                if (-not $unresolvedSeen.ContainsKey($operation.TargetPath)) {
                    $unresolvedSeen[$operation.TargetPath] = $true
                    $null = $unresolved.Add($operation.TargetPath)
                }
            }
        }
        $agentsBoundary = [IO.Path]::GetFullPath($resolvedAgentsHome)
        $agentsPathRoot = [IO.Path]::GetPathRoot($agentsBoundary)
        if ($agentsBoundary.Length -gt $agentsPathRoot.Length) { $agentsBoundary = $agentsBoundary.TrimEnd('\', '/') }
        $codexBoundary = [IO.Path]::GetFullPath($resolvedCodexHome)
        $codexPathRoot = [IO.Path]::GetPathRoot($codexBoundary)
        if ($codexBoundary.Length -gt $codexPathRoot.Length) { $codexBoundary = $codexBoundary.TrimEnd('\', '/') }
        $agentsPrefix = if ($agentsBoundary.EndsWith([string] [IO.Path]::DirectorySeparatorChar)) { $agentsBoundary } else { $agentsBoundary + [IO.Path]::DirectorySeparatorChar }
        $codexPrefix = if ($codexBoundary.EndsWith([string] [IO.Path]::DirectorySeparatorChar)) { $codexBoundary } else { $codexBoundary + [IO.Path]::DirectorySeparatorChar }
        $agentsCreated = [Collections.Generic.List[string]]::new()
        $codexCreated = [Collections.Generic.List[string]]::new()
        $unclassifiedCreated = [Collections.Generic.List[string]]::new()
        foreach ($directory in $createdDirectories) {
            $full = [IO.Path]::GetFullPath($directory)
            $fullPathRoot = [IO.Path]::GetPathRoot($full)
            if ($full.Length -gt $fullPathRoot.Length) { $full = $full.TrimEnd('\', '/') }
            if ($full -ieq $agentsBoundary -or $full.StartsWith($agentsPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                $null = $agentsCreated.Add($full)
            } elseif ($full -ieq $codexBoundary -or $full.StartsWith($codexPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                $null = $codexCreated.Add($full)
            } else {
                $null = $unclassifiedCreated.Add($full)
            }
        }
        $cleanupResults = [Collections.Generic.List[object]]::new()
        if ($agentsCreated.Count -gt 0) { $null = $cleanupResults.Add((Remove-HarnessEmptyDirectories $agentsBoundary $agentsCreated)) }
        if ($codexCreated.Count -gt 0) { $null = $cleanupResults.Add((Remove-HarnessEmptyDirectories $codexBoundary $codexCreated)) }
        foreach ($directory in @($unclassifiedCreated) + @($cleanupResults | ForEach-Object { @($_.nonEmpty) + @($_.failed) })) {
            if (-not $unresolvedSeen.ContainsKey($directory)) {
                $unresolvedSeen[$directory] = $true
                $null = $unresolved.Add($directory)
            }
        }
        $rollback = [pscustomobject] @{
            status = if ($unresolved.Count -eq 0) { 'complete' } else { 'incomplete' }
            restoredTargets = @($restored)
            removedTargets = @($removed)
            unresolvedTargets = @($unresolved)
        }
        return New-HarnessPublicResult -Status $(if ($unresolved.Count -eq 0) { 'failed' } else { 'unknown' }) -Mode $mode -AgentsRoot $resolvedAgentsHome -SkillsRoot (Join-Path $resolvedAgentsHome 'skills') -ActiveSkills @($manifestSkillRelativePaths.Keys) -Warnings @($warnings) -ChangesRequired $true -Changes @($changes) -Blockers @([pscustomobject] @{ kind = if ($Remove) { 'removeFailure' } else { 'applyFailure' }; message = $failureMessage }) -BackupPath $backupPath -Rollback $rollback -UnresolvedTargets @($unresolved)
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try {
        $modeCount = ([int] $Check.IsPresent) + ([int] $Apply.IsPresent) + ([int] $Remove.IsPresent)
        if ($modeCount -ne 1) { throw 'Specify exactly one of -Check, -Apply, or -Remove.' }
        $result = Invoke-JoewrksHarnessSync @PSBoundParameters
    } catch {
        $invocationWarnings = @()
        if ($IncludeDesignFrontend) {
            $invocationWarnings += 'DEPRECATED: -IncludeDesignFrontend is ignored; the current JOENESS bundle already installs all active skills.'
        }
        $invocationMode = if ($Check) { 'check' } elseif ($Apply) { 'apply' } else { 'remove' }
        $publicActiveSkills = Get-HarnessPublicActiveSkills (Split-Path -Parent $PSScriptRoot)
        if ($publicActiveSkills.Warning) { $invocationWarnings += $publicActiveSkills.Warning }
        $result = New-HarnessPublicResult -Status 'blocked' -Mode $invocationMode -AgentsRoot $null -SkillsRoot $null -ActiveSkills @($publicActiveSkills.ActiveSkills) -Warnings @($invocationWarnings) -ChangesRequired $false -Changes @() -Blockers @([pscustomobject] @{ kind = 'invocation'; message = $_.Exception.Message }) -BackupPath $null -Rollback $null -UnresolvedTargets @()
    }
    $result | ConvertTo-Json -Compress -Depth 16
    exit (Get-HarnessExitCode $result.status)
}
