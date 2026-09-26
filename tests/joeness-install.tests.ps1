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
 $mismatchHome=Join-Path $root mismatch
 Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $mismatchHome).status current mismatchFixture
 $statePath=Join-Path $mismatchHome joewrks-harness-state.json
 $validState=[IO.File]::ReadAllText($statePath)
 foreach($identity in @(
  @{version='0.2-astra-judgment';hash='70997d6447a45b41b3f3f54816bbed6dd1543d7ad6e4d1b2f6a79c6f955c3888'},
  @{version='unrecognized-package';hash=('0'*64)},
  @{version='0.2';hash=('0'*64)}
 )){
  $state=$validState|ConvertFrom-Json
  $state.releaseVersion=$identity.version; $state.manifestSha256=$identity.hash
  [IO.File]::WriteAllText($statePath,($state|ConvertTo-Json -Compress),(New-Object Text.UTF8Encoding($false)))
  $before=@(Get-ChildItem -LiteralPath $mismatchHome -File -Recurse|Sort-Object FullName|ForEach-Object {$_.FullName+'='+(Get-FileHash -LiteralPath $_.FullName).Hash})
  foreach($mode in @('Check','Apply','Remove')){
   $options=@{CodexHome=$mismatchHome};$options[$mode]=$true
   $r=Invoke-JoenessHarnessSync @options
   Eq $r.status blocked "mismatched identity $mode"
   $after=@(Get-ChildItem -LiteralPath $mismatchHome -File -Recurse|Sort-Object FullName|ForEach-Object {$_.FullName+'='+(Get-FileHash -LiteralPath $_.FullName).Hash})
   Eq ($after -join ';') ($before -join ';') "mismatched identity $mode preserves every file"
  }
 }
 foreach($unsupported in @('AgentsHome','BackupRoot','IncludeDesignFrontend')){
  $options=@{Check=$true;CodexHome=(Join-Path $root unsupported)}
  $options[$unsupported]=if($unsupported -eq 'IncludeDesignFrontend'){$true}else{Join-Path $root unused}
  $rejected=$false
  try { $null=Invoke-JoenessHarnessSync @options }catch [System.Management.Automation.ParameterBindingException]{$rejected=$true}
  Eq $rejected $true "$unsupported is not a current interface"
  Eq (Test-Path (Join-Path $root unsupported)) $false unsupportedNoWrite
 }
 $collision=Join-Path $root collision
 $null=New-Item -ItemType Directory -Path (Join-Path $collision skills/joeness-setup) -Force
 [IO.File]::WriteAllText((Join-Path $collision skills/joeness-setup/SKILL.md),'user-owned')
 Eq (Invoke-JoenessHarnessSync -Apply -CodexHome $collision).status blocked collision
 Eq (Test-Path (Join-Path $collision AGENTS.md)) $false noPartialCollision
 Write-Host 'PASS install lifecycle, no-op, drift, removal, concurrent-write preservation, mismatched-state rejection, current-only parameters, unowned collision'
}finally{
 if([IO.Path]::GetFullPath($root).StartsWith([IO.Path]::GetTempPath()) -and (Split-Path $root -Leaf) -like 'joeness-install-test-*'){Remove-Item -LiteralPath $root -Recurse -Force}
}
