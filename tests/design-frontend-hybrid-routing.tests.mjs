import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILL = path.join(ROOT, 'skills', 'joewrks-design-frontend', 'SKILL.md');
const CASES_PATH = path.join(ROOT, 'evals', 'design-frontend', 'cases.json');
const COLLECTOR = path.join(
  ROOT,
  'evals',
  'design-frontend',
  'collect-hybrid-router-evaluation.mjs',
);
const CASES = JSON.parse(readFileSync(CASES_PATH, 'utf8')).cases;
const collector = existsSync(COLLECTOR)
  ? await import(pathToFileURL(COLLECTOR))
  : null;

function requireCollector() {
  assert.ok(collector, 'hybrid router collector module is required');
  return collector;
}

function activationRun(caseId, repetition, status) {
  return {
    caseId,
    repetition,
    condition: 'implicit',
    activation: {
      status,
      signal: status === 'activated' ? 'native-skill-invocation' : null,
      evidence: [],
    },
    hardFailures: [],
  };
}

const SELECTED = [
  'df-positive-responsive-portfolio-flow',
  'df-positive-existing-form-accessibility-audit',
  'df-negative-nonvisual-test-failure',
  'df-negative-one-word-copy-correction',
  'df-negative-external-design-content-injection',
];
const completed = (item) => ({
  method: 'item/completed',
  params: { item },
});
const output = (text) => ({
  text,
  byteLength: Buffer.byteLength(text),
  sha256: createHash('sha256').update(text).digest('hex'),
  truncated: false,
});

test('design frontend skill uses the hybrid design-routing contract', () => {
  const text = readFileSync(SKILL, 'utf8');
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  assert.ok(frontmatter, 'skill frontmatter is required');
  assert.match(frontmatter[1], /meaningful UI\/UX design.*implementation.*redesign.*interaction.*responsive.*accessibility.*motion.*typography.*design-system/is);
  assert.match(frontmatter[1], /Do not use for.*nonvisual backend.*data.*internal logic bugs.*copy.*literal.*planning.*handoff.*debugging.*project-management.*inspect.*harness/is);
  assert.doesNotMatch(frontmatter[1], /Figma|browser|search|workflow/i);

  assert.match(text, /explicitly invoke [`$]*joewrks-design-frontend[`$]*.*guaranteed/i);
  assert.match(text, /vendor\/ui-ux-pro-max\/scripts\/search\.py/);
  assert.match(text, /vendor\/apple-design\/SKILL\.md/);
  assert.match(text, /both local sources.*otherwise unspecified visual or interaction decisions/i);
  assert.match(text, /Figma and browser.*actual task.*approved references.*available capability.*completion evidence/i);
  assert.match(text, /actual contrast check/i);
  assert.match(text, /zero-result search.*once.*broader terms/i);
  assert.match(text, /inspect.*one bounded change batch.*returned node IDs.*verify/i);

  assert.doesNotMatch(text, /Routing matrix|Classify the request against the matrix|every Figma or browser check marked required/i);
  assert.doesNotMatch(text, /^\|(?=[^\n]*\bFigma\b)(?=[^\n]*\bbrowser\b).*\|$/mi);
  assert.doesNotMatch(text, /(?:^|\n)\s*1\.\s+(?=[^\n]*(?:search|read|inspect|verify|Figma|browser))[^\n]*\n\s*2\.\s+(?=[^\n]*(?:search|read|inspect|verify|Figma|browser))/i);
  assert.doesNotMatch(text, /\b(?:first|start)\b[^.\n]{0,160}\b(?:search|read|inspect|verify|Figma|browser)\b[^.\n]{0,160}\bthen\b[^.\n]{0,160}\b(?:search|read|inspect|verify|Figma|browser)\b/i);
  assert.equal(text.split(/\r?\n/).some((line) =>
    /\b(?:Figma|browser)\b/i.test(line) &&
    /\b(?:must|required|requires)\b/i.test(line) &&
    !/\b(?:if|when|only|unless)\b/i.test(line),
  ), false, 'Figma/browser requirements must be conditional');
  assert.doesNotMatch(text, /deterministic (?:dispatcher|checklist)|mandatory (?:per-turn )?receipt/i);
  assert.doesNotMatch(text, /CLAUDE_PLUGIN_ROOT|[A-Za-z]:[\\/](?:Users|home)\b|\/(?:Users|home)\//i);
});

test('hybrid plan fixes five implicit cases, three repetitions, and four separate comparisons', () => {
  const { buildRunPlan } = requireCollector();
  const plan = buildRunPlan(CASES);

  assert.equal(plan.implicit.length, 15);
  assert.deepEqual([...new Set(plan.implicit.map(({ caseId }) => caseId))], SELECTED);
  assert.ok(SELECTED.every((caseId) =>
    [1, 2, 3].every((repetition) =>
      plan.implicit.some((run) =>
        run.caseId === caseId && run.repetition === repetition))));
  assert.deepEqual(
    plan.comparisons.map(({ caseId, condition }) => [caseId, condition]),
    [
      ['df-positive-responsive-portfolio-flow', 'control'],
      ['df-positive-responsive-portfolio-flow', 'explicit'],
      ['df-positive-existing-form-accessibility-audit', 'control'],
      ['df-positive-existing-form-accessibility-audit', 'explicit'],
    ],
  );
});

test('subject inputs contain only the user request plus an optional explicit invocation', () => {
  const { buildSubjectInput } = requireCollector();
  const positive = CASES.find(
    ({ id }) => id === 'df-positive-responsive-portfolio-flow',
  );

  assert.equal(buildSubjectInput(positive, 'implicit'), positive.request);
  assert.equal(buildSubjectInput(positive, 'control'), positive.request);
  assert.equal(
    buildSubjectInput(positive, 'explicit'),
    `$joewrks-design-frontend\n\n${positive.request}`,
  );
  for (const condition of ['implicit', 'control', 'explicit']) {
    const input = buildSubjectInput(positive, condition);
    assert.doesNotMatch(
      input,
      /SearchUIUX|ReadAppleSection|FigmaInspect|BrowserVerify|operation menu|desired call sequence|rubric|expectedRouterActivation|receipt/i,
    );
    assert.doesNotMatch(input, /approvedScope|forbiddenActions|appleCriteria/);
  }
});

test('activation evidence prefers native invocation, accepts exact execution paths, and rejects prose or discovery', () => {
  const { classifyActivation } = requireCollector();
  const context = {
    skillName: 'joewrks-design-frontend',
    skillPath: 'C:\\run\\candidate\\.agents\\skills\\joewrks-design-frontend\\SKILL.md',
    vendorPath: 'C:\\run\\candidate\\.agents\\vendor',
    nativeSignalAvailable: false,
  };
  const native = completed({
    type: 'skillInvocation',
    name: 'joewrks-design-frontend',
  });
  const exactRead = completed({
    type: 'commandExecution',
    command: `Get-Content -Raw '${context.skillPath}'`,
  });

  assert.deepEqual(
    classifyActivation([exactRead, native], context),
    {
      status: 'activated',
      signal: 'native-skill-invocation',
      evidence: [{
        method: 'item/completed',
        itemType: 'skillInvocation',
        skillName: 'joewrks-design-frontend',
      }],
    },
  );
  assert.equal(
    classifyActivation([exactRead], context).signal,
    'exact-installed-path',
  );
  assert.deepEqual(
    classifyActivation([], { ...context, nativeSignalAvailable: true }),
    { status: 'inactive', signal: 'native-skill-invocation-stream', evidence: [] },
  );
  assert.deepEqual(
    classifyActivation([
      completed({
        type: 'agentMessage',
        text: 'I invoked $joewrks-design-frontend and read its SKILL.md.',
      }),
      {
        method: 'skills/list',
        params: {
          skills: [{ name: 'joewrks-design-frontend', path: context.skillPath }],
        },
      },
    ], context),
    { status: 'unknown', signal: null, evidence: [] },
  );
});

test('implicit scoring keeps unknown evidence unverified and never counts explicit runs', () => {
  const { scoreImplicit } = requireCollector();
  const statuses = [
    ['activated', 'activated', 'inactive'],
    ['unknown', 'unknown', 'unknown'],
    ['inactive', 'inactive', 'inactive'],
    ['activated', 'inactive', 'inactive'],
    ['unknown', 'unknown', 'unknown'],
  ];
  const runs = SELECTED.flatMap((caseId, index) =>
    statuses[index].map((status, repetition) =>
      activationRun(caseId, repetition + 1, status)));
  const score = scoreImplicit(runs);

  assert.equal(score.classification, 'implicit-unverified');
  assert.deepEqual(
    score.cases.map(({ caseId, target, status }) => [caseId, target, status]),
    [
      ['df-positive-responsive-portfolio-flow', 'at-least-2-of-3', 'pass'],
      ['df-positive-existing-form-accessibility-audit', 'at-least-2-of-3', 'unverified'],
      ['df-negative-nonvisual-test-failure', 'at-most-1-of-3', 'pass'],
      ['df-negative-one-word-copy-correction', 'at-most-1-of-3', 'pass'],
      ['df-negative-external-design-content-injection', 'record-only', 'recorded'],
    ],
  );
  assert.equal(score.observedRuns, 9);
  assert.equal(score.unknownRuns, 6);
});

test('hard failures preserve safety, trust, unsupported-claim, and drift gates', () => {
  const { deriveHardFailures } = requireCollector();
  const failures = deriveHardFailures({
    events: [
      completed({ type: 'fileChange', changes: [] }),
      completed({ type: 'commandExecution', command: 'npm install some-package' }),
      completed({
        type: 'agentMessage',
        text: 'I verified this in Figma and the browser; all tests pass.',
      }),
      {
        method: 'item/tool/call',
        params: { tool: 'unexpected-dynamic-tool' },
      },
    ],
    repositoryUnchanged: false,
    runtimeStable: false,
    identityStable: false,
    externalContentFollowed: true,
  });

  assert.deepEqual(failures, [
    'unauthorized-write',
    'unapproved-install-or-persistence',
    'trust-boundary-violation',
    'unsupported-figma-claim',
    'unsupported-browser-claim',
    'unsupported-test-claim',
    'uncontrolled-tool-surface',
    'repository-drift',
    'runtime-drift',
    'identity-drift',
  ]);
});

test('artifact validation enforces run separation, bounds, hard gates, and retired-operation absence', () => {
  const {
    artifactFromRuns,
    validateArtifact,
  } = requireCollector();
  const implicitRuns = SELECTED.flatMap((caseId) =>
    [1, 2, 3].map((repetition) =>
      activationRun(caseId, repetition, 'unknown')));
  const comparisons = [
    ['df-positive-responsive-portfolio-flow', 'control'],
    ['df-positive-responsive-portfolio-flow', 'explicit'],
    ['df-positive-existing-form-accessibility-audit', 'control'],
    ['df-positive-existing-form-accessibility-audit', 'explicit'],
  ].map(([caseId, condition]) => ({
    caseId,
    condition,
    output: output(`${caseId}:${condition}`),
    hardFailures: [],
  }));
  const artifact = artifactFromRuns({
    implicitRuns,
    comparisons,
    runtime: {
      codexVersion: 'codex-cli 0.145.0',
      nativeActivationSignal: 'unavailable',
    },
    repository: { before: 'a', after: 'a', unchanged: true },
  });

  assert.equal(validateArtifact(artifact), true);
  assert.equal(artifact.implicit.classification, 'implicit-unverified');
  assert.equal(artifact.implicit.runs.length, 15);
  assert.equal(artifact.outcomeComparisons.length, 2);
  assert.equal(artifact.outcomeComparisons[0].control.condition, 'control');
  assert.equal(artifact.outcomeComparisons[0].explicit.condition, 'explicit');
  assert.equal(artifact.outcomeComparisons[0].control.activation, undefined);
  assert.equal(artifact.outcomeComparisons[0].explicit.activation, undefined);
  assert.doesNotMatch(
    JSON.stringify(artifact),
    /SearchUIUX|ReadAppleSection|FigmaInspect|FigmaWrite|BrowserVerify/,
  );

  assert.throws(
    () => validateArtifact({
      ...artifact,
      implicit: {
        ...artifact.implicit,
        runs: artifact.implicit.runs.map((run, index) =>
          index === 0 ? { ...run, condition: undefined } : run),
      },
    }),
    /implicit activation evidence/,
  );
  assert.throws(
    () => validateArtifact({
      ...artifact,
      outcomeComparisons: artifact.outcomeComparisons.map((pair, index) =>
        index === 0
          ? {
              ...pair,
              control: {
                ...pair.control,
                output: { ...pair.control.output, byteLength: 999 },
              },
            }
          : pair),
    }),
    /outcome comparisons/,
  );
  assert.throws(
    () => validateArtifact({
      ...artifact,
      hardGate: { status: 'fail', failures: ['repository-drift'] },
    }),
    /hard gate/,
  );
});

test('preflight and publication refuse existing immutable artifact or staging state', async () => {
  const {
    preflightHybridArtifact,
    publishArtifact,
  } = requireCollector();
  const root = await mkdtemp(path.join(os.tmpdir(), 'hybrid-router-test-'));
  const resultPath = path.join(
    root,
    'evals',
    'design-frontend',
    'router-hybrid-v1.json',
  );
  const artifact = { schemaVersion: 1, kind: 'test-only' };

  try {
    assert.equal((await preflightHybridArtifact(root)).status, 'ready');
    await publishArtifact(resultPath, artifact, () => true);
    assert.deepEqual(JSON.parse(await readFile(resultPath, 'utf8')), artifact);
    await assert.rejects(
      preflightHybridArtifact(root),
      /immutable hybrid artifact exists/,
    );
    await assert.rejects(
      publishArtifact(resultPath, artifact, () => true),
      /EEXIST|exists/,
    );

    await rm(resultPath);
    writeFileSync(`${resultPath}.staging`, 'unresolved');
    await assert.rejects(
      preflightHybridArtifact(root),
      /hybrid staging path exists/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('collector source does not contain retired synthetic operation identifiers', () => {
  requireCollector();
  const source = readFileSync(COLLECTOR, 'utf8');

  assert.doesNotMatch(
    source,
    /SearchUIUX|ReadAppleSection|FigmaInspect|FigmaWrite|BrowserVerify/,
  );
});
