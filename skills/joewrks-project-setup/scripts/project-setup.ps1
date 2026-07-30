[CmdletBinding()]
param(
    [switch] $Check,
    [switch] $Apply,
    [string] $ProjectPath,
    [string] $ExpectedRoot,
    [string] $ExpectedTargetHash,
    [string] $ManagedBodyBase64
)

$ErrorActionPreference = 'Stop'
$script:ProjectBeginMarker = '<!-- JOEWRKS-PROJECT:BEGIN -->'
$script:ProjectEndMarker = '<!-- JOEWRKS-PROJECT:END -->'

function Get-ProjectSha256 {
    param([byte[]] $Bytes)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function Get-ProjectFileSnapshot {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject] @{ Exists = $false; Hash = $null; Bytes = [byte[]] @() }
    }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Target path is not a file: $Path"
    }
    $bytes = [IO.File]::ReadAllBytes($Path)
    [pscustomobject] @{ Exists = $true; Hash = Get-ProjectSha256 $bytes; Bytes = $bytes }
}

function Read-ProjectUtf8 {
    param([byte[]] $Bytes)
    if ($Bytes.Length -ge 2 -and (($Bytes[0] -eq 0xff -and $Bytes[1] -eq 0xfe) -or ($Bytes[0] -eq 0xfe -and $Bytes[1] -eq 0xff))) {
        throw 'UTF-16 is not supported'
    }
    $hasBom = $Bytes.Length -ge 3 -and $Bytes[0] -eq 0xef -and $Bytes[1] -eq 0xbb -and $Bytes[2] -eq 0xbf
    $offset = if ($hasBom) { 3 } else { 0 }
    $payload = if ($offset -lt $Bytes.Length) { [byte[]] $Bytes[$offset..($Bytes.Length - 1)] } else { [byte[]] @() }
    $text = (New-Object Text.UTF8Encoding($false, $true)).GetString($payload)
    if ($text.IndexOf([char] 0) -ge 0) { throw 'NUL bytes are not supported' }
    [pscustomobject] @{ Text = $text; HasBom = $hasBom }
}

function Get-ProjectMarkerCount {
    param([string] $Text, [string] $Marker)
    $count = 0
    $offset = 0
    while (($offset = $Text.IndexOf($Marker, $offset, [StringComparison]::Ordinal)) -ge 0) {
        $count++
        $offset += $Marker.Length
    }
    $count
}

function Assert-ProjectMarkers {
    param([string] $Text)
    $beginCount = Get-ProjectMarkerCount $Text $script:ProjectBeginMarker
    $endCount = Get-ProjectMarkerCount $Text $script:ProjectEndMarker
    if ($beginCount -ne $endCount) { throw 'Project markers are incomplete' }
    if ($beginCount -gt 1) { throw 'Project markers are duplicated' }
    if ($beginCount -eq 1 -and $Text.IndexOf($script:ProjectBeginMarker, [StringComparison]::Ordinal) -gt $Text.IndexOf($script:ProjectEndMarker, [StringComparison]::Ordinal)) {
        throw 'Project markers are out of order'
    }
}

function Assert-ProjectNoReparsePoint {
    param([string] $Path, [string] $Label)
    $fullPath = [IO.Path]::GetFullPath($Path)
    $current = [IO.Path]::GetPathRoot($fullPath)
    $relative = $fullPath.Substring($current.Length)
    foreach ($segment in @($relative -split '[\\/]')) {
        if ([string]::IsNullOrEmpty($segment)) { continue }
        $current = Join-Path $current $segment
        $item = Get-Item -LiteralPath $current -Force -ErrorAction SilentlyContinue
        if ($null -ne $item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "$Label contains a reparse point: $current"
        }
    }
}

function Resolve-ProjectGitRoot {
    param([string] $Path)
    $fullPath = [IO.Path]::GetFullPath($Path)
    if (-not (Test-Path -LiteralPath $fullPath -PathType Container)) { throw 'ProjectPath is not a directory' }
    Assert-ProjectNoReparsePoint $fullPath 'Project path'
    $gitOutput = @(& git -C $fullPath rev-parse --show-toplevel 2>$null)
    $gitExitCode = $LASTEXITCODE
    $lines = @($gitOutput | ForEach-Object { ([string] $_).Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($gitExitCode -ne 0 -or $lines.Count -ne 1) { throw 'Could not resolve exactly one Git root' }
    $root = [IO.Path]::GetFullPath($lines[0])
    Assert-ProjectNoReparsePoint $root 'Git root'
    $rootBoundary = $root.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if ($fullPath -cne $root -and -not $fullPath.StartsWith($rootBoundary, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'ProjectPath is outside the resolved Git root'
    }
    $root
}

function Assert-ProjectSnapshot {
    param([string] $Path, $Snapshot)
    $current = Get-ProjectFileSnapshot $Path
    if ($current.Exists -ne $Snapshot.Exists -or ($current.Exists -and $current.Hash -cne $Snapshot.Hash)) {
        throw 'AGENTS.md changed during apply'
    }
}

function Set-ProjectFile {
    param([string] $Path, [byte[]] $Bytes, $Snapshot, [string] $ExpectedHash)
    $temporaryPath = Join-Path (Split-Path -Parent $Path) ('.AGENTS.md.joewrks-' + [Guid]::NewGuid().ToString('N') + '.tmp')
    try {
        [IO.File]::WriteAllBytes($temporaryPath, $Bytes)
        if ((Get-ProjectSha256 ([IO.File]::ReadAllBytes($temporaryPath))) -cne $ExpectedHash) {
            throw 'Temporary file verification failed'
        }
        Assert-ProjectSnapshot $Path $Snapshot
        if ($Snapshot.Exists) {
            [IO.File]::Replace($temporaryPath, $Path, [Management.Automation.Language.NullString]::Value)
        } else {
            [IO.File]::Move($temporaryPath, $Path)
        }
        if ((Get-ProjectFileSnapshot $Path).Hash -cne $ExpectedHash) { throw 'Applied file verification failed' }
    } finally {
        if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) { [IO.File]::Delete($temporaryPath) }
    }
}

function New-ProjectResult {
    param(
        [string] $Status,
        $ProjectRoot,
        $Target,
        $TargetHash,
        [bool] $ChangesRequired,
        [object[]] $Blockers = @(),
        $Rollback = $null,
        [string[]] $UnresolvedTargets = @()
    )
    [pscustomobject] @{
        status = $Status
        projectRoot = $ProjectRoot
        target = $Target
        targetHash = $TargetHash
        changesRequired = $ChangesRequired
        blockers = @($Blockers)
        rollback = $Rollback
        unresolvedTargets = @($UnresolvedTargets)
    }
}

function Invoke-JoewrksProjectSetup {
    [CmdletBinding(DefaultParameterSetName = 'Check')]
    param(
        [Parameter(Mandatory, ParameterSetName = 'Check')] [switch] $Check,
        [Parameter(Mandatory, ParameterSetName = 'Apply')] [switch] $Apply,
        [Parameter(Mandatory)] [string] $ProjectPath,
        [Parameter(Mandatory, ParameterSetName = 'Apply')] [string] $ExpectedRoot,
        [Parameter(Mandatory, ParameterSetName = 'Apply')] [string] $ExpectedTargetHash,
        [Parameter(Mandatory, ParameterSetName = 'Apply')] [string] $ManagedBodyBase64,
        [scriptblock] $AfterReplace
    )

    $root = $null
    $target = $null
    $snapshot = $null
    try {
        $root = Resolve-ProjectGitRoot $ProjectPath
        $target = [IO.Path]::GetFullPath((Join-Path $root 'AGENTS.md'))
        $rootBoundary = $root.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
        if (-not $target.StartsWith($rootBoundary, [StringComparison]::OrdinalIgnoreCase)) { throw 'AGENTS.md target is outside the Git root' }
        Assert-ProjectNoReparsePoint $target 'AGENTS.md target'
        $override = Join-Path $root 'AGENTS.override.md'
        Assert-ProjectNoReparsePoint $override 'AGENTS.override.md'
        if (Test-Path -LiteralPath $override) {
            if (-not (Test-Path -LiteralPath $override -PathType Leaf) -or ([IO.File]::ReadAllBytes($override)).Length -gt 0) {
                throw 'Nonempty AGENTS.override.md shadows project instructions'
            }
        }
        $snapshot = Get-ProjectFileSnapshot $target
        if ($snapshot.Exists) {
            if ($snapshot.Bytes.Length -gt 32KB) { throw 'AGENTS.md exceeds 32 KiB' }
            $existing = Read-ProjectUtf8 $snapshot.Bytes
            Assert-ProjectMarkers $existing.Text
        }
        $targetHash = if ($snapshot.Exists) { $snapshot.Hash } else { 'absent' }
    } catch {
        $hash = if ($null -ne $snapshot -and $snapshot.Exists) { $snapshot.Hash } elseif ($null -ne $snapshot) { 'absent' } else { $null }
        return New-ProjectResult 'blocked' $root $target $hash $false @([pscustomobject] @{ kind = 'preflight'; message = $_.Exception.Message })
    }

    if ($PSCmdlet.ParameterSetName -eq 'Check') {
        return New-ProjectResult 'ready' $root $target $targetHash $true
    }

    try {
        $normalizedExpectedRoot = [IO.Path]::GetFullPath($ExpectedRoot)
        if ($root -cne $normalizedExpectedRoot) { throw 'Git root changed after check' }
        if ($ExpectedTargetHash -cne 'absent' -and $ExpectedTargetHash -cnotmatch '\A[0-9a-f]{64}\z') {
            throw 'ExpectedTargetHash is not absent or a lowercase SHA-256'
        }
        if ($targetHash -cne $ExpectedTargetHash) { throw 'AGENTS.md changed after check' }
        try { $managedBodyBytes = [Convert]::FromBase64String($ManagedBodyBase64) }
        catch { throw 'ManagedBodyBase64 is malformed' }
        if ($managedBodyBytes.Length -gt 8KB) { throw 'Managed body exceeds 8 KiB' }
        try { $managedBody = (New-Object Text.UTF8Encoding($false, $true)).GetString($managedBodyBytes) }
        catch { throw 'Managed body is not valid UTF-8' }
        if ($managedBody.IndexOf([char] 0) -ge 0) { throw 'Managed body contains a NUL character' }
        if ($managedBody.Contains($script:ProjectBeginMarker) -or $managedBody.Contains($script:ProjectEndMarker)) {
            throw 'Managed body contains a project marker'
        }

        $existingText = ''
        $hasBom = $false
        if ($snapshot.Exists) {
            $existing = Read-ProjectUtf8 $snapshot.Bytes
            $existingText = $existing.Text
            $hasBom = $existing.HasBom
        }
        $newline = if ($existingText.Contains("`r`n")) { "`r`n" } elseif ($existingText.Contains("`n")) { "`n" } elseif ($existingText.Contains("`r")) { "`r" } else { "`r`n" }
        $normalizedBody = ($managedBody -replace "`r`n|`r|`n", $newline).TrimEnd("`r", "`n")
        $block = $script:ProjectBeginMarker + $newline
        if ($normalizedBody.Length -gt 0) { $block += $normalizedBody + $newline }
        $block += $script:ProjectEndMarker

        $begin = $existingText.IndexOf($script:ProjectBeginMarker, [StringComparison]::Ordinal)
        if ($begin -ge 0) {
            $end = $existingText.IndexOf($script:ProjectEndMarker, $begin, [StringComparison]::Ordinal) + $script:ProjectEndMarker.Length
            $plannedText = $existingText.Substring(0, $begin) + $block + $existingText.Substring($end)
        } elseif ($existingText.Length -eq 0) {
            $plannedText = $block + $newline
        } elseif ($existingText.EndsWith("`r") -or $existingText.EndsWith("`n")) {
            $plannedText = $existingText + $block + $newline
        } else {
            $plannedText = $existingText + $newline + $block + $newline
        }
        $encoding = New-Object Text.UTF8Encoding($hasBom)
        $plannedBytes = $encoding.GetBytes($plannedText)
        if ($hasBom) { $plannedBytes = [byte[]] ($encoding.GetPreamble() + $plannedBytes) }
        if ($plannedBytes.Length -gt 32KB) { throw 'Planned AGENTS.md exceeds 32 KiB' }
        $appliedHash = Get-ProjectSha256 $plannedBytes
        if ($snapshot.Exists -and $appliedHash -ceq $snapshot.Hash) {
            return New-ProjectResult 'current' $root $target $snapshot.Hash $false
        }
    } catch {
        return New-ProjectResult 'blocked' $root $target $targetHash $false @([pscustomobject] @{ kind = 'preflight'; message = $_.Exception.Message })
    }

    $operation = [pscustomobject] @{ TargetPath = $target; AppliedHash = $appliedHash; Snapshot = $snapshot }
    try {
        Set-ProjectFile $target $plannedBytes $snapshot $appliedHash
        if ($null -ne $AfterReplace) { & $AfterReplace $operation | Out-Null }
        $verified = Get-ProjectFileSnapshot $target
        if (-not $verified.Exists -or $verified.Hash -cne $appliedHash) { throw 'Applied file changed before final verification' }
        return New-ProjectResult 'current' $root $target $verified.Hash $false
    } catch {
        $failure = $_.Exception.Message
        $restored = [Collections.Generic.List[string]]::new()
        $removed = [Collections.Generic.List[string]]::new()
        $unresolved = [Collections.Generic.List[string]]::new()
        try {
            $current = Get-ProjectFileSnapshot $target
            $stillApplied = $current.Exists -and $current.Hash -ceq $appliedHash
            $matchesOriginal = $current.Exists -eq $snapshot.Exists -and (-not $current.Exists -or $current.Hash -ceq $snapshot.Hash)
            if ($stillApplied) {
                if ($snapshot.Exists) {
                    Set-ProjectFile $target $snapshot.Bytes $current $snapshot.Hash
                    $null = $restored.Add($target)
                } else {
                    [IO.File]::Delete($target)
                    if (Test-Path -LiteralPath $target) { throw 'Rollback could not remove the new AGENTS.md' }
                    $null = $removed.Add($target)
                }
            } elseif (-not $matchesOriginal) {
                $null = $unresolved.Add($target)
            }
        } catch {
            if (-not $unresolved.Contains($target)) { $null = $unresolved.Add($target) }
        }
        try {
            $final = Get-ProjectFileSnapshot $target
            $finalHash = if ($final.Exists) { $final.Hash } else { 'absent' }
        } catch {
            if (-not $unresolved.Contains($target)) { $null = $unresolved.Add($target) }
            $finalHash = $null
        }
        $rollback = [pscustomobject] @{
            status = if ($unresolved.Count -eq 0) { 'complete' } else { 'incomplete' }
            restoredTargets = @($restored)
            removedTargets = @($removed)
            unresolvedTargets = @($unresolved)
        }
        $status = if ($unresolved.Count -eq 0) { 'failed' } else { 'unknown' }
        return New-ProjectResult $status $root $target $finalHash $true @([pscustomobject] @{ kind = 'applyFailure'; message = $failure }) $rollback @($unresolved)
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try {
        if ($Check -eq $Apply) { throw 'Specify exactly one of -Check or -Apply' }
        if ([string]::IsNullOrWhiteSpace($ProjectPath)) { throw 'ProjectPath is required' }
        $applyNames = @('ExpectedRoot', 'ExpectedTargetHash', 'ManagedBodyBase64')
        if ($Check) {
            foreach ($name in $applyNames) {
                if ($PSBoundParameters.ContainsKey($name)) { throw "$name is only valid with -Apply" }
            }
            $result = Invoke-JoewrksProjectSetup -Check -ProjectPath $ProjectPath
        } else {
            foreach ($name in $applyNames) {
                if (-not $PSBoundParameters.ContainsKey($name)) { throw "$name is required with -Apply" }
            }
            $result = Invoke-JoewrksProjectSetup -Apply -ProjectPath $ProjectPath -ExpectedRoot $ExpectedRoot `
                -ExpectedTargetHash $ExpectedTargetHash -ManagedBodyBase64 $ManagedBodyBase64
        }
    } catch {
        $result = New-ProjectResult 'blocked' $null $null $null $false @([pscustomobject] @{ kind = 'invocation'; message = $_.Exception.Message })
    }
    $result | ConvertTo-Json -Compress -Depth 8
    switch ($result.status) {
        'failed' { exit 1 }
        'blocked' { exit 2 }
        'unknown' { exit 3 }
        default { exit 0 }
    }
}
