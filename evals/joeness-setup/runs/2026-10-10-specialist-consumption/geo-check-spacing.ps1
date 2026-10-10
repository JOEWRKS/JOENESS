# Project-scoped caller proposal: install at .design-harness/conformance/check-spacing.ps1.
# Read-only. TASK/ROADMAP updates remain the designated project integrator's work.
[CmdletBinding()]
param([ValidateSet('visual','complete')][string]$Claim='visual')
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
try {
    $root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
    $gate='C:\Users\tjdwo\.codex\skills\joeness-setup\scripts\review-gate.mjs'
    $gatePin='db37a33ce5ee2f9c210e4250b05aef1afb9712bfa6e524a80d39866b4c8c8c23'
    # Reviewed narrow scope; never recompute this expectation from the baseline file.
    $baselinePin='62c05b7fde59b5e5101c0c0ffe6d388fa6e74382d038d0b4a613fffa5d3c4251'
    if((Get-FileHash -LiteralPath $gate -Algorithm SHA256).Hash.ToLowerInvariant() -cne $gatePin){throw 'Installed consumer changed; review the connection before retrying'}
    $raw=& node $gate --root $root --baseline .design-harness/conformance/spacing-baseline.json --baseline-sha256 $baselinePin --result .design-harness/conformance/spacing-result.json --claim $Claim
    $code=$LASTEXITCODE
    $result=($raw -join "`n")|ConvertFrom-Json
    if($code -eq 0 -and ($result.schema -cne 'joeness.review-gate.v1' -or $result.claim -cne $Claim -or $result.scope_id -cne 'geo-header-product-campaign-spacing' -or $result.allowed -ne $true -or $result.project_complete -ne $false)){throw 'Consumer output does not authorize the requested scoped claim'}
    $raw | Write-Output
    if($code -eq 0){exit 0}else{exit 2}
} catch {
    @{schema='joeness.review-gate.v1';allowed=$false;project_complete=$false;errors=@($_.Exception.Message)}|ConvertTo-Json -Compress
    exit 2
}
