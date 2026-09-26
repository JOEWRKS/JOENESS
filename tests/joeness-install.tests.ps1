Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent $PSScriptRoot
. (Join-Path $repo 'scripts/sync-harness.ps1')
function Eq($a,$b,$m){if($a -cne $b){throw "$m expected=$b actual=$a"}}
$root=Join-Path ([IO.Path]::GetTempPath()) ('joeness-install-test-'+[guid]::NewGuid().ToString('N'))
$null=New-Item -ItemType Directory -Path $root
try {
 $homePath=Join-Path $root codex
 $r=Invoke-JoenessHarnessSync -Check -CodexHome $homePath
 Eq $r.status ready check
 $r=Invoke-JoenessHarnessSync -Apply -CodexHome $homePath
 Eq $r.status current apply
 Eq ($r.activeSkills -join ',') joeness-setup soleSkill
 $skill=Join-Path $homePath skills/joeness-setup/SKILL.md
 Eq (Test-Path $skill) $true skillExists
 Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $homePath -AfterWrite {throw 'no-op wrote'}).status current noop
 [IO.File]::AppendAllText($skill,'USER')
 Eq (Invoke-JoenessHarnessSync -Remove -CodexHome $homePath).status blocked drift
 Eq ([IO.File]::ReadAllText($skill).EndsWith('USER')) $true preserve
 Copy-Item -LiteralPath (Join-Path $repo skills/joeness-setup/SKILL.md) -Destination $skill
 Eq (Invoke-JoenessHarnessSync -Remove -CodexHome $homePath).status removed remove
 Eq (Test-Path $skill) $false skillRemoved
 Eq (Invoke-JoenessHarnessSync -Check -CodexHome $homePath).status ready removedCheck
 $r=Invoke-JoenessHarnessSync -Apply -CodexHome $homePath -AfterWrite {param($s) if($s -eq 'AGENTS.md'){[IO.File]::AppendAllText((Join-Path $homePath AGENTS.md),'USER');throw 'failure'}}
 Eq $r.status partial partial
 Eq ([IO.File]::ReadAllText((Join-Path $homePath AGENTS.md)).EndsWith('USER')) $true rollbackPreserves
 $previous=Join-Path $root previous
 $null=New-Item -ItemType Directory -Path (Join-Path $previous scripts) -Force
 $null=New-Item -ItemType Directory -Path (Join-Path $previous vendor) -Force
 foreach($path in @('scripts/sync-harness.ps1','vendor/source-manifest.json','astra-judgment-core.md')){
  $lines=@(& git -C $repo show "ab3460fd28952baa5c2ad472eed1dd6196054d8e:$path")
  if($LASTEXITCODE -ne 0){throw 'historical source unavailable'}
  [IO.File]::WriteAllText((Join-Path $previous $path),(($lines -join "`n")+"`n"),(New-Object Text.UTF8Encoding($false)))
 }
 $upgradeHome=Join-Path $root upgrade
 . (Join-Path $previous scripts/sync-harness.ps1)
 Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $upgradeHome).status current predecessor
 $coreBefore=[Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $upgradeHome AGENTS.md)))
 . (Join-Path $repo scripts/sync-harness.ps1)
 Eq (Invoke-JoenessHarnessSync -Check -CodexHome $upgradeHome).status ready upgradeCheck
 Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $upgradeHome).status current upgrade
 Eq ([Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $upgradeHome AGENTS.md)))) $coreBefore coreUnchanged
 Eq (Test-Path (Join-Path $upgradeHome skills/joeness-setup/SKILL.md)) $true upgradedSkill
 Eq (Invoke-JoenessHarnessSync -Remove -CodexHome $upgradeHome).status removed upgradedRemove
 $collision=Join-Path $root collision
 $null=New-Item -ItemType Directory -Path (Join-Path $collision skills/joeness-setup) -Force
 [IO.File]::WriteAllText((Join-Path $collision skills/joeness-setup/SKILL.md),'user-owned')
 Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $collision).status blocked collision
 Eq (Test-Path (Join-Path $collision AGENTS.md)) $false noPartialCollision
 Write-Host 'PASS install lifecycle, no-op, drift, removal, concurrent-write preservation, exact predecessor upgrade, unowned collision'
}finally{
 if([IO.Path]::GetFullPath($root).StartsWith([IO.Path]::GetTempPath()) -and (Split-Path $root -Leaf) -like 'joeness-install-test-*'){Remove-Item -LiteralPath $root -Recurse -Force}
}
