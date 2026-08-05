$ErrorActionPreference = 'Stop'

$RepositoryRoot = Split-Path -Parent $PSScriptRoot
$Implementation = Join-Path $RepositoryRoot 'scripts\sync-harness.ps1'
$ReleaseEntry = Join-Path $RepositoryRoot 'JOENESS-0.1.ps1'
$BeginMarker = '<!-- JOEWRKS-HARNESS:BEGIN -->'
$EndMarker = '<!-- JOEWRKS-HARNESS:END -->'

if (-not (Test-Path -LiteralPath $Implementation -PathType Leaf)) {
    throw "Missing required implementation script: $Implementation"
}

function Assert-True { param([bool] $Condition, [string] $Message) if (-not $Condition) { throw "Assertion failed: $Message" } }
function Assert-Equal { param($Actual, $Expected, [string] $Message) if ($Actual -cne $Expected) { throw "Assertion failed: $Message; expected [$Expected], got [$Actual]" } }
function Test-ReadmeContract {
    $readme = [IO.File]::ReadAllText((Join-Path $RepositoryRoot 'README.md'))
    $koreanRemovedAnchor = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('bm8tc3RhdGUgYHJlbW92ZWRg64qUIOycoO2aqO2VnCBzdGF0ZeuCmCDslYzroKTsp4Qg7LCo64uoIOymneqxsOulvCDssL7sp4Ag66q77ZaI6rOgIOq0gOumrCDtjIzsnbzsnYQg67OA6rK97ZWY7KeAIOyViuyVmOuLpOuKlCDrnLvsnbwg67+QLCDsnbjsi53tlZjsp4Ag66q77ZWcIHZlbmRvciByZXNpZHVl6rmM7KeAIOuqqOuRkCDsl4bri6TripQg7Kad66qF7J2AIOyVhOuLmeuLiOuLpC4='))
    foreach ($command in @(
        'powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Check',
        'powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Apply',
        'powershell.exe -NoProfile -File .\JOENESS-0.1.ps1 -Remove'
    )) {
        Assert-True $readme.Contains($command) "README quick start contains $command"
    }
    foreach ($anchor in @(
        'powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\JOENESS-0.1.ps1 -Check',
        '`harness.ps1` remains a compatibility alias',
        $koreanRemovedAnchor,
        'A no-state `removed` result means no valid state or recognized blocking evidence was found and no managed files were changed; it does not prove that every unrecognized or vendor residue is absent.',
        'Do not add a separate `HARNESS.md`.',
        'Repository `common-core.md` remains retained evaluation evidence and is not installed. The current manifest installs the compact `interaction-safety-core-v1.md` conditional decision, failure-receipt, and retry-boundary rule.',
        'JOENESS may offer a durable roadmap once for a long-lived project with no usable plan.',
        'Accepting may create `TASKS.md` and add only its location and update rule to the project `AGENTS.md`.',
        'Declining creates no files and normal work continues with a compact chat plan.',
        'An existing tracker remains the single source of truth.',
        'the explicit-only `handoff` skill',
        'An unresolved target or incomplete rollback prevents a final-state claim.',
        'Backups may contain prior state and the user''s `AGENTS.md`; treat them as private.',
        'Before sharing, run and record an exact-HEAD archive review and deliver the archive SHA-256 out of band.'
    )) {
        Assert-True $readme.Contains($anchor) "README contains safety anchor: $anchor"
    }
    Assert-True (($readme -split '## English').Count -eq 2) 'README keeps Korean and English sections'
}
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

function Get-ActiveCoreRelativePath {
    param([string] $SourceRoot)
    $manifest = Get-Content -Raw -LiteralPath (Join-Path $SourceRoot 'vendor\source-manifest.json') | ConvertFrom-Json
    ([string] $manifest.activeCommonCore.path).Replace('/', '\')
}

function Get-V1SelectedFiles {
    param($Manifest)
    $paths = @()
    foreach ($skill in @($Manifest.activeSkills.PSObject.Properties.Value)) {
        $paths += @($skill.files | ForEach-Object { ([string] $_.localPath).Replace('/', '\') })
        foreach ($sourceName in @($skill.sourceDependencies)) {
            $source = $Manifest.sources.PSObject.Properties[[string] $sourceName].Value
            $paths += @($source.files | ForEach-Object { ([string] $_.localPath).Replace('/', '\') })
        }
    }
    @($paths | Sort-Object -Unique)
}

function Copy-RelativeFile {
    param([string] $FromRoot, [string] $ToRoot, [string] $RelativePath)
    $destination = Join-Path $ToRoot $RelativePath
    [IO.Directory]::CreateDirectory((Split-Path -Parent $destination)) | Out-Null
    [IO.File]::Copy((Join-Path $FromRoot $RelativePath), $destination, $true)
}

function Get-PathIdentity {
    param([string] $Path)
    $normalized = [IO.Path]::GetFullPath($Path).TrimEnd('\', '/').Replace('/', '\').ToUpperInvariant()
    $sha = [Security.Cryptography.SHA256]::Create()
    try { ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($normalized)))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function New-Fixture {
    $root = Join-Path ([IO.Path]::GetTempPath()) ("joewrks-sync-" + [guid]::NewGuid().ToString('N'))
    $source = Join-Path $root 'source'
    [IO.Directory]::CreateDirectory($source) | Out-Null
    $activeCore = Get-ActiveCoreRelativePath $RepositoryRoot
    foreach ($path in @($activeCore, 'evals\candidates\common-core-v1.md', 'scripts\sync-harness.ps1', 'vendor\source-manifest.json') + (Get-OptionalFiles $RepositoryRoot)) { Copy-RelativeFile $RepositoryRoot $source $path }
    [pscustomobject]@{
        Root = $root; SourceRoot = $source; Script = Join-Path $source 'scripts\sync-harness.ps1'
        CodexHome = Join-Path $root 'codex'; AgentsHome = Join-Path $root 'agents'; BackupRoot = Join-Path $root 'backups'
        State = Join-Path $root 'codex\joewrks-harness-state.json'
    }
}

function Remove-Fixture { param($Fixture) if (Test-Path -LiteralPath $Fixture.Root) { [IO.Directory]::Delete($Fixture.Root, $true) } }

function Invoke-Harness {
    param($Fixture, [ValidateSet('Check', 'Apply', 'Remove')] [string] $Mode, [switch] $IncludeDesignFrontend, [switch] $PublicEntry, [switch] $ReleasePublicEntry, [switch] $UseEnvironmentCodexHome, [string[]] $ExtraArguments = @())
    $arguments = @("-$Mode")
    if (-not $UseEnvironmentCodexHome) { $arguments += @('-CodexHome', $Fixture.CodexHome) }
    $arguments += @('-AgentsHome', $Fixture.AgentsHome, '-BackupRoot', $Fixture.BackupRoot)
    if ($IncludeDesignFrontend) { $arguments += '-IncludeDesignFrontend' }
    Invoke-HarnessRaw $Fixture $arguments -PublicEntry:$PublicEntry -ReleasePublicEntry:$ReleasePublicEntry -UseEnvironmentCodexHome:$UseEnvironmentCodexHome -ExtraArguments $ExtraArguments
}

function Invoke-HarnessRaw {
    param($Fixture, [string[]] $Arguments, [switch] $PublicEntry, [switch] $ReleasePublicEntry, [switch] $UseEnvironmentCodexHome, [string[]] $ExtraArguments = @())
    $out = Join-Path $Fixture.Root 'stdout.txt'; $err = Join-Path $Fixture.Root 'stderr.txt'
    $scriptPath = if ($ReleasePublicEntry) { $ReleaseEntry } elseif ($PublicEntry) { Join-Path $RepositoryRoot 'harness.ps1' } else { $Fixture.Script }
    $commandArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath) + $Arguments
    $oldPreference = $ErrorActionPreference
    $oldCodexHome = $env:CODEX_HOME
    try {
        if ($UseEnvironmentCodexHome) { $env:CODEX_HOME = $Fixture.CodexHome }
        $ErrorActionPreference = 'Continue'
        & powershell.exe @commandArgs @ExtraArguments 1> $out 2> $err
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldPreference
        $env:CODEX_HOME = $oldCodexHome
    }
    $run = [pscustomobject]@{ ExitCode = $exitCode; StdOut = [IO.File]::ReadAllText($out); StdErr = [IO.File]::ReadAllText($err) }
    Remove-Item -LiteralPath $out, $err -Force
    $run
}

function Write-V1FixtureState {
    param($Fixture, [switch] $WithBundle)
    $manifestPath = Join-Path $Fixture.SourceRoot 'vendor\source-manifest.json'
    $legacyManifest = [IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
    $legacyManifest.PSObject.Properties.Remove('activeCommonCore')
    $legacyManifest.evaluation.current.commonCore.path = 'AGENTS.md'
    $legacyManifest.activeSkills.PSObject.Properties.Remove('handoff')
    $legacyManifest.activeSkills.PSObject.Properties.Remove('joewrks-project-setup')
    $legacyManifest.activeSkills.'joewrks-design-frontend'.PSObject.Properties.Remove('activationPolicy')
    $legacyManifestText = $legacyManifest | ConvertTo-Json -Depth 100
    $corePath = Join-Path $Fixture.SourceRoot 'evals\candidates\common-core-v1.md'
    $core = [IO.File]::ReadAllText($corePath).TrimEnd("`r", "`n")
    $block = "$BeginMarker`n$core`n$EndMarker"
    $agentsPath = Join-Path $Fixture.CodexHome 'AGENTS.md'
    Write-Utf8 $agentsPath $block

    $sourceIdentities = [ordered] @{
        commonCore = [ordered] @{ path = 'AGENTS.md'; sha256 = Get-Hash $corePath }
    }
    $wholeFileTargets = [ordered] @{}
    if ($WithBundle) {
        Assert-Equal (($legacyManifest.activeSkills.PSObject.Properties.Name | Sort-Object) -join ',') 'joewrks-design-frontend' 'V1 fixture has only the historical design skill'
        Assert-True (-not ($legacyManifest.activeSkills.'joewrks-design-frontend'.PSObject.Properties.Name -contains 'activationPolicy')) 'V1 fixture predates activationPolicy'
        foreach ($relative in Get-V1SelectedFiles $legacyManifest) {
            Copy-RelativeFile $Fixture.SourceRoot $Fixture.AgentsHome $relative
            $canonical = $relative.Replace('\', '/')
            $wholeFileTargets[$canonical] = Get-Hash (Join-Path $Fixture.AgentsHome $relative)
        }
        $installedManifest = Join-Path $Fixture.AgentsHome 'vendor\source-manifest.json'
        Write-Utf8 $installedManifest ($legacyManifestText + "`n")
        $wholeFileTargets['vendor/source-manifest.json'] = Get-Hash $installedManifest
        $sourceIdentities.designFrontend = [ordered] @{
            path = 'vendor/source-manifest.json'
            sha256 = $wholeFileTargets['vendor/source-manifest.json']
        }
    }

    $state = [ordered] @{
        schemaVersion = 1
        sourceIdentities = $sourceIdentities
        managedBlocks = [ordered] @{ 'AGENTS.md' = Get-Hash $agentsPath }
        wholeFileTargets = $wholeFileTargets
    }
    Write-Utf8 $Fixture.State (($state | ConvertTo-Json -Depth 16) + "`n")
}

function Test-PublicHarnessEntry {
    $f = New-Fixture
    try {
        $releaseCheck = Invoke-Harness $f Check -ReleasePublicEntry
        Assert-Equal $releaseCheck.ExitCode 0 'JOENESS-0.1 entry check succeeds'
        Assert-Equal (Read-Result $releaseCheck 'JOENESS-0.1 entry check').status 'ready' 'JOENESS-0.1 entry forwards check'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'JOENESS-0.1 check remains read-only'

        $emptyRemove = Invoke-Harness $f Remove -PublicEntry
        Assert-Equal $emptyRemove.ExitCode 0 'public entry empty remove succeeds'
        Assert-Equal (Read-Result $emptyRemove 'public entry empty remove').status 'removed' 'public entry forwards empty remove'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'public entry empty remove creates no backup'

        $check = Invoke-Harness $f Check -PublicEntry
        Assert-Equal $check.ExitCode 0 'public entry check succeeds'
        Assert-Equal (Read-Result $check 'public entry check').status 'ready' 'public entry forwards check'
        Assert-Equal $check.StdOut $releaseCheck.StdOut 'legacy and JOENESS-0.1 entries return the same check result'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'public entry check remains read-only'

        $apply = Invoke-Harness $f Apply -PublicEntry
        Assert-Equal $apply.ExitCode 0 'public entry apply succeeds'
        Assert-Equal (Read-Result $apply 'public entry apply').status 'current' 'public entry forwards apply'
        Assert-True (Test-Path -LiteralPath (Join-Path $f.CodexHome 'AGENTS.md') -PathType Leaf) 'public entry apply installs Common Core'
        Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) (Get-OptionalFiles $f.SourceRoot) 'public entry installs the personal pilot bundle'

        $pilot = Invoke-Harness $f Check -IncludeDesignFrontend -PublicEntry
        Assert-Equal $pilot.ExitCode 0 'public entry accepts the compatibility flag'
        $pilotResult = Read-Result $pilot 'public entry pilot check'
        Assert-PilotDisclosure $pilotResult.designFrontendPilot 'default-personal-pilot' 'public entry pilot check'
        Assert-Equal @($pilotResult.warnings).Count 1 'public entry exposes one compatibility warning'

        $invalid = Invoke-Harness $f Check -PublicEntry -ExtraArguments @('-Apply')
        Assert-Equal $invalid.ExitCode 2 'public entry preserves blocked exit status'
        Assert-Equal (Read-Result $invalid 'public entry invalid invocation').status 'blocked' 'public entry preserves blocked result'

        $remove = Invoke-Harness $f Remove -PublicEntry
        Assert-Equal $remove.ExitCode 0 'public entry owned remove succeeds'
        Assert-Equal (Read-Result $remove 'public entry owned remove').status 'removed' 'public entry forwards owned remove'
        Assert-True (-not (Test-Path -LiteralPath $f.State)) 'public entry owned remove deletes state'
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

function Get-TreeEntries {
    param([string] $Root)
    if (-not (Test-Path -LiteralPath $Root)) { return @() }
    $entries = @('D:.')
    $entries += @(Get-ChildItem -LiteralPath $Root -Directory -Recurse | ForEach-Object { 'D:' + $_.FullName.Substring($Root.Length).TrimStart('\') })
    $entries += @(Get-ChildItem -LiteralPath $Root -File -Recurse | ForEach-Object { 'F:' + $_.FullName.Substring($Root.Length).TrimStart('\') + '=' + (Get-Hash $_.FullName) })
    @($entries | Sort-Object)
}

function Assert-TreeEqual {
    param([hashtable] $Actual, [hashtable] $Expected, [string] $Message)
    Assert-Equal (($Actual.GetEnumerator() | Sort-Object Name | ConvertTo-Json -Compress)) (($Expected.GetEnumerator() | Sort-Object Name | ConvertTo-Json -Compress)) $Message
}

function Set-SourceCore {
    param($Fixture, [string] $Text)
    $core = Join-Path $Fixture.SourceRoot (Get-ActiveCoreRelativePath $Fixture.SourceRoot); Write-Utf8 $core $Text
    $manifestPath = Join-Path $Fixture.SourceRoot 'vendor\source-manifest.json'
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    $manifest.activeCommonCore.sha256 = Get-Hash $core
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

function Assert-OneJsonResult {
    param($Run, [string] $Message)
    $lines = @($Run.StdOut -split "\r?\n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    Assert-Equal $lines.Count 1 "$Message emits exactly one JSON result"
    Read-Result $Run $Message
}

function Test-ModeAndExitContract {
    $f = New-Fixture
    try {
        foreach ($case in @(
            @{ Name = 'no mode'; Arguments = @('-CodexHome', $f.CodexHome, '-AgentsHome', $f.AgentsHome, '-BackupRoot', $f.BackupRoot) },
            @{ Name = 'Check plus Apply'; Arguments = @('-Check', '-Apply', '-CodexHome', $f.CodexHome, '-AgentsHome', $f.AgentsHome, '-BackupRoot', $f.BackupRoot) },
            @{ Name = 'Check plus Remove'; Arguments = @('-Check', '-Remove', '-CodexHome', $f.CodexHome, '-AgentsHome', $f.AgentsHome, '-BackupRoot', $f.BackupRoot) },
            @{ Name = 'Apply plus Remove'; Arguments = @('-Apply', '-Remove', '-CodexHome', $f.CodexHome, '-AgentsHome', $f.AgentsHome, '-BackupRoot', $f.BackupRoot) }
        )) {
            $run = Invoke-HarnessRaw $f $case.Arguments
            Assert-Equal $run.ExitCode 2 "$($case.Name) exits blocked"
            Assert-Equal (Assert-OneJsonResult $run $case.Name).status 'blocked' "$($case.Name) reports blocked"
            Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) "$($case.Name) creates no Codex target"
            Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) "$($case.Name) creates no Agents target"
            Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) "$($case.Name) creates no backup"
        }

        . $f.Script
        $command = Get-Command Invoke-JoewrksHarnessSync
        $parameters = $command.Parameters
        foreach ($mode in @('Check', 'Apply', 'Remove')) {
            Assert-True $parameters.ContainsKey($mode) "inner function exposes $mode"
        }
        Assert-Equal (($command.ParameterSets.Name | Sort-Object) -join ',') 'Apply,Check,Remove' 'inner function exposes exactly three modes'
        Assert-Equal (Get-HarnessExitCode 'current') 0 'current maps to exit 0'
        Assert-Equal (Get-HarnessExitCode 'ready') 0 'ready maps to exit 0'
        Assert-Equal (Get-HarnessExitCode 'removed') 0 'removed maps to exit 0'
        Assert-Equal (Get-HarnessExitCode 'failed') 1 'failed maps to exit 1'
        Assert-Equal (Get-HarnessExitCode 'blocked') 2 'blocked maps to exit 2'
        Assert-Equal (Get-HarnessExitCode 'unknown') 3 'unknown maps to exit 3'
        Assert-Equal (Get-HarnessExitCode 'unexpected') 3 'unexpected status maps to exit 3'
    } finally { Remove-Fixture $f }
}

function Test-RemoveContract {
    $f = New-Fixture
    try {
        $empty = Invoke-Harness $f Remove
        Assert-Equal $empty.ExitCode 0 'empty remove succeeds'
        $emptyResult = Read-Result $empty 'empty remove'
        Assert-Equal $emptyResult.status 'removed' 'empty remove is a no-op'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'empty remove creates no Codex target'
        Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'empty remove creates no Agents target'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'empty remove creates no backup'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        $agentsPath = Join-Path $f.CodexHome 'AGENTS.md'
        $externalBytes = [Text.Encoding]::UTF8.GetPreamble() + (New-Object Text.UTF8Encoding($false)).GetBytes("external prefix`r`nexternal suffix`r`n")
        Write-Bytes $agentsPath $externalBytes
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'owned remove baseline apply succeeds'
        $installedAgentsBytes = [IO.File]::ReadAllBytes($agentsPath)
        $stateBytes = [IO.File]::ReadAllBytes($f.State)
        $ownedFiles = Get-OptionalFiles $f.SourceRoot
        $ownedBytes = @{}
        foreach ($relative in $ownedFiles) { $ownedBytes[$relative] = [IO.File]::ReadAllBytes((Join-Path $f.AgentsHome $relative)) }
        $externalPath = Join-Path $f.AgentsHome 'external.txt'
        Write-Utf8 $externalPath 'external'

        . $f.Script
        $orderedTargets = [Collections.Generic.List[string]]::new()
        $callback = { param($operation) $orderedTargets.Add([string] $operation.TargetPath) }.GetNewClosure()
        $removed = Invoke-JoewrksHarnessSync -Remove -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace $callback
        Assert-Equal $removed.status 'removed' 'owned remove reports removed'
        Assert-True (-not (Test-Path -LiteralPath $f.State)) 'owned remove removes state'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $externalBytes 'owned remove preserves external AGENTS bytes'
        Assert-Equal ([IO.File]::ReadAllText($externalPath)) 'external' 'owned remove preserves unrelated AgentsHome file'
        foreach ($relative in $ownedFiles) {
            Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.AgentsHome $relative))) "owned remove deletes state-owned file: $relative"
            Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $removed.backupPath (Join-Path 'agents' $relative)))) $ownedBytes[$relative] "owned remove backs up exact owned bytes: $relative"
        }
        Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $removed.backupPath 'codex\AGENTS.md'))) $installedAgentsBytes 'owned remove backs up exact AGENTS bytes'
        Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $removed.backupPath 'codex\joewrks-harness-state.json'))) $stateBytes 'owned remove backs up exact state bytes'
        Assert-Equal $orderedTargets[$orderedTargets.Count - 1] $f.State 'remove deletes state last'
        Assert-Equal $orderedTargets[$orderedTargets.Count - 2] $agentsPath 'remove removes Common Core after whole files'

        $beforeSecondRemove = Get-TreeEntries $f.Root
        $second = Invoke-Harness $f Remove
        Assert-Equal $second.ExitCode 0 'second remove with a clean managed directory skeleton succeeds'
        Assert-Equal (Read-Result $second 'second remove').status 'removed' 'second remove treats only the exact clean skeleton as absent'
        Assert-StringSetEqual (Get-TreeEntries $f.Root) $beforeSecondRemove 'second remove creates no files or backup'

        $reapply = Invoke-Harness $f Apply
        Assert-Equal $reapply.ExitCode 0 'apply reuses the clean managed directory skeleton'
        Assert-Equal (Read-Result $reapply 'apply after remove').status 'current' 'apply after remove restores the bundle'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'empty AGENTS remove baseline apply succeeds'
        $agentsPath = Join-Path $f.CodexHome 'AGENTS.md'
        $removed = Invoke-Harness $f Remove
        Assert-Equal $removed.ExitCode 0 'empty AGENTS remove succeeds'
        Assert-True (Test-Path -LiteralPath $agentsPath -PathType Leaf) 'remove preserves AGENTS.md when external bytes are empty'
        Assert-Equal ([IO.File]::ReadAllBytes($agentsPath)).Length 0 'preserved AGENTS.md is empty'
    } finally { Remove-Fixture $f }
}

function Test-NoFinalNewlineRoundTrip {
    $f = New-Fixture
    try {
        $agentsPath = Join-Path $f.CodexHome 'AGENTS.md'
        $originalBytes = [byte[]] @(0x61, 0x62, 0x63)
        Write-Bytes $agentsPath $originalBytes

        $apply = Invoke-Harness $f Apply -PublicEntry
        Assert-Equal $apply.ExitCode 0 'public apply accepts AGENTS without a final newline'
        Assert-Equal (Read-Result $apply 'no-final-newline public apply').status 'current' 'public apply reaches current'

        $remove = Invoke-Harness $f Remove -PublicEntry
        Assert-Equal $remove.ExitCode 0 'public remove after no-final-newline apply succeeds'
        Assert-Equal (Read-Result $remove 'no-final-newline public remove').status 'removed' 'public remove reports removed'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($agentsPath)) $originalBytes 'public Apply then Remove restores exact original bytes without adding a newline'
    } finally { Remove-Fixture $f }
}

function Test-RemovePreflightBlockers {
    foreach ($case in @(
        @{ Name = 'orphan marker'; Prepare = { param($f) Write-Utf8 (Join-Path $f.CodexHome 'AGENTS.md') "$BeginMarker`nforeign`n$EndMarker" } },
        @{ Name = 'orphan managed skill namespace'; Prepare = { param($f) Write-Utf8 (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\external.txt') 'external' } }
    )) {
        $f = New-Fixture
        try {
            & $case.Prepare $f
            $before = Get-TreeEntries $f.Root
            $run = Invoke-Harness $f Remove
            Assert-Equal $run.ExitCode 2 "$($case.Name) exits blocked"
            Assert-Equal (Read-Result $run $case.Name).status 'blocked' "$($case.Name) blocks without inferred ownership"
            Assert-StringSetEqual (Get-TreeEntries $f.Root) $before "$($case.Name) causes zero writes"
            Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) "$($case.Name) creates no backup"
        } finally { Remove-Fixture $f }
    }

    foreach ($case in @(
        @{ Name = 'drifted owned target'; Prepare = { param($f) Add-Content -LiteralPath (Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md') -Value 'drift' } },
        @{ Name = 'drifted owned Common Core'; Prepare = { param($f) $path = Join-Path $f.CodexHome 'AGENTS.md'; Write-Utf8 $path ([IO.File]::ReadAllText($path).Replace($EndMarker, "# Drifted managed slot`n$EndMarker")) } },
        @{ Name = 'missing owned target'; Prepare = { param($f) [IO.File]::Delete((Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md')) } },
        @{ Name = 'missing owned AGENTS'; Prepare = { param($f) [IO.File]::Delete((Join-Path $f.CodexHome 'AGENTS.md')) } }
    )) {
        $f = New-Fixture
        try {
            Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 "$($case.Name) baseline apply succeeds"
            & $case.Prepare $f
            $beforeCodex = Get-TreeEntries $f.CodexHome
            $beforeAgents = Get-TreeEntries $f.AgentsHome
            $beforeBackups = Get-TreeEntries $f.BackupRoot
            $run = Invoke-Harness $f Remove
            Assert-Equal $run.ExitCode 2 "$($case.Name) exits blocked"
            Assert-Equal (Read-Result $run $case.Name).status 'blocked' "$($case.Name) blocks removal"
            Assert-StringSetEqual (Get-TreeEntries $f.CodexHome) $beforeCodex "$($case.Name) leaves Codex bytes"
            Assert-StringSetEqual (Get-TreeEntries $f.AgentsHome) $beforeAgents "$($case.Name) leaves Agents bytes"
            Assert-StringSetEqual (Get-TreeEntries $f.BackupRoot) $beforeBackups "$($case.Name) creates no backup"
        } finally { Remove-Fixture $f }
    }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'remove root identity baseline apply succeeds'
        $originalAgentsHome = $f.AgentsHome
        $beforeCodex = Get-TreeEntries $f.CodexHome
        $beforeAgents = Get-TreeEntries $originalAgentsHome
        $f.AgentsHome = Join-Path $f.Root 'other-agents'
        $run = Invoke-Harness $f Remove
        Assert-Equal $run.ExitCode 2 'remove root identity mismatch exits blocked'
        $result = Read-Result $run 'remove root identity mismatch'
        Assert-Equal $result.status 'blocked' 'remove root identity mismatch blocks'
        Assert-True (@($result.blockers).kind -contains 'rootIdentity') 'remove root identity mismatch is reported'
        Assert-StringSetEqual (Get-TreeEntries $f.CodexHome) $beforeCodex 'remove root identity mismatch leaves Codex bytes'
        Assert-StringSetEqual (Get-TreeEntries $originalAgentsHome) $beforeAgents 'remove root identity mismatch leaves owned Agents bytes'
        Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'remove root identity mismatch creates no alternate AgentsHome'
    } finally { Remove-Fixture $f }
}

function Test-CleanSkeletonAdversaries {
    $f = New-Fixture
    $skillsJunction = Join-Path $f.AgentsHome 'skills'
    try {
        $junctionTarget = Join-Path $f.Root 'absent-namespace-parent-reparse-target'
        [IO.Directory]::CreateDirectory($f.AgentsHome) | Out-Null
        [IO.Directory]::CreateDirectory($junctionTarget) | Out-Null
        New-Item -ItemType Junction -Path $skillsJunction -Target $junctionTarget | Out-Null
        $before = Get-TreeEntries $f.Root

        $remove = Invoke-Harness $f Remove
        Assert-Equal $remove.ExitCode 2 'absent namespace below a reparse parent blocks no-state remove'
        Assert-Equal (Read-Result $remove 'absent namespace below a reparse parent remove').status 'blocked' 'reparse parent remove is blocked'
        Assert-StringSetEqual (Get-TreeEntries $f.Root) $before 'reparse parent remove causes zero writes'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'reparse parent remove creates no backup'

        $apply = Invoke-Harness $f Apply
        Assert-Equal $apply.ExitCode 2 'absent namespace below a reparse parent blocks apply'
        Assert-Equal (Read-Result $apply 'absent namespace below a reparse parent apply').status 'blocked' 'reparse parent apply is blocked'
        Assert-StringSetEqual (Get-TreeEntries $f.Root) $before 'reparse parent apply causes zero writes'
    } finally {
        $entry = Get-Item -LiteralPath $skillsJunction -Force -ErrorAction SilentlyContinue
        if ($null -ne $entry -and ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            [IO.Directory]::Delete($skillsJunction)
        }
        Remove-Fixture $f
    }

    $f = New-Fixture
    try {
        [IO.Directory]::CreateDirectory($f.AgentsHome) | Out-Null
        $skillsParent = Join-Path $f.AgentsHome 'skills'
        $before = Get-TreeEntries $f.Root
        . $f.Script
        $results = & {
            function Get-Item {
                [CmdletBinding()]
                param([string[]] $LiteralPath, [switch] $Force)
                if (@($LiteralPath).Count -eq 1 -and $LiteralPath[0] -ieq $skillsParent) {
                    Write-Error 'injected parent inspection error'
                    return
                }
                Microsoft.PowerShell.Management\Get-Item @PSBoundParameters
            }
            [pscustomobject] @{
                Remove = Invoke-JoewrksHarnessSync -Remove -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot
                Apply = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot
            }
        }
        Assert-Equal $results.Remove.status 'blocked' 'parent inspection error blocks no-state remove'
        Assert-Equal (Get-HarnessExitCode $results.Remove.status) 2 'parent inspection error remove maps to exit 2'
        Assert-Equal $results.Apply.status 'blocked' 'parent inspection error blocks apply'
        Assert-StringSetEqual (Get-TreeEntries $f.Root) $before 'parent inspection error causes zero target writes'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'parent inspection error creates no backup'
    } finally { Remove-Fixture $f }

    foreach ($case in @(
        @{
            Name = 'file in expected skeleton directory'
            Prepare = {
                param($f)
                Write-Utf8 (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\agents\external.txt') 'external'
                $null
            }
        },
        @{
            Name = 'unexpected skeleton subdirectory'
            Prepare = {
                param($f)
                [IO.Directory]::CreateDirectory((Join-Path $f.AgentsHome 'skills\joewrks-project-setup\unexpected')) | Out-Null
                $null
            }
        },
        @{
            Name = 'skill root reparse'
            Prepare = {
                param($f)
                $path = Join-Path $f.AgentsHome 'skills\joewrks-project-setup'
                [IO.Directory]::Delete($path, $true)
                $target = Join-Path $f.Root 'root-reparse-target'
                [IO.Directory]::CreateDirectory($target) | Out-Null
                New-Item -ItemType Junction -Path $path -Target $target | Out-Null
                $path
            }
        },
        @{
            Name = 'skeleton descendant reparse'
            Prepare = {
                param($f)
                $path = Join-Path $f.AgentsHome 'skills\joewrks-project-setup\agents'
                [IO.Directory]::Delete($path)
                $target = Join-Path $f.Root 'descendant-reparse-target'
                [IO.Directory]::CreateDirectory($target) | Out-Null
                New-Item -ItemType Junction -Path $path -Target $target | Out-Null
                $path
            }
        }
    )) {
        $f = New-Fixture
        $reparsePath = $null
        try {
            Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 "$($case.Name) baseline apply succeeds"
            Assert-Equal (Invoke-Harness $f Remove).ExitCode 0 "$($case.Name) baseline remove succeeds"
            $reparsePath = & $case.Prepare $f
            $before = Get-TreeEntries $f.Root

            $remove = Invoke-Harness $f Remove
            Assert-Equal $remove.ExitCode 2 "$($case.Name) blocks no-state remove"
            Assert-Equal (Read-Result $remove "$($case.Name) remove").status 'blocked' "$($case.Name) remove is blocked"
            Assert-StringSetEqual (Get-TreeEntries $f.Root) $before "$($case.Name) remove causes zero writes"

            $apply = Invoke-Harness $f Apply
            Assert-Equal $apply.ExitCode 2 "$($case.Name) blocks apply reuse"
            Assert-Equal (Read-Result $apply "$($case.Name) apply").status 'blocked' "$($case.Name) apply is blocked"
            Assert-StringSetEqual (Get-TreeEntries $f.Root) $before "$($case.Name) apply causes zero writes"
        } finally {
            if ($reparsePath) {
                $entry = Get-Item -LiteralPath $reparsePath -Force -ErrorAction SilentlyContinue
                if ($null -ne $entry -and ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                    [IO.Directory]::Delete($reparsePath)
                }
            }
            Remove-Fixture $f
        }
    }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'skeleton inspection-error baseline apply succeeds'
        Assert-Equal (Invoke-Harness $f Remove).ExitCode 0 'skeleton inspection-error baseline remove succeeds'
        $skillRoot = Join-Path $f.AgentsHome 'skills\joewrks-project-setup'
        $before = Get-TreeEntries $f.Root
        . $f.Script
        $results = & {
            function Get-ChildItem {
                [CmdletBinding()]
                param([string[]] $LiteralPath, [switch] $Force, [switch] $Directory, [switch] $File, [switch] $Recurse, [string] $Filter)
                if (@($LiteralPath).Count -eq 1 -and $LiteralPath[0] -ieq $skillRoot) {
                    throw 'injected skeleton inspection error'
                }
                Microsoft.PowerShell.Management\Get-ChildItem @PSBoundParameters
            }
            [pscustomobject] @{
                Remove = Invoke-JoewrksHarnessSync -Remove -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot
                Apply = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot
            }
        }
        Assert-Equal $results.Remove.status 'blocked' 'skeleton inspection uncertainty blocks remove'
        Assert-Equal $results.Apply.status 'blocked' 'skeleton inspection uncertainty blocks apply'
        Assert-StringSetEqual (Get-TreeEntries $f.Root) $before 'skeleton inspection uncertainty causes zero writes'
    } finally { Remove-Fixture $f }
}

function Test-RemoveRollback {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'complete remove rollback baseline apply succeeds'
        $beforeCodex = Get-TreeEntries $f.CodexHome
        $beforeAgents = Get-TreeEntries $f.AgentsHome
        . $f.Script
        $result = Invoke-JoewrksHarnessSync -Remove -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace { param($operation) throw 'mid-remove failure' }
        Assert-Equal $result.status 'failed' 'complete remove rollback reports failed'
        Assert-Equal $result.rollback.status 'complete' 'mid-remove rollback completes'
        Assert-StringSetEqual (Get-TreeEntries $f.CodexHome) $beforeCodex 'complete remove rollback restores exact Codex tree'
        Assert-StringSetEqual (Get-TreeEntries $f.AgentsHome) $beforeAgents 'complete remove rollback restores exact Agents tree'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'unknown remove rollback baseline apply succeeds'
        $beforeState = [IO.File]::ReadAllBytes($f.State)
        $changedBytes = [Text.Encoding]::UTF8.GetBytes('concurrent replacement')
        $capture = @{ Path = $null }
        . $f.Script
        $callback = {
            param($operation)
            $capture.Path = [string] $operation.TargetPath
            [IO.File]::WriteAllBytes($capture.Path, $changedBytes)
            throw 'concurrent remove edit'
        }.GetNewClosure()
        $result = Invoke-JoewrksHarnessSync -Remove -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace $callback
        Assert-Equal $result.status 'unknown' 'incomplete remove rollback reports unknown'
        Assert-Equal $result.rollback.status 'incomplete' 'concurrent remove rollback is incomplete'
        Assert-True (@($result.unresolvedTargets) -contains $capture.Path) 'concurrent remove rollback reports unresolved target'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($capture.Path)) $changedBytes 'concurrent replacement is not overwritten'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'unknown remove preserves exact state bytes'
        Assert-Equal (Get-HarnessExitCode $result.status) 3 'unknown remove maps to exit 3'
    } finally { Remove-Fixture $f }
}

function Test-EmptyCheckAndApply {
    $f = New-Fixture
    try {
        $check = Invoke-Harness $f Check; Assert-Equal $check.ExitCode 0 'empty check succeeds'
        $result = Read-Result $check 'empty check'; Assert-Equal $result.status 'ready' 'empty check is ready'; Assert-True ([bool]$result.changesRequired) 'empty check needs changes'
        Assert-Equal $result.bundleSelection 'personal-pilot' 'default selects personal pilot'
        Assert-Equal @($result.warnings).Count 0 'default check has no warnings'
        Assert-PilotDisclosure $result.designFrontendPilot 'default-personal-pilot' 'default check'
        Assert-True ((@($result.changes) | ConvertTo-Json -Depth 8) -match '(?i)common.?core') 'empty check plans Common Core'
        Assert-True (-not (Test-Path -LiteralPath $f.CodexHome)) 'check creates no target/state'; Assert-True (-not (Test-Path -LiteralPath $f.AgentsHome)) 'check creates no agents directory'; Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'check creates no backup'
        $apply = Invoke-Harness $f Apply; Assert-Equal $apply.ExitCode 0 'first apply succeeds'; $applyResult = Read-Result $apply 'first apply'; Assert-Equal $applyResult.status 'current' 'first apply is current'; Assert-Equal $applyResult.bundleSelection 'personal-pilot' 'apply reports personal pilot'
        $agents = Join-Path $f.CodexHome 'AGENTS.md'; Assert-True (Test-Path -LiteralPath $agents) 'apply creates Common Core target'; Assert-True (Test-Path -LiteralPath $f.State) 'apply creates state'
        Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) (Get-OptionalFiles $f.SourceRoot) 'default installs full manifest unit'
        $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        Assert-Equal (($state.PSObject.Properties.Name | Sort-Object) -join ',') 'agentsHomeIdentitySha256,bundleSelection,managedBlocks,schemaVersion,sourceIdentities,wholeFileTargets' 'state v2 has exact top-level keys'
        Assert-Equal (($state.sourceIdentities.PSObject.Properties.Name | Sort-Object) -join ',') 'bundleManifest,commonCore' 'state v2 has exact source identity keys'
        Assert-Equal $state.schemaVersion 2 'apply writes schema v2'
        Assert-Equal $state.bundleSelection 'personal-pilot' 'state records bundle selection'
        Assert-Equal $state.agentsHomeIdentitySha256 (Get-PathIdentity $f.AgentsHome) 'state binds normalized AgentsHome identity'
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
        Set-SourceCore $f ((Get-Content -Raw -LiteralPath (Join-Path $f.SourceRoot (Get-ActiveCoreRelativePath $f.SourceRoot))) + "`n# update")
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
        @{ Path = ('safe/COM' + [char]0x00b9 + '.txt'); Pattern = '*reserved*' },
        @{ Path = ('safe/COM' + [char]0x00b2 + '.txt'); Pattern = '*reserved*' },
        @{ Path = ('safe/COM' + [char]0x00b3 + '.txt'); Pattern = '*reserved*' },
        @{ Path = ('safe/LPT' + [char]0x00b9 + '.txt'); Pattern = '*reserved*' },
        @{ Path = ('safe/LPT' + [char]0x00b2 + '.txt'); Pattern = '*reserved*' },
        @{ Path = ('safe/LPT' + [char]0x00b3 + '.txt'); Pattern = '*reserved*' },
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

        $danglingTarget = Join-Path $f.Root 'removed-vendor'
        $danglingJunction = Join-Path $f.SourceRoot 'dangling-vendor'
        [IO.Directory]::CreateDirectory($danglingTarget) | Out-Null
        New-Item -ItemType Junction -Path $danglingJunction -Target $danglingTarget | Out-Null
        [IO.Directory]::Delete($danglingTarget)
        try {
            Assert-ThrowsLike {
                Resolve-HarnessSourceFile $f.SourceRoot 'dangling-vendor/file.txt'
            } '*reparse point*' 'dangling source junction blocks'
        } finally {
            [IO.Directory]::Delete($danglingJunction)
        }
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

function Test-ReparsePlanningBoundaries {
    $cases = @(
        @{ Name = 'Codex override junction'; Home = 'CodexHome'; Relative = 'AGENTS.override.md' },
        @{ Name = 'Codex skills junction'; Home = 'CodexHome'; Relative = 'skills' },
        @{ Name = 'backup root junction'; Home = 'BackupRoot'; Relative = $null }
    )
    foreach ($case in $cases) {
        $f = New-Fixture
        $junction = $null
        try {
            $root = [string] $f.PSObject.Properties[$case.Home].Value
            $junction = if ($case.Relative) { Join-Path $root $case.Relative } else { $root }
            $realTarget = Join-Path $f.Root ('real-' + $case.Name)
            [IO.Directory]::CreateDirectory((Split-Path -Parent $junction)) | Out-Null
            [IO.Directory]::CreateDirectory($realTarget) | Out-Null
            New-Item -ItemType Junction -Path $junction -Target $realTarget | Out-Null
            $beforeTarget = Get-TreeHashes $realTarget
            $result = Read-Result (Invoke-Harness $f Check) $case.Name
            Assert-Equal $result.status 'blocked' "$($case.Name) blocks check"
            Assert-True (@($result.blockers | Where-Object { $_.message -like '*reparse point*' }).Count -gt 0) "$($case.Name) is reported"
            Assert-TreeEqual (Get-TreeHashes $realTarget) $beforeTarget "$($case.Name) check writes nothing"
            Assert-True (-not (Test-Path -LiteralPath $f.State)) "$($case.Name) writes no state"
        } finally {
            if ($junction -and (Test-Path -LiteralPath $junction)) { [IO.Directory]::Delete($junction) }
            Remove-Fixture $f
        }
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

function Test-ManifestSkillCollisions {
    $cases = @(
        @{
            Name = 'current design frontmatter collision'
            Action = { param($f) Write-Utf8 (Join-Path $f.AgentsHome 'skills\other\SKILL.md') "---`nname: joewrks-design-frontend`n---" }
        },
        @{
            Name = 'legacy project directory collision'
            Action = { param($f) Write-Utf8 (Join-Path $f.CodexHome 'skills\joewrks-project-setup\SKILL.md') 'unmanaged' }
        },
        @{
            Name = 'exact project directory without managed skill file'
            Action = { param($f) Write-Utf8 (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\unrelated.txt') 'unmanaged' }
        }
    )
    foreach ($case in $cases) {
        $f = New-Fixture
        try {
            & $case.Action $f
            $codex = Get-TreeHashes $f.CodexHome
            $agents = Get-TreeHashes $f.AgentsHome
            $run = Invoke-Harness $f Check -IncludeDesignFrontend
            $result = Read-Result $run $case.Name
            Assert-True ($run.ExitCode -ne 0) "$($case.Name) exits nonzero"
            Assert-Equal $result.status 'blocked' "$($case.Name) reports blocked"
            Assert-True (@($result.blockers).kind -contains 'duplicateSkill') "$($case.Name) reports duplicateSkill"
            Assert-TreeEqual (Get-TreeHashes $f.CodexHome) $codex "$($case.Name) check creates no Codex writes"
            Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $agents "$($case.Name) check creates no agents writes"
            Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) "$($case.Name) creates no backup"
        } finally { Remove-Fixture $f }
    }

    $f = New-Fixture
    try {
        $hiddenDirectory = Join-Path $f.CodexHome 'skills\hidden-legacy'
        $hiddenSkill = Join-Path $hiddenDirectory 'SKILL.md'
        Write-Utf8 $hiddenSkill "---`nname: joewrks-design-frontend`n---"
        (Get-Item -LiteralPath $hiddenDirectory -Force).Attributes = (Get-Item -LiteralPath $hiddenDirectory -Force).Attributes -bor [IO.FileAttributes]::Hidden
        (Get-Item -LiteralPath $hiddenSkill -Force).Attributes = (Get-Item -LiteralPath $hiddenSkill -Force).Attributes -bor [IO.FileAttributes]::Hidden
        $beforeHash = Get-Hash $hiddenSkill
        $beforeDirectoryAttributes = (Get-Item -LiteralPath $hiddenDirectory -Force).Attributes
        $beforeFileAttributes = (Get-Item -LiteralPath $hiddenSkill -Force).Attributes

        $run = Invoke-Harness $f Check -PublicEntry
        $result = Read-Result $run 'hidden legacy skill collision'
        Assert-Equal $run.ExitCode 2 'hidden legacy skill collision exits blocked'
        Assert-Equal $result.status 'blocked' 'hidden legacy skill collision reports blocked'
        Assert-True (@($result.blockers).kind -contains 'duplicateSkill') 'hidden legacy skill collision reports duplicateSkill'
        Assert-Equal (Get-Hash $hiddenSkill) $beforeHash 'hidden legacy skill collision check preserves skill bytes'
        Assert-Equal (Get-Item -LiteralPath $hiddenDirectory -Force).Attributes $beforeDirectoryAttributes 'hidden legacy skill collision check preserves directory attributes'
        Assert-Equal (Get-Item -LiteralPath $hiddenSkill -Force).Attributes $beforeFileAttributes 'hidden legacy skill collision check preserves file attributes'
        Assert-True (-not (Test-Path -LiteralPath $f.State)) 'hidden legacy skill collision check writes no state'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'hidden legacy skill collision check creates no backup'
    } finally { Remove-Fixture $f }
}

function Test-StateTrust {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'schema tamper baseline apply succeeds'
        Assert-BlockedBeforeWrites $f {
            param($fixture)
            $state = Get-Content -Raw -LiteralPath $fixture.State | ConvertFrom-Json
            $state.schemaVersion = 3
            Write-Utf8 $fixture.State ($state | ConvertTo-Json -Depth 16)
        } 'wrong state schema' 'invalidState'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply -PublicEntry).ExitCode 0 'V2 Common Core identity baseline public apply succeeds'
        $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        $installedHash = [string] $state.managedBlocks.'AGENTS.md'
        $tamperedHash = if ($installedHash -ceq ('0' * 64)) { '1' * 64 } else { '0' * 64 }
        $state.sourceIdentities.commonCore.sha256 = $tamperedHash
        Write-Utf8 $f.State (($state | ConvertTo-Json -Depth 16) + "`n")
        $beforeCodex = Get-TreeEntries $f.CodexHome
        $beforeAgents = Get-TreeEntries $f.AgentsHome
        $beforeBackups = Get-TreeEntries $f.BackupRoot

        foreach ($mode in @('Check', 'Apply')) {
            $run = Invoke-Harness $f $mode -PublicEntry
            $result = Read-Result $run "tampered V2 Common Core identity public $mode"
            Assert-Equal $run.ExitCode 2 "tampered V2 Common Core identity public $mode exits blocked"
            Assert-Equal $result.status 'blocked' "tampered V2 Common Core identity public $mode reports blocked"
            Assert-True (@($result.blockers).kind -contains 'invalidState') "tampered V2 Common Core identity public $mode reports invalidState"
            Assert-StringSetEqual (Get-TreeEntries $f.CodexHome) $beforeCodex "tampered V2 Common Core identity public $mode leaves Codex targets and state"
            Assert-StringSetEqual (Get-TreeEntries $f.AgentsHome) $beforeAgents "tampered V2 Common Core identity public $mode leaves Agents targets"
            Assert-StringSetEqual (Get-TreeEntries $f.BackupRoot) $beforeBackups "tampered V2 Common Core identity public $mode creates no backup"
        }
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
            $state.sourceIdentities.bundleManifest.path = 'unrelated.json'
            Write-Utf8 $fixture.State ($state | ConvertTo-Json -Depth 16)
        } 'unrelated bundle source identity' 'invalidState'
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
        $default = Read-Result (Invoke-Harness $f Check) 'default pilot check'
        $explicit = Read-Result (Invoke-Harness $f Check -IncludeDesignFrontend) 'explicit pilot check'
        Assert-Equal $default.status 'ready' 'default pilot check is ready'
        Assert-PilotDisclosure $default.designFrontendPilot 'default-personal-pilot' 'default pilot check'
        Assert-Equal @($default.warnings).Count 0 'default pilot check has no warnings'
        Assert-Equal $explicit.status 'ready' 'explicit pilot check is ready'
        Assert-PilotDisclosure $explicit.designFrontendPilot 'default-personal-pilot' 'explicit pilot check'
        Assert-Equal @($explicit.warnings).Count 1 'compatibility flag emits one warning'
        Assert-Equal ([string]$explicit.warnings) 'DEPRECATED: -IncludeDesignFrontend no longer changes selection; personal-pilot already includes joewrks-design-frontend.' 'compatibility flag emits the exact warning'
        Assert-Equal (($default.changes | ConvertTo-Json -Compress -Depth 8)) (($explicit.changes | ConvertTo-Json -Compress -Depth 8)) 'compatibility flag leaves planned targets unchanged'

        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'default apply succeeds'
        $expectedFiles = Get-OptionalFiles $f.SourceRoot; Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) $expectedFiles 'default installs exactly the manifest-selected files'
        $installedDesign = Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md'
        $installedRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $installedDesign))
        Assert-True (Test-Path (Join-Path $installedRoot 'vendor\ui-ux-pro-max\scripts\search.py')) 'installed UIUX runtime resolves'
        Assert-True (Test-Path (Join-Path $installedRoot 'vendor\apple-design\SKILL.md')) 'installed Apple reference resolves'
        Assert-True (Test-Path (Join-Path $f.AgentsHome 'skills\handoff\SKILL.md')) 'explicit handoff skill installs'
        Assert-True (([IO.File]::ReadAllText((Join-Path $f.AgentsHome 'skills\handoff\agents\openai.yaml'))) -match 'allow_implicit_invocation:\s*false') 'handoff remains explicit-only'
        Assert-True (Test-Path (Join-Path $f.AgentsHome 'skills\handoff\LICENSE')) 'handoff license installs'
        Assert-True (Test-Path (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\scripts\project-setup.ps1')) 'project helper installs'
        Assert-True (([IO.File]::ReadAllText((Join-Path $f.AgentsHome 'skills\joewrks-project-setup\agents\openai.yaml'))) -match 'allow_implicit_invocation:\s*true') 'project setup allows conditional implicit selection'
        $before = Get-TreeHashes $f.AgentsHome
        $beforeState = [IO.File]::ReadAllBytes($f.State)
        $compatApply = Read-Result (Invoke-Harness $f Apply -IncludeDesignFrontend) 'compatibility no-op apply'
        Assert-Equal $compatApply.status 'current' 'compatibility flag apply is current'
        Assert-Equal ([string]$compatApply.warnings) 'DEPRECATED: -IncludeDesignFrontend no longer changes selection; personal-pilot already includes joewrks-design-frontend.' 'compatibility apply emits the exact warning'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $before 'compatibility flag changes no target hashes'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'compatibility flag changes no desired state bytes'
        Add-Content -LiteralPath (Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md') -Value 'external drift'; $drift = Get-TreeHashes $f.AgentsHome
        $check = Invoke-Harness $f Check; $driftResult = Read-Result $check 'optional drift check'; Assert-Equal $driftResult.status 'blocked' 'installed optional drift blocks default check'; Assert-PilotDisclosure $driftResult.designFrontendPilot 'default-personal-pilot' 'optional drift check'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $drift 'optional drift check is read-only'
        $run = Invoke-Harness $f Apply; Assert-True ($run.ExitCode -ne 0) 'installed optional drift blocks apply'; Assert-Equal (Read-Result $run 'optional drift').status 'blocked' 'installed optional drift reports blocked'; Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $drift 'installed optional drift is not overwritten'
        $stateText = [IO.File]::ReadAllText($f.State); $state = $stateText | ConvertFrom-Json
        Assert-True ($stateText -notmatch '(?i)[a-z]:\\') 'state stores no drive letter'
        Assert-True ($stateText -notmatch [regex]::Escape([Environment]::GetFolderPath('UserProfile'))) 'state stores no user profile'
        Assert-True ($stateText -notmatch [regex]::Escape($f.CodexHome)) 'state stores no CodexHome path'
        Assert-True ($stateText -notmatch [regex]::Escape($f.AgentsHome)) 'state stores no AgentsHome path'
        Assert-Equal (($state.PSObject.Properties.Name | Sort-Object) -join ',') 'agentsHomeIdentitySha256,bundleSelection,managedBlocks,schemaVersion,sourceIdentities,wholeFileTargets' 'state keeps exact v2 keys'
    } finally { Remove-Fixture $f }
}

function Test-PreservedOptionalAfterCoreUpdate {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply -IncludeDesignFrontend).ExitCode 0 'preserved optional baseline apply succeeds'
        $designSkill = Join-Path $f.AgentsHome 'skills\joewrks-design-frontend\SKILL.md'
        $beforeDesignSkill = Get-Hash $designSkill
        Set-SourceCore $f ((Get-Content -Raw -LiteralPath (Join-Path $f.SourceRoot (Get-ActiveCoreRelativePath $f.SourceRoot))) + "`n# core-only update")

        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'core-only update after opt-in succeeds'
        Assert-Equal (Get-Hash $designSkill) $beforeDesignSkill 'core update preserves unchanged design skill bytes'
        Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) (Get-OptionalFiles $f.SourceRoot) 'core update keeps the current manifest-selected unit'

        $check = Invoke-Harness $f Check
        Assert-Equal $check.ExitCode 0 'check after preserved optional core update succeeds'
        $result = Read-Result $check 'check after preserved optional core update'
        Assert-Equal $result.status 'current' 'preserved optional state remains valid after a core-only update'
        Assert-PilotDisclosure $result.designFrontendPilot 'default-personal-pilot' 'check after preserved optional core update'
    } finally { Remove-Fixture $f }
}

function Test-V1HistoricalTrust {
    $f = New-Fixture
    try {
        Write-V1FixtureState $f
        $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        $state.sourceIdentities.commonCore.sha256 = '0' * 64
        Write-Utf8 $f.State (($state | ConvertTo-Json -Depth 16) + "`n")
        $before = Get-TreeEntries $f.Root
        $result = Read-Result (Invoke-Harness $f Check) 'V1 zero Common Core identity'
        Assert-Equal $result.status 'blocked' 'V1 zero Common Core identity blocks'
        Assert-True (@($result.blockers).kind -contains 'invalidState') 'V1 zero Common Core identity reports invalidState'
        Assert-StringSetEqual (Get-TreeEntries $f.Root) $before 'V1 zero Common Core identity check is read-only'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Write-V1FixtureState $f -WithBundle
        $unrelated = Join-Path $f.AgentsHome 'unrelated.txt'
        Write-Utf8 $unrelated 'unrelated'
        $installedManifestPath = Join-Path $f.AgentsHome 'vendor\source-manifest.json'
        $installedManifest = Get-Content -Raw -LiteralPath $installedManifestPath | ConvertFrom-Json
        $installedManifest.activeSkills.'joewrks-design-frontend'.files += [pscustomobject] @{
            localPath = 'unrelated.txt'
            bytes = ([IO.File]::ReadAllBytes($unrelated)).Length
            sha256 = Get-Hash $unrelated
            exactUpstreamCopy = $false
        }
        Write-Utf8 $installedManifestPath (($installedManifest | ConvertTo-Json -Depth 100) + "`n")
        $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        $state.wholeFileTargets | Add-Member -NotePropertyName 'unrelated.txt' -NotePropertyValue (Get-Hash $unrelated)
        $state.wholeFileTargets.'vendor/source-manifest.json' = Get-Hash $installedManifestPath
        $state.sourceIdentities.designFrontend.sha256 = Get-Hash $installedManifestPath
        Write-Utf8 $f.State (($state | ConvertTo-Json -Depth 16) + "`n")
        $before = Get-TreeEntries $f.Root
        $result = Read-Result (Invoke-Harness $f Check) 'V1 unrelated selected file'
        Assert-Equal $result.status 'blocked' 'V1 unrelated selected file blocks'
        Assert-True (@($result.blockers).kind -contains 'invalidState') 'V1 unrelated selected file reports invalidState'
        Assert-StringSetEqual (Get-TreeEntries $f.Root) $before 'V1 unrelated selected file check is read-only'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Write-V1FixtureState $f -WithBundle
        $installedManifestPath = Join-Path $f.AgentsHome 'vendor\source-manifest.json'
        $installedManifest = Get-Content -Raw -LiteralPath $installedManifestPath | ConvertFrom-Json
        $installedManifest.evaluation.current.commonCore.sha256 = '0' * 64
        Write-Utf8 $installedManifestPath (($installedManifest | ConvertTo-Json -Depth 100) + "`n")
        $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        $state.wholeFileTargets.'vendor/source-manifest.json' = Get-Hash $installedManifestPath
        $state.sourceIdentities.designFrontend.sha256 = Get-Hash $installedManifestPath
        Write-Utf8 $f.State (($state | ConvertTo-Json -Depth 16) + "`n")
        $result = Read-Result (Invoke-Harness $f Check) 'V1 installed manifest zero Common Core identity'
        Assert-Equal $result.status 'blocked' 'V1 installed manifest zero Common Core identity blocks'
        Assert-True (@($result.blockers).kind -contains 'invalidState') 'V1 installed manifest zero Common Core identity reports invalidState'
    } finally { Remove-Fixture $f }
}

function Test-LegacyV2ActiveCoreMigration {
    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'legacy V2 baseline apply succeeds'

        $historicalCorePath = Join-Path $f.SourceRoot 'evals\candidates\common-core-v1.md'
        $historicalCore = [IO.File]::ReadAllText($historicalCorePath).TrimEnd("`r", "`n")
        $agentsPath = Join-Path $f.CodexHome 'AGENTS.md'
        Write-Utf8 $agentsPath "$BeginMarker`n$historicalCore`n$EndMarker"

        $installedManifestPath = Join-Path $f.AgentsHome 'vendor\source-manifest.json'
        $installedManifest = Get-Content -Raw -LiteralPath $installedManifestPath | ConvertFrom-Json
        $installedManifest.PSObject.Properties.Remove('activeCommonCore')
        $installedManifest.evaluation.current.commonCore.path = 'AGENTS.md'
        Write-Utf8 $installedManifestPath (($installedManifest | ConvertTo-Json -Depth 100) + "`n")

        $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        $state.sourceIdentities.commonCore.path = 'AGENTS.md'
        $state.sourceIdentities.commonCore.sha256 = Get-Hash $historicalCorePath
        $state.managedBlocks.'AGENTS.md' = Get-Hash $agentsPath
        $state.wholeFileTargets.'vendor/source-manifest.json' = Get-Hash $installedManifestPath
        $state.sourceIdentities.bundleManifest.sha256 = Get-Hash $installedManifestPath
        Write-Utf8 $f.State (($state | ConvertTo-Json -Depth 16) + "`n")

        $check = Read-Result (Invoke-Harness $f Check) 'legacy V2 active-core migration check'
        Assert-Equal $check.status 'ready' 'legacy V2 active-core migration is ready'
        $apply = Read-Result (Invoke-Harness $f Apply) 'legacy V2 active-core migration apply'
        Assert-Equal $apply.status 'current' 'legacy V2 active-core migration succeeds'

        $migratedState = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
        $sourceManifest = Get-Content -Raw -LiteralPath (Join-Path $f.SourceRoot 'vendor\source-manifest.json') | ConvertFrom-Json
        Assert-Equal $migratedState.sourceIdentities.commonCore.path $sourceManifest.activeCommonCore.path 'legacy V2 migration records the active core path'
        Assert-Equal $migratedState.sourceIdentities.commonCore.sha256 $sourceManifest.activeCommonCore.sha256 'legacy V2 migration records the active core identity'
        $migratedManifest = Get-Content -Raw -LiteralPath $installedManifestPath | ConvertFrom-Json
        Assert-Equal $migratedManifest.activeCommonCore.path $sourceManifest.activeCommonCore.path 'legacy V2 migration installs the active core path'
        Assert-Equal $migratedManifest.activeCommonCore.sha256 $sourceManifest.activeCommonCore.sha256 'legacy V2 migration installs the active core pointer'
    } finally { Remove-Fixture $f }
}

function Test-V1StateMigration {
    foreach ($case in @(
        @{ Name = 'core-only'; WithBundle = $false },
        @{ Name = 'design-opt-in'; WithBundle = $true }
    )) {
        $f = New-Fixture
        try {
            Write-V1FixtureState $f -WithBundle:$case.WithBundle
            $beforeState = [IO.File]::ReadAllBytes($f.State)
            $beforeCodex = Get-TreeHashes $f.CodexHome
            $beforeAgents = Get-TreeHashes $f.AgentsHome
            $check = Read-Result (Invoke-Harness $f Check) "$($case.Name) V1 migration check"
            Assert-Equal $check.status 'ready' "$($case.Name) V1 migration is ready"
            Assert-Equal $check.bundleSelection 'personal-pilot' "$($case.Name) V1 migration selects the personal pilot"
            Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState "$($case.Name) check leaves exact V1 state bytes"
            Assert-TreeEqual (Get-TreeHashes $f.CodexHome) $beforeCodex "$($case.Name) check leaves the Codex tree"
            Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $beforeAgents "$($case.Name) check leaves the Agents tree"

            $apply = Read-Result (Invoke-Harness $f Apply) "$($case.Name) V1 migration apply"
            Assert-Equal $apply.status 'current' "$($case.Name) V1 migration succeeds"
            $state = Get-Content -Raw -LiteralPath $f.State | ConvertFrom-Json
            Assert-Equal (($state.PSObject.Properties.Name | Sort-Object) -join ',') 'agentsHomeIdentitySha256,bundleSelection,managedBlocks,schemaVersion,sourceIdentities,wholeFileTargets' "$($case.Name) migration writes exact V2 keys"
            Assert-Equal (($state.sourceIdentities.PSObject.Properties.Name | Sort-Object) -join ',') 'bundleManifest,commonCore' "$($case.Name) migration writes exact source identity keys"
            Assert-Equal $state.schemaVersion 2 "$($case.Name) migration writes schema V2"
            Assert-Equal $state.agentsHomeIdentitySha256 (Get-PathIdentity $f.AgentsHome) "$($case.Name) migration binds AgentsHome"
            Assert-True (Test-Path -LiteralPath (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\SKILL.md')) "$($case.Name) migration installs the project skill"
            Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) (Get-OptionalFiles $f.SourceRoot) "$($case.Name) migration installs the full manifest unit"
        } finally { Remove-Fixture $f }
    }

    $f = New-Fixture
    try {
        Write-V1FixtureState $f
        [IO.Directory]::CreateDirectory((Join-Path $f.AgentsHome 'keep-empty')) | Out-Null
        [IO.Directory]::CreateDirectory((Join-Path $f.AgentsHome 'preexisting\child')) | Out-Null
        $beforeTree = @{ codex = Get-TreeHashes $f.CodexHome; agents = Get-TreeHashes $f.AgentsHome }
        $beforeState = [IO.File]::ReadAllBytes($f.State)
        $failedTargets = [Collections.Generic.List[string]]::new()
        . $f.Script
        $result = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace {
            param($replacement)
            if ($replacement.TargetPath.StartsWith((Join-Path $f.AgentsHome 'skills'), [StringComparison]::OrdinalIgnoreCase)) {
                $failedTargets.Add([string] $replacement.TargetPath)
                throw 'failure during V1 target migration'
            }
        }
        Assert-Equal $result.status 'unknown' 'V1 target migration incomplete rollback is unknown'
        Assert-Equal $result.rollback.status 'incomplete' 'V1 target migration preserves created directories for inspection'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'target failure leaves exact V1 state bytes'
        Assert-TreeEqual (Get-TreeHashes $f.CodexHome) $beforeTree.codex 'target failure restores the V1 Codex tree'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $beforeTree.agents 'target failure restores the V1 Agents tree'
        Assert-True (Test-Path -LiteralPath (Join-Path $f.AgentsHome 'keep-empty') -PathType Container) 'target failure preserves pre-existing empty directory'
        Assert-True (Test-Path -LiteralPath (Join-Path $f.AgentsHome 'preexisting\child') -PathType Container) 'target failure preserves pre-existing nested directory'
        Assert-Equal $failedTargets.Count 1 'V1 migration fails on the first managed skill target'
        $failedTargetParent = [IO.Path]::GetDirectoryName($failedTargets[0])
        $createdDirectories = @(
            [IO.Path]::GetDirectoryName($failedTargetParent),
            $failedTargetParent
        )
        foreach ($directory in $createdDirectories) {
            Assert-True (Test-Path -LiteralPath $directory -PathType Container) "target failure preserves created directory: $directory"
            Assert-Equal (@($result.unresolvedTargets | Where-Object { $_ -ieq $directory }).Count) 1 "target failure reports created directory once: $directory"
        }
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    try {
        Write-V1FixtureState $f -WithBundle
        $beforeTree = @{ codex = Get-TreeHashes $f.CodexHome; agents = Get-TreeHashes $f.AgentsHome }
        $beforeState = [IO.File]::ReadAllBytes($f.State)
        $createdDirectories = @(
            (Join-Path $f.AgentsHome 'skills\joewrks-project-setup'),
            (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\agents'),
            (Join-Path $f.AgentsHome 'skills\joewrks-project-setup\scripts')
        )
        . $f.Script
        $failedAfterState = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace {
            param($replacement)
            if ($replacement.TargetPath -ieq $f.State) { throw 'failure after V2 state replacement' }
        }
        Assert-Equal $failedAfterState.status 'unknown' 'state-write incomplete rollback is unknown'
        Assert-Equal $failedAfterState.rollback.status 'incomplete' 'state-write rollback preserves created directories for inspection'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'exact V1 state bytes return'
        Assert-TreeEqual (Get-TreeHashes $f.CodexHome) $beforeTree.codex 'Codex tree returns to V1'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $beforeTree.agents 'Agents tree returns to V1'
        foreach ($directory in $createdDirectories) {
            Assert-True (Test-Path -LiteralPath $directory -PathType Container) "state-write rollback preserves created directory: $directory"
            Assert-Equal (@($failedAfterState.unresolvedTargets | Where-Object { $_ -ieq $directory }).Count) 1 "state-write rollback reports created directory once: $directory"
        }
    } finally { Remove-Fixture $f }
}

function Test-CreatedDirectoryRollbackResidue {
    $f = New-Fixture
    try {
        Write-V1FixtureState $f
        $createdParent = Join-Path $f.AgentsHome 'skills\joewrks-design-frontend'
        $externalPath = Join-Path $createdParent 'external.txt'
        $createdDirectories = @($f.AgentsHome, (Join-Path $f.AgentsHome 'skills'), $createdParent)
        . $f.Script
        $result = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace {
            param($replacement)
            if ($replacement.TargetPath.StartsWith($createdParent, [StringComparison]::OrdinalIgnoreCase)) {
                Write-Utf8 $externalPath 'external'
                throw 'external file prevents created-directory cleanup'
            }
        }
        Assert-Equal $result.status 'unknown' 'created-directory residue makes status unknown'
        Assert-Equal $result.rollback.status 'incomplete' 'surviving created directories make rollback incomplete'
        foreach ($directory in $createdDirectories) {
            Assert-True (Test-Path -LiteralPath $directory -PathType Container) "external residue preserves created directory: $directory"
            Assert-Equal (@($result.unresolvedTargets | Where-Object { $_ -ieq $directory }).Count) 1 "external residue reports created directory once: $directory"
        }
        Assert-True (Test-Path -LiteralPath $externalPath -PathType Leaf) 'created-directory cleanup preserves an external file'
        Assert-StringSetEqual @((Get-TreeHashes $f.AgentsHome).Keys) @('skills\joewrks-design-frontend\external.txt') 'failed rollback leaves no run-created marker or managed file'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    $danglingDirectory = Join-Path $f.AgentsHome 'skills\joewrks-design-frontend'
    try {
        Write-V1FixtureState $f
        $danglingTarget = Join-Path $f.Root 'removed-junction-target'
        $absentDirectory = Join-Path $f.AgentsHome 'skills\joewrks-project-setup\agents'
        $testPathBehavior = @{ TreatDanglingAsUnreachable = $false }
        . $f.Script
        $result = & {
            # Windows PowerShell 5.1 treats a dangling junction itself as reachable; emulate runtimes that do not.
            function Test-Path {
                param(
                    [string[]] $LiteralPath,
                    [Microsoft.PowerShell.Commands.TestPathType] $PathType
                )
                if ($testPathBehavior.TreatDanglingAsUnreachable -and @($LiteralPath).Count -eq 1 -and $LiteralPath[0] -ieq $danglingDirectory) {
                    return $false
                }
                Microsoft.PowerShell.Management\Test-Path @PSBoundParameters
            }
            Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace {
                param($replacement)
                if ($replacement.TargetPath -ieq $f.State) {
                    [IO.Directory]::Delete($danglingDirectory, $true)
                    [IO.Directory]::CreateDirectory($danglingTarget) | Out-Null
                    New-Item -ItemType Junction -Path $danglingDirectory -Target $danglingTarget | Out-Null
                    [IO.Directory]::Delete($danglingTarget)
                    [IO.Directory]::Delete($absentDirectory, $true)
                    $testPathBehavior.TreatDanglingAsUnreachable = $true
                    throw 'created directories become dangling and absent residues'
                }
            }
        }
        $danglingEntry = Get-Item -LiteralPath $danglingDirectory -Force -ErrorAction SilentlyContinue
        Assert-True ($null -ne $danglingEntry) 'dangling created-directory entry survives rollback'
        Assert-True (($danglingEntry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) 'surviving dangling entry remains a junction'
        Assert-True ($null -eq (Get-Item -LiteralPath $danglingTarget -Force -ErrorAction SilentlyContinue)) 'dangling junction target remains absent'
        Assert-Equal (@($result.unresolvedTargets | Where-Object { $_ -ieq $danglingDirectory }).Count) 1 'dangling created directory is reported unresolved once'
        Assert-True ($null -eq (Get-Item -LiteralPath $absentDirectory -Force -ErrorAction SilentlyContinue)) 'absent created-directory entry remains absent'
        Assert-Equal (@($result.unresolvedTargets | Where-Object { $_ -ieq $absentDirectory }).Count) 0 'truly absent created directory is not reported unresolved'
    } finally {
        $danglingEntry = Get-Item -LiteralPath $danglingDirectory -Force -ErrorAction SilentlyContinue
        if ($null -ne $danglingEntry -and ($danglingEntry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            [IO.Directory]::Delete($danglingDirectory)
        }
        Remove-Fixture $f
    }
}

function Test-HomeResolutionAndIdentity {
    $f = New-Fixture
    try {
        $result = Read-Result (Invoke-Harness $f Apply -UseEnvironmentCodexHome) 'CODEX_HOME apply'
        Assert-Equal $result.status 'current' 'environment CODEX_HOME apply succeeds'
        Assert-True (Test-Path -LiteralPath (Join-Path $f.CodexHome 'AGENTS.md')) 'environment CODEX_HOME receives Common Core'
        Assert-True (Test-Path -LiteralPath $f.State) 'environment CODEX_HOME receives state'
    } finally { Remove-Fixture $f }

    $f = New-Fixture
    $oldCodexHome = $env:CODEX_HOME
    try {
        $env:CODEX_HOME = Join-Path $f.Root 'wrong-environment-codex'
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'explicit CodexHome apply succeeds'
        Assert-True (Test-Path -LiteralPath $f.State) 'explicit CodexHome receives state'
        Assert-True (-not (Test-Path -LiteralPath $env:CODEX_HOME)) 'explicit CodexHome overrides environment CODEX_HOME'
    } finally {
        $env:CODEX_HOME = $oldCodexHome
        Remove-Fixture $f
    }

    $f = New-Fixture
    try {
        Assert-Equal (Invoke-Harness $f Apply).ExitCode 0 'AgentsHome identity baseline apply succeeds'
        $beforeCodex = Get-TreeHashes $f.CodexHome
        $beforeAgents = Get-TreeHashes $f.AgentsHome
        $beforeState = [IO.File]::ReadAllBytes($f.State)
        $otherAgentsHome = Join-Path $f.Root 'other-agents'
        $f.AgentsHome = $otherAgentsHome
        $result = Read-Result (Invoke-Harness $f Check) 'different AgentsHome check'
        Assert-Equal $result.status 'blocked' 'different AgentsHome blocks'
        Assert-True (@($result.blockers).kind -contains 'rootIdentity') 'different AgentsHome reports rootIdentity'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($f.State)) $beforeState 'identity blocker leaves state bytes'
        Assert-TreeEqual (Get-TreeHashes $f.CodexHome) $beforeCodex 'identity blocker leaves Codex tree'
        Assert-TreeEqual (Get-TreeHashes (Join-Path $f.Root 'agents')) $beforeAgents 'identity blocker leaves original Agents tree'
        Assert-True (-not (Test-Path -LiteralPath $otherAgentsHome)) 'identity blocker creates no alternate AgentsHome'
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
        Assert-Equal $result.status 'unknown' 'concurrent disappearance reports unknown'
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
        Set-SourceCore $f ((Get-Content -Raw -LiteralPath (Join-Path $f.SourceRoot (Get-ActiveCoreRelativePath $f.SourceRoot))) + "`n# rollback probe")
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
        Assert-Equal $result.status 'unknown' 'callback failure with created-directory residue reports unknown'; Assert-True (-not (Test-Path -LiteralPath $f.State)) 'rollback removes unwritten state'; Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.CodexHome 'AGENTS.md'))) 'rollback restores absent target'
        Assert-True ((Invoke-Harness $f Check -ExtraArguments @('-AfterReplace', 'nope')).ExitCode -ne 0) 'CLI exposes no callback switch'
    } finally { Remove-Fixture $f }
    $f = New-Fixture
    try {
        . $f.Script
        $changedBytes = [Text.Encoding]::UTF8.GetBytes('changed again'); $changedPathFile = Join-Path $f.Root 'changed-target.txt'
        $result = Invoke-JoewrksHarnessSync -Apply -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace { param($replacement) Write-Bytes $replacement.TargetPath $changedBytes; [IO.File]::WriteAllText($changedPathFile, $replacement.TargetPath); throw 'test concurrent edit' }
        Assert-Equal $result.status 'unknown' 'concurrent callback failure reports unknown'; Assert-True (@($result.unresolvedTargets).Count -gt 0) 'changed-again target is unresolved, not overwritten'; Assert-BytesEqual ([IO.File]::ReadAllBytes([IO.File]::ReadAllText($changedPathFile))) $changedBytes 'rollback preserves externally changed bytes'
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
            [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($externalTarget)) | Out-Null
            [IO.File]::WriteAllBytes($externalTarget, $externalBytes)
        }.GetNewClosure()
        $result = Invoke-JoewrksHarnessSync -Apply -IncludeDesignFrontend -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace $callback
        Assert-Equal $result.status 'unknown' 'identical concurrent creation reports unknown'
        Assert-True (@($result.unresolvedTargets) -contains $externalTarget) 'identical concurrent creation is unresolved'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($externalTarget)) $externalBytes 'uncommitted identical concurrent creation is preserved'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $f.CodexHome 'AGENTS.md'))) 'earlier committed target still rolls back'
        Assert-True (-not (Test-Path -LiteralPath $f.State)) 'failed identical concurrent creation writes no state'
    } finally { Remove-Fixture $f }
}

function Test-MultiTargetRollback {
    $f = New-Fixture
    try {
        $externalPath = Join-Path $f.AgentsHome 'external.txt'
        Write-Utf8 $externalPath 'external'
        $beforeAgents = Get-TreeHashes $f.AgentsHome
        . $f.Script
        $replacements = [Collections.Generic.List[string]]::new()
        $callback = {
            param($replacement)
            $replacements.Add([string] $replacement.TargetPath)
            if ($replacements.Count -eq 2) { throw 'test multi-target failure' }
        }.GetNewClosure()
        $result = Invoke-JoewrksHarnessSync -Apply -IncludeDesignFrontend -CodexHome $f.CodexHome -AgentsHome $f.AgentsHome -BackupRoot $f.BackupRoot -AfterReplace $callback
        Assert-Equal $result.status 'unknown' 'multi-target callback failure reports unknown'
        Assert-PilotDisclosure $result.designFrontendPilot 'default-personal-pilot' 'failed personal-pilot apply'
        Assert-Equal $replacements.Count 2 'failure occurs after two replacements'
        Assert-Equal $result.rollback.status 'incomplete' 'multi-target rollback preserves created directories for inspection'
        $failedTargetParent = [IO.Path]::GetDirectoryName($replacements[1])
        $createdDirectories = @(
            $f.CodexHome,
            [IO.Path]::GetDirectoryName($failedTargetParent),
            $failedTargetParent
        )
        foreach ($directory in $createdDirectories) {
            Assert-True (Test-Path -LiteralPath $directory -PathType Container) "multi-target rollback preserves created directory: $directory"
            Assert-Equal (@($result.unresolvedTargets | Where-Object { $_ -ieq $directory }).Count) 1 "multi-target rollback reports created directory once: $directory"
        }
        Assert-Equal (Get-TreeHashes $f.CodexHome).Count 0 'multi-target rollback removes created Codex files'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $beforeAgents 'multi-target rollback removes created optional files and preserves external content'
        Assert-Equal ([IO.File]::ReadAllText($externalPath)) 'external' 'multi-target rollback preserves external file bytes'
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
        Assert-PilotDisclosure $result.designFrontendPilot 'default-personal-pilot' 'optional directory collision'
        Assert-True ((@($result.blockers).kind -contains 'optionalCollision')) 'optional directory collision is reported'
        Assert-TreeEqual (Get-TreeHashes $f.AgentsHome) $before 'optional directory collision check is read-only'
        Assert-True (Test-Path -LiteralPath $collision -PathType Container) 'optional directory collision remains a directory'
        Assert-True (-not (Test-Path -LiteralPath $f.BackupRoot)) 'optional directory collision creates no backup'
    } finally { Remove-Fixture $f }
}

Test-PublicHarnessEntry
Test-ReadmeContract
Test-ModeAndExitContract
Test-RemoveContract
Test-NoFinalNewlineRoundTrip
Test-RemovePreflightBlockers
Test-CleanSkeletonAdversaries
Test-RemoveRollback
Test-ManifestPathSafety
Test-ReparsePlanningBoundaries
Test-Task2CheckRegressions
Test-EmptyCheckAndApply
Test-AgentEncodingAndCoreUpdate
Test-PreflightBlockers
Test-ManifestSkillCollisions
Test-StateTrust
Test-V1HistoricalTrust
Test-LegacyV2ActiveCoreMigration
Test-V1StateMigration
Test-CreatedDirectoryRollbackResidue
Test-HomeResolutionAndIdentity
Test-OptionalBundleStateAndDrift
Test-ConcurrentDisappearanceBeforeDelete
Test-PreservedOptionalAfterCoreUpdate
Test-ObsoleteOptionalReconciliation
Test-ExistingTargetRollback
Test-DeterministicRollback
Test-UncommittedIdenticalCreation
Test-MultiTargetRollback
Write-Host 'PASS sync-harness contract'
