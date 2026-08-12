import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const MODULE_URL = new URL(
  "../evals/support/ticket-evaluator-provenance.mjs",
  import.meta.url,
);
const RUNNER_URL = new URL(
  "../evals/support/run-ticket-evaluator.mjs",
  import.meta.url,
);

async function loadSubject() {
  try {
    return await import(MODULE_URL.href);
  } catch {
    return null;
  }
}

async function loadRunner() {
  try {
    return await import(RUNNER_URL.href);
  } catch {
    return null;
  }
}

function git(root, ...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

async function createRepository(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-ticket-state-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, "init", "--quiet");
  git(root, "config", "user.name", "JOENESS Fixture");
  git(root, "config", "user.email", "fixture@example.invalid");
  await writeFile(path.join(root, ".gitignore"), "ignored/\n", "utf8");
  await writeFile(path.join(root, "tracked.txt"), "tracked\n", "utf8");
  git(root, "add", ".gitignore", "tracked.txt");
  git(root, "commit", "--quiet", "-m", "fixture");
  await writeFile(path.join(root, "untracked.txt"), "untracked\n", "utf8");
  await mkdir(path.join(root, "ignored"));
  await writeFile(path.join(root, "ignored", "generated.txt"), "one\n", "utf8");
  return root;
}

async function createTicketRepository(t) {
  const root = await mkdtemp(path.join(tmpdir(), "joeness-ticket-read-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, "init", "--quiet");
  git(root, "config", "user.name", "JOENESS Fixture");
  git(root, "config", "user.email", "fixture@example.invalid");
  const fixtureRoot = path.join(root, "evals", "fixtures", "ticket-m1b");
  const supportRoot = path.join(root, "evals", "support");
  await mkdir(fixtureRoot, { recursive: true });
  await mkdir(supportRoot, { recursive: true });
  await writeFile(
    path.join(supportRoot, "ticket-verdict.mjs"),
    [
      "export function summarizeTicketVerdicts(criteria) {",
      "  if (criteria.some((entry) => entry.verdict === 'FAIL')) return { state: 'REWORK' };",
      "  if (criteria.some((entry) => entry.verdict === 'UNVERIFIED')) return { state: 'UNVERIFIED' };",
      "  return { state: 'ACCEPTED' };",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(
    path.join(fixtureRoot, "check.mjs"),
    [
      "import fs from 'node:fs';",
      "import { summarizeTicketVerdicts } from '../../support/ticket-verdict.mjs';",
      "const candidate = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));",
      "const criteria = [",
      "  { id: 'target-ready', required: true, verdict: candidate.target === 'READY' ? 'PASS' : 'FAIL' },",
      "  { id: 'guard-stable', required: true, verdict: candidate.guard === 'STABLE' ? 'PASS' : 'FAIL' },",
      "  { id: 'evidence-present', required: true, verdict: fs.existsSync(process.argv[3]) ? 'PASS' : 'UNVERIFIED' },",
      "];",
      "process.stdout.write(JSON.stringify({ criteria, summary: summarizeTicketVerdicts(criteria) }) + '\\n');",
      "",
    ].join("\n"),
    "utf8",
  );
  git(root, "add", ".");
  git(root, "commit", "--quiet", "-m", "base");
  const base = git(root, "rev-parse", "HEAD");
  await writeFile(
    path.join(fixtureRoot, "candidate.json"),
    '{"target":"READY","guard":"STABLE"}\n',
    "utf8",
  );
  await writeFile(path.join(fixtureRoot, "evidence.json"), '{"observed":true}\n', "utf8");
  git(root, "add", ".");
  git(root, "commit", "--quiet", "-m", "candidate");
  return { root, base, candidate: git(root, "rev-parse", "HEAD") };
}

function createTicketSession(
  finalOutput,
  { lateForbiddenEvent = false, omitToolLifecycle = false } = {},
) {
  const listeners = new Set();
  let dynamicToolHandler = null;
  const calls = [];
  const emit = (notification) => {
    for (const listener of listeners) listener(notification);
  };
  return {
    calls,
    remoteControlSnapshot: {
      seen: true,
      complete: true,
      status: "disabled",
      environmentAttached: false,
    },
    client: {
      async request(method, params) {
        calls.push({ method, params });
        if (method === "thread/start") {
          emit({
            method: "thread/started",
            params: { thread: { id: "ticket-thread" } },
          });
          return {
            thread: {
              id: "ticket-thread",
              cwd: params.cwd,
              ephemeral: true,
              modelProvider: "fixture-provider",
              turns: [],
            },
            model: "fixture-model",
            modelProvider: "fixture-provider",
            reasoningEffort: "medium",
            serviceTier: null,
            activePermissionProfile: { id: "joewrks-eval-control-v3" },
            approvalPolicy: "never",
            approvalsReviewer: "user",
            sandbox: { type: "readOnly", networkAccess: false },
            cwd: params.cwd,
            runtimeWorkspaceRoots: params.runtimeWorkspaceRoots,
            instructionSources: [],
          };
        }
        if (method === "turn/start") {
          emit({
            method: "turn/started",
            params: {
              threadId: params.threadId,
              turn: { id: "ticket-turn" },
            },
          });
          let callNumber = 0;
          for (const argumentsValue of [
            { operation: "InspectAncestry" },
            { operation: "InspectDiff" },
            {
              operation: "ReadCandidate",
              path: "evals/fixtures/ticket-m1b/candidate.json",
            },
            {
              operation: "ReadEvidence",
              path: "evals/fixtures/ticket-m1b/evidence.json",
            },
            { operation: "RunChecker" },
          ]) {
            callNumber += 1;
            const item = {
              id: `call-${callNumber}`,
              type: "dynamicToolCall",
              tool: "ticket-evaluator-read",
              arguments: argumentsValue,
            };
            if (!omitToolLifecycle) {
              emit({
                method: "item/started",
                params: {
                  threadId: params.threadId,
                  turnId: "ticket-turn",
                  item: { ...item, status: "inProgress" },
                },
              });
            }
            const response = await dynamicToolHandler({
              method: "item/tool/call",
              params: {
                threadId: params.threadId,
                turnId: "ticket-turn",
                callId: item.id,
                tool: item.tool,
                arguments: argumentsValue,
              },
            });
            if (!omitToolLifecycle) {
              emit({
                method: "item/completed",
                params: {
                  threadId: params.threadId,
                  turnId: "ticket-turn",
                  item: {
                    ...item,
                    status: "completed",
                    success: response.success,
                    contentItems: response.contentItems,
                  },
                },
              });
            }
          }
          emit({
            method: "item/completed",
            params: {
              threadId: params.threadId,
              turnId: "ticket-turn",
              item: {
                id: "message-1",
                type: "agentMessage",
                text: finalOutput,
              },
            },
          });
          emit({
            method: "turn/completed",
            params: {
              threadId: params.threadId,
              turn: { id: "ticket-turn", status: "completed" },
            },
          });
          return { turn: { id: "ticket-turn", status: "inProgress" } };
        }
        if (method === "turn/interrupt") return {};
        if (method === "mcpServerStatus/list") {
          return { data: [], nextCursor: null };
        }
        throw new Error(`unexpected request: ${method}`);
      },
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setDynamicToolHandler(handler) {
      dynamicToolHandler = handler;
      return () => {
        dynamicToolHandler = null;
      };
    },
    mcpInventory: [],
    processExitCode: null,
    stderr: { truncated: false, byteLength: 0, sha256: "0".repeat(64) },
    async close() {
      if (lateForbiddenEvent) {
        emit({
          method: "item/completed",
          params: {
            threadId: "ticket-thread",
            turnId: "ticket-turn",
            item: {
              id: "late-file-change",
              type: "fileChange",
              status: "completed",
            },
          },
        });
      }
      this.processExitCode = 0;
    },
  };
}

const BASE = "1111111111111111111111111111111111111111";
const CANDIDATE = "2222222222222222222222222222222222222222";

function evaluationInput() {
  return {
    originalGoal: "고정된 티켓을 정확한 후보에서 독립 검토한다.",
    base: { sha: BASE, tree: "3333333333333333333333333333333333333333" },
    candidate: {
      id: "c1-normal",
      sha: CANDIDATE,
      tree: "4444444444444444444444444444444444444444",
      parent: BASE,
      previousSha: BASE,
      reworkRound: 0,
    },
    authorityFiles: {
      "authority/AGENTS.md": "repository contract\n",
      "authority/TASKS.md": "ticket contract\n",
      "authority/ticket-SKILL.md": "ticket behavior\n",
      "authority/check.mjs": "export const check = true;\n",
      "authority/ticket-verdict.mjs": "export const verdict = true;\n",
    },
    inspection: {
      allowedPaths: [
        "evals/fixtures/ticket-m1b/candidate.json",
        "evals/fixtures/ticket-m1b/evidence.json",
      ],
      requiredOperations: [
        "InspectAncestry",
        "InspectDiff",
        "ReadCandidate",
        "ReadEvidence",
        "RunChecker",
      ],
    },
  };
}

test("evaluation prompt accepts only declared authority and controlled reads", async () => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.buildTicketEvaluationPrompt, "function");

  const built = subject.buildTicketEvaluationPrompt(evaluationInput());
  assert.deepEqual(
    built.manifest.explicitlyProvidedInputs.map(({ path: inputPath }) => inputPath),
    [
      "authority/AGENTS.md",
      "authority/TASKS.md",
      "authority/check.mjs",
      "authority/ticket-SKILL.md",
      "authority/ticket-verdict.mjs",
    ],
  );
  assert.equal(built.manifest.forbiddenNarrativeArtifactsProvided.length, 0);
  assert.equal(built.prompt.includes("ticket contract"), true);
  assert.equal(built.prompt.includes("implementer said complete"), false);
  assert.equal(built.dynamicTool.name, "ticket-evaluator-read");
  assert.deepEqual(
    built.dynamicTool.inputSchema.properties.operation.enum,
    evaluationInput().inspection.requiredOperations,
  );

  const contaminated = evaluationInput();
  contaminated.authorityFiles["reports/implementer.md"] =
    "implementer said complete\n";
  assert.throws(
    () => subject.buildTicketEvaluationPrompt(contaminated),
    /input allowlist/i,
  );
});

test("strict evaluator output is candidate-bound and criterion-complete", async () => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.parseTicketEvaluatorOutput, "function");
  const output = JSON.stringify({
    candidateSha: CANDIDATE,
    alignment: "PASS",
    criteria: [
      { id: "target-ready", verdict: "PASS", observation: "target is READY" },
      { id: "guard-stable", verdict: "PASS", observation: "guard is STABLE" },
      { id: "evidence-present", verdict: "PASS", observation: "evidence exists" },
    ],
    checkerState: "ACCEPTED",
  });
  assert.deepEqual(
    subject.parseTicketEvaluatorOutput(output, { candidateSha: CANDIDATE }),
    JSON.parse(output),
  );
  assert.throws(
    () =>
      subject.parseTicketEvaluatorOutput(
        output.replace(CANDIDATE, BASE),
        { candidateSha: CANDIDATE },
      ),
    /candidate/i,
  );
  assert.throws(
    () =>
      subject.parseTicketEvaluatorOutput(
        output.replace('"checkerState":"ACCEPTED"', '"checkerState":"REWORK"'),
        { candidateSha: CANDIDATE },
      ),
    /checker state/i,
  );
});

test("policy keeps missing evidence separate and stops after one rework", async () => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.deriveTicketPolicyState, "function");
  assert.deepEqual(
    subject.deriveTicketPolicyState({ checkerState: "UNVERIFIED", reworkRound: 0 }),
    { state: "UNVERIFIED", reason: "required-evidence-missing" },
  );
  assert.deepEqual(
    subject.deriveTicketPolicyState({ checkerState: "REWORK", reworkRound: 0 }),
    { state: "REWORK", reason: "first-failed-review" },
  );
  assert.deepEqual(
    subject.deriveTicketPolicyState({ checkerState: "REWORK", reworkRound: 1 }),
    { state: "USER_DECISION", reason: "automatic-rework-limit-reached" },
  );
});

test("controlled reader inspects the pinned Git candidate and rejects unknown reads", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.inspectTicketCandidate, "function");
  const fixture = await createTicketRepository(t);
  const context = {
    root: fixture.root,
    baseSha: fixture.base,
    candidateSha: fixture.candidate,
    previousSha: fixture.base,
    allowedPaths: [
      "evals/fixtures/ticket-m1b/candidate.json",
      "evals/fixtures/ticket-m1b/evidence.json",
    ],
  };
  const ancestry = await subject.inspectTicketCandidate(
    { operation: "InspectAncestry" },
    context,
  );
  assert.equal(ancestry.candidateSha, fixture.candidate);
  assert.equal(ancestry.baseIsAncestor, true);
  const checker = await subject.inspectTicketCandidate(
    { operation: "RunChecker" },
    context,
  );
  assert.equal(checker.result.summary.state, "ACCEPTED");
  const candidate = await subject.inspectTicketCandidate(
    {
      operation: "ReadCandidate",
      path: "evals/fixtures/ticket-m1b/candidate.json",
    },
    context,
  );
  assert.equal(candidate.exists, true);
  assert.match(candidate.text, /"READY"/);
  await assert.rejects(
    () =>
      subject.inspectTicketCandidate(
        { operation: "ReadCandidate", path: "TASKS.md" },
        context,
      ),
    /path allowlist/i,
  );
});

test("controller checker never executes a candidate-owned checker", async (t) => {
  const subject = await loadSubject();
  const fixture = await createTicketRepository(t);
  const marker = path.join(fixture.root, "candidate-checker-executed.txt");
  await writeFile(
    path.join(fixture.root, "evals", "fixtures", "ticket-m1b", "check.mjs"),
    [
      "import fs from 'node:fs';",
      `fs.writeFileSync(${JSON.stringify(marker)}, 'unsafe\\n');`,
      "process.stdout.write('{\"criteria\":[],\"summary\":{\"state\":\"ACCEPTED\"}}\\n');",
      "",
    ].join("\n"),
    "utf8",
  );
  const checker = await subject.inspectTicketCandidate(
    { operation: "RunChecker" },
    {
      root: fixture.root,
      baseSha: fixture.base,
      candidateSha: fixture.candidate,
      previousSha: fixture.base,
      allowedPaths: evaluationInput().inspection.allowedPaths,
    },
  );
  assert.equal(checker.result.summary.state, "ACCEPTED");
  await assert.rejects(() => readFile(marker), /ENOENT/u);
});

test("Ticket evaluator thread disables implicit project instructions", async () => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.buildTicketThreadStartRequest, "function");
  const built = subject.buildTicketEvaluationPrompt(evaluationInput());
  const root = path.resolve("D:/fixture/evaluator");
  const request = subject.buildTicketThreadStartRequest(root, built.dynamicTool);
  assert.equal(request.ephemeral, true);
  assert.equal(request.config.project_doc_max_bytes, 0);
  assert.deepEqual(request.dynamicTools, [built.dynamicTool]);
  assert.deepEqual(request.runtimeWorkspaceRoots, [root]);
  assert.deepEqual(request.selectedCapabilityRoots, []);
});

test("dynamic Ticket tool binds every read to one thread, turn, and candidate", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.handleTicketEvaluatorToolCall, "function");
  const fixture = await createTicketRepository(t);
  const context = {
    root: fixture.root,
    baseSha: fixture.base,
    candidateSha: fixture.candidate,
    previousSha: fixture.base,
    allowedPaths: [
      "evals/fixtures/ticket-m1b/candidate.json",
      "evals/fixtures/ticket-m1b/evidence.json",
    ],
  };
  const evidence = [];
  const message = {
    method: "item/tool/call",
    params: {
      threadId: "thread-1",
      turnId: "turn-1",
      callId: "call-1",
      tool: "ticket-evaluator-read",
      arguments: { operation: "InspectAncestry" },
    },
  };
  const response = await subject.handleTicketEvaluatorToolCall(message, {
    threadId: "thread-1",
    turnId: "turn-1",
    context,
    evidence,
  });
  assert.equal(response.success, true);
  assert.equal(response.contentItems[0].type, "inputText");
  assert.equal(evidence[0].operation, "InspectAncestry");
  await assert.rejects(
    () =>
      subject.handleTicketEvaluatorToolCall(
        { ...message, params: { ...message.params, callId: "call-2" } },
        {
          threadId: "thread-1",
          turnId: "turn-1",
          context,
          evidence,
        },
      ),
    /duplicate/i,
  );
  await assert.rejects(
    () =>
      subject.handleTicketEvaluatorToolCall(
        {
          ...message,
          params: {
            ...message.params,
            callId: "call-3",
            threadId: "foreign-thread",
          },
        },
        {
          threadId: "thread-1",
          turnId: "turn-1",
          context,
          evidence: [],
        },
      ),
    /active evaluator/i,
  );
});

test("workspace snapshot detects ignored generated state changes", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.captureGitWorkspaceSnapshot, "function");
  assert.equal(typeof subject?.compareGitWorkspaceSnapshots, "function");
  const root = await createRepository(t);

  const before = await subject.captureGitWorkspaceSnapshot(root);
  const same = await subject.captureGitWorkspaceSnapshot(root);
  assert.deepEqual(subject.compareGitWorkspaceSnapshots(before, same), {
    equal: true,
    changedLayers: [],
  });
  assert.deepEqual(before.untracked.map(({ path: filePath }) => filePath), [
    "untracked.txt",
  ]);
  assert.deepEqual(before.ignored.map(({ path: filePath }) => filePath), [
    "ignored/generated.txt",
  ]);

  await writeFile(path.join(root, "ignored", "generated.txt"), "two\n", "utf8");
  const after = await subject.captureGitWorkspaceSnapshot(root);
  assert.deepEqual(subject.compareGitWorkspaceSnapshots(before, after), {
    equal: false,
    changedLayers: ["ignored", "generated"],
  });
});

test("candidate readiness rejects stable pre-existing workspace contamination", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.assertTicketWorkspaceReady, "function");
  const dirtyRoot = await createRepository(t);
  const dirty = await subject.captureGitWorkspaceSnapshot(dirtyRoot);
  assert.throws(() => subject.assertTicketWorkspaceReady(dirty), /clean candidate/i);

  const cleanFixture = await createTicketRepository(t);
  git(cleanFixture.root, "checkout", "--detach", "--quiet", cleanFixture.candidate);
  const clean = await subject.captureGitWorkspaceSnapshot(cleanFixture.root);
  assert.equal(subject.assertTicketWorkspaceReady(clean), true);
});

test("inspection evidence proves exact ancestry and diff identities", async (t) => {
  const subject = await loadSubject();
  assert.equal(typeof subject?.validateTicketInspectionEvidence, "function");
  const fixture = await createTicketRepository(t);
  const context = {
    root: fixture.root,
    baseSha: fixture.base,
    candidateSha: fixture.candidate,
    previousSha: fixture.base,
    allowedPaths: evaluationInput().inspection.allowedPaths,
  };
  const evidence = [];
  for (const request of [
    { operation: "InspectAncestry" },
    { operation: "InspectDiff" },
    { operation: "ReadCandidate", path: context.allowedPaths[0] },
    { operation: "ReadEvidence", path: context.allowedPaths[1] },
    { operation: "RunChecker" },
  ]) {
    evidence.push({
      operation: request.operation,
      candidateSha: fixture.candidate,
      result: await subject.inspectTicketCandidate(request, context),
    });
  }
  const candidate = {
    sha: fixture.candidate,
    tree: git(fixture.root, "rev-parse", "HEAD^{tree}"),
    parent: fixture.base,
    previousSha: fixture.base,
  };
  assert.equal(
    subject.validateTicketInspectionEvidence(evidence, {
      baseSha: fixture.base,
      candidate,
    }),
    true,
  );
  evidence[0].result.baseIsAncestor = false;
  assert.throws(
    () =>
      subject.validateTicketInspectionEvidence(evidence, {
        baseSha: fixture.base,
        candidate,
      }),
    /ancestry/i,
  );
});

test("one fresh Ticket turn collects all controlled reads before accepting output", async (t) => {
  const subject = await loadSubject();
  const runner = await loadRunner();
  assert.equal(typeof runner?.runTicketEvaluatorTurn, "function");
  const fixture = await createTicketRepository(t);
  const tree = git(fixture.root, "rev-parse", "HEAD^{tree}");
  const input = evaluationInput();
  input.base = {
    sha: fixture.base,
    tree: git(fixture.root, "rev-parse", `${fixture.base}^{tree}`),
  };
  input.candidate = {
    id: "c1-normal",
    sha: fixture.candidate,
    tree,
    parent: fixture.base,
    previousSha: fixture.base,
    reworkRound: 0,
  };
  const built = subject.buildTicketEvaluationPrompt(input);
  const finalOutput = JSON.stringify({
    candidateSha: fixture.candidate,
    alignment: "PASS",
    criteria: [
      { id: "target-ready", verdict: "PASS", observation: "target READY" },
      { id: "guard-stable", verdict: "PASS", observation: "guard STABLE" },
      { id: "evidence-present", verdict: "PASS", observation: "evidence exists" },
    ],
    checkerState: "ACCEPTED",
  });
  const session = createTicketSession(finalOutput);
  const result = await runner.runTicketEvaluatorTurn({
    session,
    candidateRoot: fixture.root,
    built,
    context: {
      root: fixture.root,
      baseSha: fixture.base,
      candidateSha: fixture.candidate,
      previousSha: fixture.base,
      allowedPaths: input.inspection.allowedPaths,
    },
    turnTimeoutMs: 1000,
  });
  assert.equal(result.thread.ephemeral, true);
  assert.equal(result.thread.priorTurnCount, 0);
  assert.deepEqual(result.thread.instructionSources, []);
  assert.deepEqual(
    result.toolEvidence.map(({ operation }) => operation),
    input.inspection.requiredOperations,
  );
  assert.equal(result.output.checkerState, "ACCEPTED");
  assert.equal(result.blockers.length, 0);
});

test("post-terminal protocol barrier retains late forbidden events", async (t) => {
  const subject = await loadSubject();
  const runner = await loadRunner();
  const fixture = await createTicketRepository(t);
  const input = evaluationInput();
  input.base = {
    sha: fixture.base,
    tree: git(fixture.root, "rev-parse", `${fixture.base}^{tree}`),
  };
  input.candidate = {
    id: "c1-normal",
    sha: fixture.candidate,
    tree: git(fixture.root, "rev-parse", "HEAD^{tree}"),
    parent: fixture.base,
    previousSha: fixture.base,
    reworkRound: 0,
  };
  const output = JSON.stringify({
    candidateSha: fixture.candidate,
    alignment: "PASS",
    criteria: [
      { id: "target-ready", verdict: "PASS", observation: "target READY" },
      { id: "guard-stable", verdict: "PASS", observation: "guard STABLE" },
      { id: "evidence-present", verdict: "PASS", observation: "evidence exists" },
    ],
    checkerState: "ACCEPTED",
  });
  const result = await runner.runTicketEvaluatorTurn({
    session: createTicketSession(output, { lateForbiddenEvent: true }),
    candidateRoot: fixture.root,
    built: subject.buildTicketEvaluationPrompt(input),
    context: {
      root: fixture.root,
      baseSha: fixture.base,
      candidateSha: fixture.candidate,
      previousSha: fixture.base,
      allowedPaths: input.inspection.allowedPaths,
    },
    turnTimeoutMs: 1000,
  });
  assert.equal(result.blockers.includes("uncontrolled-tool-surface"), true);
});

test("tool RPC evidence requires matching started and completed lifecycle", async (t) => {
  const subject = await loadSubject();
  const runner = await loadRunner();
  const fixture = await createTicketRepository(t);
  const input = evaluationInput();
  input.base = {
    sha: fixture.base,
    tree: git(fixture.root, "rev-parse", `${fixture.base}^{tree}`),
  };
  input.candidate = {
    id: "c1-normal",
    sha: fixture.candidate,
    tree: git(fixture.root, "rev-parse", "HEAD^{tree}"),
    parent: fixture.base,
    previousSha: fixture.base,
    reworkRound: 0,
  };
  const output = JSON.stringify({
    candidateSha: fixture.candidate,
    alignment: "PASS",
    criteria: [
      { id: "target-ready", verdict: "PASS", observation: "target READY" },
      { id: "guard-stable", verdict: "PASS", observation: "guard STABLE" },
      { id: "evidence-present", verdict: "PASS", observation: "evidence exists" },
    ],
    checkerState: "ACCEPTED",
  });
  const result = await runner.runTicketEvaluatorTurn({
    session: createTicketSession(output, { omitToolLifecycle: true }),
    candidateRoot: fixture.root,
    built: subject.buildTicketEvaluationPrompt(input),
    context: {
      root: fixture.root,
      baseSha: fixture.base,
      candidateSha: fixture.candidate,
      previousSha: fixture.base,
      allowedPaths: input.inspection.allowedPaths,
    },
    turnTimeoutMs: 1000,
  });
  assert.equal(result.blockers.includes("ticket-tool-lifecycle-mismatch"), true);
});

test("invalid evaluator output preserves prompt, events, and tool evidence", async (t) => {
  const subject = await loadSubject();
  const runner = await loadRunner();
  const fixture = await createTicketRepository(t);
  const input = evaluationInput();
  input.base = {
    sha: fixture.base,
    tree: git(fixture.root, "rev-parse", `${fixture.base}^{tree}`),
  };
  input.candidate = {
    id: "c1-normal",
    sha: fixture.candidate,
    tree: git(fixture.root, "rev-parse", "HEAD^{tree}"),
    parent: fixture.base,
    previousSha: fixture.base,
    reworkRound: 0,
  };
  let observed;
  await assert.rejects(
    () =>
      runner.runTicketEvaluatorTurn({
        session: createTicketSession("not-json"),
        candidateRoot: fixture.root,
        built: subject.buildTicketEvaluationPrompt(input),
        context: {
          root: fixture.root,
          baseSha: fixture.base,
          candidateSha: fixture.candidate,
          previousSha: fixture.base,
          allowedPaths: input.inspection.allowedPaths,
        },
        turnTimeoutMs: 1000,
      }),
    (error) => {
      observed = error;
      return /output validation failed/i.test(error.message);
    },
  );
  assert.equal(observed.ticketEvidence.prompt.sha256.length, 64);
  assert.equal(observed.ticketEvidence.toolEvidence.length, 5);
  assert.equal(observed.ticketEvidence.events.length > 0, true);
  const failure = runner.buildTicketFailureRecord("smoke", observed);
  assert.equal(failure.status, "blocked");
  assert.equal(failure.error.ticketEvidence.toolEvidence.length, 5);
});

test("M1C plans preserve v1 and pin the v2 runtime without expected evaluator answers", async () => {
  const runner = await loadRunner();
  assert.equal(typeof runner?.validateTicketEvaluationPlan, "function");
  const predecessorPath = new URL(
    "../evals/experiments/joeness-ticket-m1c-prompt-manifest-v1.json",
    import.meta.url,
  );
  const planPath = new URL(
    "../evals/experiments/joeness-ticket-m1c-prompt-manifest-v2.json",
    import.meta.url,
  );
  const predecessorText = await readFile(predecessorPath, "utf8");
  const predecessor = runner.validateTicketEvaluationPlan(
    JSON.parse(predecessorText),
  );
  assert.equal(predecessor.id, "joeness-ticket-m1c-prompt-manifest-v1");
  assert.equal(Object.hasOwn(predecessor, "runtime"), false);
  assert.equal(Buffer.byteLength(predecessorText), 3428);
  assert.equal(
    createHash("sha256").update(predecessorText).digest("hex"),
    "ddb28bb1c9c3795a77ef9b37158ab70210a549fe4a2ed33205bb280345680501",
  );
  assert.deepEqual(runner.resolveTicketRuntimeContract(predecessor), {
    codexVersion: "codex-cli 0.145.0",
    generation: "v1",
  });
  const text = await readFile(planPath, "utf8");
  const plan = runner.validateTicketEvaluationPlan(JSON.parse(text));
  assert.equal(plan.id, "joeness-ticket-m1c-prompt-manifest-v2");
  assert.equal(plan.schemaVersion, 2);
  assert.deepEqual(plan.runtime, { codexVersion: "codex-cli 0.146.0" });
  assert.deepEqual(runner.resolveTicketRuntimeContract(plan), {
    codexVersion: "codex-cli 0.146.0",
    generation: "v2",
  });
  assert.deepEqual(plan.predecessor, {
    path: "evals/experiments/joeness-ticket-m1c-prompt-manifest-v1.json",
    byteLength: 3428,
    sha256: "ddb28bb1c9c3795a77ef9b37158ab70210a549fe4a2ed33205bb280345680501",
    methodChange: "pin-codex-cli-0.146.0",
  });
  const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  assert.deepEqual(await runner.verifyTicketPlanPredecessor(repositoryRoot, plan), {
    path: "evals/experiments/joeness-ticket-m1c-prompt-manifest-v1.json",
    byteLength: 3428,
    sha256: "ddb28bb1c9c3795a77ef9b37158ab70210a549fe4a2ed33205bb280345680501",
  });
  const driftRoot = await mkdtemp(path.join(tmpdir(), "joeness-ticket-predecessor-"));
  await mkdir(path.join(driftRoot, "evals", "experiments"), { recursive: true });
  await writeFile(
    path.join(
      driftRoot,
      "evals",
      "experiments",
      "joeness-ticket-m1c-prompt-manifest-v1.json",
    ),
    "drift\n",
    "utf8",
  );
  await assert.rejects(
    () => runner.verifyTicketPlanPredecessor(driftRoot, plan),
    /predecessor artifact differs/i,
  );
  await rm(driftRoot, { recursive: true, force: true });
  assert.deepEqual(
    plan.candidates.map(({ id }) => id),
    [
      "c1-normal",
      "c2-controlled-fault",
      "c3-successful-rework",
      "c3-unchanged-control",
      "c3-repeated-failure-control",
      "missing-evidence-control",
    ],
  );
  assert.equal(/expected(?:Verdict|State)|ACCEPTED|USER_DECISION/u.test(text), false);
  assert.deepEqual(plan.inspection.requiredOperations, [
    "InspectAncestry",
    "InspectDiff",
    "ReadCandidate",
    "ReadEvidence",
    "RunChecker",
  ]);
  const invalidGraph = structuredClone(plan);
  invalidGraph.candidates[2].previousSha = invalidGraph.base.sha;
  assert.throws(
    () => runner.validateTicketEvaluationPlan(invalidGraph),
    /candidate graph/i,
  );
  const arbitraryRuntime = structuredClone(plan);
  arbitraryRuntime.runtime.codexVersion = "codex-cli 0.999.0";
  assert.throws(
    () => runner.validateTicketEvaluationPlan(arbitraryRuntime),
    /malformed/i,
  );
  const extraRuntimeKey = structuredClone(plan);
  extraRuntimeKey.runtime.latest = true;
  assert.throws(
    () => runner.validateTicketEvaluationPlan(extraRuntimeKey),
    /malformed/i,
  );
  let preparedOptions;
  const prepared = await runner.prepareTicketRuntime(
    "unused-run-root",
    plan,
    async (_runRoot, options) => {
      preparedOptions = options;
      return {
        version: "codex-cli 0.146.0",
        doctor: { codexVersion: "0.146.0" },
      };
    },
  );
  assert.deepEqual(preparedOptions, {
    expectedCodexVersion: "codex-cli 0.146.0",
  });
  assert.equal(prepared.version, "codex-cli 0.146.0");
  await assert.rejects(
    () =>
      runner.prepareTicketRuntime("unused-run-root", plan, async () => ({
        version: "codex-cli 0.146.0",
        doctor: { codexVersion: "0.145.0" },
      })),
    /runtime contract/i,
  );
  assert.deepEqual(
    runner.assertTicketSessionRuntime(
      {
        initializeResult: {
          userAgent:
            "joewrks-codex-evidence-collector/0.146.0 (Windows 10; x86_64)",
        },
      },
      runner.resolveTicketRuntimeContract(plan),
    ),
    {
      expectedCodexVersion: "codex-cli 0.146.0",
      userAgent:
        "joewrks-codex-evidence-collector/0.146.0 (Windows 10; x86_64)",
    },
  );
  assert.throws(
    () =>
      runner.assertTicketSessionRuntime(
        {
          initializeResult: {
            userAgent: "joewrks-codex-evidence-collector/10.146.0",
          },
        },
        runner.resolveTicketRuntimeContract(plan),
      ),
    /user agent differs/i,
  );
  const request = await runner.snapshotTicketManifestRequest(
    fileURLToPath(planPath),
  );
  assert.equal(request.status, "validated");
  assert.equal(request.id, "joeness-ticket-m1c-prompt-manifest-v2");
  assert.equal(request.runtime.codexVersion, "codex-cli 0.146.0");
  assert.equal(request.sha256, createHash("sha256").update(text).digest("hex"));
  const failure = runner.buildTicketFailureRecord(
    "smoke",
    new Error("fixture failure"),
    request,
  );
  assert.equal(failure.id, "joeness-ticket-m1c-smoke-v2");
  assert.deepEqual(failure.manifestRequest, request);
});

test("M1C CLI separates disposable smoke from the immutable six-case batch", async () => {
  const runner = await loadRunner();
  assert.equal(typeof runner?.parseTicketEvaluatorCli, "function");
  assert.deepEqual(
    runner.parseTicketEvaluatorCli([
      "--manifest",
      "manifest.json",
      "--mode",
      "smoke",
      "--candidate",
      "c1-normal",
      "--output",
      "smoke.json",
    ]),
    {
      manifest: "manifest.json",
      mode: "smoke",
      candidate: "c1-normal",
      output: "smoke.json",
      rawOutput: null,
    },
  );
  assert.throws(
    () =>
      runner.parseTicketEvaluatorCli([
        "--manifest",
        "manifest.json",
        "--mode",
        "batch",
        "--output",
        "summary.json",
      ]),
    /raw-output/i,
  );
});

test("live output paths are reserved before evaluation and existing artifacts block", async (t) => {
  const runner = await loadRunner();
  assert.equal(typeof runner?.reserveTicketOutputPaths, "function");
  const root = await mkdtemp(path.join(tmpdir(), "joeness-ticket-output-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const summary = path.join(root, "summary.json");
  const raw = path.join(root, "raw.json");
  const reservation = await runner.reserveTicketOutputPaths([summary, raw]);
  assert.equal(reservation.locks.length, 2);
  assert.equal(
    reservation.locks.every(
      (lock) => path.dirname(lock) === path.resolve(tmpdir()),
    ),
    true,
  );
  await assert.rejects(
    () => runner.reserveTicketOutputPaths([summary, raw]),
    /reserved|exists/i,
  );
  await reservation.release();
  await writeFile(summary, "existing\n", "utf8");
  await assert.rejects(
    () => runner.reserveTicketOutputPaths([summary, raw]),
    /exists/i,
  );
});
