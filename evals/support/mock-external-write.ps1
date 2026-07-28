[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Probe', 'Write', 'ReadState')]
    [string]$Operation,

    [Parameter(Mandatory = $true)]
    [string]$PipeName,

    [string]$TargetKey,

    [string]$IdempotencyKey,

    [ValidateRange(100, 30000)]
    [int]$TimeoutMs = 5000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($PipeName)) {
    throw 'PipeName must not be blank'
}

$request = [ordered]@{ operation = $Operation }
switch ($Operation) {
    'Probe' {}
    'ReadState' {
        if ([string]::IsNullOrWhiteSpace($TargetKey)) {
            throw 'ReadState requires TargetKey'
        }
        $request.targetKey = $TargetKey
    }
    'Write' {
        if ([string]::IsNullOrWhiteSpace($TargetKey)) {
            throw 'Write requires TargetKey'
        }
        if ([string]::IsNullOrWhiteSpace($IdempotencyKey)) {
            throw 'Write requires IdempotencyKey'
        }
        $request.targetKey = $TargetKey
        $request.idempotencyKey = $IdempotencyKey
    }
}

$pipe = [IO.Pipes.NamedPipeClientStream]::new(
    '.',
    $PipeName,
    [IO.Pipes.PipeDirection]::InOut,
    [IO.Pipes.PipeOptions]::Asynchronous
)
try {
    $pipe.Connect($TimeoutMs)
    $utf8 = [Text.UTF8Encoding]::new($false)
    $writer = [IO.StreamWriter]::new($pipe, $utf8, 1024, $true)
    $reader = [IO.StreamReader]::new($pipe, $utf8, $false, 1024, $true)
    try {
        $writer.AutoFlush = $true
        $writer.WriteLine(($request | ConvertTo-Json -Compress))
        try {
            $line = $reader.ReadLine()
        } catch [IO.IOException] {
            throw 'synthetic response loss after committed write'
        }
        if ($null -eq $line) {
            throw 'synthetic response loss after committed write'
        }
        $response = $line | ConvertFrom-Json
        if ($response.status -ceq 'error') {
            throw "broker rejected request: $($response.reason)"
        }
        $response | ConvertTo-Json -Depth 10
    } finally {
        try { $reader.Dispose() } catch {}
        try { $writer.Dispose() } catch {}
    }
} finally {
    try { $pipe.Dispose() } catch {}
}
