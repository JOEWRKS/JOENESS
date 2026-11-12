param($Repo,$Dir)
$ErrorActionPreference='Stop'
if(Test-Path $Dir){Remove-Item -Recurse -Force $Dir}; $null=New-Item -ItemType Directory $Dir; git -C $Dir init -q
$ps=Join-Path $Repo 'skills/joeness-setup/scripts/project-setup.ps1'
$body=[IO.File]::ReadAllText((Join-Path $Repo 'skills/joeness-setup/assets/AGENTS.md'))
function Run($b){ $c=(& powershell -NoProfile -File $ps -Check -ProjectPath $Dir)|ConvertFrom-Json
  "check: status=$($c.status) warnings=$(@($c.warnings).Count)"
  $a=(& powershell -NoProfile -File $ps -Apply -ProjectPath $Dir -ExpectedRoot $c.projectRoot -ExpectedTargetHash $c.targetHash -ExpectedStateHash $c.stateHash -ManagedBodyBase64 ([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($b))))|ConvertFrom-Json
  "apply: status=$($a.status) blockers=$($a.blockers -join '; ')" }
'--- absolute path substituted'
Run ($body.Replace('<joedesign>','E:\tools\skills\joedesign'))
"AGENTS.md exists: $(Test-Path (Join-Path $Dir 'AGENTS.md'))"
'--- shipped body'
Run $body
$c=(& powershell -NoProfile -File $ps -Check -ProjectPath $Dir)|ConvertFrom-Json
"recheck: status=$($c.status) warnings=$(@($c.warnings).Count)"
Select-String -Path (Join-Path $Dir 'AGENTS.md') -Pattern 'joedesign' | ForEach-Object { "AGENTS.md:$($_.LineNumber): $($_.Line.Trim())" }
