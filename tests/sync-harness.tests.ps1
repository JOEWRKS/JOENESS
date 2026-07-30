$ErrorActionPreference = 'Stop'

$RepositoryRoot = Split-Path -Parent $PSScriptRoot
$Implementation = Join-Path $RepositoryRoot 'scripts\sync-harness.ps1'
$BeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$EndMarker = '<!-- JOEWRKS-HARNESS:END -->'

if (-not (Test-Path -LiteralPath $Implementation -PathType Leaf)) {
    throw "Missing required implementation script: $Implementation"
}

function Assert-True { param([bool] $Condition, [string] $Message) if (-not $Condition) { throw "Assertion failed: $Message" } }
function Assert-Equal { param($Actual, $Expected, [string] $Message) if ($Actual -cne $Expected) { throw "Assertion failed: $Message; expected [$Expected], got [$Actual]" } }
function Get-Hash { param([string] $Path) (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Write-Utf8 { param([string] $Path, [string] $Text) [IO.Directory]::CreateDirectory((Split-Path -Parent $Path)) | Out-Null; [IO.File]::WriteAllText($Path, $Text, (New-Object Text.UTF8Encoding($false))) }
function Write-Bytes { param([string] $Path, [byte[]] $Bytes) [IO.Directory]::CreateDirectory((Split-Path -Parent $Path)) | Out-Null; [IO.File]::WriteAllBytes($Path, $Bytes) }

function Get-OptionalFiles {
    param([string] $SourceRoot)
    $manifest = Get-Content -Raw -LiteralPath (Join-Path $SourceRoot 'vendor\source-manifest.json') | ConvertFrom-Json
    $paths = @('vendor/source-manifest.json')
    foreach ($skill in @($manifest.activeSkills.PSObject.Properties.Value)) {
        $paths += @($skill.files | ForEach-Object { $_.localPath })
        foreach ($source in @($skill.sourceDependencies)) { $paths += @($manifest.sources.$source.files | ForEach-Object { $_.localPath }) }
    }
    @($paths | Sort-Object -Unique)
}

function Copy-RelativeFile {
    param([string] $FromRoot, [string] $ToRoot, [string] $RelativePath)
    $destination = Join-Path $ToRoot $RelativePath
    [IO.Directory]::CreateDirectory((Split-Path -Parent $destination)) | Out-Null
    [IO.File]::Copy((Join-Path $FromRoot $RelativePath), $destination, $true)
}

function New-Fixture {
    $root = Join-Path ([IO.Path]::GetTempPath()) ("joewrks-sync-" + [guid]::NewGuid().ToString('N'))
    $source = Join-Path $root 'source'
    [IO.Directory]::CreateDirectory($source) | Out-Null
    foreach ($path in @('AGENTS.md', 'scripts\sync-harness.ps1', 'vendor\source-manifest.json') + (Get-OptionalFiles $RepositoryRoot)) { Copy-RelativeFile $RepositoryRoot $source $path }
    [pscustomobject]@{
        Root = $root; SourceRoot = $source; Script = Join-Path $source 'scripts\sync-harness.ps1'
        CodexHome = Join-Path $root 'codex'; AgentsHome = Join-Path $root 'agents'; BackupRoot = Join-Path $root 'backups'
        State = Join-Path $root 'codex\joewrks-harness-state.json'
    }
}

function Remove-Fixture { param($Fixture) if (Test-Path -LiteralPath $Fixture.Root) { [IO.Directory]::Delete($Fixture.Root, $true) } }

function Invoke-Harness {
    param($Fixture, [ValidateSet('Check', 'Apply')] [string] $Mode, [switch] $IncludeDesignFrontend, [string[]] $ExtraArguments = @())
    $out = Join-Path $Fixture.Root 'stdout.txt'; $err = Join-Path $Fixture.Root 'stderr.txt'
    $commandArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $Fixture.Script, "-$Mode", '-CodexHome', $Fixture.CodexHome, '-AgentsHome', $Fixture.AgentsHome, '-BackupRoot', $Fixture.BackupRoot)
    if ($IncludeDesignFrontend) { $commandArgs += '-IncludeDesignFrontend' }
    & powershell.exe @commandArgs @ExtraArguments 1> $out 2> $err
    $run = [pscustomobject]@{ ExitCode = $LASTEXITCODE; StdOut = [IO.File]::ReadAllText($out); StdErr = [IO.File]::ReadAllText($err) }
    Remove-Item -LiteralPath $out, $err -Force
    $run
}

function Read-Result {
    param($Run, [string] $Message)
    Assert-True (-not [string]::IsNullOrWhiteSpace($Run.StdOut)) "$Message emits JSON"
    try { $Run.StdOut.Trim() | ConvertFrom-Json } catch { throw "Assertion failed: $Message emits parseable JSON" }
}

function Get-TreeHashes {
    param([string] $Root)
    $hashes = @{}
    if (Test-Path -LiteralPath $Root) {
        foreach ($file in Get-ChildItem -LiteralPath $Root -File -Recurse) { $hashes[$file.FullName.Substring($Root.Length).TrimStart('\')] = Get-Hash $file.FullName }
    }
    $hashes
}

function Assert-TreeEqual {
    param([hashtable] $Actual, [hashtable] $Expected, [string] $Message)
    Assert-Equal (($Actual.GetEnumerator() | Sort-Object Name | ConvertTo-Json -Compress)) (($Expected.GetEnumerator() | Sort-Object Name | ConvertTo-Json -Compress)) $Message
}

function Set-SourceCore {
    param($Fixture, [string] $Text)
    $core = Join-Path $Fixture.SourceRoot 'AGENTS.md'; Write-Utf8 $core $Text
    $manifestPath = Join-Path $Fixture.SourceRoot 'vendor\source-manifest.json'
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    $manifest.evaluation.current.commonCore.sha256 = Get-Hash $core
    Write-Utf8 $manifestPath ($manifest | ConvertTo-Json -Depth 32)
}

function Find-Bytes {
    param([byte[]] $Bytes, [byte[]] $Needle)
    for ($i = 0; $i -le $Bytes.Length - $Needle.Length; $i++) {
        $match = $true
        for ($j = 0; $j -lt $Needle.Length; $j++) { if ($Bytes[$i + $j] -ne $Needle[$j]) { $match = $false; break } }
        if ($match) { return $i }
    }
    -1
}

function Count-Bytes {
    param([byte[]] $Bytes, [byte[]] $Needle)
    $count = 0
    for ($i = 0; $i -le $Bytes.Length - $Needle.Length; $i++) {
        $match = $true
        for ($j = 0; $j -lt $Needle.Length; $j++) { if ($Bytes[$i + $j] -ne $Needle[$j]) { $match = $false; break } }
        if ($match) { $count++; $i += $Needle.Length - 1 }
    }
    $count
}

function Get-ExternalAgentBytes {
    param([string] $Path)
    $bytes = [IO.File]::ReadAllBytes($Path); $begin = [Text.Encoding]::UTF8.GetBytes($BeginMarker); $end = [Text.Encoding]::UTF8.GetBytes($EndMarker)
    $first = Find-Bytes $bytes $begin; $last = Find-Bytes $bytes $end
    Assert-True ($first -ge 0 -and $last -gt $first) 'managed block markers exist'
    [pscustomobject]@{ Prefix = $bytes[0..($first - 1)]; Suffix = $bytes[($last + $end.Length)..($bytes.Length - 1)] }
}

function Assert-BytesEqual { param([byte[]] $Actual, [byte[]] $Expected, [string] $Message) Assert-Equal ([Convert]::ToBase64String($Actual)) ([Convert]::ToBase64String($Expected)) $Message }
function Assert-StringSetEqual { param([string[]] $Actual, [string[]] $Expected, [string] $Message) Assert-Equal (($Actual | Sort-Object) -join "`n") (($Expected | Sort-Object) -join "`n") $Message }

function Test-EmptyCheckAndApply {
    $f = New-Fixture
    try {
        $check = Invoke-Harness $f Check; Assert-Equal $check.ExitCode 0 'empty check succeeds'
        $result = Read-Result $check 'empty check'; Assert-Equal $result.status 'ready' 'empty check is ready'; Assert-True ([bool]$result.changesRequired) 'empty check needs changes'
        Assert-True ((@($result.changes) | ConvertTo-Json -Depth 8) -match '(?i)common.?core') 'empty check plans Common Core'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'check creates no target/state'; Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'check creates no agents directory'; Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'check creates no backup'
        $apply = Invoke-Harness $f Apply; Assert-Equal $apply.ExitCode 0 'first apply succeeds'; Assert-Equal (Read-Result $apply 'first apply').status 'current' 'first apply is current'
        $agents = Join-Path $f.CodexHome 'AGENTS.md'; Assert-True (Test-Path -LiteralPath $agents) 'apply creates Common Core target'; Assert-True (Test-Path -LiteralPath $f.State) 'apply creates state'; Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'default apply creates no optional target'
        $agentBytes = [IO.File]::ReadAllBytes($agents); Assert-Equal (Count-Bytes $agentBytes ([Text.Encoding]::UTF8.GetBytes($BeginMarker))) 1 'apply creates exactly one managed block begin marker'; Assert-Equal (Count-Bytes $agentBytes ([Text.Encoding]::UTF8.GetBytes($EndMarker))) 1 'apply creates exactly one managed block end marker'
        Assert-Equal (Read-Result (Invoke-Harness $f Check) 'post-apply check').status 'current' 'post-apply check is current'
        $before = Get-TreeHashes $f.CodexHome; $backupExists = Test-Path -LiteralPath $f.BackupRoot; $backups = Get-TreeHashes $f.BackupRoot; Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'second apply succeeds'
        Assert-TreeEqual (Get-TreeHashes $f.CodexHome) $before 'second apply changes no target hashes'; Assert-Equal (Test-Path -LiteralPath $f.BackupRoot) $backupExists 'second apply creates no backup directory'; Assert-TreeEqual (Get-TreeHashes $f.BackupRoot) $backups 'second apply creates no backup files'
    } finally { Remove-Fixture $f }
}

function Test-AgentEncodingAndCoreUpdate {
    $f = New-Fixture
    try {
        $path = Join-Path $f.CodexHome 'AGENTS.md'
        $start = "$([char]0xc678)$([char]0xbd80) $([char]0xc2dc)$([char]0xc791)"; $end = "$([char]0xc678)$([char]0xbd80) $([char]0xb05d)"; $edit = "$([char]0xc678)$([char]0xbd80) $([char]0xc218)$([char]0xc815)"
        Write-Bytes $path ([Text.Encoding]::UTF8.GetPreamble() + (New-Object Text.UTF8Encoding($false)).GetBytes("$start`r`n$end`r`n"))
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'initial Korean AGENTS apply succeeds'
        $bytes = [IO.File]::ReadAllBytes($path); Assert-True ($bytes[0] -eq 0xef -and $bytes[1] -eq 0xbb -and $bytes[2] -eq 0xbf) 'BOM survives initial apply'
        $agentText = [Text.Encoding]::UTF8.GetString($bytes[3..($bytes.Length - 1)]); Assert-True ($agentText -notmatch '(?<!\r)\n') 'CRLF style survives initial apply'
        Write-Bytes $path ([Text.Encoding]::UTF8.GetPreamble() + (New-Object Text.UTF8Encoding($false)).GetBytes($agentText.Replace($end, $edit)))
        $external = Get-ExternalAgentBytes $path
        Assert-Equal (Invoke-Harness $f Check).ExitCode 0 'external edit is checkable'; Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'no-op apply preserves external edit'
        Set-SourceCore $f ((Get-Content -Raw -LiteralPath (Join-Path $f.SourceRoot 'AGENTS.md')) + "`n# update")
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'source core update succeeds'
        $after = Get-ExternalAgentBytes $path; Assert-BytesEqual $after.Prefix $external.Prefix 'external prefix is byte-exact'; Assert-BytesEqual $after.Suffix $external.Suffix 'external suffix is byte-exact'
    } finally { Remove-Fixture $f }
}

function Assert-BlockedBeforeWrites {
    param($Fixture, [scriptblock] $Prepare, [string] $Message)
    & $Prepare $Fixture; $codex = Get-TreeHashes $Fixture.CodexHome; $agents = Get-TreeHashes $Fixture.AgentsHome; $backupExists = Test-Path -LiteralPath $Fixture.BackupRoot; $backups = Get-TreeHashes $Fixture.BackupRoot
    $run = Invoke-Harness $Fixture Apply; Assert-True ($run.ExitCode -ne 0) "$Message exits nonzero"; Assert-Equal (Read-Result $run $Message).status 'blocked' "$Message reports blocked"
    Assert-TreeEqual (Get-TreeHashes $Fixture.CodexHome) $codex "$Message creates no Codex writes"; Assert-TreeEqual (Get-TreeHashes $Fixture.AgentsHome) $agents "$Message creates no agents writes"; Assert-Equal (Test-Path -LiteralPath $Fixture.BackupRoot) $backupExists "$Message creates no backup directory"; Assert-TreeEqual (Get-TreeHashes $Fixture.BackupRoot) $backups "$Message creates no backup files"
}

function Test-PreflightBlockers {
    $cases = @(
        @{ Name = 'malformed marker'; Action = { param($f) Write-Utf8 (Join-Path $f.CodexHome 'AGENTS.md') "$BeginMarker`npartial" } },
        @{ Name = 'duplicate markers'; Action = { param($f) Write-Utf8 (Join-Path $f.CodexHome 'AGENTS.md') "$BeginMarker`na`n$EndMarker`n$BeginMarker`nb`n$EndMarker" } },
        @{ Name = 'override shadow'; Action = { param($f) Write-Utf8 (Join-Path $f.CodexHome 'AGENTS.override.md') 'user override' } },
        @{ Name = 'current skill collision'; Action = { param($f) Write-Utf8 (Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md') 'unmanaged' } },
        @{ Name = 'legacy skill collision'; Action = { param($f) Write-Utf8 (Join-Path $f.CodexHome 'skills\other\SKILL.md') "---`nname: joewrks-design-frontend`n---" } }
    )
    foreach ($case in $cases) { $f = New-Fixture; try { Assert-BlockedBeforeWrites $f $case.Action $case.Name } finally { Remove-Fixture $f } }
    $f = New-Fixture; try { Add-Content -LiteralPath (Join-Path $f.SourceRoot 'skills\joewrks-design-frontend\SKILL.md') -Value 'bad source'; Assert-BlockedBeforeWrites $f {} 'source hash mismatch' } finally { Remove-Fixture $f }
    $f = New-Fixture; try { Set-SourceCore $f ('# oversized' + ('x' * (33KB))); Assert-BlockedBeforeWrites $f {} 'oversized planned AGENTS.md' } finally { Remove-Fixture $f }
}

function Test-OptionalBundleStateAndDrift {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'default apply succeeds'; Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'default apply installs no optional files'
        Assert-Equal (Invoke-Harness $f Apply -IncludeDesignFrontend).ExitCode 0 'opt-in apply succeeds'
        $expectedFiles = Get-OptionalFiles $f.SourceRoot; Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) $expectedFiles 'opt-in installs exactly the manifest-selected files'
        $before = Get-TreeHashes $f.AgentsHome; Assert-Equal (Read-Result (Invoke-Harness $f Check) 'default check after opt-in').status 'current' 'omitted flag preserves opt-in'; Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'default apply after opt-in succeeds'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $before 'omitted flag does not update/remove opt-in'
        Add-Content -LiteralPath (Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md') -Value 'external drift'; $drift = Get-TreeHashes $f.AgentsHome
        $check = Invoke-Harness $f Check; Assert-Equal (Read-Result $check 'optional drift check').status 'blocked' 'installed optional drift blocks default check'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $drift 'optional drift check is read-only'
        $run = Invoke-Harness $f Apply; Assert-True ($run.ExitCode -ne 0) 'installed optional drift blocks apply'; Assert-Equal (Read-Result $run 'optional drift').status 'blocked' 'installed optional drift reports blocked'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $drift 'installed optional drift is not overwritten'
        $stateText = [IO.File]::ReadAllText($f.State); $state = $stateText | ConvertFrom-Json
        Assert-True ($stateText -notmatch '(?i)[a-z]:\\') 'state stores no drive letter'; Assert-True ($stateText -notmatch [regex]::Escape([Environment]::GetFolderPath('UserProfile'))) 'state stores no user profile'; Assert-True ($state.PSObject.Properties.Name -contains 'managedBlocks') 'state has block ownership'; Assert-True ($state.PSObject.Properties.Name -contains 'wholeFileTargets') 'state has whole-file ownership'
    } finally { Remove-Fixture $f }
}

function Test-DeterministicRollback {
    $f = New-Fixture
    try {
        . $f.Script; Assert-True ((Get-Command Invoke-JoewrksHarnessSync).Parameters.ContainsKey('AfterReplace')) 'dot-sourced function exposes internal callback'
        $result = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace { param($replacement) throw 'test failure' }
        Assert-Equal $result.status 'failed' 'callback failure reports failed'; Assert-True (-not (Test-Path -LiteralPath $f.State)) 'rollback removes unwritten state'; Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.CodexHome 'AGENTS.md'))) 'rollback restores absent target'
        Assert-True ((Invoke-Harness $f Check -ExtraArguments @('-AfterReplace', 'nope')).ExitCode -ne 0) 'CLI exposes no callback switch'
    } finally { Remove-Fixture $f }
    $f = New-Fixture
    try {
        . $f.Script
        $changedBytes = [Text.Encoding]::UTF8.GetBytes('changed again'); $changedPathFile = Join-Path $f.Root 'changed-target.txt'
        $result = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace { param($replacement) Write-Bytes $replacement.TargetPath $changedBytes; [IO.File]::WriteAllText($changedPathFile, $replacement.TargetPath); throw 'test concurrent edit' }
        Assert-Equal $result.status 'failed' 'concurrent callback failure reports failed'; Assert-True (@($result.unresolvedTargets).Count -gt 0) 'changed-again target is unresolved, not overwritten'; Assert-BytesEqual ([IO.File]::ReadAllBytes([IO.File]::ReadAllText($changedPathFile))) $changedBytes 'rollback preserves externally changed bytes'
    } finally { Remove-Fixture $f }
}

Test-EmptyCheckAndApply
Test-AgentEncodingAndCoreUpdate
Test-PreflightBlockers
Test-OptionalBundleStateAndDrift
Test-DeterministicRollback
Write-Host 'PASS sync-harness contract'
