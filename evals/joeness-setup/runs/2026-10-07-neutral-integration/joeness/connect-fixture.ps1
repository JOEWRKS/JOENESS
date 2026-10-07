param([Parameter(Mandatory)][string]$ProjectPath,
      [Parameter(Mandatory)][string]$ProductSource,
      [switch]$Combined)
$ErrorActionPreference='Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../../..'))
$root = [IO.Path]::GetFullPath($ProjectPath)
$temp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
if (-not $root.StartsWith($temp,[StringComparison]::OrdinalIgnoreCase) -or
    $root -notmatch 'joeness-integration-[a-f0-9]+[\\/](standalone|combined)$') {
    throw 'Only the bounded synthetic integration fixture is allowed'
}
$product = [IO.Path]::GetFullPath((Join-Path $root $ProductSource))
if (-not $product.StartsWith($root+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {
    throw 'Product source outside fixture'
}
$protected=@($ProductSource,'ROADMAP.md','TASK.md','ISSUES.md','DESIGN.md')
$before=@{}
foreach($name in $protected){$before[$name]=(Get-FileHash -LiteralPath (Join-Path $root $name) -Algorithm SHA256).Hash.ToLowerInvariant()}
$outside=[IO.File]::ReadAllText((Join-Path $root 'AGENTS.md'))
$body=[IO.File]::ReadAllText((Join-Path $repo 'skills/joeness-setup/assets/AGENTS.md'))
$body=$body.Replace('Adapt paths and agreed scope before applying this body.', '')
$body=$body.Replace('<exact source or undecided>', $ProductSource)
$body=$body.Replace('<agreed scope>', 'TASK.md and affected ROADMAP.md/ISSUES.md facts only; no Product or DESIGN writes')
if($Combined){
 $body += @'

- Product state writes belong to its authorized product-definition maintainer.
  This session reads that source only. Reference its schema/revision/file hash and
  relevant stable IDs; do not turn an observation reference into approval.
  On resume, reconcile affected summaries against the actual owner; preserve
  partial decisions, open conditions and approval scope. TASK records any unsaved gap.
'@
}
. (Join-Path $repo 'skills/joeness-setup/scripts/project-setup.ps1')
$connectionCheck=Invoke-JoenessProjectSetup -Check -ProjectPath $root
if($connectionCheck.status -ne 'ready'){throw "Unexpected pre-check: $($connectionCheck|ConvertTo-Json -Compress)"}
$connectArgs=@{ProjectPath=$root;ExpectedRoot=$connectionCheck.projectRoot;ExpectedTargetHash=$connectionCheck.targetHash;
 ExpectedStateHash=$connectionCheck.stateHash;ManagedBodyBase64=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($body))}
$connectionApply=Invoke-JoenessProjectSetup -Apply @connectArgs
$connectionPost=Invoke-JoenessProjectSetup -Check -ProjectPath $root
if($connectionApply.status -ne 'current' -or $connectionPost.status -ne 'current' -or $connectionPost.blockState -ne 'clean'){throw 'Connection failed'}
if(-not [IO.File]::ReadAllText((Join-Path $root 'AGENTS.md')).EndsWith($outside)){throw 'Outside AGENTS text changed'}
$after=@{}
foreach($name in $protected){
 $after[$name]=(Get-FileHash -LiteralPath (Join-Path $root $name) -Algorithm SHA256).Hash.ToLowerInvariant()
 if($before[$name] -cne $after[$name]){throw "Helper changed $name"}
}
[ordered]@{check=$connectionCheck;apply=$connectionApply;post=$connectionPost;protectedBefore=$before;protectedAfter=$after;
 outsideAgentsPreserved=$true;combinedDraftGlue=[bool]$Combined}|ConvertTo-Json -Depth 10
