import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function gitBlob(relative) {
  return execFileSync("git", ["hash-object", relative], { cwd: ROOT, encoding: "utf8" }).trim();
}

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  assert.notEqual(first, -1, `missing patch anchor: ${label}`);
  assert.equal(source.indexOf(before, first + before.length), -1, `duplicate patch anchor: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

const tasksPath = path.join(ROOT, "TASKS.md");
const contractPath = path.join(ROOT, "docs", "contracts", "JOEWRKS_CROSS_SYSTEM_AUTHORITY_V1.md");

assert.equal(gitBlob("TASKS.md"), "5bf5c7a5b0abd9b3b9ffca6024ce903938a63181", "TASKS.md changed unexpectedly");
assert.equal(gitBlob("docs/contracts/JOEWRKS_CROSS_SYSTEM_AUTHORITY_V1.md"), "54187e494ccb217cef17457fb6e2aa2631614adb", "cross-system contract changed unexpectedly");

let tasks = await readFile(tasksPath, "utf8");
const oldHeader = `# JOENESS 검증 부채 로드맵

## Astra-native terminal closure

- 상태: \`ASTRA_NATIVE_CLOSURE_READY_FOR_PERSONAL_TRANSITION\`
- Target: \`gpt-6-astra / xhigh\`; active runtime overlay, Common Core, managed runtime files, public skills, default vendors, plugin routing: none
- Clean Astra는 설치나 Apply가 필요하지 않다. Exact GPT-5.6 Control만 명시적 fail-closed Remove fixture 경로를 지원한다.
- Astra synthetic evaluation은 종료됐고 새 evaluation queue를 만들지 않는다. Personal installation은 이번 repository closure에서 변경하지 않는다.

## 보존된 이전 원장`;
const newHeader = `# JOENESS 검증 부채 로드맵

## JOENESS 0.2 Astra Judgment

- 상태: \`0.2-astra-judgment / IMPLEMENTATION_COMPLETE / RELEASE_VERIFICATION_PENDING\`
- Target: \`gpt-6-astra / xhigh\`.
- Active runtime: \`astra-judgment-core.md\`의 **Independent Judgment** 하나만 관리 block으로 설치한다.
- Active public skills: 0; managed whole-file runtime payload: 0; default vendors: 0; plugin routing: none.
- 목적: 사용자 질문·반론·우려·취향을 자동 정정으로 취급하지 않고 evidence로 재평가하되, 사용자가 결정권을 가진 범위의 명시적 결정은 그대로 존중한다.
- Installer contract: clean \`Check -> ready\`; explicit \`Apply -> current\`; exact current \`Check -> current\`; explicit \`Remove -> removed\`; drift/ownership ambiguity는 fail-closed.
- Exact GPT-5.6 Control은 계속 \`legacy\`로 탐지하고 자동 migration하지 않으며, pinned identity에 대해서만 explicit Remove를 지원한다.
- Behavioral A/B plan: \`evals/experiments/joeness-astra-independent-judgment-ab-plan-v1.json\` — \`NOT-RUN\`. Repository lifecycle PASS와 behavioral superiority를 같은 주장으로 취급하지 않는다.
- 다음 release gate: current-release + historical-integrity + Astra judgment lifecycle + retained fail-closed/legacy tests + project/P0/vendor + diff check 전체 PASS 후 release 상태를 완료로 승격한다.

## 0.1 Astra-native zero-runtime closure — historical

- \`0.1-astra-native\`의 zero-runtime 종료는 당시 Astra rebaseline/stress evidence 기준으로 유효한 결정이었다.
- 당시 Target: \`gpt-6-astra / xhigh\`; active runtime overlay, Common Core, managed runtime files, public skills, default vendors, plugin routing: none.
- Clean Astra는 설치나 Apply가 필요하지 않았고, exact GPT-5.6 Control만 explicit fail-closed Remove 경로를 지원했다.
- 0.2는 0.1의 broad Core를 되살리는 변경이 아니라, 이후 별도로 관찰된 Independent Judgment failure에 대한 최소 재개다.

## 보존된 이전 원장`;
tasks = replaceOnce(tasks, oldHeader, newHeader, "TASKS current release header");
await writeFile(tasksPath, tasks, "utf8");

let contract = await readFile(contractPath, "utf8");
const oldBoundary = `## 10. JOENESS repository boundary

This file is hosted in the former JOENESS repository for shared physical storage only.

It does not:

- reactivate JOENESS runtime;
- install a Common Core or behavioral overlay;
- reactivate historical JOENESS skills or vendors;
- make JOENESS a control plane above JOEFLOW;
- make this repository the owner of Product Definition or visual truth.

Current Astra execution remains:

\`Bare Astra + applicable domain system + project-local authority\`

Historical JOENESS \`skills/**\`, \`vendor/**\`, evals, and compatibility material remain historical/reference evidence unless explicitly reactivated by a separate, evidence-based decision.

## 11. Change policy`;
const newBoundary = `## 10. JOENESS repository boundary

This file is hosted in the JOENESS repository as shared physical storage for cross-system authority boundaries.

Reading, referencing, or revising this contract does not itself:

- activate, install, remove, or expand JOENESS runtime behavior;
- activate a Common Core, skill, vendor, or plugin route;
- make JOENESS a control plane above JOEFLOW;
- make this repository the owner of Product Definition or visual truth.

JOENESS 0.2 separately has one active behavioral release rule, **Independent Judgment**, identified by \`vendor/source-manifest.json\` and sourced from \`astra-judgment-core.md\`. That release decision is independent of this shared contract. Consuming this contract does not inherit or activate that runtime rule.

Historical broad JOENESS Core material, \`skills/**\`, vendor source, evals, and compatibility material remain historical/reference evidence unless explicitly reactivated by a separate evidence-based release decision. The 0.2 release does not reactivate those historical surfaces.

## 11. Change policy`;
contract = replaceOnce(contract, oldBoundary, newBoundary, "cross-system JOENESS boundary");
await writeFile(contractPath, contract, "utf8");

process.stdout.write("Materialized JOENESS 0.2 ledger and shared-contract boundary updates.\n");
