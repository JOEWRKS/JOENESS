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
function Assert-ThrowsLike {
    param([scriptblock] $Action, [string] $Pattern, [string] $Message)
    try { & $Action; throw "Assertion failed: $Message did not throw" }
    catch {
        if ($_.Exception.Message -notlike $Pattern) {
            throw "Assertion failed: $Message; expected [$Pattern], got [$($_.Exception.Message)]"
        }
    }
}
function Get-Hash { param([string] $Path) (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Write-Utf8 { param([string] $Path, [string] $Text) [IO.Directory]::CreateDirectory((Split-Path -Parent $Path)) | Out-Null; [IO.File]::WriteAllText($Path, $Text, (New-Object Text.UTF8Encoding($false))) }
function Write-Bytes { param([string] $Path, [byte[]] $Bytes) [IO.Directory]::CreateDirectory((Split-Path -Parent $Path)) | Out-Null; [IO.File]::WriteAllBytes($Path, $Bytes) }

function Get-OptionalFiles {
    param([string] $SourceRoot)
    $manifest = Get-Content -Raw -LiteralPath (Join-Path $SourceRoot 'vendor\source-manifest.json') | ConvertFrom-Json
    $paths = @('vendor\source-manifest.json')
    foreach ($skill in @($manifest.activeSkills.PSObject.Properties.Value)) {
        $paths += @($skill.files | ForEach-Object { $_.localPath -replace '/', '\' })
        foreach ($source in @($skill.sourceDependencies)) { $paths += @($manifest.sources.$source.files | ForEach-Object { $_.localPath -replace '/', '\' }) }
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
    param($Fixture, [ValidateSet('Check', 'Apply')] [string] $Mode, [switch] $IncludeDesignFrontend, [switch] $PublicEntry, [string[]] $ExtraArguments = @())
    $out = Join-Path $Fixture.Root 'stdout.txt'; $err = Join-Path $Fixture.Root 'stderr.txt'
    $scriptPath = if ($PublicEntry) { Join-Path $RepositoryRoot 'harness.ps1' } else { $Fixture.Script }
    $commandArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath, "-$Mode", '-CodexHome', $Fixture.CodexHome, '-AgentsHome', $Fixture.AgentsHome, '-BackupRoot', $Fixture.BackupRoot)
    if ($IncludeDesignFrontend) { $commandArgs += '-IncludeDesignFrontend' }
    $oldPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & powershell.exe @commandArgs @ExtraArguments 1> $out 2> $err
        $exitCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $oldPreference }
    $run = [pscustomobject]@{ ExitCode = $exitCode; StdOut = [IO.File]::ReadAllText($out); StdErr = [IO.File]::ReadAllText($err) }
    Remove-Item -LiteralPath $out, $err -Force
    $run
}

function Test-PublicHarnessEntry {
    $f = New-Fixture
    try {
        $check = Invoke-Harness $f Check -PublicEntry
        Assert-Equal $check.ExitCode 0 'public entry check succeeds'
        Assert-Equal (Read-Result $check 'public entry check').status 'ready' 'public entry forwards check'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'public entry check remains read-only'

        $apply = Invoke-Harness $f Apply -PublicEntry
        Assert-Equal $apply.ExitCode 0 'public entry apply succeeds'
        Assert-Equal (Read-Result $apply 'public entry apply').status 'current' 'public entry forwards apply'
        Assert-True (Test-Path -LiteralPath (Join-Path $f.CodexHome 'AGENTS.md') -PathType Leaf) 'public entry apply installs Common Core'

        $pilot = Invoke-Harness $f Check -IncludeDesignFrontend -PublicEntry
        Assert-Equal $pilot.ExitCode 0 'public entry forwards the optional pilot flag'
        Assert-PilotDisclosure (Read-Result $pilot 'public entry pilot check').designFrontendPilot 'explicit-request' 'public entry pilot check'

        $invalid = Invoke-Harness $f Check -PublicEntry -ExtraArguments @('-Apply')
        Assert-True ($invalid.ExitCode -ne 0) 'public entry preserves blocked exit status'
        Assert-Equal (Read-Result $invalid 'public entry invalid invocation').status 'blocked' 'public entry preserves blocked result'
    } finally { Remove-Fixture $f }
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

function Remove-SourceOptionalEntry {
    param($Fixture, [string] $RelativePath)
    $manifestPath = Join-Path $Fixture.SourceRoot 'vendor\source-manifest.json'
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    $removed = $false
    foreach ($skill in @($manifest.activeSkills.PSObject.Properties.Value)) {
        $kept = @($skill.files | Where-Object {
            if (([string] $_.localPath).Replace('\', '/') -ceq $RelativePath.Replace('\', '/')) { $removed = $true; $false } else { $true }
        })
        $skill.files = $kept
    }
    if (-not $removed) { throw "Fixture manifest entry not found: $RelativePath" }
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
function Assert-PilotDisclosure {
    param($Pilot, [string] $Selection, [string] $Message)
    Assert-True ($null -ne $Pilot) "$Message discloses the pilot"
    Assert-Equal $Pilot.selection $Selection "$Message distinguishes pilot selection"
    Assert-Equal $Pilot.state 'candidate' "$Message reports candidate state"
    Assert-Equal $Pilot.hardGate 'pass' "$Message reports the manifest hard gate"
    Assert-Equal $Pilot.promotionPass $false "$Message does not claim promotion"
    Assert-Equal $Pilot.classification 'implicit-unverified' "$Message reports unverified classification"
    Assert-Equal $Pilot.outcomeReview 'human-review-required' "$Message requires human outcome review"
    Assert-Equal $Pilot.semanticImprovement 'not-asserted' "$Message does not assert semantic improvement"
    Assert-Equal $Pilot.figma 'task-time-verification-not-certified' "$Message does not certify Figma"
    Assert-Equal $Pilot.browser 'task-time-verification-not-certified' "$Message does not certify browser behavior"
}

function Test-EmptyCheckAndApply {
    $f = New-Fixture
    try {
        $check = Invoke-Harness $f Check; Assert-Equal $check.ExitCode 0 'empty check succeeds'
        $result = Read-Result $check 'empty check'; Assert-Equal $result.status 'ready' 'empty check is ready'; Assert-True ([bool]$result.changesRequired) 'empty check needs changes'
        Assert-Equal $result.designFrontendPilot $null 'core-only check has no pilot disclosure'
        Assert-True ((@($result.changes) | ConvertTo-Json -Depth 8) -match '(?i)common.?core') 'empty check plans Common Core'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'check creates no target/state'; Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'check creates no agents directory'; Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'check creates no backup'
        $apply = Invoke-Harness $f Apply; Assert-Equal $apply.ExitCode 0 'first apply succeeds'; Assert-Equal (Read-Result $apply 'first apply').status 'current' 'first apply is current'
        $agents = Join-Path $f.CodexHome 'AGENTS.md'; Assert-True (Test-Path -LiteralPath $agents) 'apply creates Common Core target'; Assert-True (Test-Path -LiteralPath $f.State) 'apply creates state'; Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'default apply creates no optional target'
        $agentBytes = [IO.File]::ReadAllBytes($agents); $beginBytes = [Text.Encoding]::UTF8.GetBytes($BeginMarker); $endBytes = [Text.Encoding]::UTF8.GetBytes($EndMarker); Assert-Equal (Count-Bytes $agentBytes $beginBytes) 1 'apply creates exactly one managed block begin marker'; Assert-Equal (Count-Bytes $agentBytes $endBytes) 1 'apply creates exactly one managed block end marker'; Assert-True ((Find-Bytes $agentBytes $beginBytes) -lt (Find-Bytes $agentBytes $endBytes)) 'apply orders the managed block begin marker before its end marker'
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
    param($Fixture, [scriptblock] $Prepare, [string] $Message, [string] $BlockerKind)
    & $Prepare $Fixture; $codex = Get-TreeHashes $Fixture.CodexHome; $agents = Get-TreeHashes $Fixture.AgentsHome; $backupExists = Test-Path -LiteralPath $Fixture.BackupRoot; $backups = Get-TreeHashes $Fixture.BackupRoot
    $run = Invoke-Harness $Fixture Apply; Assert-True ($run.ExitCode -ne 0) "$Message exits nonzero"; $result = Read-Result $run $Message; Assert-Equal $result.status 'blocked' "$Message reports blocked"
    if ($BlockerKind) { Assert-True (@($result.blockers).kind -contains $BlockerKind) "$Message reports $BlockerKind" }
    Assert-TreeEqual (Get-TreeHashes $Fixture.CodexHome) $codex "$Message creates no Codex writes"; Assert-TreeEqual (Get-TreeHashes $Fixture.AgentsHome) $agents "$Message creates no agents writes"; Assert-Equal (Test-Path -LiteralPath $Fixture.BackupRoot) $backupExists "$Message creates no backup directory"; Assert-TreeEqual (Get-TreeHashes $Fixture.BackupRoot) $backups "$Message creates no backup files"
}

function Test-ManifestPathSafety {
    . $Implementation
    $cases = @(
        @{ Path = 'C:\absolute.txt'; Pattern = '*relative*' },
        @{ Path = '\\server\share.txt'; Pattern = '*relative*' },
        @{ Path = '\\?\C:\device.txt'; Pattern = '*relative*' },
        @{ Path = '../escape.txt'; Pattern = '*normalized*' },
        @{ Path = 'safe/file.txt:stream'; Pattern = '*alternate data stream*' },
        @{ Path = 'safe/na*me.txt'; Pattern = '*invalid character*' },
        @{ Path = 'safe/CON.txt'; Pattern = '*reserved*' },
        @{ Path = 'safe/name. '; Pattern = '*trailing dot or space*' }
    )
    foreach ($case in $cases) {
        Assert-ThrowsLike {
            Get-HarnessSafeRelativePath $case.Path 'test path'
        } $case.Pattern "rejects $($case.Path)"
    }

    $f = New-Fixture
    $junction = $null
    try {
        $manifestPath = Join-Path $f.SourceRoot 'vendor\source-manifest.json'
        $exactDuplicateManifest = ([IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json)
        $exactFile = $exactDuplicateManifest.activeSkills.'joewrks-design-frontend'.files[0]
        $exactDuplicateManifest.activeSkills.'joewrks-design-frontend'.files = @($exactFile, $exactFile)
        Assert-ThrowsLike {
            Get-HarnessManifestSelections $exactDuplicateManifest $f.SourceRoot
        } '*duplicate*' 'exact duplicate blocks'

        $caseAliasManifest = ([IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json)
        $firstFile = $caseAliasManifest.activeSkills.'joewrks-design-frontend'.files[0]
        $aliasFile = [pscustomobject] @{
            localPath = ([string] $firstFile.localPath).ToUpperInvariant()
            bytes = $firstFile.bytes
            sha256 = $firstFile.sha256
            exactUpstreamCopy = $firstFile.exactUpstreamCopy
        }
        $caseAliasManifest.activeSkills.'joewrks-design-frontend'.files = @($firstFile, $aliasFile)
        Assert-ThrowsLike {
            Get-HarnessManifestSelections $caseAliasManifest $f.SourceRoot
        } '*case-insensitive destination*' 'case-only aliases block'

        $prefixManifest = [pscustomobject] @{
            activeSkills = [pscustomobject] @{
                'collision-test' = [pscustomobject] @{
                    sourceDependencies = @()
                    files = @(
                        [pscustomobject] @{ localPath = 'skills/collision'; bytes = 1; sha256 = ('0' * 64); exactUpstreamCopy = $false },
                        [pscustomobject] @{ localPath = 'skills/collision/file.txt'; bytes = 1; sha256 = ('0' * 64); exactUpstreamCopy = $false }
                    )
                }
            }
            sources = [pscustomobject] @{}
        }
        Assert-ThrowsLike {
            Get-HarnessManifestSelections $prefixManifest $f.SourceRoot
        } '*file-directory collision*' 'file-directory prefix collision blocks'

        $real = Join-Path $f.Root 'real-vendor'
        $junction = Join-Path $f.SourceRoot 'linked-vendor'
        [IO.Directory]::CreateDirectory($real) | Out-Null
        New-Item -ItemType Junction -Path $junction -Target $real | Out-Null
        Assert-ThrowsLike {
            Resolve-HarnessSourceFile $f.SourceRoot 'linked-vendor/file.txt'
        } '*reparse point*' 'source junction blocks'
    } finally {
        if ($junction -and (Test-Path -LiteralPath $junction)) { [IO.Directory]::Delete($junction) }
        Remove-Fixture $f
    }

    $targetFixture = New-Fixture
    $targetJunction = $null
    try {
        $realTarget = Join-Path $targetFixture.Root 'real-target-vendor'
        [IO.Directory]::CreateDirectory($targetFixture.AgentsHome) | Out-Null
        [IO.Directory]::CreateDirectory($realTarget) | Out-Null
        $targetJunction = Join-Path $targetFixture.AgentsHome 'vendor'
        New-Item -ItemType Junction -Path $targetJunction -Target $realTarget | Out-Null
        $beforeTarget = Get-TreeHashes $realTarget
        $targetCheck = Invoke-Harness $targetFixture Check -IncludeDesignFrontend
        $targetResult = Read-Result $targetCheck 'target junction check'
        Assert-Equal $targetResult.status 'blocked' 'target junction blocks full check'
        Assert-True (@($targetResult.blockers | Where-Object { $_.message -like '*reparse point*' }).Count -gt 0) 'target junction is reported'
        Assert-TreeEqual (Get-TreeHashes $realTarget) $beforeTarget 'target junction check writes nothing'
        Assert-True (-not (Test-Path -LiteralPath $targetFixture.State)) 'target junction writes no state'
        Assert-True (-not (Test-Path -LiteralPath $targetFixture.BackupRoot)) 'target junction creates no backup'
    } finally {
        if ($targetJunction -and (Test-Path -LiteralPath $targetJunction)) { [IO.Directory]::Delete($targetJunction) }
        Remove-Fixture $targetFixture
    }
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
    $f = New-Fixture
    try {
        Add-Content -LiteralPath (Join-Path $f.SourceRoot 'skills\joewrks-design-frontend\SKILL.md') -Value 'bad source'
        $result = Read-Result (Invoke-Harness $f Check -IncludeDesignFrontend) 'pilot source-integrity blocker'
        Assert-Equal $result.status 'blocked' 'pilot source-integrity mismatch blocks'
        Assert-Equal $result.designFrontendPilot.hardGate 'unverified' 'source-integrity blocker does not report a passing hard gate'
    } finally { Remove-Fixture $f }
}

function Test-StateTrust {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'schema tamper baseline apply succeeds'
        Assert-BlockedBeforeWrites $f {
            param($fixture)
            $state = Get-Content -Raw -LiteralPath $fixture.State | ConvertFrom-Json
            $state.schemaVersion = 2
            Write-Utf8 $fixture.State ($state | ConvertTo-Json -Depth 16)
        } 'wrong state schema' 'invalidState'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'managed-key tamper baseline apply succeeds'
        Assert-BlockedBeforeWrites $f {
            param($fixture)
            $state = Get-Content -Raw -LiteralPath $fixture.State | ConvertFrom-Json
            $hash = [string] $state.managedBlocks.'AGENTS.md'
            $state.managedBlocks = [pscustomobject] @{ 'OTHER.md' = $hash }
            Write-Utf8 $fixture.State ($state | ConvertTo-Json -Depth 16)
        } 'wrong managed block key' 'invalidState'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply -IncludeDesignFrontend).ExitCode 0 'arbitrary ownership baseline apply succeeds'
        $cleanState = [IO.File]::ReadAllBytes($f.State)
        Assert-BlockedBeforeWrites $f {
            param($fixture)
            $state = Get-Content -Raw -LiteralPath $fixture.State | ConvertFrom-Json
            $state.sourceIdentities.designFrontend.path = 'unrelated.json'
            Write-Utf8 $fixture.State ($state | ConvertTo-Json -Depth 16)
        } 'unrelated design source identity' 'invalidState'
        Write-Bytes $f.State $cleanState
        Assert-BlockedBeforeWrites $f {
            param($fixture)
            $state = Get-Content -Raw -LiteralPath $fixture.State | ConvertFrom-Json
            $state.wholeFileTargets.PSObject.Properties.Remove('skills/joewrks-design-frontend/agents/openai.yaml')
            Write-Utf8 $fixture.State ($state | ConvertTo-Json -Depth 16)
        } 'missing manifest-selected ownership' 'invalidState'
        Write-Bytes $f.State $cleanState
        Assert-BlockedBeforeWrites $f {
            param($fixture)
            $rogue = Join-Path $fixture.AgentsHome 'unrelated.txt'
            Write-Utf8 $rogue 'not part of the design bundle'
            $state = Get-Content -Raw -LiteralPath $fixture.State | ConvertFrom-Json
            $state.wholeFileTargets | Add-Member -NotePropertyName 'unrelated.txt' -NotePropertyValue (Get-Hash $rogue)
            Write-Utf8 $fixture.State ($state | ConvertTo-Json -Depth 16)
        } 'arbitrary whole-file ownership' 'invalidState'
    } finally { Remove-Fixture $f }
}

function Test-OptionalBundleStateAndDrift {
    $f = New-Fixture
    try {
        $explicit = Read-Result (Invoke-Harness $f Check -IncludeDesignFrontend) 'explicit pilot check'
        Assert-Equal $explicit.status 'ready' 'explicit pilot check is ready'
        Assert-PilotDisclosure $explicit.designFrontendPilot 'explicit-request' 'explicit pilot check'
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'default apply succeeds'; Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'default apply installs no optional files'
        Assert-Equal (Invoke-Harness $f Apply -IncludeDesignFrontend).ExitCode 0 'opt-in apply succeeds'
        $expectedFiles = Get-OptionalFiles $f.SourceRoot; Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) $expectedFiles 'opt-in installs exactly the manifest-selected files'
        $before = Get-TreeHashes $f.AgentsHome; $preserved = Read-Result (Invoke-Harness $f Check) 'default check after opt-in'; Assert-Equal $preserved.status 'current' 'omitted flag preserves opt-in'; Assert-PilotDisclosure $preserved.designFrontendPilot 'preserved-prior-opt-in' 'default check after opt-in'; Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'default apply after opt-in succeeds'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $before 'omitted flag does not update/remove opt-in'
        Add-Content -LiteralPath (Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md') -Value 'external drift'; $drift = Get-TreeHashes $f.AgentsHome
        $check = Invoke-Harness $f Check; $driftResult = Read-Result $check 'optional drift check'; Assert-Equal $driftResult.status 'blocked' 'installed optional drift blocks default check'; Assert-PilotDisclosure $driftResult.designFrontendPilot 'preserved-prior-opt-in' 'optional drift check'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $drift 'optional drift check is read-only'
        $run = Invoke-Harness $f Apply; Assert-True ($run.ExitCode -ne 0) 'installed optional drift blocks apply'; Assert-Equal (Read-Result $run 'optional drift').status 'blocked' 'installed optional drift reports blocked'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $drift 'installed optional drift is not overwritten'
        $stateText = [IO.File]::ReadAllText($f.State); $state = $stateText | ConvertFrom-Json
        Assert-True ($stateText -notmatch '(?i)[a-z]:\\') 'state stores no drive letter'; Assert-True ($stateText -notmatch [regex]::Escape([Environment]::GetFolderPath('UserProfile'))) 'state stores no user profile'; Assert-True ($state.PSObject.Properties.Name -contains 'managedBlocks') 'state has block ownership'; Assert-True ($state.PSObject.Properties.Name -contains 'wholeFileTargets') 'state has whole-file ownership'
    } finally { Remove-Fixture $f }
}

function Test-PreservedOptionalAfterCoreUpdate {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply -IncludeDesignFrontend).ExitCode 0 'preserved optional baseline apply succeeds'
        $beforeOptional = Get-TreeHashes $f.AgentsHome
        Set-SourceCore $f ((Get-Content -Raw -LiteralPath (Join-Path $f.SourceRoot 'AGENTS.md')) + "`n# core-only update")

        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'core-only update after opt-in succeeds'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $beforeOptional 'core-only update preserves optional files and installed manifest'

        $check = Invoke-Harness $f Check
        Assert-Equal $check.ExitCode 0 'check after preserved optional core update succeeds'
        $result = Read-Result $check 'check after preserved optional core update'
        Assert-Equal $result.status 'current' 'preserved optional state remains valid after a core-only update'
        Assert-PilotDisclosure $result.designFrontendPilot 'preserved-prior-opt-in' 'check after preserved optional core update'
    } finally { Remove-Fixture $f }
}

function Test-ObsoleteOptionalReconciliation {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply -IncludeDesignFrontend).ExitCode 0 'obsolete-file baseline apply succeeds'
        $obsoleteRelative = 'skills/joewrks-design-frontend/agents/openai.yaml'
        $obsoletePath = Join-Path $f.AgentsHome ($obsoleteRelative -replace '/', '\')
        $beforeAgents = Get-TreeHashes $f.AgentsHome
        $beforeState = [IO.File]::ReadAllBytes($f.State)
        $obsoleteBytes = [IO.File]::ReadAllBytes($obsoletePath)
        Remove-SourceOptionalEntry $f $obsoleteRelative

        $check = Read-Result (Invoke-Harness $f Check -IncludeDesignFrontend) 'obsolete-file update check'
        Assert-Equal $check.status 'ready' 'obsolete-file update is ready'
        Assert-True (@($check.changes | Where-Object { $_.action -eq 'remove' -and $_.target -eq $obsoleteRelative }).Count -eq 1) 'obsolete-file update plans one removal'

        . $f.Script
        $result = Invoke-JoewrksHarnessSync -Apply -IncludeDesignFrontend -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace {
            param($replacement)
            if (-not $replacement.DesiredExists -and $replacement.TargetPath -ieq $obsoletePath) { throw 'test failure after obsolete deletion' }
        }
        Assert-Equal $result.status 'failed' 'failure after obsolete deletion reports failed'
        Assert-Equal $result.rollback.status 'complete' 'obsolete deletion rollback completes'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $beforeAgents 'obsolete deletion rollback restores the optional tree'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($obsoletePath)) $obsoleteBytes 'obsolete deletion rollback restores exact bytes'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'obsolete deletion rollback preserves exact prior state'
        $obsoleteBackupPath = Join-Path $result.backupPath (Join-Path 'agents' ($obsoleteRelative -replace '/', '\'))
        Assert-BytesEqual ([IO.File]::ReadAllBytes($obsoleteBackupPath)) $obsoleteBytes 'obsolete file backup is byte-exact'

        $applyResult = Read-Result (Invoke-Harness $f Apply -IncludeDesignFrontend) 'successful obsolete-file update'
        Assert-Equal $applyResult.status 'current' 'successful obsolete-file update is current'
        Assert-True (-not (Test-Path -LiteralPath $obsoletePath)) 'explicit update removes obsolete optional file'
        $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        Assert-True (-not ($state.wholeFileTargets.PSObject.Properties.Name -contains $obsoleteRelative)) 'state drops obsolete optional ownership'
        Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) (Get-OptionalFiles $f.SourceRoot) 'explicit update leaves exactly the current manifest-selected unit'
    } finally { Remove-Fixture $f }
}

function Test-ConcurrentDisappearanceBeforeDelete {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply -IncludeDesignFrontend).ExitCode 0 'delete-race baseline apply succeeds'
        $obsoleteRelative = 'skills/joewrks-design-frontend/agents/openai.yaml'
        $obsoletePath = Join-Path $f.AgentsHome ($obsoleteRelative -replace '/', '\')
        Remove-SourceOptionalEntry $f $obsoleteRelative

        . $f.Script
        $realAssertSnapshot = ${function:Assert-HarnessFileSnapshot}
        function Assert-HarnessFileSnapshot {
            param([string] $Path, $Snapshot)
            & $realAssertSnapshot $Path $Snapshot
            if ($Path -ieq $obsoletePath) { [IO.File]::Delete($Path) }
        }

        $result = Invoke-JoewrksHarnessSync -Apply -IncludeDesignFrontend -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace {
            param($replacement)
            if (-not $replacement.DesiredExists -and $replacement.TargetPath -ieq $obsoletePath) { throw 'test failure after concurrent disappearance' }
        }
        Assert-Equal $result.status 'failed' 'concurrent disappearance reports failed'
        Assert-Equal $result.rollback.status 'incomplete' 'unowned concurrent disappearance is unresolved'
        Assert-True (@($result.unresolvedTargets) -contains $obsoletePath) 'concurrent disappearance reports the target unresolved'
        Assert-True (-not (Test-Path -LiteralPath $obsoletePath)) 'rollback does not recreate a file deleted by another actor'
    } finally { Remove-Fixture $f }
}

function Test-ExistingTargetRollback {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'existing-target rollback baseline apply succeeds'
        $agentsPath = Join-Path $f.CodexHome 'AGENTS.md'
        $beforeAgents = [IO.File]::ReadAllBytes($agentsPath)
        $beforeState = [IO.File]::ReadAllBytes($f.State)
        Set-SourceCore $f ((Get-Content -Raw -LiteralPath (Join-Path $f.SourceRoot 'AGENTS.md')) + "`n# rollback probe")
        . $f.Script
        $result = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace { param($replacement) throw 'test existing-target failure' }
        Assert-Equal $result.status 'failed' 'existing-target callback failure reports failed'
        Assert-Equal $result.rollback.status 'complete' 'existing-target rollback completes'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $beforeAgents 'existing-target rollback restores exact AGENTS bytes'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'existing-target rollback preserves exact state bytes'
        $agentsBackupPath = Join-Path $result.backupPath 'codex\AGENTS.md'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsBackupPath)) $beforeAgents 'existing-target backup is byte-exact'
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

function Test-UncommittedIdenticalCreation {
    $f = New-Fixture
    try {
        . $f.Script
        $externalTarget = Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md'
        $externalBytes = [IO.File]::ReadAllBytes((Join-Path $f.SourceRoot 'skills\joewrks-design-frontend\SKILL.md'))
        $callback = {
            param($replacement)
            Write-Bytes $externalTarget $externalBytes
        }.GetNewClosure()
        $result = Invoke-JoewrksHarnessSync -Apply -IncludeDesignFrontend -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace $callback
        Assert-Equal $result.status 'failed' 'identical concurrent creation reports failed'
        Assert-True (@($result.unresolvedTargets) -contains $externalTarget) 'identical concurrent creation is unresolved'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($externalTarget)) $externalBytes 'uncommitted identical concurrent creation is preserved'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.CodexHome 'AGENTS.md'))) 'earlier committed target still rolls back'
        Assert-True (-not (Test-Path -LiteralPath $f.State)) 'failed identical concurrent creation writes no state'
    } finally { Remove-Fixture $f }
}

function Test-MultiTargetRollback {
    $f = New-Fixture
    try {
        . $f.Script
        $replacements = [Collections.Generic.List[string]]::new()
        $callback = {
            param($replacement)
            $replacements.Add([string] $replacement.TargetPath)
            if ($replacements.Count -eq 2) { throw 'test multi-target failure' }
        }.GetNewClosure()
        $result = Invoke-JoewrksHarnessSync -Apply -IncludeDesignFrontend -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace $callback
        Assert-Equal $result.status 'failed' 'multi-target callback failure reports failed'
        Assert-PilotDisclosure $result.designFrontendPilot 'explicit-request' 'failed opt-in apply'
        Assert-Equal $replacements.Count 2 'failure occurs after two replacements'
        Assert-Equal $result.rollback.status 'complete' 'matching targets roll back completely'
        Assert-Equal @($result.unresolvedTargets).Count 0 'complete rollback has no unresolved targets'
        Assert-Equal (Get-TreeHashes $f.CodexHome).Count 0 'multi-target rollback removes created Codex files'
        Assert-Equal (Get-TreeHashes $f.AgentsHome).Count 0 'multi-target rollback removes created optional files'
        Assert-True (-not (Test-Path -LiteralPath $f.State)) 'state remains unwritten when an earlier target fails'
    } finally { Remove-Fixture $f }
}

function Test-Task2CheckRegressions {
    $f = New-Fixture
    try {
        $out = Join-Path $f.Root 'dual-stdout.txt'; $err = Join-Path $f.Root 'dual-stderr.txt'
        $oldPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $f.Script -Check -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot 1> $out 2> $err
        } finally { $ErrorActionPreference = $oldPreference }
        $run = [pscustomobject]@{ ExitCode = $LASTEXITCODE; StdOut = [IO.File]::ReadAllText($out); StdErr = [IO.File]::ReadAllText($err) }
        Assert-True ($run.ExitCode -ne 0) 'dual mode exits nonzero'
        Assert-Equal (Read-Result $run 'dual mode').status 'blocked' 'dual mode reports one JSON failure'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'dual mode creates no Codex target'
        Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'dual mode creates no agents target'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'dual mode creates no backup'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        $collision = Join-Path $f.AgentsHome 'vendor\source-manifest.json'
        [IO.Directory]::CreateDirectory($collision) | Out-Null
        $before = Get-TreeHashes $f.AgentsHome
        $run = Invoke-Harness $f Check -IncludeDesignFrontend
        $result = Read-Result $run 'optional directory collision'
        Assert-True ($run.ExitCode -ne 0) 'optional directory collision exits nonzero'
        Assert-Equal $result.status 'blocked' 'optional directory collision blocks'
        Assert-PilotDisclosure $result.designFrontendPilot 'explicit-request' 'optional directory collision'
        Assert-True ((@($result.blockers).kind -contains 'optionalCollision')) 'optional directory collision is reported'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $before 'optional directory collision check is read-only'
        Assert-True (Test-Path -LiteralPath $collision -PathType Container) 'optional directory collision remains a directory'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'optional directory collision creates no backup'
    } finally { Remove-Fixture $f }
}

Test-PublicHarnessEntry
Test-ManifestPathSafety
Test-Task2CheckRegressions
Test-EmptyCheckAndApply
Test-AgentEncodingAndCoreUpdate
Test-PreflightBlockers
Test-StateTrust
Test-OptionalBundleStateAndDrift
Test-ConcurrentDisappearanceBeforeDelete
Test-PreservedOptionalAfterCoreUpdate
Test-ObsoleteOptionalReconciliation
Test-ExistingTargetRollback
Test-DeterministicRollback
Test-UncommittedIdenticalCreation
Test-MultiTargetRollback
Write-Host 'PASS sync-harness contract'
