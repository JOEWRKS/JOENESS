Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
. (Join-Path $repo 'skills/joeness-setup/scripts/project-setup.ps1')
$utf8 = New-Object Text.UTF8Encoding($false)
$script:passed = 0
function Eq($actual,$expected,$label) { if ($actual -cne $expected) { throw "$label expected=$expected actual=$actual" } }
function Bytes($path) { [Convert]::ToBase64String([IO.File]::ReadAllBytes($path)) }
function Fixture {
    $p = Join-Path ([IO.Path]::GetTempPath()) ('joeness-project-test-'+[guid]::NewGuid().ToString('N'))
    $null=New-Item -ItemType Directory -Path $p
    & git -C $p init -q
    $p
}
function Apply($p,$body='Read TASK.md. Record authorized work.') {
    $c=Invoke-JoenessProjectSetup -Check -ProjectPath $p
    Invoke-JoenessProjectSetup -Apply -ProjectPath $p -ExpectedRoot $p -ExpectedTargetHash $c.targetHash -ExpectedStateHash $c.stateHash -ManagedBodyBase64 ([Convert]::ToBase64String($utf8.GetBytes($body)))
}
function Detach($p) {
    $c=Invoke-JoenessProjectSetup -Check -ProjectPath $p
    Invoke-JoenessProjectSetup -Detach -ProjectPath $p -ExpectedRoot $c.projectRoot -ExpectedTargetHash $c.targetHash -ExpectedStateHash $c.stateHash
}
function Case($name,[scriptblock]$body) {
    $p=Fixture
    try { & $body $p; $script:passed++; Write-Host "PASS $name" }
    finally {
        $resolved=[IO.Path]::GetFullPath($p)
        if (-not $resolved.StartsWith([IO.Path]::GetTempPath()) -or (Split-Path $resolved -Leaf) -notlike 'joeness-project-test-*') { throw 'unsafe cleanup' }
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
Case 'InitialApplyAndNoOp' {
    param($p)
    Eq (Invoke-JoenessProjectSetup -Check -ProjectPath $p).status ready check
    Eq (Apply $p).status current apply
    $a=Join-Path $p AGENTS.md; $s=Join-Path $p .joeness/setup-state.json
    $b=Bytes $a; $t=(Get-Item $a).LastWriteTimeUtc.Ticks; $st=(Get-Item $s).LastWriteTimeUtc.Ticks
    $c=Invoke-JoenessProjectSetup -Check -ProjectPath $p
    $r=Invoke-JoenessProjectSetup -Apply -ProjectPath $p -ExpectedRoot $c.projectRoot -ExpectedTargetHash $c.targetHash -ExpectedStateHash $c.stateHash -ManagedBodyBase64 ([Convert]::ToBase64String($utf8.GetBytes('Read TASK.md. Record authorized work.'))) -AfterWrite { throw 'no-op writer called' }
    Eq $r.status current noop; Eq (Bytes $a) $b bytes; Eq (Get-Item $a).LastWriteTimeUtc.Ticks $t timestamp; Eq (Get-Item $s).LastWriteTimeUtc.Ticks $st stateTimestamp
    Eq @( $r.changedTargets ).Count 0 targets
}
Case 'InsideEditSurvivesFreshCheck' {
    param($p)
    $null=Apply $p
    $a=Join-Path $p AGENTS.md; $s=Join-Path $p .joeness/setup-state.json
    [IO.File]::WriteAllText($a,[IO.File]::ReadAllText($a).Replace('Read TASK.md.','User edited. Read TASK.md.'),$utf8)
    $b=Bytes $a; $sb=Bytes $s
    Eq (Invoke-JoenessProjectSetup -Check -ProjectPath $p).blockState edited classification
    Eq (Apply $p 'replacement').status blocked update
    Eq (Detach $p).status blocked detach
    Eq (Bytes $a) $b preserved; Eq (Bytes $s) $sb statePreserved
}
foreach ($eol in @("`n","`r`n")) {
 foreach ($bom in @($false,$true)) {
  foreach ($ending in @('',$eol)) {
   Case "OutsideBytesAndDetach bom=$bom eol=$($eol.Length) ending=$($ending.Length)" {
    param($p)
    $a=Join-Path $p AGENTS.md
    $enc=New-Object Text.UTF8Encoding($bom)
    [IO.File]::WriteAllText($a,("user"+$ending),$enc)
    $original=Bytes $a
    Eq (Apply $p).status current apply
    # Appended outside content must survive update and detach.
    [IO.File]::AppendAllText($a,'outside',$utf8)
    Eq (Apply $p 'updated body').status current update
    Eq (Detach $p).status detached detach
    Eq (Bytes $a) ([Convert]::ToBase64String(([Convert]::FromBase64String($original)+$utf8.GetBytes('outside')))) outside
    Eq (Detach $p).status detached repeat
    Eq (Test-Path $a) $true keepFile
   }
  }
 }
}
Case 'MalformedOrUnownedOrLegacy' {
 param($p)
 $a=Join-Path $p AGENTS.md
 foreach($value in @('<!-- JOENESS-SETUP:BEGIN -->','<!-- JOENESS-SETUP:BEGIN -->x<!-- JOENESS-SETUP:END -->','<!-- JOEWRKS-PROJECT:BEGIN -->old<!-- JOEWRKS-PROJECT:END -->')) {
  [IO.File]::WriteAllText($a,$value,$utf8); $b=Bytes $a
  Eq (Apply $p).status blocked collision; Eq (Bytes $a) $b unchanged
 }
}
Case 'StateTamperAndOneSidedState' {
 param($p)
 $null=Apply $p; $s=Join-Path $p .joeness/setup-state.json; $a=Join-Path $p AGENTS.md
 $original=[IO.File]::ReadAllText($s)
 [IO.File]::WriteAllText($s,$original.Replace('AGENTS.md','../outside.md'),$utf8)
 Eq (Detach $p).status blocked tamper
 [IO.File]::WriteAllText($s,$original,$utf8)
 Remove-Item -LiteralPath $a
 Eq (Apply $p).status blocked missingTarget
}
Case 'StateWriteFailureAfterUserEdit' {
 param($p)
 $c=Invoke-JoenessProjectSetup -Check -ProjectPath $p
 $args=@{Apply=$true;ProjectPath=$p;ExpectedRoot=$c.projectRoot;ExpectedTargetHash=$c.targetHash;ExpectedStateHash=$c.stateHash;ManagedBodyBase64=[Convert]::ToBase64String($utf8.GetBytes('body'))}
 $r=Invoke-JoenessProjectSetup @args -AfterWrite { param($stage) if($stage -eq 'AGENTS.md'){throw 'injected failure'} }
 Eq $r.status failed rollback; Eq $r.rollback complete restored; Eq (Test-Path (Join-Path $p AGENTS.md)) $false initialAbsent
 $r=Invoke-JoenessProjectSetup @args -AfterWrite { param($stage) if($stage -eq 'AGENTS.md'){[IO.File]::AppendAllText((Join-Path $p AGENTS.md),'USER EDIT');throw 'failure'} }
 Eq $r.status partial partial; Eq $r.unresolvedTargets.Count 1 unresolved
 Eq ([IO.File]::ReadAllText((Join-Path $p AGENTS.md)).EndsWith('USER EDIT')) $true userPreserved
}
Case 'SnapshotAndRootDrift' {
 param($p)
 $c=Invoke-JoenessProjectSetup -Check -ProjectPath $p
 [IO.File]::WriteAllText((Join-Path $p AGENTS.md),'new edit',$utf8)
 $args=@{Apply=$true;ProjectPath=$p;ExpectedRoot=$c.projectRoot;ExpectedTargetHash=$c.targetHash;ExpectedStateHash=$c.stateHash;ManagedBodyBase64=[Convert]::ToBase64String($utf8.GetBytes('body'))}
 Eq (Invoke-JoenessProjectSetup @args).status blocked stale
 $args.ExpectedRoot=Split-Path $p -Parent
 Eq (Invoke-JoenessProjectSetup @args).status blocked root
}
Case 'CloneRebindsRelativeState' {
 param($p)
 $null=Apply $p
 $clone=Fixture
 try {
  Copy-Item -LiteralPath (Join-Path $p AGENTS.md) -Destination $clone
  Copy-Item -LiteralPath (Join-Path $p .joeness) -Destination $clone -Recurse
  Eq (Invoke-JoenessProjectSetup -Check -ProjectPath $clone).status current clone
  Eq (Detach $clone).status detached detachClone
 } finally { Remove-Item -LiteralPath $clone -Recurse -Force }
}
Case 'InvalidUtf8AndOverride' {
 param($p)
 $a=Join-Path $p AGENTS.md
 [IO.File]::WriteAllBytes($a,[byte[]]@(255,254,65,0))
 $b=Bytes $a; Eq (Apply $p).status blocked utf16; Eq (Bytes $a) $b same
 Remove-Item $a
 [IO.File]::WriteAllText((Join-Path $p AGENTS.override.md),'override',$utf8)
 Eq (Apply $p).status blocked override
}
Case 'StateSnapshotDrift' {
 param($p)
 $null=Apply $p
 $c=Invoke-JoenessProjectSetup -Check -ProjectPath $p
 [IO.File]::AppendAllText((Join-Path $p .joeness/setup-state.json)," ")
 $r=Invoke-JoenessProjectSetup -Detach -ProjectPath $p -ExpectedRoot $p -ExpectedTargetHash $c.targetHash -ExpectedStateHash $c.stateHash
 Eq $r.status blocked stateChanged
}
Case 'ReparseAndNonGitFailClosed' {
 param($p)
 $other=Fixture
 try {
  $link=Join-Path $p .joeness
  $null=New-Item -ItemType Junction -Path $link -Target $other
  Eq (Apply $p).status blocked junction
  Eq (Test-Path (Join-Path $other setup-state.json)) $false externalUntouched
  [IO.Directory]::Delete($link)
  $child=Join-Path $other plain
  $null=New-Item -ItemType Directory -Path $child
  Eq (Invoke-JoenessProjectSetup -Check -ProjectPath $child).status blocked nonRoot
 }finally{Remove-Item -LiteralPath $other -Recurse -Force}
}
Case 'RealGitCloneRebindsCheckoutEolButNotContentEdits' {
 param($p)
 & git -C $p config core.autocrlf false
 [IO.File]::WriteAllText((Join-Path $p AGENTS.md),"user prefix`n",$utf8)
 $null=Apply $p
 & git -C $p add AGENTS.md .joeness/setup-state.json
 & git -C $p -c user.name=Fixture -c user.email=fixture@example.invalid commit -qm baseline
 $clone=Join-Path ([IO.Path]::GetTempPath()) ('joeness-project-test-'+[guid]::NewGuid().ToString('N'))
 try {
  & git -c core.autocrlf=true clone -q $p $clone
  Eq $LASTEXITCODE 0 clone
  & git -C $clone config core.autocrlf true
  Eq ((& git -C $clone status --porcelain) -join '') '' cleanCheckout
  Eq ([IO.File]::ReadAllText((Join-Path $clone AGENTS.md)).Contains("`r`n")) $true checkoutCRLF
  Eq (Invoke-JoenessProjectSetup -Check -ProjectPath $clone).status current eolRebound
  [IO.File]::AppendAllText((Join-Path $clone AGENTS.md),'outside',$utf8)
  Eq (Invoke-JoenessProjectSetup -Check -ProjectPath $clone).status current outsideAllowed
  Eq (Detach $clone).status detached cloneDetach
  Eq ([IO.File]::ReadAllText((Join-Path $clone AGENTS.md))) "user prefix`r`noutside" preservedClonePrefix
 }finally{if(Test-Path $clone){Remove-Item -LiteralPath $clone -Recurse -Force}}
 $null=Apply $p
 [IO.File]::WriteAllText((Join-Path $p AGENTS.md),[IO.File]::ReadAllText((Join-Path $p AGENTS.md)).Replace("`n","`r`n").Replace('Read TASK.md.','USER EDIT'),$utf8)
 Eq (Invoke-JoenessProjectSetup -Check -ProjectPath $p).blockState edited realContentDrift
 Eq (Detach $p).status blocked protectRealEdit
}
Write-Host "PASS $script:passed project safety cases"
