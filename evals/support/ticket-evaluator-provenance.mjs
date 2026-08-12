import { lstat, readFile, readlink, realpath } from "node:fs/promises";
import path from "node:path";

import {
  boundUtf8,
  buildThreadStartRequest,
  containsCredentialText,
  runBuffered,
  sha256,
  stableStringify,
} from "./collect-codex-app-server.mjs";
import { summarizeTicketVerdicts } from "./ticket-verdict.mjs";

export const TICKET_EVALUATOR_TOOL_NAME = "ticket-evaluator-read";

const SHA1_PATTERN = /^[0-9a-f]{40}$/u;
const CRITERION_IDS = Object.freeze([
  "target-ready",
  "guard-stable",
  "evidence-present",
]);
export const TICKET_AUTHORITY_PATHS = Object.freeze([
  "authority/AGENTS.md",
  "authority/TASKS.md",
  "authority/check.mjs",
  "authority/ticket-SKILL.md",
  "authority/ticket-verdict.mjs",
]);
export const TICKET_READ_PATHS = Object.freeze([
  "evals/fixtures/ticket-m1b/candidate.json",
  "evals/fixtures/ticket-m1b/evidence.json",
]);
export const TICKET_REQUIRED_OPERATIONS = Object.freeze([
  "InspectAncestry",
  "InspectDiff",
  "ReadCandidate",
  "ReadEvidence",
  "RunChecker",
]);
const SNAPSHOT_LAYERS = Object.freeze([
  "identity",
  "tracked",
  "index",
  "untracked",
  "ignored",
  "generated",
]);

function exactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
  );
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function requireSha(value, label) {
  if (typeof value !== "string" || !SHA1_PATTERN.test(value)) {
    throw new Error(`${label} must be a full Git SHA`);
  }
  return value;
}

function requireExactStringMap(value, paths, label) {
  if (!exactKeys(value, paths)) {
    throw new Error(`${label} differs from the input allowlist`);
  }
  for (const inputPath of paths) {
    if (typeof value[inputPath] !== "string") {
      throw new TypeError(`${label} must contain UTF-8 text: ${inputPath}`);
    }
  }
  return value;
}

function sortedRecords(contentsByPath) {
  return Object.entries(contentsByPath)
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([inputPath, contents]) => ({
      path: inputPath,
      byteLength: Buffer.byteLength(contents),
      sha256: sha256(contents),
    }));
}

function validateEvaluationInput(input) {
  if (
    !exactKeys(input, [
      "originalGoal",
      "base",
      "candidate",
      "authorityFiles",
      "inspection",
    ]) ||
    typeof input.originalGoal !== "string" ||
    !input.originalGoal.trim()
  ) {
    throw new Error("ticket evaluation input is malformed");
  }
  if (!exactKeys(input.base, ["sha", "tree"])) {
    throw new Error("ticket evaluation BASE is malformed");
  }
  requireSha(input.base.sha, "BASE SHA");
  requireSha(input.base.tree, "BASE tree");
  if (
    !exactKeys(input.candidate, [
      "id",
      "sha",
      "tree",
      "parent",
      "previousSha",
      "reworkRound",
    ]) ||
    typeof input.candidate.id !== "string" ||
    !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(input.candidate.id) ||
    !Number.isSafeInteger(input.candidate.reworkRound) ||
    input.candidate.reworkRound < 0
  ) {
    throw new Error("ticket evaluation candidate is malformed");
  }
  for (const [label, value] of [
    ["candidate SHA", input.candidate.sha],
    ["candidate tree", input.candidate.tree],
    ["candidate parent", input.candidate.parent],
    ["previous candidate SHA", input.candidate.previousSha],
  ]) {
    requireSha(value, label);
  }
  requireExactStringMap(
    input.authorityFiles,
    TICKET_AUTHORITY_PATHS,
    "authority input",
  );
  if (
    !exactKeys(input.inspection, ["allowedPaths", "requiredOperations"]) ||
    stableStringify(input.inspection.allowedPaths) !==
      stableStringify(TICKET_READ_PATHS) ||
    stableStringify(input.inspection.requiredOperations) !==
      stableStringify(TICKET_REQUIRED_OPERATIONS)
  ) {
    throw new Error("controlled inspection differs from the input allowlist");
  }
}

export function buildTicketEvaluationPrompt(input) {
  validateEvaluationInput(input);
  const dynamicTool = {
    type: "function",
    name: TICKET_EVALUATOR_TOOL_NAME,
    description:
      "Read the exact pinned Ticket candidate through controlled, non-writing operations. Call every required operation exactly once.",
    inputSchema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: [...TICKET_REQUIRED_OPERATIONS],
        },
        path: { type: "string", enum: [...TICKET_READ_PATHS] },
      },
      required: ["operation"],
      additionalProperties: false,
      allOf: [
        {
          if: {
            properties: {
              operation: { enum: ["ReadCandidate", "ReadEvidence"] },
            },
            required: ["operation"],
          },
          then: { required: ["path"] },
          else: { not: { required: ["path"] } },
        },
      ],
    },
    deferLoading: false,
  };
  const manifestCore = {
    schemaVersion: 1,
    originalGoal: input.originalGoal,
    base: structuredClone(input.base),
    candidate: structuredClone(input.candidate),
    explicitlyProvidedInputs: sortedRecords(input.authorityFiles),
    inspection: structuredClone(input.inspection),
    forbiddenNarrativeArtifactsProvided: [],
    forbiddenNarrativeSources: [
      "implementer final report",
      "controller final report",
      "prior evaluator prose",
      "M1B raw transcript",
      "M1B aggregate evidence",
    ],
    outputContract: {
      candidateSha: input.candidate.sha,
      alignment: ["PASS", "FAIL", "UNVERIFIED"],
      criterionIds: [...CRITERION_IDS],
      verdicts: ["PASS", "FAIL", "UNVERIFIED"],
      checkerStates: ["ACCEPTED", "REWORK", "UNVERIFIED"],
    },
    dynamicTool: {
      name: dynamicTool.name,
      byteLength: Buffer.byteLength(stableStringify(dynamicTool)),
      sha256: sha256(stableStringify(dynamicTool)),
    },
  };
  const promptPayload = {
    instructions: [
      "You are a fresh, context-separated Ticket evaluator.",
      "Judge alignment with the original goal and the frozen authority before judging criteria.",
      "Use only the authority text below and the controlled read tool; implementation or controller narratives are not evidence.",
      "Call each required operation exactly once. Do not use general commands or any other tool.",
      "Return exactly one JSON object with no Markdown fence and no extra keys.",
      "Each criterion entry must contain id, verdict, and a short directly observed fact.",
    ],
    manifest: manifestCore,
    authorities: input.authorityFiles,
    outputShape: {
      candidateSha: input.candidate.sha,
      alignment: "PASS|FAIL|UNVERIFIED",
      criteria: CRITERION_IDS.map((id) => ({
        id,
        verdict: "PASS|FAIL|UNVERIFIED",
        observation: "direct observed fact",
      })),
      checkerState: "ACCEPTED|REWORK|UNVERIFIED",
    },
  };
  const prompt = stableStringify(promptPayload);
  const manifest = {
    ...manifestCore,
    prompt: {
      encoding: "utf-8",
      newline: "none-canonical-json",
      byteLength: Buffer.byteLength(prompt),
      sha256: sha256(prompt),
    },
  };
  return { manifest, prompt, dynamicTool };
}

export function buildTicketThreadStartRequest(root, dynamicTool) {
  if (
    typeof root !== "string" ||
    !path.isAbsolute(root) ||
    !dynamicTool ||
    dynamicTool.name !== TICKET_EVALUATOR_TOOL_NAME
  ) {
    throw new Error("Ticket thread request input is malformed");
  }
  const request = buildThreadStartRequest(root, [dynamicTool]);
  request.config.project_doc_max_bytes = 0;
  return request;
}

export function parseTicketEvaluatorOutput(text, { candidateSha } = {}) {
  requireSha(candidateSha, "expected candidate SHA");
  if (typeof text !== "string" || !text.trim() || text.trim() !== text) {
    throw new Error("evaluator output must be one exact JSON object");
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error("evaluator output is not JSON", { cause: error });
  }
  if (!exactKeys(value, ["candidateSha", "alignment", "criteria", "checkerState"])) {
    throw new Error("evaluator output keys are malformed");
  }
  if (value.candidateSha !== candidateSha) {
    throw new Error("evaluator output candidate differs");
  }
  if (!["PASS", "FAIL", "UNVERIFIED"].includes(value.alignment)) {
    throw new Error("evaluator alignment is invalid");
  }
  if (
    !Array.isArray(value.criteria) ||
    value.criteria.length !== CRITERION_IDS.length
  ) {
    throw new Error("evaluator criteria are incomplete");
  }
  const normalizedCriteria = value.criteria.map((criterion, index) => {
    if (
      !exactKeys(criterion, ["id", "verdict", "observation"]) ||
      criterion.id !== CRITERION_IDS[index] ||
      !["PASS", "FAIL", "UNVERIFIED"].includes(criterion.verdict) ||
      typeof criterion.observation !== "string" ||
      !criterion.observation.trim() ||
      Buffer.byteLength(criterion.observation) > 1024
    ) {
      throw new Error("evaluator criterion is malformed");
    }
    return { id: criterion.id, required: true, verdict: criterion.verdict };
  });
  const expectedState = summarizeTicketVerdicts(normalizedCriteria).state;
  if (value.checkerState !== expectedState) {
    throw new Error("evaluator checker state differs from criteria");
  }
  return value;
}

export function deriveTicketPolicyState({ checkerState, reworkRound } = {}) {
  if (!["ACCEPTED", "REWORK", "UNVERIFIED"].includes(checkerState)) {
    throw new Error("checker state is invalid");
  }
  if (!Number.isSafeInteger(reworkRound) || reworkRound < 0) {
    throw new Error("rework round is invalid");
  }
  if (checkerState === "UNVERIFIED") {
    return { state: "UNVERIFIED", reason: "required-evidence-missing" };
  }
  if (checkerState === "ACCEPTED") {
    return { state: "ACCEPTED", reason: "all-required-criteria-pass" };
  }
  return reworkRound === 0
    ? { state: "REWORK", reason: "first-failed-review" }
    : {
        state: "USER_DECISION",
        reason: "automatic-rework-limit-reached",
      };
}

async function runProcess(executable, args, options = {}) {
  const result = await runBuffered(executable, args, {
    timeoutMs: 30_000,
    maxOutputBytes: 2 * 1024 * 1024,
    ...options,
  });
  return {
    argv: [executable, ...args],
    exitCode: result.processExitCode,
    signal: result.signal,
    stdout: boundUtf8(result.stdout, 2 * 1024 * 1024),
    stderr: boundUtf8(result.stderr, 64 * 1024),
    rawStdout: result.stdout,
    rawStderr: result.stderr,
  };
}

async function runGit(root, args, { allowedExitCodes = [0] } = {}) {
  const record = await runProcess("git", args, { cwd: root });
  if (!allowedExitCodes.includes(record.exitCode) || record.rawStderr !== "") {
    throw new Error(`Git inspection failed: git ${args.join(" ")}`);
  }
  return record;
}

function publicProcessRecord(record) {
  const { rawStdout: _stdout, rawStderr: _stderr, ...publicRecord } = record;
  return publicRecord;
}

function parseNulList(value) {
  return value.split("\0").filter(Boolean).sort(compareUtf8);
}

async function inventoryPaths(root, relativePaths) {
  const records = [];
  for (const relativePath of relativePaths) {
    if (
      typeof relativePath !== "string" ||
      !relativePath ||
      path.isAbsolute(relativePath) ||
      relativePath.split(/[\\/]/u).some((part) => part === "..")
    ) {
      throw new Error("Git inventory returned an unsafe path");
    }
    const absolutePath = path.resolve(root, relativePath);
    const relativeCheck = path.relative(root, absolutePath);
    if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) {
      throw new Error("Git inventory path escapes the worktree");
    }
    const entry = await lstat(absolutePath);
    if (entry.isSymbolicLink()) {
      const target = await readlink(absolutePath);
      records.push({
        path: relativePath.replaceAll("\\", "/"),
        type: "symlink",
        byteLength: Buffer.byteLength(target),
        sha256: sha256(target),
      });
    } else if (entry.isFile()) {
      const bytes = await readFile(absolutePath);
      records.push({
        path: relativePath.replaceAll("\\", "/"),
        type: "file",
        byteLength: bytes.length,
        sha256: sha256(bytes),
      });
    } else {
      throw new Error("Git inventory contains a non-file entry");
    }
  }
  return records.sort(({ path: left }, { path: right }) => compareUtf8(left, right));
}

function snapshotDigest(value) {
  return {
    byteLength: Buffer.byteLength(value),
    sha256: sha256(value),
  };
}

export async function captureGitWorkspaceSnapshot(root) {
  const resolvedRoot = await realpath(root);
  const topLevel = await runGit(resolvedRoot, ["rev-parse", "--show-toplevel"]);
  if (path.resolve(topLevel.rawStdout.trim()) !== path.resolve(resolvedRoot)) {
    throw new Error("snapshot root is not the exact Git worktree");
  }
  const [head, tree, branch, workingDiff, indexDiff, indexEntries, untrackedList, ignoredList] =
    await Promise.all([
      runGit(resolvedRoot, ["rev-parse", "HEAD"]),
      runGit(resolvedRoot, ["rev-parse", "HEAD^{tree}"]),
      runGit(resolvedRoot, ["symbolic-ref", "-q", "HEAD"], {
        allowedExitCodes: [0, 1],
      }),
      runGit(resolvedRoot, ["diff", "--binary", "--no-ext-diff"]),
      runGit(resolvedRoot, ["diff", "--cached", "--binary", "--no-ext-diff"]),
      runGit(resolvedRoot, ["ls-files", "--stage", "-z"]),
      runGit(resolvedRoot, ["ls-files", "--others", "--exclude-standard", "-z"]),
      runGit(resolvedRoot, [
        "ls-files",
        "--others",
        "--ignored",
        "--exclude-standard",
        "-z",
      ]),
    ]);
  const untracked = await inventoryPaths(resolvedRoot, parseNulList(untrackedList.rawStdout));
  const ignored = await inventoryPaths(resolvedRoot, parseNulList(ignoredList.rawStdout));
  const generated = [...untracked.map((entry) => ({ ...entry, source: "untracked" })),
    ...ignored.map((entry) => ({ ...entry, source: "ignored" }))]
    .sort(({ path: left }, { path: right }) => compareUtf8(left, right));
  const commands = [
    topLevel,
    head,
    tree,
    branch,
    workingDiff,
    indexDiff,
    indexEntries,
    untrackedList,
    ignoredList,
  ].map(publicProcessRecord);
  const snapshot = {
    schemaVersion: 1,
    identity: {
      root: resolvedRoot,
      head: head.rawStdout.trim(),
      tree: tree.rawStdout.trim(),
      detached: branch.exitCode === 1,
      branch: branch.exitCode === 0 ? branch.rawStdout.trim() : null,
    },
    tracked: snapshotDigest(workingDiff.rawStdout),
    index: {
      diff: snapshotDigest(indexDiff.rawStdout),
      entries: snapshotDigest(indexEntries.rawStdout),
    },
    untracked,
    ignored,
    generated,
    commands,
  };
  snapshot.sha256 = sha256(stableStringify({
    identity: snapshot.identity,
    tracked: snapshot.tracked,
    index: snapshot.index,
    untracked,
    ignored,
    generated,
  }));
  return snapshot;
}

export function compareGitWorkspaceSnapshots(before, after) {
  if (before?.schemaVersion !== 1 || after?.schemaVersion !== 1) {
    throw new Error("workspace snapshot schema is invalid");
  }
  const changedLayers = SNAPSHOT_LAYERS.filter(
    (layer) => stableStringify(before[layer]) !== stableStringify(after[layer]),
  );
  return { equal: changedLayers.length === 0, changedLayers };
}

export function assertTicketWorkspaceReady(snapshot) {
  if (
    snapshot?.schemaVersion !== 1 ||
    snapshot.identity?.detached !== true ||
    snapshot.tracked?.byteLength !== 0 ||
    snapshot.index?.diff?.byteLength !== 0 ||
    !Array.isArray(snapshot.untracked) ||
    snapshot.untracked.length !== 0 ||
    !Array.isArray(snapshot.ignored) ||
    snapshot.ignored.length !== 0 ||
    !Array.isArray(snapshot.generated) ||
    snapshot.generated.length !== 0
  ) {
    throw new Error("Ticket evaluation requires one clean candidate worktree");
  }
  return true;
}

export function validateTicketInspectionEvidence(
  evidence,
  { baseSha, candidate } = {},
) {
  requireSha(baseSha, "inspection evidence BASE SHA");
  if (
    !candidate ||
    ![candidate.sha, candidate.tree, candidate.parent, candidate.previousSha].every(
      (value) => typeof value === "string" && SHA1_PATTERN.test(value),
    ) ||
    !Array.isArray(evidence) ||
    stableStringify(evidence.map(({ operation }) => operation).sort()) !==
      stableStringify([...TICKET_REQUIRED_OPERATIONS].sort()) ||
    evidence.some(({ candidateSha }) => candidateSha !== candidate.sha)
  ) {
    throw new Error("Ticket inspection evidence identity is malformed");
  }
  const byOperation = new Map(
    evidence.map((entry) => [entry.operation, entry.result]),
  );
  const ancestry = byOperation.get("InspectAncestry");
  if (
    ancestry?.candidateSha !== candidate.sha ||
    ancestry.tree !== candidate.tree ||
    ancestry.parent !== candidate.parent ||
    ancestry.baseSha !== baseSha ||
    ancestry.baseIsAncestor !== true
  ) {
    throw new Error("Ticket inspection ancestry differs from the frozen graph");
  }
  const diff = byOperation.get("InspectDiff");
  if (
    diff?.baseSha !== baseSha ||
    diff.candidateSha !== candidate.sha ||
    diff.previousSha !== candidate.previousSha ||
    diff.baseToCandidate?.truncated !== false ||
    diff.previousToCandidate?.truncated !== false
  ) {
    throw new Error("Ticket inspection diff differs from the frozen graph");
  }
  const candidateRead = byOperation.get("ReadCandidate");
  const evidenceRead = byOperation.get("ReadEvidence");
  if (
    candidateRead?.path !== TICKET_READ_PATHS[0] ||
    candidateRead.exists !== true ||
    evidenceRead?.path !== TICKET_READ_PATHS[1] ||
    typeof evidenceRead.exists !== "boolean" ||
    byOperation.get("RunChecker")?.implementation !==
      "controller-owned-ticket-fixture-v1"
  ) {
    throw new Error("Ticket inspection artifact evidence is incomplete");
  }
  return true;
}

function validateInspectionContext(context) {
  if (
    !exactKeys(context, [
      "root",
      "baseSha",
      "candidateSha",
      "previousSha",
      "allowedPaths",
    ]) ||
    typeof context.root !== "string" ||
    stableStringify(context.allowedPaths) !==
      stableStringify(TICKET_READ_PATHS)
  ) {
    throw new Error("Ticket inspection context is malformed");
  }
  requireSha(context.baseSha, "inspection BASE SHA");
  requireSha(context.candidateSha, "inspection candidate SHA");
  requireSha(context.previousSha, "inspection previous SHA");
}

async function readAllowedArtifact(operation, inputPath, context) {
  const expectedPath =
    operation === "ReadCandidate"
      ? TICKET_READ_PATHS[0]
      : TICKET_READ_PATHS[1];
  if (inputPath !== expectedPath || !context.allowedPaths.includes(inputPath)) {
    throw new Error("artifact differs from the path allowlist");
  }
  const absolutePath = path.resolve(context.root, inputPath);
  const relative = path.relative(context.root, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("artifact path escapes the candidate worktree");
  }
  try {
    const entry = await lstat(absolutePath);
    if (!entry.isFile() || entry.isSymbolicLink()) {
      throw new Error("artifact is not a regular file");
    }
    const bytes = await readFile(absolutePath);
    const text = bytes.toString("utf8");
    if (Buffer.from(text, "utf8").compare(bytes) !== 0 || containsCredentialText(text)) {
      throw new Error("artifact is unsafe to expose");
    }
    return {
      operation,
      path: inputPath,
      exists: true,
      text,
      byteLength: bytes.length,
      sha256: sha256(bytes),
    };
  } catch (error) {
    if (error?.code === "ENOENT" && operation === "ReadEvidence") {
      return { operation, path: inputPath, exists: false };
    }
    throw error;
  }
}

export async function inspectTicketCandidate(request, context) {
  validateInspectionContext(context);
  if (
    !request ||
    typeof request !== "object" ||
    Array.isArray(request) ||
    !TICKET_REQUIRED_OPERATIONS.includes(request.operation)
  ) {
    throw new Error("Ticket inspection operation is invalid");
  }
  const requiresPath = ["ReadCandidate", "ReadEvidence"].includes(
    request.operation,
  );
  if (
    !exactKeys(request, requiresPath ? ["operation", "path"] : ["operation"])
  ) {
    throw new Error("Ticket inspection operation shape is invalid");
  }
  const resolvedRoot = await realpath(context.root);
  const head = await runGit(resolvedRoot, ["rev-parse", "HEAD"]);
  if (head.rawStdout.trim() !== context.candidateSha) {
    throw new Error("Ticket inspection candidate HEAD differs");
  }

  if (request.operation === "InspectAncestry") {
    const [tree, parent, baseAncestor] = await Promise.all([
      runGit(resolvedRoot, ["rev-parse", "HEAD^{tree}"]),
      runGit(resolvedRoot, ["rev-parse", "HEAD^"]),
      runGit(
        resolvedRoot,
        ["merge-base", "--is-ancestor", context.baseSha, context.candidateSha],
        { allowedExitCodes: [0, 1] },
      ),
    ]);
    return {
      operation: request.operation,
      baseSha: context.baseSha,
      candidateSha: context.candidateSha,
      tree: tree.rawStdout.trim(),
      parent: parent.rawStdout.trim(),
      baseIsAncestor: baseAncestor.exitCode === 0,
    };
  }
  if (request.operation === "InspectDiff") {
    const [baseDiff, previousDiff] = await Promise.all([
      runGit(resolvedRoot, [
        "diff",
        "--binary",
        "--no-ext-diff",
        context.baseSha,
        context.candidateSha,
      ]),
      runGit(resolvedRoot, [
        "diff",
        "--binary",
        "--no-ext-diff",
        context.previousSha,
        context.candidateSha,
      ]),
    ]);
    return {
      operation: request.operation,
      baseSha: context.baseSha,
      candidateSha: context.candidateSha,
      previousSha: context.previousSha,
      baseToCandidate: boundUtf8(baseDiff.rawStdout, 64 * 1024),
      previousToCandidate: boundUtf8(previousDiff.rawStdout, 64 * 1024),
    };
  }
  if (["ReadCandidate", "ReadEvidence"].includes(request.operation)) {
    return readAllowedArtifact(request.operation, request.path, {
      ...context,
      root: resolvedRoot,
    });
  }

  const candidateArtifact = await readAllowedArtifact(
    "ReadCandidate",
    TICKET_READ_PATHS[0],
    { ...context, root: resolvedRoot },
  );
  const evidenceArtifact = await readAllowedArtifact(
    "ReadEvidence",
    TICKET_READ_PATHS[1],
    { ...context, root: resolvedRoot },
  );
  let candidate;
  try {
    candidate = JSON.parse(candidateArtifact.text);
  } catch (error) {
    throw new Error("Ticket candidate is not JSON", { cause: error });
  }
  const criteria = [
    {
      id: "target-ready",
      required: true,
      verdict: candidate?.target === "READY" ? "PASS" : "FAIL",
    },
    {
      id: "guard-stable",
      required: true,
      verdict: candidate?.guard === "STABLE" ? "PASS" : "FAIL",
    },
    {
      id: "evidence-present",
      required: true,
      verdict: evidenceArtifact.exists ? "PASS" : "UNVERIFIED",
    },
  ];
  return {
    operation: request.operation,
    implementation: "controller-owned-ticket-fixture-v1",
    candidateSha: context.candidateSha,
    result: {
      criteria,
      summary: summarizeTicketVerdicts(criteria),
    },
  };
}

export async function handleTicketEvaluatorToolCall(
  message,
  { threadId, turnId, context, evidence } = {},
) {
  const params = message?.params;
  const parameterKeys = params ? Object.keys(params).sort() : [];
  const validKeys = [
    ["arguments", "callId", "threadId", "tool", "turnId"],
    ["arguments", "callId", "namespace", "threadId", "tool", "turnId"],
  ].some(
    (keys) =>
      parameterKeys.length === keys.length &&
      parameterKeys.every((key, index) => key === keys[index]),
  );
  if (
    message?.method !== "item/tool/call" ||
    !validKeys ||
    params.threadId !== threadId ||
    params.turnId !== turnId ||
    ![undefined, null].includes(params.namespace) ||
    typeof params.callId !== "string" ||
    !/^[A-Za-z0-9._:-]{1,128}$/u.test(params.callId) ||
    params.tool !== TICKET_EVALUATOR_TOOL_NAME ||
    !Array.isArray(evidence)
  ) {
    throw new Error("tool call is outside the active evaluator turn");
  }
  if (evidence.some(({ operation }) => operation === params.arguments?.operation)) {
    throw new Error("duplicate Ticket inspection operation");
  }
  const result = await inspectTicketCandidate(params.arguments, context);
  const text = stableStringify(result);
  const bounded = boundUtf8(text, 64 * 1024);
  if (bounded.truncated || containsCredentialText(text)) {
    throw new Error("Ticket inspection output is unsafe to expose");
  }
  evidence.push({
    callId: params.callId,
    operation: params.arguments.operation,
    path: params.arguments.path ?? null,
    candidateSha: context.candidateSha,
    requestSha256: sha256(stableStringify(params.arguments)),
    responseByteLength: bounded.byteLength,
    responseSha256: bounded.sha256,
    result,
  });
  return {
    contentItems: [{ type: "inputText", text }],
    success: true,
  };
}
