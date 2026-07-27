[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Write', 'ReadState')]
    [string]$Operation,

    [Parameter(Mandatory = $true)]
    [string]$RunRoot,

    [Parameter(Mandatory = $true)]
    [string]$StatePath,

    [Parameter(Mandatory = $true)]
    [string]$TargetKey,

    [string]$IdempotencyKey,

    [switch]$LoseResponse
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8Json {
    param([string]$LiteralPath, [object]$Value)
    $parent = Split-Path -Parent $LiteralPath
    if (-not (Test-Path -LiteralPath $parent)) {
        [IO.Directory]::CreateDirectory($parent) | Out-Null
    }
    $json = $Value | ConvertTo-Json -Depth 10
    $utf8 = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($LiteralPath, $json + [Environment]::NewLine, $utf8)
}

$rootFull = [IO.Path]::GetFullPath($RunRoot).TrimEnd('\') + '\'
$systemTempFull = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
if (
    $rootFull -eq $systemTempFull -or
    -not $rootFull.StartsWith($systemTempFull, [StringComparison]::OrdinalIgnoreCase)
) {
    throw "RunRoot must be a strict child of system temp: $rootFull"
}

$stateFull = [IO.Path]::GetFullPath($StatePath)
if (-not $stateFull.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
    throw "StatePath is outside RunRoot: $stateFull"
}

if ([string]::IsNullOrWhiteSpace($TargetKey)) {
    throw 'TargetKey must not be blank'
}

if (Test-Path -LiteralPath $stateFull) {
    $state = Get-Content -Raw -Encoding UTF8 -LiteralPath $stateFull | ConvertFrom-Json
} else {
    $state = [pscustomobject]@{
        schemaVersion = 1
        effects = @()
        events = @()
    }
}

if ($Operation -eq 'ReadState') {
    $state.events = @($state.events) + [pscustomobject]@{
        sequence = @($state.events).Count + 1
        kind = 'state-query'
        targetKey = $TargetKey
        idempotencyKey = $null
    }
    Write-Utf8Json -LiteralPath $stateFull -Value $state
    $effects = @($state.effects | Where-Object { $_.targetKey -eq $TargetKey })
    [pscustomobject]@{
        targetKey = $TargetKey
        effectCount = $effects.Count
        effects = $effects
        events = @($state.events)
    } | ConvertTo-Json -Depth 10
    return
}

if ([string]::IsNullOrWhiteSpace($IdempotencyKey)) {
    throw 'Write requires IdempotencyKey'
}

$existing = @(
    $state.effects | Where-Object {
        $_.targetKey -eq $TargetKey -and $_.idempotencyKey -eq $IdempotencyKey
    }
) | Select-Object -First 1

if ($null -ne $existing) {
    $state.events = @($state.events) + [pscustomobject]@{
        sequence = @($state.events).Count + 1
        kind = 'same-key-recovery'
        targetKey = $TargetKey
        idempotencyKey = $IdempotencyKey
    }
    Write-Utf8Json -LiteralPath $stateFull -Value $state
    [pscustomobject]@{
        targetKey = $TargetKey
        operationId = $existing.operationId
        effectCount = @($state.effects | Where-Object { $_.targetKey -eq $TargetKey }).Count
        reused = $true
    } | ConvertTo-Json -Depth 10
    return
}

$operationId = 'op-' + (@($state.effects).Count + 1).ToString('0000')
$effect = [pscustomobject]@{
    operationId = $operationId
    targetKey = $TargetKey
    idempotencyKey = $IdempotencyKey
}
$state.effects = @($state.effects) + $effect
$state.events = @($state.events) + [pscustomobject]@{
    sequence = @($state.events).Count + 1
    kind = 'write-applied'
    targetKey = $TargetKey
    idempotencyKey = $IdempotencyKey
    operationId = $operationId
}
Write-Utf8Json -LiteralPath $stateFull -Value $state

if ($LoseResponse) {
    throw 'synthetic response loss after committed write'
}

[pscustomobject]@{
    targetKey = $TargetKey
    operationId = $operationId
    effectCount = @($state.effects | Where-Object { $_.targetKey -eq $TargetKey }).Count
    reused = $false
} | ConvertTo-Json -Depth 10
