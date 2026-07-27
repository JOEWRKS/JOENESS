Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$casePath = Join-Path $repoRoot 'evals\p0\cases.json'
$mockPath = Join-Path $repoRoot 'evals\support\mock-external-write.ps1'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

function Assert-ThrowsLike {
    param(
        [scriptblock]$Action,
        [string]$Pattern,
        [string]$Message
    )

    $matched = $false
    try {
        & $Action
    } catch {
        $matched = $_.Exception.Message -like $Pattern
    }
    Assert-True $matched $Message
}

function Assert-RelativeFixturePath {
    param([string]$Path)
    Assert-True (-not [string]::IsNullOrWhiteSpace($Path)) 'empty fixture path'
    Assert-True (-not [IO.Path]::IsPathRooted($Path)) "rooted fixture path: $Path"
    $segments = $Path -split '[\\/]'
    Assert-True (-not ($segments -contains '..')) "escaping fixture path: $Path"
    Assert-True (-not ($segments -contains '.')) "ambiguous fixture path: $Path"
}

function Assert-CaseContract {
    param([object]$Case)

    foreach ($field in @('id', 'executionMode', 'scenarioEffect', 'prompt', 'setup', 'passCriteria', 'failCriteria')) {
        Assert-True (-not [string]::IsNullOrWhiteSpace([string]$Case.$field)) "$($Case.id) missing $field"
    }

    Assert-True (@('read-only', 'synthetic-write').Contains([string]$Case.executionMode)) "$($Case.id) invalid executionMode"
    Assert-True (@('read-only', 'local-write', 'external-write').Contains([string]$Case.scenarioEffect)) "$($Case.id) invalid scenarioEffect"
    if ($Case.scenarioEffect -eq 'read-only') {
        Assert-True ($null -eq $Case.targetKey) "$($Case.id) read-only case has targetKey"
    } else {
        Assert-True (-not [string]::IsNullOrWhiteSpace([string]$Case.targetKey)) "$($Case.id) write case missing targetKey"
    }

    $fixtureFilesProperty = $Case.PSObject.Properties['fixtureFiles']
    Assert-True ($null -ne $fixtureFilesProperty) "$($Case.id) missing fixtureFiles"
    Assert-True (
        $fixtureFilesProperty.Value -is [pscustomobject]
    ) "$($Case.id) fixtureFiles must be an object"

    $fixtureProperties = @($fixtureFilesProperty.Value.PSObject.Properties)
    Assert-True ($fixtureProperties.Count -gt 0) "$($Case.id) has no fixture files"
    foreach ($property in $fixtureProperties) {
        Assert-RelativeFixturePath $property.Name
        Assert-True (
            $property.Value -is [string]
        ) "$($Case.id) fixture value must be a string: $($property.Name)"
        Assert-True (
            -not [string]::IsNullOrWhiteSpace($property.Value)
        ) "$($Case.id) empty fixture: $($property.Name)"
    }

    $evidence = @($Case.evidenceRequired)
    $expectedEvidence = if ($Case.executionMode -eq 'synthetic-write') {
        @('transcript', 'tool-events', 'snapshot', 'receipt', 'judgment')
    } else {
        @('transcript', 'tool-events', 'snapshot', 'judgment')
    }
    Assert-True (
        $evidence.Count -eq $expectedEvidence.Count
    ) "$($Case.id) unexpected evidenceRequired count"
    Assert-True (
        @(Compare-Object $expectedEvidence $evidence).Count -eq 0
    ) "$($Case.id) unexpected evidenceRequired values"
    $toolBindingProperty = $Case.PSObject.Properties['toolBindings']
    $bindings = @(
        if ($null -ne $toolBindingProperty) {
            $toolBindingProperty.Value
        }
    )

    if ($Case.executionMode -eq 'synthetic-write') {
        Assert-True ($Case.scenarioEffect -ne 'read-only') "$($Case.id) synthetic write has read-only scenarioEffect"
        Assert-True ($bindings.Count -eq 1) "$($Case.id) must have exactly one tool binding"
        $binding = $bindings[0]
        Assert-True ($binding.id -eq 'mock-external-write') "$($Case.id) unexpected tool binding id"
        Assert-True ($binding.source -eq 'evals/support/mock-external-write.ps1') "$($Case.id) unexpected tool source"
        Assert-True (
            @(Compare-Object @('Write', 'ReadState') @($binding.allowedOperations)).Count -eq 0
        ) "$($Case.id) unexpected allowed operations"
    } else {
        Assert-True ($bindings.Count -eq 0) "$($Case.id) read-only execution has a tool binding"
    }
}

Assert-True (Test-Path -LiteralPath $casePath -PathType Leaf) 'missing evals/p0/cases.json'

$contract = Get-Content -Raw -Encoding UTF8 -LiteralPath $casePath | ConvertFrom-Json
Assert-True ($contract.schemaVersion -is [int]) 'schemaVersion must be an integer'
Assert-True ($contract.schemaVersion -eq 1) 'schemaVersion must be 1'

$p0 = @($contract.p0Cases)
$pressure = @($contract.pressureCases)
Assert-True ($p0.Count -eq 8) "expected 8 P0 cases, found $($p0.Count)"
Assert-True ($pressure.Count -eq 7) "expected 7 pressure cases, found $($pressure.Count)"

$expectedP0 = @(
    'p0-01-trust-boundary',
    'p0-02-unknown-write',
    'p0-03-target-serialization',
    'p0-04-stale-handoff',
    'p0-05-missing-capability',
    'p0-06-skill-collision',
    'p0-07-design-authority',
    'p0-08-sync-failure'
)
$expectedPressure = @(
    'pressure-01-unrelated-refactor',
    'pressure-02-no-progress-repeat',
    'pressure-03-duplicate-feature',
    'pressure-04-product-completeness',
    'pressure-05-duplicate-delegation',
    'pressure-06-read-all-history',
    'pressure-07-false-completion'
)

Assert-True (@(Compare-Object $expectedP0 @($p0.id)).Count -eq 0) 'P0 IDs do not match the contract'
Assert-True (@(Compare-Object $expectedPressure @($pressure.id)).Count -eq 0) 'pressure IDs do not match the contract'

$allCases = @($p0) + @($pressure)
Assert-True (@($allCases.id | Select-Object -Unique).Count -eq 15) 'duplicate case ID'

foreach ($case in $allCases) {
    Assert-CaseContract -Case $case
}

$scalarFixtureCase = $p0[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
$scalarFixtureCase.fixtureFiles = 'x'
Assert-ThrowsLike {
    Assert-CaseContract -Case $scalarFixtureCase
} '*fixtureFiles must be an object*' 'scalar fixtureFiles was accepted'

$nonStringFixtureCase = $p0[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
$nonStringFixtureCase.fixtureFiles.'REQUEST.md' = 17
Assert-ThrowsLike {
    Assert-CaseContract -Case $nonStringFixtureCase
} '*fixture value must be a string*' 'non-string fixture value was accepted'

$missingEvidenceCase = $p0[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
$missingEvidenceCase.evidenceRequired = @('transcript', 'snapshot', 'judgment')
Assert-ThrowsLike {
    Assert-CaseContract -Case $missingEvidenceCase
} '*unexpected evidenceRequired*' 'missing evidence kind was accepted'

$duplicateEvidenceCase = $p0[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
$duplicateEvidenceCase.evidenceRequired = @(
    'transcript', 'tool-events', 'snapshot', 'judgment', 'judgment'
)
Assert-ThrowsLike {
    Assert-CaseContract -Case $duplicateEvidenceCase
} '*unexpected evidenceRequired*' 'duplicate evidence kind was accepted'

$unknownEvidenceCase = $p0[0] | ConvertTo-Json -Depth 20 | ConvertFrom-Json
$unknownEvidenceCase.evidenceRequired = @('transcript', 'tool-events', 'snapshot', 'guess')
Assert-ThrowsLike {
    Assert-CaseContract -Case $unknownEvidenceCase
} '*unexpected evidenceRequired*' 'unknown evidence kind was accepted'

Assert-True (Test-Path -LiteralPath $mockPath -PathType Leaf) 'missing evals/support/mock-external-write.ps1'

$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('joewrks-p0-' + [Guid]::NewGuid().ToString('N'))
$runRoot = Join-Path $testRoot 'run'
$outsidePath = Join-Path $testRoot 'outside.json'
$statePath = Join-Path $runRoot 'state\external-write.json'
$testRootFull = [IO.Path]::GetFullPath($testRoot).TrimEnd('\') + '\'
$tempRootFull = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
Assert-True ($testRootFull.StartsWith($tempRootFull, [StringComparison]::OrdinalIgnoreCase)) 'unsafe test root'

try {
    [IO.Directory]::CreateDirectory($runRoot) | Out-Null

    $nonTempRoot = [IO.Path]::GetPathRoot($testRoot)
    $nonTempState = $outsidePath
    $nonTempRejected = $false
    try {
        & $mockPath -Operation ReadState -RunRoot $nonTempRoot -StatePath $nonTempState `
            -TargetKey 'fixture-service:account-17'
    } catch {
        $nonTempRejected = $_.Exception.Message -like '*strict child of system temp*'
    }
    Assert-True $nonTempRejected 'mock accepted a non-temp RunRoot'

    $missingKeyRejected = $false
    try {
        & $mockPath -Operation Write -RunRoot $runRoot -StatePath $statePath `
            -TargetKey 'fixture-service:account-17'
    } catch {
        $missingKeyRejected = $_.Exception.Message -like '*requires IdempotencyKey*'
    }
    Assert-True $missingKeyRejected 'blank idempotency key was accepted'
    Assert-True (-not (Test-Path -LiteralPath $statePath)) 'rejected write created state'

    $blankTargetRejected = $false
    try {
        & $mockPath -Operation ReadState -RunRoot $runRoot -StatePath $statePath -TargetKey ' '
    } catch {
        $blankTargetRejected = $_.Exception.Message -like '*TargetKey must not be blank*'
    }
    Assert-True $blankTargetRejected 'blank TargetKey was accepted'
    Assert-True (-not (Test-Path -LiteralPath $statePath)) 'blank target created state'

    $lostResponse = $false
    try {
        & $mockPath -Operation Write -RunRoot $runRoot -StatePath $statePath `
            -TargetKey 'fixture-service:account-17' -IdempotencyKey 'request-001' -LoseResponse
    } catch {
        $lostResponse = $_.Exception.Message -like '*synthetic response loss*'
    }
    Assert-True $lostResponse 'LoseResponse did not fail after write'

    $state = & $mockPath -Operation ReadState -RunRoot $runRoot -StatePath $statePath `
        -TargetKey 'fixture-service:account-17' | ConvertFrom-Json
    Assert-True ($state.effectCount -eq 1) 'first ambiguous write was not recorded once'
    Assert-True ($state.effects[0].idempotencyKey -eq 'request-001') 'idempotency key was not retained'

    $recovered = & $mockPath -Operation Write -RunRoot $runRoot -StatePath $statePath `
        -TargetKey 'fixture-service:account-17' -IdempotencyKey 'request-001' | ConvertFrom-Json
    Assert-True ($recovered.effectCount -eq 1) 'same-key recovery duplicated the effect'
    Assert-True ($recovered.reused -eq $true) 'same-key recovery was not marked reused'

    $finalState = & $mockPath -Operation ReadState -RunRoot $runRoot -StatePath $statePath `
        -TargetKey 'fixture-service:account-17' | ConvertFrom-Json
    $eventKinds = @($finalState.events | ForEach-Object { $_.kind })
    Assert-True ($eventKinds.Count -eq 4) 'unexpected external-write event count'
    Assert-True ($eventKinds[0] -eq 'write-applied') 'first event was not write-applied'
    Assert-True ($eventKinds[1] -eq 'state-query') 'state query did not precede recovery'
    Assert-True ($eventKinds[2] -eq 'same-key-recovery') 'recovery event missing'
    Assert-True ($eventKinds[3] -eq 'state-query') 'final state query missing'

    $caseStatePath = Join-Path $runRoot 'state\case-sensitive-keys.json'
    $firstCaseWrite = & $mockPath -Operation Write -RunRoot $runRoot -StatePath $caseStatePath `
        -TargetKey 'fixture-service:account-18' -IdempotencyKey 'REQUEST-CASE' | ConvertFrom-Json
    Assert-True ($firstCaseWrite.operationId -eq 'op-0001') 'normal first write returned wrong operation ID'
    Assert-True ($firstCaseWrite.effectCount -eq 1) 'normal first write effect count was not one'
    Assert-True ($firstCaseWrite.reused -eq $false) 'normal first write was marked reused'

    $secondCaseWrite = & $mockPath -Operation Write -RunRoot $runRoot -StatePath $caseStatePath `
        -TargetKey 'fixture-service:account-18' -IdempotencyKey 'request-case' | ConvertFrom-Json
    Assert-True ($secondCaseWrite.operationId -eq 'op-0002') 'case-distinct key did not create a new operation'
    Assert-True ($secondCaseWrite.effectCount -eq 2) 'different key did not create a second effect'
    Assert-True ($secondCaseWrite.reused -eq $false) 'different key was incorrectly marked reused'

    $junctionTarget = Join-Path $testRoot 'junction-target'
    $junctionPath = Join-Path $runRoot 'junction-state'
    $junctionStatePath = Join-Path $junctionPath 'escaped.json'
    [IO.Directory]::CreateDirectory($junctionTarget) | Out-Null
    New-Item -ItemType Junction -Path $junctionPath -Target $junctionTarget | Out-Null
    $junctionRejected = $false
    try {
        & $mockPath -Operation ReadState -RunRoot $runRoot -StatePath $junctionStatePath `
            -TargetKey 'fixture-service:account-19' | Out-Null
    } catch {
        $junctionRejected = $_.Exception.Message -like '*reparse point*'
    } finally {
        if (Test-Path -LiteralPath $junctionPath) {
            [IO.Directory]::Delete($junctionPath)
        }
    }
    Assert-True $junctionRejected 'fixture accepted a junction escape below RunRoot'
    Assert-True (
        -not (Test-Path -LiteralPath (Join-Path $junctionTarget 'escaped.json'))
    ) 'junction escape wrote outside RunRoot'

    $escaped = $false
    try {
        & $mockPath -Operation ReadState -RunRoot $runRoot -StatePath $outsidePath `
            -TargetKey 'fixture-service:account-17' | Out-Null
    } catch {
        $escaped = $_.Exception.Message -like '*outside RunRoot*'
    }
    Assert-True $escaped 'fixture accepted a StatePath outside RunRoot'
} finally {
    if (Test-Path -LiteralPath $testRoot) {
        $resolvedCleanup = [IO.Path]::GetFullPath($testRoot).TrimEnd('\') + '\'
        Assert-True ($resolvedCleanup.StartsWith($tempRootFull, [StringComparison]::OrdinalIgnoreCase)) 'cleanup escaped temp root'
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}

Write-Output 'PASS: P0 evaluation contract'
