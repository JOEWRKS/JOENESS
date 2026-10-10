# Explicitly approved one-time transition. No global instructions or other skills.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$BackupRoot)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../..'))
$personal='C:\Users\tjdwo\.codex'
$oldPin='bef807f187591aa88380158391f2f2adf0fa2b81e8c4887caf9c7530af1e1708'
$backup=[IO.Path]::GetFullPath($BackupRoot)
if (-not $backup.StartsWith('D:\JOEWRKS\.joeness-install-backups\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Backup must be outside active skill discovery in designated backup directory' }
if (Test-Path -LiteralPath $backup) { throw 'Use a fresh backup directory; never overwrite a prior transition' }
function Sha([string]$p){ if(Test-Path -LiteralPath $p -PathType Leaf){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}else{'absent'} }
function CallInstaller([string]$source,[string]$mode){
    $psi=New-Object Diagnostics.ProcessStartInfo
    $psi.FileName='powershell.exe'
    $psi.Arguments=('-NoProfile -ExecutionPolicy Bypass -File "{0}" -{1} -CodexHome "{2}"' -f (Join-Path $source 'JOENESS.ps1'),$mode,$personal)
    $psi.UseShellExecute=$false;$psi.CreateNoWindow=$true;$psi.RedirectStandardOutput=$true;$psi.RedirectStandardError=$true
    $psi.StandardOutputEncoding=New-Object Text.UTF8Encoding($false)
    $psi.StandardErrorEncoding=New-Object Text.UTF8Encoding($false)
    $p=New-Object Diagnostics.Process;$p.StartInfo=$psi
    try{$null=$p.Start();$stdout=$p.StandardOutput.ReadToEndAsync();$stderr=$p.StandardError.ReadToEndAsync();$p.WaitForExit();$value=$stdout.Result.Trim()|ConvertFrom-Json
        if($p.ExitCode -ne 0){throw ('Installer {0}: {1}' -f $mode,$stdout.Result)}
        return $value
    }finally{$p.Dispose()}
}
$statePath=Join-Path $personal 'joeness-skills-state.json'
$state=Get-Content -Raw -LiteralPath $statePath|ConvertFrom-Json
if($state.manifestSha256 -cne $oldPin){throw 'Old installation identity changed; inspect, do not retry'}
$guardPaths=@('AGENTS.md','config.toml','joewrks-harness-state.json')
$guard=@{};foreach($p in $guardPaths){$guard[$p]=Sha (Join-Path $personal $p)}
$null=New-Item -ItemType Directory -Path $backup
$archivePath=Join-Path $backup 'previous-source.zip'
& git -C $repo archive --format=zip --output $archivePath 0812d76 JOENESS.ps1 scripts/sync-harness.ps1 vendor/source-manifest.json skills/joeness-setup
if($LASTEXITCODE -ne 0){throw 'Cannot preserve exact prior source'}
$old=Join-Path $backup 'previous-source';Expand-Archive -LiteralPath (Join-Path $backup 'previous-source.zip') -DestinationPath $old
if((Sha (Join-Path $old 'vendor/source-manifest.json')) -cne $oldPin){throw 'Archived manifest mismatch'}
if((CallInstaller $old 'Check').status -cne 'current'){throw 'Previous installer does not own current files'}
Copy-Item -LiteralPath (Join-Path $personal 'skills/joeness-setup') -Destination (Join-Path $backup 'installed-before') -Recurse
Copy-Item -LiteralPath $statePath -Destination (Join-Path $backup 'installed-before-state.json')
$candidate=Join-Path $backup 'candidate-source';$null=New-Item -ItemType Directory -Path $candidate
foreach($p in @('JOENESS.ps1','scripts','vendor','skills')){Copy-Item -LiteralPath (Join-Path $repo $p) -Destination (Join-Path $candidate $p) -Recurse}
$candidatePin=Sha (Join-Path $candidate 'vendor/source-manifest.json')
if($candidatePin -cne (Sha (Join-Path $repo 'vendor/source-manifest.json'))){throw 'Candidate source changed during snapshot'}
$removed=CallInstaller $old 'Remove'
if($removed.status -cne 'removed'){throw 'Removal not complete; no blind installation'}
try{
    $applied=CallInstaller $candidate 'Apply'
    if($applied.status -cne 'current'){throw 'Candidate not current'}
    $checked=CallInstaller $candidate 'Check'
    if($checked.status -cne 'current'){throw 'Installed check failed'}
}catch{
    # Restore only if failed candidate left no state/files. Never overwrite a partial installation.
    $remaining=@(Get-ChildItem -LiteralPath (Join-Path $personal 'skills/joeness-setup') -Recurse -File -ErrorAction SilentlyContinue)
    if(-not(Test-Path -LiteralPath $statePath) -and $remaining.Count -eq 0){$null=CallInstaller $old 'Apply'}
    throw
}
foreach($p in $guardPaths){if((Sha (Join-Path $personal $p)) -cne $guard[$p]){throw "Outside file changed; inspect concurrency: $p"}}
$installedState=Get-Content -Raw -LiteralPath $statePath|ConvertFrom-Json
if($installedState.manifestSha256 -cne $candidatePin){throw 'Final installation identity mismatch'}
[ordered]@{status='current';releaseLabel=$installedState.releaseVersion;releaseStatus='local candidate, not new release';backup=$backup;previousManifest=$oldPin;candidateManifest=$candidatePin;installedStateSha256=(Sha $statePath);managedFiles=$installedState.files.Count;globalFilesUnchanged=$true;result=$checked}|ConvertTo-Json -Depth 7
