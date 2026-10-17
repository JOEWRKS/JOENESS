Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../../..')).Path
. (Join-Path $repoRoot 'scripts/sync-harness.ps1')
$fixtureRoot = Join-Path ([IO.Path]::GetTempPath()) ('joeness-promotion-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $fixtureRoot
$manifest = Get-Content (Join-Path $repoRoot 'vendor/source-manifest.json') -Raw | ConvertFrom-Json
$results = [ordered]@{ root = $fixtureRoot; stages = @(); matchedFiles = 0 }
foreach ($mode in @('Check', 'Apply', 'Check')) {
    $options = @{ CodexHome = $fixtureRoot }; $options[$mode] = $true
    $result = Invoke-JoenessHarnessSync @options
    $expected = if ($results.stages.Count -eq 0) { 'ready' } else { 'current' }
    if ($result.status -ne $expected) { throw "$mode expected $expected; got $($result.status)" }
    $results.stages += "$mode=$($result.status)"
}
foreach ($file in $manifest.publicSkills[0].files) {
    $installed = Join-Path $fixtureRoot ('skills/joeness-setup/' + $file.path)
    $hash = (Get-FileHash -LiteralPath $installed -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -cne $file.sha256) { throw "Installed hash mismatch: $($file.path)" }
    $results.matchedFiles++
}
$results.templateSha256 = (Get-FileHash -LiteralPath (Join-Path $fixtureRoot 'skills/joeness-setup/assets/AGENTS.md') -Algorithm SHA256).Hash.ToLowerInvariant()
if (Test-Path (Join-Path $fixtureRoot 'AGENTS.md')) { throw 'Unexpected global AGENTS' }
# Remove only owned fixture installation through the canonical installer; no broad deletion.
$removed = Invoke-JoenessHarnessSync -Remove -CodexHome $fixtureRoot
if ($removed.status -ne 'removed') { throw "Fixture removal failed: $($removed.status)" }
$results.stages += 'Remove=removed'
$results | ConvertTo-Json -Depth 4
