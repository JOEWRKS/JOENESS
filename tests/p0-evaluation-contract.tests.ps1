Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$casePath = Join-Path $repoRoot 'evals\p0\cases.json'
$mockPath = Join-Path $repoRoot 'evals\support\mock-external-write.ps1'

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

function Assert-RelativeFixturePath {
    param([string]$Path)
    Assert-True (-not [string]::IsNullOrWhiteSpace($Path)) 'empty fixture path'
    Assert-True (-not [IO.Path]::IsPathRooted($Path)) "rooted fixture path: $Path"
    $segments = $Path -split '[\\/]'
    Assert-True (-not ($segments -contains '..')) "escaping fixture path: $Path"
    Assert-True (-not ($segments -contains '.')) "ambiguous fixture path: $Path"
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
    foreach ($field in @('id', 'executionMode', 'scenarioEffect', 'prompt', 'setup', 'passCriteria', 'failCriteria')) {
        Assert-True (-not [string]::IsNullOrWhiteSpace([string]$case.$field)) "$($case.id) missing $field"
    }

    Assert-True (@('read-only', 'synthetic-write').Contains([string]$case.executionMode)) "$($case.id) invalid executionMode"
    Assert-True (@('read-only', 'local-write', 'external-write').Contains([string]$case.scenarioEffect)) "$($case.id) invalid scenarioEffect"
    if ($case.scenarioEffect -eq 'read-only') {
        Assert-True ($null -eq $case.targetKey) "$($case.id) read-only case has targetKey"
    } else {
        Assert-True (-not [string]::IsNullOrWhiteSpace([string]$case.targetKey)) "$($case.id) write case missing targetKey"
    }

    $fixtureProperties = @($case.fixtureFiles.PSObject.Properties)
    Assert-True ($fixtureProperties.Count -gt 0) "$($case.id) has no fixture files"
    foreach ($property in $fixtureProperties) {
        Assert-RelativeFixturePath $property.Name
        Assert-True (-not [string]::IsNullOrWhiteSpace([string]$property.Value)) "$($case.id) empty fixture: $($property.Name)"
    }

    $evidence = @($case.evidenceRequired)
    Assert-True ($evidence.Count -gt 0) "$($case.id) has no evidence requirements"
    Assert-True ($evidence -contains 'transcript') "$($case.id) must require transcript"
    Assert-True ($evidence -contains 'judgment') "$($case.id) must require judgment"
    $toolBindingProperty = $case.PSObject.Properties['toolBindings']
    $bindings = @(
        if ($null -ne $toolBindingProperty) {
            $toolBindingProperty.Value
        }
    )

    if ($case.executionMode -eq 'synthetic-write') {
        Assert-True ($case.scenarioEffect -ne 'read-only') "$($case.id) synthetic write has read-only scenarioEffect"
        Assert-True ($evidence -contains 'receipt') "$($case.id) synthetic write must require receipt"
        Assert-True ($bindings.Count -eq 1) "$($case.id) must have exactly one tool binding"
        $binding = $bindings[0]
        Assert-True ($binding.id -eq 'mock-external-write') "$($case.id) unexpected tool binding id"
        Assert-True ($binding.source -eq 'evals/support/mock-external-write.ps1') "$($case.id) unexpected tool source"
        Assert-True (
            @(Compare-Object @('Write', 'ReadState') @($binding.allowedOperations)).Count -eq 0
        ) "$($case.id) unexpected allowed operations"
    } else {
        Assert-True (-not ($evidence -contains 'receipt')) "$($case.id) read-only execution must not require receipt"
        Assert-True ($bindings.Count -eq 0) "$($case.id) read-only execution has a tool binding"
    }
}

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
