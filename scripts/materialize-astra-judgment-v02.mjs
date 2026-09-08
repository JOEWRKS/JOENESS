import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = path.join(ROOT, "scripts", "sync-harness.ps1");
const EXPECTED_BASE_BLOB = "5b0d0cc2c328382941b3dfa6436798b1818f2919";

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  assert.notEqual(first, -1, `missing patch anchor: ${label}`);
  assert.equal(source.indexOf(before, first + before.length), -1, `duplicate patch anchor: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function replaceCount(source, before, after, expected, label) {
  const count = source.split(before).length - 1;
  assert.equal(count, expected, `unexpected patch count for ${label}: ${count}`);
  return source.split(before).join(after);
}

const alreadyPatched = /runtimeMode -ceq 'common-core'/u;
let text = await readFile(TARGET, "utf8");
if (alreadyPatched.test(text) && text.includes("Astra judgment distribution must have exactly one active Common Core")) {
  process.stdout.write("Astra judgment installer patch already materialized.\n");
  process.exit(0);
}

const blob = execFileSync("git", ["hash-object", "scripts/sync-harness.ps1"], {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
assert.equal(blob, EXPECTED_BASE_BLOB, "sync-harness.ps1 is not the frozen Astra-native base blob");

text = replaceOnce(
  text,
  "    $selected = [Collections.Generic.List[object]]::new()\n    foreach ($skillProperty in @($Manifest.activeSkills.PSObject.Properties)) {",
  "    $selected = [Collections.Generic.List[object]]::new()\n    $activeSkillsProperty = $Manifest.PSObject.Properties['activeSkills']\n    if ($null -eq $activeSkillsProperty) { return @() }\n    foreach ($skillProperty in @($activeSkillsProperty.Value.PSObject.Properties)) {",
  "manifest selections tolerate the slim zero-skill manifest",
);

text = replaceOnce(
  text,
  "    $isExactControlInstall = $false\n    $astraNative = $false",
  "    $isExactControlInstall = $false\n    $isCurrentV2 = $false\n    $astraNative = $false",
  "current state trust initialization",
);

text = replaceOnce(
  text,
  "        $manifest = $manifestRead.Text | ConvertFrom-Json\n        $astraNative = [string] $manifest.runtimeMode -ceq 'none'\n        if (-not $astraNative -or [string] $manifest.target.model -cne 'gpt-6-astra' -or [string] $manifest.target.reasoningEffort -cne 'xhigh') {\n            throw 'Active distribution is not the supported Astra-native identity'\n        }\n        if ($null -ne $manifest.activeCommonCore -or\n            @($manifest.managedRuntimeFiles).Count -ne 0 -or\n            @($manifest.publicSkills).Count -ne 0 -or\n            @($manifest.defaultVendors).Count -ne 0 -or\n            $null -ne $manifest.pluginRouting) {\n            throw 'Astra-native distribution must have zero managed runtime payload'\n        }",
  "        $manifest = $manifestRead.Text | ConvertFrom-Json\n        $astraNative = [string] $manifest.runtimeMode -ceq 'common-core'\n        if ([int] $manifest.schemaVersion -ne 2 -or\n            [string] $manifest.release.name -cne 'JOENESS' -or\n            [string] $manifest.release.version -cne '0.2-astra-judgment' -or\n            [string] $manifest.release.entrypoint -cne 'JOENESS.ps1' -or\n            -not $astraNative -or\n            [string] $manifest.target.model -cne 'gpt-6-astra' -or\n            [string] $manifest.target.reasoningEffort -cne 'xhigh') {\n            throw 'Active distribution is not the supported JOENESS 0.2 Astra judgment identity'\n        }\n        if ($null -eq $manifest.activeCommonCore -or\n            @($manifest.managedRuntimeFiles).Count -ne 0 -or\n            @($manifest.publicSkills).Count -ne 0 -or\n            @($manifest.defaultVendors).Count -ne 0 -or\n            $null -ne $manifest.pluginRouting) {\n            throw 'Astra judgment distribution must have exactly one active Common Core and zero whole-file, skill, vendor, or plugin payload'\n        }",
  "active distribution identity",
);

text = replaceOnce(
  text,
  "        if ($null -ne $coreEntry) { throw 'Astra-native manifest unexpectedly selects a Common Core' }",
  "        Assert-HarnessObjectShape $coreEntry @('path', 'sha256') 'Astra judgment Common Core identity'\n        $coreRelativePath = Get-HarnessSafeRelativePath ([string] $coreEntry.path) 'Astra judgment Common Core path'\n        if ($coreRelativePath -cne 'astra-judgment-core.md') { throw 'Astra judgment Common Core path is invalid' }\n        $coreSourceHash = Get-HarnessValidSha256 $coreEntry.sha256 'Astra judgment Common Core hash'\n        $coreSourcePath = Resolve-HarnessSourceFile $sourceRoot $coreRelativePath\n        if (-not (Test-Path -LiteralPath $coreSourcePath -PathType Leaf)) { throw \"Missing Astra judgment Common Core source: $coreRelativePath\" }\n        $coreSourceRead = Read-HarnessUtf8 $coreSourcePath\n        if ((Get-HarnessSha256 $coreSourceRead.Bytes) -cne $coreSourceHash) { throw 'Astra judgment Common Core source hash is invalid' }\n        $sourceCore = $coreSourceRead.Text.TrimEnd(\"`r\", \"`n\")\n        $null = $optionalEntries.Add([pscustomobject] @{\n            RelativePath = 'vendor/source-manifest.json'\n            Hash = $manifestHash\n            Bytes = $manifestRead.Bytes\n        })",
  "active core loading and owned manifest",
);

text = replaceOnce(
  text,
  "                $installedSkillNames = @($installedManifest.activeSkills.PSObject.Properties.Name | Sort-Object -CaseSensitive)",
  "                $installedActiveSkillsProperty = $installedManifest.PSObject.Properties['activeSkills']\n                $installedSkillNames = if ($null -eq $installedActiveSkillsProperty) {\n                    @($installedManifest.publicSkills | ForEach-Object { [string] $_ } | Sort-Object -CaseSensitive)\n                } else {\n                    @($installedActiveSkillsProperty.Value.PSObject.Properties.Name | Sort-Object -CaseSensitive)\n                }",
  "installed slim manifest skill inventory",
);

text = replaceOnce(
  text,
  "                    } elseif ($installedSkillNames.Count -eq 0 -and $installedWholeFiles.Count -eq 0) {\n                        $isPriorLeanV2 = $true\n                    } else {\n                        throw 'V2 installed manifest identity is not trusted'\n                    }",
  "                    } else {\n                        throw 'V2 installed manifest identity is not trusted'\n                    }",
  "remove unpinned prior-Lean state trust",
);

text = replaceOnce(
  text,
  "                } elseif ($isCurrentV2 -or $isControlV2 -or $isPriorLeanV2) {\n                    $installedWholeFiles",
  "                } elseif ($isCurrentV2 -or $isControlV2) {\n                    $installedWholeFiles",
  "expected whole files trust only current or Control",
);

text = replaceOnce(
  text,
  "    if ($null -ne $state -and -not $isExactControlInstall) {\n        $state = $null\n        $stateCoreHash = $null\n        $stateWholeFiles = @{}\n        $null = $blockers.Add([pscustomobject] @{ kind = 'invalidState'; message = 'Installed JOENESS state is not the exact supported Control identity' })\n    }",
  "    if ($null -ne $state -and -not $isExactControlInstall -and -not $isCurrentV2) {\n        $state = $null\n        $stateCoreHash = $null\n        $stateWholeFiles = @{}\n        $null = $blockers.Add([pscustomobject] @{ kind = 'invalidState'; message = 'Installed JOENESS state is neither the exact current Astra judgment identity nor the exact supported Control identity' })\n    }",
  "retain exact current state",
);

text = replaceOnce(
  text,
  "                $permittedControlBlockHashes = @(foreach ($newline in @(\"`n\", \"`r`n\")) {\n                    $normalizedControlCore = $controlV2CoreSource -replace \"`r`n|`r|`n\", $newline\n                    $controlBlockBytes = [Text.Encoding]::UTF8.GetBytes(\"$($script:HarnessBeginMarker)$newline$normalizedControlCore$newline$($script:HarnessEndMarker)\")\n                    Get-HarnessSha256 $controlBlockBytes\n                })\n                if ($permittedControlBlockHashes -cnotcontains $existingBlockHash) { throw 'Installed Common Core block is not the exact supported Control source' }",
  "                if ($isExactControlInstall) {\n                    $permittedControlBlockHashes = @(foreach ($newline in @(\"`n\", \"`r`n\")) {\n                        $normalizedControlCore = $controlV2CoreSource -replace \"`r`n|`r|`n\", $newline\n                        $controlBlockBytes = [Text.Encoding]::UTF8.GetBytes(\"$($script:HarnessBeginMarker)$newline$normalizedControlCore$newline$($script:HarnessEndMarker)\")\n                        Get-HarnessSha256 $controlBlockBytes\n                    })\n                    if ($permittedControlBlockHashes -cnotcontains $existingBlockHash) { throw 'Installed Common Core block is not the exact supported Control source' }\n                } else {\n                    $permittedCurrentBlockHashes = @(foreach ($newline in @(\"`n\", \"`r`n\")) {\n                        $normalizedCurrentCore = $sourceCore -replace \"`r`n|`r|`n\", $newline\n                        $currentBlockBytes = [Text.Encoding]::UTF8.GetBytes(\"$($script:HarnessBeginMarker)$newline$normalizedCurrentCore$newline$($script:HarnessEndMarker)\")\n                        Get-HarnessSha256 $currentBlockBytes\n                    })\n                    if ($permittedCurrentBlockHashes -cnotcontains $existingBlockHash) { throw 'Installed Common Core block is not the exact current Astra judgment source' }\n                }",
  "current and Control removal source pinning",
);

text = replaceOnce(
  text,
  "    if ($blockers.Count -eq 0 -and $Apply) {\n        $warnings += 'Apply is unsupported for the Astra-native zero-runtime distribution; no files were changed.'\n        return New-HarnessPublicResult -Status 'unsupported' -Mode $mode -AgentsRoot $resolvedAgentsHome -SkillsRoot (Join-Path $resolvedAgentsHome 'skills') -ActiveSkills @() -Warnings @($warnings) -ChangesRequired $false -Changes @() -Blockers @() -BackupPath $null -Rollback $null -UnresolvedTargets @()\n    }\n\n",
  "",
  "remove zero-runtime Apply no-op",
);

text = replaceCount(
  text,
  "DEPRECATED: -IncludeDesignFrontend is ignored; the current JOENESS bundle already installs all active skills.",
  "DEPRECATED: -IncludeDesignFrontend is ignored; JOENESS 0.2 Astra Judgment installs no public skills.",
  2,
  "deprecated IncludeDesignFrontend warning",
);

await writeFile(TARGET, text, "utf8");
const finalText = await readFile(TARGET, "utf8");
assert.match(finalText, /runtimeMode -ceq 'common-core'/u);
assert.match(finalText, /Astra judgment distribution must have exactly one active Common Core/u);
assert.match(finalText, /Astra judgment Common Core source hash is invalid/u);
assert.doesNotMatch(finalText, /Apply is unsupported for the Astra-native zero-runtime distribution/u);
assert.match(finalText, /-not \$isExactControlInstall -and -not \$isCurrentV2/u);
assert.match(finalText, /Installed Common Core block is not the exact current Astra judgment source/u);
assert.equal(finalText.includes("$isPriorLeanV2 = $true"), false);

process.stdout.write("Materialized JOENESS 0.2 Astra judgment installer patch.\n");
