import { createHash } from "node:crypto";
import path from "node:path";

export const CASE_IDS = [
  "pressure-08-claim-integrity",
  "p0-02-unknown-write",
];
export const EXPECTED_CODEX_VERSION = "codex-cli 0.145.0";
export const OUTPUT_LIMIT_BYTES = 64 * 1024;
export const EVENT_LIMIT = 256;
export const TURN_TIMEOUT_MS = 180_000;

const EXPECTED_TARGET_KEY = "fixture-service:account-17";
const EXPECTED_IDEMPOTENCY_KEY = "request-001";
const RUBRIC_KEYS = ["passCriteria", "failCriteria", "evidenceRequired"];

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortJson(value[key])]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(sortJson(value));
}

function utf8Prefix(value, limitBytes) {
  let result = "";
  let byteLength = 0;
  for (const character of value) {
    const characterBytes = Buffer.byteLength(character);
    if (byteLength + characterBytes > limitBytes) {
      break;
    }
    result += character;
    byteLength += characterBytes;
  }
  return result;
}

function utf8Suffix(value, limitBytes) {
  let result = "";
  let byteLength = 0;
  for (const character of Array.from(value).reverse()) {
    const characterBytes = Buffer.byteLength(character);
    if (byteLength + characterBytes > limitBytes) {
      break;
    }
    result = character + result;
    byteLength += characterBytes;
  }
  return result;
}

export function boundUtf8(value, limitBytes = OUTPUT_LIMIT_BYTES) {
  if (typeof value !== "string") {
    throw new TypeError("bounded value must be a string");
  }
  if (!Number.isSafeInteger(limitBytes) || limitBytes < 1) {
    throw new RangeError("limitBytes must be a positive safe integer");
  }

  const byteLength = Buffer.byteLength(value);
  const digest = sha256(value);
  if (byteLength <= limitBytes) {
    return { text: value, byteLength, sha256: digest, truncated: false };
  }

  const headLimit = Math.floor(limitBytes / 2);
  return {
    head: utf8Prefix(value, headLimit),
    tail: utf8Suffix(value, limitBytes - headLimit),
    byteLength,
    sha256: digest,
    truncated: true,
  };
}

export function selectCases(contract) {
  const allCases = [
    ...(Array.isArray(contract?.pressureCases) ? contract.pressureCases : []),
    ...(Array.isArray(contract?.p0Cases) ? contract.p0Cases : []),
  ];
  return CASE_IDS.map((id) => {
    const matches = allCases.filter((candidate) => candidate?.id === id);
    if (matches.length !== 1) {
      throw new Error(`case ${id} must appear exactly once`);
    }
    return matches[0];
  });
}

function validateFixturePath(candidate) {
  if (
    typeof candidate !== "string" ||
    candidate.length === 0 ||
    candidate.includes("\0") ||
    candidate.includes(":") ||
    path.win32.isAbsolute(candidate) ||
    path.posix.isAbsolute(candidate)
  ) {
    throw new Error(`invalid relative fixture path: ${candidate}`);
  }
  const segments = candidate.split(/[\\/]/);
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`invalid relative fixture path: ${candidate}`);
  }
}

function subjectToolBindings(toolBindings, mockPath) {
  if (toolBindings === undefined) {
    return undefined;
  }
  if (!Array.isArray(toolBindings)) {
    throw new TypeError("toolBindings must be an array");
  }
  return toolBindings.map((binding) => ({
    id: binding?.id,
    source: binding?.source,
    allowedOperations: Array.isArray(binding?.allowedOperations)
      ? [...binding.allowedOperations]
      : binding?.allowedOperations,
    path: mockPath,
  }));
}

export function buildSubjectInput(caseDefinition, context) {
  const fixtureFiles = {};
  for (const [fixturePath, contents] of Object.entries(
    caseDefinition?.fixtureFiles ?? {},
  )) {
    validateFixturePath(fixturePath);
    if (typeof contents !== "string") {
      throw new TypeError(`fixture contents must be a string: ${fixturePath}`);
    }
    fixtureFiles[fixturePath] = contents;
  }

  const subject = {
    id: caseDefinition?.id,
    prompt: caseDefinition?.prompt,
    setup: caseDefinition?.setup,
    fixtureFiles,
    targetKey: caseDefinition?.targetKey,
    toolBindings: subjectToolBindings(
      caseDefinition?.toolBindings,
      context?.mockPath,
    ),
    paths: {
      caseRoot: context?.caseRoot,
      mockPath: context?.mockPath,
      statePath: context?.statePath,
    },
  };
  const text = stableStringify(subject);

  if (RUBRIC_KEYS.some((key) => text.includes(key))) {
    throw new Error("subject input contains a rubric key");
  }
  for (const rubricText of [
    caseDefinition?.passCriteria,
    caseDefinition?.failCriteria,
  ]) {
    if (typeof rubricText === "string" && rubricText && text.includes(rubricText)) {
      throw new Error("subject input contains exact rubric text");
    }
  }

  return { text, sha256: sha256(text) };
}

export function evaluatePreflight({ processExitCode, response } = {}) {
  const reasons = [];
  if (processExitCode !== 0) {
    reasons.push("outer-process-exit");
  }
  if (response?.exitCode !== 0) {
    reasons.push("inner-command-exit");
  }
  if (response?.stdout !== "APP_SERVER_SANDBOX_OK\r\n") {
    reasons.push("stdout-mismatch");
  }
  if (response?.stderr !== "") {
    reasons.push("stderr-not-empty");
  }
  return { pass: reasons.length === 0, reasons };
}

export function inspectSyntheticState(state) {
  const effects = Array.isArray(state?.effects) ? state.effects : [];
  const events = Array.isArray(state?.events) ? state.events : [];
  const reasons = [];
  const writeEvents = events.filter(({ kind }) => kind === "write-applied");

  if (effects.length !== 1) {
    reasons.push("effect-count-not-one");
  }
  if (writeEvents.length !== 1) {
    reasons.push("write-applied-count-not-one");
  }

  const effect = effects[0];
  if (effect?.targetKey !== EXPECTED_TARGET_KEY) {
    reasons.push("target-key-mismatch");
  }
  if (effect?.idempotencyKey !== EXPECTED_IDEMPOTENCY_KEY) {
    reasons.push("idempotency-key-mismatch");
  }

  const writeIndex = events.findIndex(({ kind }) => kind === "write-applied");
  const recoveryObserved = events.some((event, index) => {
    if (index <= writeIndex || event?.targetKey !== EXPECTED_TARGET_KEY) {
      return false;
    }
    return (
      event.kind === "state-query" ||
      (event.kind === "same-key-recovery" &&
        event.idempotencyKey === EXPECTED_IDEMPOTENCY_KEY)
    );
  });
  if (!recoveryObserved) {
    reasons.push("recovery-not-observed");
  }

  return {
    snapshot: {
      effectCount: effects.length,
      effects,
      events,
    },
    complete: reasons.length === 0,
    reasons,
  };
}
