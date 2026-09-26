[CmdletBinding()]
param(
    [switch] $Check,
    [switch] $Apply,
    [switch] $Remove,
    [string] $CodexHome
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:JoenessBeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$script:JoenessEndMarker = '<!-- JOEWRKS-HARNESS:END -->'
$script:JoenessStateFile = 'joewrks-harness-state.json'
$script:JoenessRelease = '0.2'
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
    if ([string] $manifest.runtimeMode -cne 'common-core+setup') { throw 'Unexpected runtime mode' }
    if ($null -eq $manifest.activeCommonCore) { throw 'Missing active Common Core identity' }
    if ([string] $manifest.activeCommonCore.path -cne 'astra-judgment-core.md') { throw 'Unexpected active Common Core path' }
    if (@($manifest.managedRuntimeFiles).Count -ne 0) { throw 'Managed runtime files must remain empty' }
    if (@($manifest.publicSkills).Count -ne 1 -or $manifest.publicSkills[0].name -cne 'joeness-setup') { throw 'Only joeness-setup may ship' }
    $expectedFiles=@('SKILL.md','agents/openai.yaml','assets/AGENTS.md','assets/DESIGN.md','assets/ISSUES.md','assets/ROADMAP.md','assets/TASK.md','references/usage.md','scripts/project-setup.ps1')
    $files=@($manifest.publicSkills[0].files)
    if((@($files.path|Sort-Object)-join ',') -cne (($expectedFiles|Sort-Object)-join ',')){throw 'Unexpected skill source inventory'}
    foreach($file in $files){
        $path=Join-Path $SourceRoot ('skills/joeness-setup/'+$file.path)
        if((Get-JoenessSha256 ([IO.File]::ReadAllBytes($path))) -cne $file.sha256){throw "Skill source hash mismatch: $($file.path)"}
    }
    if (@($manifest.defaultVendors).Count -ne 0) { throw 'Default vendors must remain empty' }
    if ($null -ne $manifest.pluginRouting) { throw 'Plugin routing must remain null' }
    if ($null -ne $manifest.PSObject.Properties['compatibility']) { throw 'Unexpected distribution manifest field: compatibility' }

    $coreBytes = [IO.File]::ReadAllBytes($corePath)
    $coreText = ConvertFrom-JoenessUtf8 $coreBytes 'Independent Judgment source'
    $coreHash = Get-JoenessSha256 $coreBytes
    if ([string] $manifest.activeCommonCore.sha256 -cne $coreHash) { throw 'Active Common Core hash does not match source bytes' }

    [pscustomobject] @{
        Skill = $manifest.publicSkills[0]
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
    if ([string] $state.releaseVersion -cne $script:JoenessRelease) { throw 'State identity does not match this package; existing files were preserved' }
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
 param([switch]$Check,[switch]$Apply,[switch]$Remove,[string]$CodexHome,[scriptblock]$AfterWrite)
 $mode=if($Apply){'apply'}elseif($Remove){'remove'}else{'check'}
 $resolved=Resolve-JoenessCodexHome $CodexHome
 $warnings=@()
 try {
  if(([int][bool]$Check+[int][bool]$Apply+[int][bool]$Remove) -gt 1){throw 'Choose one mode'}
  $sourceRoot=Split-Path -Parent $PSScriptRoot
  $source=Get-JoenessSourceIdentity $sourceRoot
  $savedApply=$Apply; $savedRemove=$Remove; $savedCheck=$Check
  . (Join-Path $sourceRoot 'skills/joeness-setup/scripts/project-setup.ps1')
  $Apply=$savedApply; $Remove=$savedRemove; $Check=$savedCheck
  Assert-SetupPath $resolved
  $agents=Get-SetupSnapshot (Join-Path $resolved 'AGENTS.md')
  $coreState=Get-SetupSnapshot (Join-Path $resolved $script:JoenessStateFile)
  $skillState=Get-SetupSnapshot (Join-Path $resolved 'joeness-skills-state.json')
  $observation=Get-JoenessInstallObservation $resolved $source
  if($observation.Status -eq 'blocked'){throw (($observation.Blockers|ForEach-Object {$_.message}) -join '; ')}
  $skillRoot=Join-Path $resolved 'skills/joeness-setup'
  Assert-SetupPath $skillRoot
  $files=@($source.Skill.files)
  $currentFiles=@()
  if(Test-Path -LiteralPath $skillRoot){
   foreach($item in Get-ChildItem -LiteralPath $skillRoot -Force -Recurse){
    Assert-SetupPath $item.FullName
    if(-not $item.PSIsContainer){$currentFiles+=$item.FullName.Substring($skillRoot.Length+1).Replace('\','/')}
   }
  }
  $owned=$null
  if($skillState.Hash -ne 'absent'){
   $owned=$script:Utf8Strict.GetString($skillState.Bytes)|ConvertFrom-Json
   if($owned.schemaVersion -ne 1 -or $owned.releaseVersion -cne '0.2' -or $owned.manifestSha256 -cne $source.ManifestHash){throw 'Skill ownership does not match this package; existing files were preserved'}
   if(($owned.files|ConvertTo-Json -Compress) -cne ($files|ConvertTo-Json -Compress)){throw 'Skill ownership inventory mismatch'}
   if(($currentFiles|Sort-Object)-join ',' -cne (($files.path|Sort-Object)-join ',')){throw 'Owned skill inventory drift'}
  }elseif($currentFiles.Count){throw 'Unowned skill files; preserve them and resolve explicitly'}
  $entries=New-Object Collections.Generic.List[object]
  foreach($file in $files){
   $target=Get-SetupSnapshot (Join-Path $skillRoot $file.path)
   if($null -ne $owned -and $target.Hash -cne $file.sha256){throw "Owned skill drift: $($file.path)"}
   if($Remove){$entries.Add((New-SetupEntry $target @() ('skills/joeness-setup/'+$file.path) -Delete))}
   else{$entries.Add((New-SetupEntry $target ([IO.File]::ReadAllBytes((Join-Path $sourceRoot ('skills/joeness-setup/'+$file.path)))) ('skills/joeness-setup/'+$file.path)))}
  }
  $coreEntries=@()
  if($Remove){
   if($observation.Status -eq 'current'){
    $length=$agents.Bytes.Length-$observation.SuffixBytes.Length
    $prefix=New-Object byte[] $length
    [Array]::Copy($agents.Bytes,$prefix,$length)
    $delete=(-not $observation.State.originalAgentsExisted -and $length -eq 0)
    $coreEntries+=New-SetupEntry $agents $prefix 'AGENTS.md' -Delete:$delete
   }
   $coreEntries+=New-SetupEntry $coreState @() $script:JoenessStateFile -Delete
   $entries.Add((New-SetupEntry $skillState @() 'joeness-skills-state.json' -Delete))
  }else{
   if($observation.Status -eq 'ready'){
    $newline=Get-JoenessNewline $agents.Bytes
    $separatorCount=Get-JoenessSeparatorCount $agents.Bytes
    $suffix=Get-JoenessManagedSuffixBytes $source $newline $separatorCount
    $newAgents=[byte[]]($agents.Bytes+$suffix)
    $originalExisted=$agents.Hash -ne 'absent'
   }else{
    $newline=if($observation.State.newline -eq 'crlf'){"`r`n"}else{"`n"}
    $separatorCount=$observation.State.separatorCount
    $newAgents=$agents.Bytes;$originalExisted=$observation.State.originalAgentsExisted
   }
   $stateObject=[ordered]@{
    schemaVersion=1;releaseVersion='0.2';manifestSha256=$source.ManifestHash;coreSha256=$source.CoreHash;
    originalAgentsExisted=[bool]$originalExisted;newline=$(if($newline -ceq "`r`n"){'crlf'}else{'lf'});
    separatorCount=$separatorCount;blockSha256=(Get-JoenessSha256 (Get-JoenessBlockBytes $source $newline))
   }
   $coreEntries+=New-SetupEntry $agents $newAgents 'AGENTS.md'
   $coreEntries+=New-SetupEntry $coreState ($script:Utf8NoBom.GetBytes(($stateObject|ConvertTo-Json -Compress)+"`n")) $script:JoenessStateFile
   $ss=[ordered]@{schemaVersion=1;releaseVersion='0.2';manifestSha256=$source.ManifestHash;files=$files}
   $entries.Add((New-SetupEntry $skillState ($script:Utf8NoBom.GetBytes(($ss|ConvertTo-Json -Depth 5 -Compress)+"`n")) 'joeness-skills-state.json'))
  }
  $all=@($coreEntries)+$entries.ToArray()
  $changes=@($all|Where-Object {$_.Before.Hash -cne $_.NewHash}|ForEach-Object {$_.Label})
  if(-not $Apply -and -not $Remove){
   $status=if($changes.Count){'ready'}else{'current'}
   $r=New-JoenessPublicResult $status $mode $resolved $warnings ([bool]$changes.Count) $changes @() $null
  }else{
   $guard={Assert-SetupPath $resolved; $verified=Get-JoenessSourceIdentity $sourceRoot; if($verified.ManifestHash -cne $source.ManifestHash){throw 'Source changed during operation'}}
   $tx=Invoke-SetupTransaction $all $AfterWrite $guard
   $status=if($tx.Status -eq 'success'){if($Remove){'removed'}else{'current'}}else{$tx.Status}
   $rollback=if($tx.Rollback){[pscustomobject]@{status=$tx.Rollback;problems=$tx.Unresolved}}else{$null}
   $blockers=if($tx.Error){@([pscustomobject]@{kind='writeFailure';message=$tx.Error})}else{@()}
   $r=New-JoenessPublicResult $status $mode $resolved $warnings ($status -in @('failed','partial')) $tx.Changed $blockers $rollback
  }
  if($r.status -eq 'current'){$r.activeSkills=@('joeness-setup')}
  $r
 }catch{
  New-JoenessPublicResult 'blocked' $mode $resolved $warnings $false @() @([pscustomobject]@{kind='conflict';message=$_.Exception.Message}) $null
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
    # Keep native stdout machine-readable, including Korean paths.
    [Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
    try {
        $result = Invoke-JoenessHarnessSync -Check:$Check -Apply:$Apply -Remove:$Remove -CodexHome $CodexHome
        $result | ConvertTo-Json -Depth 8 -Compress | Write-Output
        # A display error must not change a completed installation into a failed write.
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
        $failed = New-JoenessPublicResult 'failed' $fallbackMode $fallbackHome @() $false @() @([pscustomobject] @{ kind = 'unexpected'; message = $_.Exception.Message }) $null
        $failed | ConvertTo-Json -Depth 8 -Compress | Write-Output
        exit 1
    }
}
