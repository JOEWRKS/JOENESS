[CmdletBinding()]
param(
 [switch]$Check, [switch]$Apply, [switch]$Detach, [string]$ProjectPath,
 [string]$ExpectedRoot, [string]$ExpectedTargetHash, [string]$ExpectedStateHash,
 [string]$ManagedBodyBase64
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$script:SetupUtf8=New-Object Text.UTF8Encoding($false,$true)
$script:SetupBegin='<!-- JOENESS-SETUP:BEGIN -->'
$script:SetupEnd='<!-- JOENESS-SETUP:END -->'
function Get-SetupHash([byte[]]$Bytes) {
 $h=[Security.Cryptography.SHA256]::Create()
 try { ([BitConverter]::ToString($h.ComputeHash($Bytes))).Replace('-','').ToLowerInvariant() } finally {$h.Dispose()}
}
function Assert-SetupPath([string]$Path) {
 $cursor=[IO.Path]::GetFullPath($Path)
 while($cursor) {
  if(Test-Path -LiteralPath $cursor) {
   if(((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw "Reparse path blocked: $cursor"}
  }
  $parent=Split-Path -Parent $cursor
  if($parent -eq $cursor){break}
  $cursor=$parent
 }
}
function Get-SetupSnapshot([string]$Path) {
 Assert-SetupPath $Path
 if(Test-Path -LiteralPath $Path) {
  if(-not(Test-Path -LiteralPath $Path -PathType Leaf)){throw "Expected a regular file: $Path"}
  $b=[IO.File]::ReadAllBytes($Path)
  return [pscustomobject]@{Path=$Path;Hash=(Get-SetupHash $b);Bytes=$b}
 }
 [pscustomobject]@{Path=$Path;Hash='absent';Bytes=[byte[]]@()}
}
function Write-SetupFile([string]$Path,[byte[]]$Bytes) {
 Assert-SetupPath $Path
 $parent=Split-Path -Parent $Path
 if(-not(Test-Path -LiteralPath $parent)){$null=New-Item -ItemType Directory -Path $parent}
 Assert-SetupPath $Path
 $tmp="$Path.joeness.$([guid]::NewGuid().ToString('N')).tmp"
 try {
  [IO.File]::WriteAllBytes($tmp,$Bytes)
  if(Test-Path -LiteralPath $Path){[IO.File]::Replace($tmp,$Path,[NullString]::Value)}else{[IO.File]::Move($tmp,$Path)}
 } finally { if(Test-Path -LiteralPath $tmp){Remove-Item -LiteralPath $tmp -Force} }
}
# Shared bounded transaction primitive: callers provide exact preimages and desired bytes.
# Rollback never overwrites a target that no longer matches this transaction's own write.
function Invoke-SetupTransaction($Entries,[scriptblock]$AfterWrite,[scriptblock]$Guard) {
 $written=New-Object Collections.Generic.List[object]
 $unresolved=New-Object Collections.Generic.List[string]
 try {
  foreach($entry in $Entries) {
   if($null -ne $Guard){& $Guard}
   foreach($candidate in $Entries) {
    $prior=@($written | Where-Object {$_.Path -ceq $candidate.Path})
    $expected=if($prior.Count){$prior[0].NewHash}else{$candidate.Before.Hash}
    if((Get-SetupSnapshot $candidate.Path).Hash -cne $expected){throw "Target changed during transaction: $($candidate.Label)"}
   }
   if($entry.NewHash -ceq $entry.Before.Hash){continue}
   # Record intent before writing; detect an atomic writer failure after replacement.
   $written.Add($entry)
   if($entry.NewHash -ceq 'absent'){Remove-Item -LiteralPath $entry.Path -Force}
   else {Write-SetupFile $entry.Path $entry.Bytes}
   if($null -ne $AfterWrite){& $AfterWrite $entry.Label}
  }
  if($null -ne $Guard){& $Guard}
  foreach($entry in $Entries){if((Get-SetupSnapshot $entry.Path).Hash -cne $entry.NewHash){throw "Post-write mismatch: $($entry.Label)"}}
  return [pscustomobject]@{Status='success';Changed=@($written | ForEach-Object {$_.Label});Rollback=$null;Unresolved=@();Error=$null}
 } catch {
  $message=$_.Exception.Message
  for($i=$written.Count-1;$i -ge 0;$i--) {
   $entry=$written[$i]
   try {
    $now=Get-SetupSnapshot $entry.Path
    if($now.Hash -ceq $entry.Before.Hash){continue}
    if($now.Hash -cne $entry.NewHash){throw 'Concurrent edit preserved'}
    if($entry.Before.Hash -ceq 'absent'){Remove-Item -LiteralPath $entry.Path -Force}
    else{Write-SetupFile $entry.Path $entry.Before.Bytes}
   }catch{$unresolved.Add($entry.Label)}
  }
  $status=if($unresolved.Count){'partial'}else{'failed'}
  $rollback=if($unresolved.Count){'incomplete'}else{'complete'}
  return [pscustomobject]@{Status=$status;Changed=@($unresolved);Rollback=$rollback;Unresolved=@($unresolved);Error=$message}
 }
}
function New-SetupEntry($Before,[byte[]]$Bytes,[string]$Label,[switch]$Delete) {
 $hash=if($Delete){'absent'}else{Get-SetupHash $Bytes}
 [pscustomobject]@{Path=$Before.Path;Before=$Before;Bytes=$Bytes;NewHash=$hash;Label=$Label}
}
function Resolve-SetupRoot([string]$Value) {
 if([string]::IsNullOrWhiteSpace($Value)){throw 'ProjectPath is required'}
 $p=[IO.Path]::GetFullPath($Value).TrimEnd('\','/')
 Assert-SetupPath $p
 if(-not(Test-Path -LiteralPath $p -PathType Container)){throw 'Project directory is missing'}
 $git=@(& git -C $p rev-parse --show-toplevel 2>$null)
 if($LASTEXITCODE -ne 0 -or $git.Count -ne 1){throw 'Git root required; no git init is performed'}
 $root=[IO.Path]::GetFullPath($git[0]).TrimEnd('\','/')
 if($p -ine $root){throw 'ProjectPath must name the actual Git root'}
 if(Test-Path -LiteralPath (Join-Path $root 'AGENTS.override.md')){throw 'AGENTS.override.md takes precedence; resolve it explicitly'}
 $root
}
function Get-SetupCommittedText([string]$Root,[string]$RelativePath) {
 # Read raw Git blob bytes, without shell pipelines or checkout/textconv filters.
 $info=New-Object Diagnostics.ProcessStartInfo
 $info.FileName='git';$info.Arguments='-C "'+$Root+'" cat-file blob "HEAD:'+$RelativePath+'"'
 $info.UseShellExecute=$false;$info.CreateNoWindow=$true
 $info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
 $proc=New-Object Diagnostics.Process;$proc.StartInfo=$info
 $buffer=New-Object IO.MemoryStream
 try {
  $null=$proc.Start();$proc.StandardOutput.BaseStream.CopyTo($buffer)
  $errorText=$proc.StandardError.ReadToEnd();$proc.WaitForExit()
  if($proc.ExitCode -ne 0){throw "Committed setup baseline unavailable: $errorText"}
  $script:SetupUtf8.GetString($buffer.ToArray())
 }finally{$buffer.Dispose();$proc.Dispose()}
}
function Test-SetupEolRebind([string]$Root,[string]$CurrentBlock,[string]$AppliedBlock,[string]$StateText) {
 # Only LF/CRLF-equivalent content, corroborated by committed AGENTS AND state.
 # Outside user edits do not need to match HEAD. Semantic internal edits still block.
 $currentLf=$CurrentBlock.Replace("`r`n","`n")
 $appliedLf=$AppliedBlock.Replace("`r`n","`n")
 if($currentLf.Contains("`r") -or $appliedLf.Contains("`r") -or $currentLf -cne $appliedLf){return $false}
 try {
  $committedState=Get-SetupCommittedText $Root '.joeness/setup-state.json'
  if($committedState.Replace("`r`n","`n") -cne $StateText.Replace("`r`n","`n")){return $false}
  $committed=Get-SetupCommittedText $Root 'AGENTS.md'
  if([regex]::Matches($committed,[regex]::Escape($script:SetupBegin)).Count -ne 1 -or [regex]::Matches($committed,[regex]::Escape($script:SetupEnd)).Count -ne 1){return $false}
  $start=$committed.IndexOf($script:SetupBegin,[StringComparison]::Ordinal)
  $end=$committed.IndexOf($script:SetupEnd,[StringComparison]::Ordinal)
  if($end -lt $start){return $false}
  $committed.Substring($start,$end+$script:SetupEnd.Length-$start).Replace("`r`n","`n") -ceq $appliedLf
 }catch{return $false}
}
function Read-SetupObservation([string]$Root) {
 $target=Get-SetupSnapshot (Join-Path $Root 'AGENTS.md')
 $state=Get-SetupSnapshot (Join-Path $Root '.joeness/setup-state.json')
 $text=$script:SetupUtf8.GetString($target.Bytes)
 $blockState='absent';$record=$null;$start=-1;$length=0;$eolRebound=$false
 if($text.Contains('JOEWRKS-PROJECT:')){throw 'legacy: historical project markers require explicit migration'}
 $bc=[regex]::Matches($text,[regex]::Escape($script:SetupBegin)).Count
 $ec=[regex]::Matches($text,[regex]::Escape($script:SetupEnd)).Count
 if($bc -ne $ec -or $bc -gt 1){throw 'malformed: expected one complete marker pair'}
 if($bc -eq 1) {
  $start=$text.IndexOf($script:SetupBegin,[StringComparison]::Ordinal)
  $end=$text.IndexOf($script:SetupEnd,[StringComparison]::Ordinal)
  if($end -lt $start){throw 'malformed: reversed marker pair'}
  $length=$end+$script:SetupEnd.Length-$start
  $blockState='unowned'
 }
 if($state.Hash -ne 'absent') {
  $stateText=$script:SetupUtf8.GetString($state.Bytes)
  $record=$stateText|ConvertFrom-Json
  $keys=@($record.PSObject.Properties.Name|Sort-Object)
  if(($keys -join ',') -cne 'appliedBlockBase64,appliedBlockSha256,ownedBoundary,schemaVersion,targetRelativePath,toolVersion'){throw 'malformed: state schema fields'}
  if($record.schemaVersion -isnot [int] -or $record.schemaVersion -ne 1 -or $record.toolVersion -cne '0.2' -or $record.targetRelativePath -cne 'AGENTS.md'){throw 'malformed: state identity'}
  $base=[Convert]::FromBase64String($record.appliedBlockBase64)
  if([Convert]::ToBase64String($base) -cne $record.appliedBlockBase64 -or (Get-SetupHash $base) -cne $record.appliedBlockSha256){throw 'malformed: state block hash'}
  $bt=$script:SetupUtf8.GetString($base)
  if(-not $bt.StartsWith($script:SetupBegin) -or -not $bt.EndsWith($script:SetupEnd) -or [regex]::Matches($bt,'<!-- JOENESS-SETUP:').Count -ne 2){throw 'malformed: state markers'}
  if((@($record.ownedBoundary.PSObject.Properties.Name|Sort-Object)-join ',') -cne 'prefixBase64,suffixBase64'){throw 'malformed: boundary schema'}
  foreach($v in @($record.ownedBoundary.prefixBase64,$record.ownedBoundary.suffixBase64)){
   $separator=$script:SetupUtf8.GetString([Convert]::FromBase64String($v))
   if($separator -cnotmatch '^(\r?\n){0,2}$'){throw 'malformed: boundary bytes'}
  }
  if($bc -ne 1){throw 'malformed: state exists without managed block'}
  $current=$script:SetupUtf8.GetBytes($text.Substring($start,$length))
  $blockState=if((Get-SetupHash $current) -ceq $record.appliedBlockSha256){'clean'}else{'edited'}
  if($blockState -eq 'edited' -and (Test-SetupEolRebind $Root ($script:SetupUtf8.GetString($current)) $bt $stateText)){
   $blockState='clean';$eolRebound=$true
  }
 }
 if($blockState -eq 'unowned'){throw 'unowned: existing markers have no applied baseline'}
 [pscustomobject]@{Target=$target;State=$state;Text=$text;Record=$record;Start=$start;Length=$length;BlockState=$blockState;EolRebound=$eolRebound}
}
function Invoke-JoenessProjectSetup {
 [CmdletBinding()]
 param(
  [Parameter(Mandatory,ParameterSetName='Check')][switch]$Check,
  [Parameter(Mandatory,ParameterSetName='Apply')][switch]$Apply,
  [Parameter(Mandatory,ParameterSetName='Detach')][switch]$Detach,
  [Parameter(Mandatory)][string]$ProjectPath,
  [Parameter(Mandatory,ParameterSetName='Apply')][Parameter(Mandatory,ParameterSetName='Detach')][string]$ExpectedRoot,
  [Parameter(Mandatory,ParameterSetName='Apply')][Parameter(Mandatory,ParameterSetName='Detach')][ValidatePattern('^(absent|[a-f0-9]{64})$')][string]$ExpectedTargetHash,
  [Parameter(Mandatory,ParameterSetName='Apply')][Parameter(Mandatory,ParameterSetName='Detach')][ValidatePattern('^(absent|[a-f0-9]{64})$')][string]$ExpectedStateHash,
  [Parameter(Mandatory,ParameterSetName='Apply')][string]$ManagedBodyBase64,
  [scriptblock]$AfterWrite
 )
 $action=if($Apply){'apply'}elseif($Detach){'detach'}else{'check'}
 $r=[ordered]@{action=$action;status='blocked';projectRoot=$null;target='AGENTS.md';targetHash='absent';statePath='.joeness/setup-state.json';stateHash='absent';blockState='malformed';changedTargets=@();blockers=@();rollback=$null;unresolvedTargets=@()}
 try {
  $root=Resolve-SetupRoot $ProjectPath; $r.projectRoot=$root
  $o=Read-SetupObservation $root
  $r.targetHash=$o.Target.Hash; $r.stateHash=$o.State.Hash; $r.blockState=$o.BlockState
  if($o.BlockState -eq 'edited'){throw 'Managed block edited since last application; preserve and review a scoped correction'}
  if($Check){$r.status=if($o.BlockState -eq 'clean'){'current'}else{'ready'};return [pscustomobject]$r}
  if([IO.Path]::GetFullPath($ExpectedRoot).TrimEnd('\','/') -ine $root){throw 'ExpectedRoot mismatch'}
  if($ExpectedTargetHash -cne $o.Target.Hash -or $ExpectedStateHash -cne $o.State.Hash){throw 'Snapshot mismatch; inspect current targets'}
  if($Detach -and $o.BlockState -eq 'absent'){$r.status='detached';return [pscustomobject]$r}
  $before=$o.Text; $prefix='';$suffix=''
  if($o.BlockState -eq 'clean'){
   $prefix=$script:SetupUtf8.GetString([Convert]::FromBase64String($o.Record.ownedBoundary.prefixBase64))
   $suffix=$script:SetupUtf8.GetString([Convert]::FromBase64String($o.Record.ownedBoundary.suffixBase64))
   if($o.EolRebound){
    $nl=if($before.Substring($o.Start,$o.Length).Contains("`r`n")){"`r`n"}else{"`n"}
    $prefix=$prefix -replace "\r\n|\n",$nl;$suffix=$suffix -replace "\r\n|\n",$nl
   }
  }else{
   $nl=if($before.Contains("`r`n")){"`r`n"}else{"`n"}
   if($before.Length){$prefix=if($before.EndsWith("`n")){$nl}else{$nl+$nl}}
   $suffix=$nl
  }
  if($Detach){
   $left=$before.Substring(0,$o.Start);$right=$before.Substring($o.Start+$o.Length)
   if($prefix.Length -and $left.EndsWith($prefix)){$left=$left.Substring(0,$left.Length-$prefix.Length)}
   if($suffix.Length -and $right.StartsWith($suffix)){$right=$right.Substring($suffix.Length)}
   $newText=$left+$right
   $stateEntry=New-SetupEntry $o.State @() '.joeness/setup-state.json' -Delete
  }else{
   $body=$script:SetupUtf8.GetString([Convert]::FromBase64String($ManagedBodyBase64))
   if([string]::IsNullOrWhiteSpace($body) -or $body.Contains('JOENESS-SETUP:') -or $body.Contains('JOEWRKS-PROJECT:') -or $body.Contains([char]0)){throw 'Invalid managed body'}
   $nl=if($before.Contains("`r`n")){"`r`n"}else{"`n"}
   $body=$body -replace "\r\n|\r|\n",$nl
   $block=$script:SetupBegin+$nl+$body.TrimEnd("`r","`n")+$nl+$script:SetupEnd
   $blockBytes=$script:SetupUtf8.GetBytes($block)
   if($o.BlockState -eq 'clean'){$newText=$before.Substring(0,$o.Start)+$block+$before.Substring($o.Start+$o.Length)}
   else{$newText=$before+$prefix+$block+$suffix}
   $record=[ordered]@{schemaVersion=1;toolVersion='0.2';targetRelativePath='AGENTS.md';appliedBlockBase64=[Convert]::ToBase64String($blockBytes);appliedBlockSha256=Get-SetupHash $blockBytes;ownedBoundary=[ordered]@{prefixBase64=[Convert]::ToBase64String($script:SetupUtf8.GetBytes($prefix));suffixBase64=[Convert]::ToBase64String($script:SetupUtf8.GetBytes($suffix))}}
   $stateBytes=$script:SetupUtf8.GetBytes(($record|ConvertTo-Json -Depth 5 -Compress)+"`n")
   $stateEntry=New-SetupEntry $o.State $stateBytes '.joeness/setup-state.json'
  }
  $entries=@((New-SetupEntry $o.Target ($script:SetupUtf8.GetBytes($newText)) 'AGENTS.md'),$stateEntry)
  $guard={if((Resolve-SetupRoot $ProjectPath) -ine $root){throw 'Root changed'}}
  $tx=Invoke-SetupTransaction $entries $AfterWrite $guard
  $r.status=if($tx.Status -eq 'success'){if($Detach){'detached'}else{'current'}}else{$tx.Status}
  $r.changedTargets=$tx.Changed;$r.rollback=$tx.Rollback;$r.unresolvedTargets=$tx.Unresolved
  if($tx.Error){$r.blockers=@($tx.Error)}
  $r.targetHash=(Get-SetupSnapshot $o.Target.Path).Hash;$r.stateHash=(Get-SetupSnapshot $o.State.Path).Hash
  if($tx.Status -eq 'success'){$r.blockState=if($Detach){'absent'}else{'clean'}}
 }catch{
  $message=$_.Exception.Message;$r.blockers=@($message)
  foreach($label in @('legacy','unowned','malformed')){if($message.StartsWith($label+':')){$r.blockState=$label}}
 }
 [pscustomobject]$r
}
if($MyInvocation.InvocationName -ne '.'){
 try{
  $argsMap=@{ProjectPath=$ProjectPath}
  if($Apply -or $Detach){
   $argsMap.ExpectedRoot=$ExpectedRoot;$argsMap.ExpectedTargetHash=$ExpectedTargetHash;$argsMap.ExpectedStateHash=$ExpectedStateHash
   if($Apply){$argsMap.Apply=$true;$argsMap.ManagedBodyBase64=$ManagedBodyBase64}else{$argsMap.Detach=$true}
  }else{$argsMap.Check=$true}
  if(([int][bool]$Check+[int][bool]$Apply+[int][bool]$Detach) -gt 1){throw 'Choose one mode'}
  $result=Invoke-JoenessProjectSetup @argsMap
  $result|ConvertTo-Json -Depth 6 -Compress
  if($result.status -in @('ready','current','detached')){exit 0}else{exit 2}
 }catch{Write-Error $_;exit 1}
}
