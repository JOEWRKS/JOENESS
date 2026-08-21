$ErrorActionPreference = 'Stop'

$RepositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Implementation = Join-Path $RepositoryRoot 'skills\project\scripts\project-setup.ps1'
if (-not (Test-Path -LiteralPath $Implementation -PathType Leaf)) {
    throw 'Missing required project setup helper'
}

$Utf8NoBom = New-Object Text.UTF8Encoding($false)
$Utf8Bom = New-Object Text.UTF8Encoding($true)
$BeginMarker = '<!-- JOEWRKS-PROJECT:BEGIN -->'
$EndMarker = '<!-- JOEWRKS-PROJECT:END -->'

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

function Assert-Equal {
    param($Actual, $Expected, [string] $Message)
    if ($Actual -cne $Expected) {
        throw "Assertion failed: $Message; expected [$Expected], got [$Actual]"
    }
}

function Assert-BytesEqual {
    param([byte[]] $Actual, [byte[]] $Expected, [string] $Message)
    Assert-Equal ([Convert]::ToBase64String($Actual)) ([Convert]::ToBase64String($Expected)) $Message
}

function Assert-ResultShape {
    param($Result, [string] $Message)
    $actual = @($Result.PSObject.Properties.Name | Sort-Object)
    $expected = @('blockers', 'changesRequired', 'projectRoot', 'rollback', 'status', 'target', 'targetHash', 'unresolvedTargets')
    Assert-Equal ($actual -join ',') ($expected -join ',') $Message
}

function New-ProjectFixture {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('joewrks-project-' + [Guid]::NewGuid().ToString('N'))
    $project = Join-Path $root 'project'
    [IO.Directory]::CreateDirectory($project) | Out-Null
    & git -C $project init --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Could not initialize project fixture' }
    [pscustomobject] @{ Root = $root; Project = $project; Helper = $Implementation }
}

function Remove-ProjectFixture {
    param($Fixture)
    if (Test-Path -LiteralPath $Fixture.Root) { [IO.Directory]::Delete($Fixture.Root, $true) }
}

function Get-TreeHashes {
    param([string] $Root)
    $result = [ordered] @{}
    foreach ($file in @(Get-ChildItem -LiteralPath $Root -File -Recurse | Sort-Object FullName)) {
        $relative = $file.FullName.Substring($Root.Length).TrimStart('\', '/').Replace('\', '/')
        if ($relative -eq '.git' -or $relative.StartsWith('.git/')) { continue }
        $result[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $result
}

function Assert-TreeEqual {
    param($Actual, $Expected, [string] $Message)
    if (($Actual | ConvertTo-Json -Compress) -cne ($Expected | ConvertTo-Json -Compress)) {
        throw "Assertion failed: $Message"
    }
}

function ConvertTo-BodyBase64 {
    param([string] $Body)
    [Convert]::ToBase64String($Utf8NoBom.GetBytes($Body))
}

function Invoke-ProjectHelper {
    param(
        $Fixture,
        [ValidateSet('Check', 'Apply')] [string] $Mode,
        [string] $ExpectedRoot,
        [string] $ExpectedTargetHash,
        [string] $ManagedBodyBase64
    )
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $Fixture.Helper, "-$Mode", '-ProjectPath', $Fixture.Project)
    if ($Mode -eq 'Apply') {
        $arguments += @(
            '-ExpectedRoot', $ExpectedRoot,
            '-ExpectedTargetHash', $ExpectedTargetHash,
            '-ManagedBodyBase64', $ManagedBodyBase64
        )
    }
    $output = @(& powershell.exe @arguments 2>&1)
    $exitCode = $LASTEXITCODE
    [pscustomobject] @{
        ExitCode = $exitCode
        Raw = $output -join "`n"
        Result = (($output -join "`n") | ConvertFrom-Json)
    }
}

function Invoke-RawProjectHelper {
    param([string[]] $Arguments)
    $output = @(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Implementation @Arguments 2>&1)
    [pscustomobject] @{
        ExitCode = $LASTEXITCODE
        Result = (($output -join "`n") | ConvertFrom-Json)
    }
}

function Assert-BlockedWithoutChange {
    param($Fixture, [scriptblock] $Action, [string] $Message)
    $before = Get-TreeHashes $Fixture.Project
    $result = & $Action
    Assert-Equal $result.ExitCode 2 "$Message exits 2"
    Assert-Equal $result.Result.status 'blocked' "$Message is blocked"
    Assert-TreeEqual (Get-TreeHashes $Fixture.Project) $before "$Message is read-only"
}

function Test-CheckApplyMissingTarget {
    $f = New-ProjectFixture
    try {
        $before = Get-TreeHashes $f.Project
        $check = Invoke-ProjectHelper $f Check
        Assert-Equal $check.ExitCode 0 'check succeeds'
        Assert-ResultShape $check.Result 'check result has the stable JSON shape'
        Assert-Equal $check.Result.status 'ready' 'safe project is ready'
        Assert-Equal $check.Result.projectRoot ([IO.Path]::GetFullPath($f.Project)) 'check resolves exact Git root'
        Assert-Equal $check.Result.target (Join-Path ([IO.Path]::GetFullPath($f.Project)) 'AGENTS.md') 'check reports target'
        Assert-Equal $check.Result.targetHash 'absent' 'missing AGENTS uses absent snapshot'
        Assert-TreeEqual (Get-TreeHashes $f.Project) $before 'check is byte-for-byte read-only'

        $body = "# Project Contract`n- Test: ``npm test``"
        $encoded = ConvertTo-BodyBase64 $body
        $apply = Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash $encoded
        Assert-Equal $apply.ExitCode 0 'apply succeeds'
        Assert-ResultShape $apply.Result 'apply result has the stable JSON shape'
        Assert-Equal $apply.Result.status 'current' 'apply reaches current'
        Assert-Equal $apply.Result.changesRequired $false 'apply reports no remaining change'
        $expected = "$BeginMarker`r`n# Project Contract`r`n- Test: ``npm test```r`n$EndMarker`r`n"
        Assert-BytesEqual ([IO.File]::ReadAllBytes((Join-Path $f.Project 'AGENTS.md'))) ($Utf8NoBom.GetBytes($expected)) 'new target uses UTF-8 no BOM and CRLF'

        $hash = $apply.Result.targetHash
        $second = Invoke-ProjectHelper $f Apply $apply.Result.projectRoot $hash $encoded
        Assert-Equal $second.Result.status 'current' 'same body is an idempotent current result'
        Assert-Equal $second.Result.targetHash $hash 'same body does not rewrite target'
    } finally { Remove-ProjectFixture $f }
}

function Test-PreservesBomCrLfAndOutsideBytes {
    $f = New-ProjectFixture
    try {
        $target = Join-Path $f.Project 'AGENTS.md'
        $original = "outside-before  `r`n$BeginMarker`r`nold`r`n$EndMarker`r`noutside-after`t`r`n"
        [IO.File]::WriteAllBytes($target, $Utf8Bom.GetPreamble() + $Utf8NoBom.GetBytes($original))
        $check = Invoke-ProjectHelper $f Check
        $body = "new line 1`nnew line 2"
        $apply = Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash (ConvertTo-BodyBase64 $body)
        Assert-Equal $apply.Result.status 'current' 'existing target updates'
        $expected = "outside-before  `r`n$BeginMarker`r`nnew line 1`r`nnew line 2`r`n$EndMarker`r`noutside-after`t`r`n"
        Assert-BytesEqual ([IO.File]::ReadAllBytes($target)) ($Utf8Bom.GetPreamble() + $Utf8NoBom.GetBytes($expected)) 'BOM, CRLF, and outside bytes are preserved'
    } finally { Remove-ProjectFixture $f }
}

function Test-InputAndPreflightBlockers {
    $limit = New-ProjectFixture
    try {
        $limitCheck = Invoke-ProjectHelper $limit Check
        $limitApply = Invoke-ProjectHelper $limit Apply $limitCheck.Result.projectRoot $limitCheck.Result.targetHash (ConvertTo-BodyBase64 ('x' * 8192))
        Assert-Equal $limitApply.Result.status 'current' 'body at exactly 8 KiB is accepted'
    } finally { Remove-ProjectFixture $limit }

    $f = New-ProjectFixture
    try {
        $check = Invoke-ProjectHelper $f Check
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash (ConvertTo-BodyBase64 ('x' * 8193))
        } 'body over 8 KiB'
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash 'not-base64!'
        } 'malformed base64'
        $invalidUtf8 = [Convert]::ToBase64String([byte[]] @(0xc3, 0x28))
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash $invalidUtf8
        } 'malformed UTF-8 body'
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash (ConvertTo-BodyBase64 "a$([char] 0)b")
        } 'NUL body'
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash (ConvertTo-BodyBase64 "x $BeginMarker")
        } 'body containing marker'

        $target = Join-Path $f.Project 'AGENTS.md'
        [IO.File]::WriteAllBytes($target, $Utf8NoBom.GetBytes(('z' * (32KB - 50))))
        $largeCheck = Invoke-ProjectHelper $f Check
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply $largeCheck.Result.projectRoot $largeCheck.Result.targetHash (ConvertTo-BodyBase64 ('b' * 100))
        } 'final file over 32 KiB'

        [IO.File]::WriteAllBytes($target, $Utf8NoBom.GetBytes("$BeginMarker`r`nincomplete"))
        Assert-BlockedWithoutChange $f { Invoke-ProjectHelper $f Check } 'incomplete markers'
        [IO.File]::WriteAllBytes($target, $Utf8NoBom.GetBytes("$BeginMarker`r`na`r`n$EndMarker`r`n$BeginMarker`r`nb`r`n$EndMarker"))
        Assert-BlockedWithoutChange $f { Invoke-ProjectHelper $f Check } 'duplicate markers'

        [IO.File]::WriteAllBytes($target, [byte[]] @(0xff, 0xfe, 0x41, 0x00))
        Assert-BlockedWithoutChange $f { Invoke-ProjectHelper $f Check } 'UTF-16 target'
        [IO.File]::WriteAllBytes($target, [byte[]] @(0xc3, 0x28))
        Assert-BlockedWithoutChange $f { Invoke-ProjectHelper $f Check } 'malformed UTF-8 target'

        [IO.File]::Delete($target)
        [IO.File]::WriteAllText((Join-Path $f.Project 'AGENTS.override.md'), 'shadow', $Utf8NoBom)
        Assert-BlockedWithoutChange $f { Invoke-ProjectHelper $f Check } 'nonempty override'
    } finally { Remove-ProjectFixture $f }
}

function Test-StaleSnapshotsAndWrongRoot {
    $f = New-ProjectFixture
    $other = New-ProjectFixture
    try {
        $check = Invoke-ProjectHelper $f Check
        [IO.File]::WriteAllText((Join-Path $f.Project 'AGENTS.md'), 'concurrent', $Utf8NoBom)
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply $check.Result.projectRoot $check.Result.targetHash (ConvertTo-BodyBase64 'body')
        } 'stale target hash'

        $fresh = Invoke-ProjectHelper $f Check
        Assert-BlockedWithoutChange $f {
            Invoke-ProjectHelper $f Apply ([IO.Path]::GetFullPath($other.Project)) $fresh.Result.targetHash (ConvertTo-BodyBase64 'body')
        } 'different Git root'
    } finally {
        Remove-ProjectFixture $f
        Remove-ProjectFixture $other
    }
}

function Test-RootAndReparseBlockers {
    $outside = Join-Path ([IO.Path]::GetTempPath()) ('joewrks-nongit-' + [Guid]::NewGuid().ToString('N'))
    [IO.Directory]::CreateDirectory($outside) | Out-Null
    try {
        $raw = Invoke-RawProjectHelper @('-Check', '-ProjectPath', $outside)
        Assert-Equal $raw.ExitCode 2 'non-Git path exits 2'
        Assert-Equal $raw.Result.status 'blocked' 'non-Git path is blocked'
    } finally { [IO.Directory]::Delete($outside, $true) }

    $f = New-ProjectFixture
    try {
        $alias = Join-Path $f.Root 'alias'
        New-Item -ItemType Junction -Path $alias -Target $f.Project | Out-Null
        $raw = Invoke-RawProjectHelper @('-Check', '-ProjectPath', $alias)
        Assert-Equal $raw.ExitCode 2 'reparse project path exits 2'
        Assert-Equal $raw.Result.status 'blocked' 'reparse project path is blocked'
    } finally {
        if (Test-Path -LiteralPath $alias) { [IO.Directory]::Delete($alias) }
        Remove-ProjectFixture $f
    }

    $f = New-ProjectFixture
    try {
        $junctionSource = Join-Path $f.Root 'junction-source'
        [IO.Directory]::CreateDirectory($junctionSource) | Out-Null
        $targetJunction = Join-Path $f.Project 'AGENTS.md'
        New-Item -ItemType Junction -Path $targetJunction -Target $junctionSource | Out-Null
        $raw = Invoke-RawProjectHelper @('-Check', '-ProjectPath', $f.Project)
        Assert-Equal $raw.ExitCode 2 'reparse AGENTS.md target exits 2'
        Assert-Equal $raw.Result.status 'blocked' 'reparse AGENTS.md target is blocked'
        [IO.Directory]::Delete($targetJunction)

        $overrideJunction = Join-Path $f.Project 'AGENTS.override.md'
        New-Item -ItemType Junction -Path $overrideJunction -Target $junctionSource | Out-Null
        $raw = Invoke-RawProjectHelper @('-Check', '-ProjectPath', $f.Project)
        Assert-Equal $raw.ExitCode 2 'reparse AGENTS.override.md exits 2'
        Assert-Equal $raw.Result.status 'blocked' 'reparse AGENTS.override.md is blocked'
    } finally {
        if (Test-Path -LiteralPath $targetJunction) { [IO.Directory]::Delete($targetJunction) }
        if (Test-Path -LiteralPath $overrideJunction) { [IO.Directory]::Delete($overrideJunction) }
        Remove-ProjectFixture $f
    }

    $f = New-ProjectFixture
    try {
        . $Implementation
        $before = Get-TreeHashes $f.Project
        function Get-Item {
            [CmdletBinding()]
            param([string] $LiteralPath, [switch] $Force)
            Write-Error 'injected reparse inspection failure'
        }
        $result = Invoke-JoewrksProjectSetup -Check -ProjectPath $f.Project
        Assert-Equal $result.status 'blocked' 'reparse inspection failure is blocked'
        Assert-True $result.blockers[0].message.Contains('injected reparse inspection failure') 'inspection failure is reported'
        Assert-TreeEqual (Get-TreeHashes $f.Project) $before 'reparse inspection failure is read-only'
    } finally { Remove-ProjectFixture $f }
}

function Test-WindowsPathCasing {
    $f = New-ProjectFixture
    try {
        $alternateProjectPath = $f.Project.ToUpperInvariant()
        Assert-True ($alternateProjectPath -cne $f.Project -and $alternateProjectPath -ieq $f.Project) 'fixture has a casing-only project path'
        $before = Get-TreeHashes $f.Project
        $check = Invoke-RawProjectHelper @('-Check', '-ProjectPath', $alternateProjectPath)
        Assert-Equal $check.ExitCode 0 'casing-only ProjectPath succeeds'
        Assert-Equal $check.Result.status 'ready' 'casing-only ProjectPath is the same Git root'
        Assert-TreeEqual (Get-TreeHashes $f.Project) $before 'casing-only check is read-only'
    } finally { Remove-ProjectFixture $f }

    $f = New-ProjectFixture
    try {
        $check = Invoke-ProjectHelper $f Check
        $alternateExpectedRoot = $check.Result.projectRoot.ToUpperInvariant()
        Assert-True ($alternateExpectedRoot -cne $check.Result.projectRoot -and $alternateExpectedRoot -ieq $check.Result.projectRoot) 'fixture has a casing-only expected root'
        $apply = Invoke-ProjectHelper $f Apply $alternateExpectedRoot $check.Result.targetHash (ConvertTo-BodyBase64 'body')
        Assert-Equal $apply.ExitCode 0 'casing-only ExpectedRoot succeeds'
        Assert-Equal $apply.Result.status 'current' 'casing-only ExpectedRoot is the checked Git root'
    } finally { Remove-ProjectFixture $f }
}

function Test-RawCliValidation {
    $f = New-ProjectFixture
    try {
        foreach ($case in @(
            @{ Args = @('-Check'); Name = 'missing ProjectPath' },
            @{ Args = @('-Check', '-Apply', '-ProjectPath', $f.Project); Name = 'mode collision' },
            @{ Args = @('-Check', '-ProjectPath', $f.Project, '-ExpectedRoot', $f.Project); Name = 'check/apply field collision' },
            @{ Args = @('-Apply', '-ProjectPath', $f.Project); Name = 'missing apply snapshots' }
        )) {
            $result = Invoke-RawProjectHelper $case.Args
            Assert-Equal $result.ExitCode 2 "$($case.Name) exits 2"
            Assert-ResultShape $result.Result "$($case.Name) returns JSON"
            Assert-Equal $result.Result.status 'blocked' "$($case.Name) is blocked"
        }
    } finally { Remove-ProjectFixture $f }
}

function Test-ConditionalRollback {
    $f = New-ProjectFixture
    try {
        . $Implementation
        Assert-True ((Get-Command Invoke-JoewrksProjectSetup).Parameters.ContainsKey('AfterReplace')) 'dot-sourced function exposes internal callback'
        Assert-True ((Get-Command Invoke-JoewrksProjectSetup).Parameters.ContainsKey('BeforeRollbackRemove')) 'dot-sourced function exposes internal rollback-remove callback'
        $checkResult = Invoke-JoewrksProjectSetup -Check -ProjectPath $f.Project
        $target = Join-Path $f.Project 'AGENTS.md'

        $failed = Invoke-JoewrksProjectSetup -Apply -ProjectPath $f.Project -ExpectedRoot $checkResult.projectRoot `
            -ExpectedTargetHash $checkResult.targetHash -ManagedBodyBase64 (ConvertTo-BodyBase64 'body') `
            -AfterReplace { throw 'test post-replace failure' }
        Assert-Equal $failed.status 'failed' 'verified rollback returns failed'
        Assert-Equal $failed.rollback.status 'complete' 'verified rollback is reported'
        Assert-True (-not (Test-Path -LiteralPath $target)) 'verified rollback removes newly created target'

        $rollbackRaceBytes = $Utf8NoBom.GetBytes('replacement immediately before rollback removal')
        $beforeRollbackRemove = {
            param($operation)
            [IO.File]::WriteAllBytes($operation.TargetPath, $rollbackRaceBytes)
        }.GetNewClosure()
        $racedBeforeRemove = Invoke-JoewrksProjectSetup -Apply -ProjectPath $f.Project -ExpectedRoot $checkResult.projectRoot `
            -ExpectedTargetHash $checkResult.targetHash -ManagedBodyBase64 (ConvertTo-BodyBase64 'body') `
            -AfterReplace { throw 'test rollback-remove race' } -BeforeRollbackRemove $beforeRollbackRemove
        Assert-Equal $racedBeforeRemove.status 'unknown' 'replacement immediately before rollback removal returns unknown'
        Assert-Equal $racedBeforeRemove.rollback.status 'incomplete' 'replacement immediately before rollback removal makes rollback incomplete'
        Assert-True (@($racedBeforeRemove.rollback.removedTargets) -notcontains $target) 'replacement immediately before rollback removal is not reported removed'
        Assert-True (@($racedBeforeRemove.unresolvedTargets) -contains $target) 'replacement immediately before rollback removal reports target unresolved'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($target)) $rollbackRaceBytes 'replacement immediately before rollback removal survives'

        $originalBytes = $Utf8Bom.GetPreamble() + $Utf8NoBom.GetBytes("outside`r`n")
        [IO.File]::WriteAllBytes($target, $originalBytes)
        $checkResult = Invoke-JoewrksProjectSetup -Check -ProjectPath $f.Project
        $restored = Invoke-JoewrksProjectSetup -Apply -ProjectPath $f.Project -ExpectedRoot $checkResult.projectRoot `
            -ExpectedTargetHash $checkResult.targetHash -ManagedBodyBase64 (ConvertTo-BodyBase64 'body') `
            -AfterReplace { throw 'test existing-file rollback' }
        Assert-Equal $restored.status 'failed' 'existing-file rollback returns failed'
        Assert-Equal $restored.rollback.status 'complete' 'existing-file rollback is complete'
        Assert-True (@($restored.rollback.restoredTargets) -contains $target) 'existing target is reported restored'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($target)) $originalBytes 'existing target restores exact pre-write bytes'

        $raceBytes = $Utf8NoBom.GetBytes('post-rollback concurrent edit')
        $script:RollbackRaceTarget = $target
        $script:RollbackRaceBytes = $raceBytes
        $finalSnapshotLine = ([IO.File]::ReadAllLines($Implementation, [Text.Encoding]::UTF8) |
            Select-String '\$final = Get-ProjectFileSnapshot \$target' | Select-Object -First 1).LineNumber
        $raceBreakpoint = Set-PSBreakpoint -Script $Implementation -Line $finalSnapshotLine -Action {
            [IO.File]::WriteAllBytes($script:RollbackRaceTarget, $script:RollbackRaceBytes)
        }
        try {
            $checkResult = Invoke-JoewrksProjectSetup -Check -ProjectPath $f.Project
            $raced = Invoke-JoewrksProjectSetup -Apply -ProjectPath $f.Project -ExpectedRoot $checkResult.projectRoot `
                -ExpectedTargetHash $checkResult.targetHash -ManagedBodyBase64 (ConvertTo-BodyBase64 'new body') `
                -AfterReplace { throw 'test post-rollback race' }
        } finally {
            Remove-PSBreakpoint -Breakpoint $raceBreakpoint
        }
        Assert-Equal $raced.status 'unknown' 'post-rollback concurrent edit returns unknown'
        Assert-Equal $raced.rollback.status 'incomplete' 'post-rollback concurrent edit makes rollback incomplete'
        Assert-True (@($raced.unresolvedTargets) -contains $target) 'post-rollback concurrent target is unresolved'
        Assert-True (@($raced.rollback.restoredTargets) -notcontains $target) 'unverified restoration is not retained'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($target)) $raceBytes 'post-rollback concurrent edit is preserved'

        [IO.File]::Delete($target)
        $checkResult = Invoke-JoewrksProjectSetup -Check -ProjectPath $f.Project
        $concurrentBytes = $Utf8NoBom.GetBytes('concurrent edit')
        $unknown = Invoke-JoewrksProjectSetup -Apply -ProjectPath $f.Project -ExpectedRoot $checkResult.projectRoot `
            -ExpectedTargetHash $checkResult.targetHash -ManagedBodyBase64 (ConvertTo-BodyBase64 'body') `
            -AfterReplace { param($operation) [IO.File]::WriteAllBytes($operation.TargetPath, $concurrentBytes); throw 'test concurrent edit' }
        Assert-Equal $unknown.status 'unknown' 'concurrent edit makes state unknown'
        Assert-Equal $unknown.rollback.status 'incomplete' 'concurrent edit reports incomplete rollback'
        Assert-True (@($unknown.unresolvedTargets) -contains $target) 'concurrent target is unresolved'
        Assert-BytesEqual ([IO.File]::ReadAllBytes($target)) $concurrentBytes 'rollback never overwrites concurrent edit'

        [IO.File]::Delete($target)
        $checkResult = Invoke-JoewrksProjectSetup -Check -ProjectPath $f.Project
        $typeChanged = Invoke-JoewrksProjectSetup -Apply -ProjectPath $f.Project -ExpectedRoot $checkResult.projectRoot `
            -ExpectedTargetHash $checkResult.targetHash -ManagedBodyBase64 (ConvertTo-BodyBase64 'body') `
            -AfterReplace {
                param($operation)
                [IO.File]::Delete($operation.TargetPath)
                [IO.Directory]::CreateDirectory($operation.TargetPath) | Out-Null
                throw 'test concurrent type change'
            }
        Assert-Equal $typeChanged.status 'unknown' 'concurrent target type change returns unknown JSON'
        Assert-True (@($typeChanged.unresolvedTargets) -contains $target) 'type-changed target is unresolved'
    } finally { Remove-ProjectFixture $f }
}

Test-CheckApplyMissingTarget
Test-PreservesBomCrLfAndOutsideBytes
Test-InputAndPreflightBlockers
Test-StaleSnapshotsAndWrongRoot
Test-RootAndReparseBlockers
Test-WindowsPathCasing
Test-RawCliValidation
Test-ConditionalRollback

Write-Output 'project setup contract PASS'
