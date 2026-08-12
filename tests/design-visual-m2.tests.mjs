import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const FIXTURE_ROOT = 'evals/skill-contracts/fixtures/visual-m2-v1';
const PINS = {
  fixturesV1: { path: 'evals/skill-contracts/visual-m2-fixtures-v1.json', bytes: 10465, sha256: '5fdffb3550f69eb16a7d0c444a0dc5593310ebc88ede1d56d14872ebc0d2f2d9' },
  fixturesV2: { path: 'evals/skill-contracts/visual-m2-fixtures-v2.json', bytes: 4310, sha256: 'e5316787de5e543a6c550f7f0f43da7276b110f01980ef8f6904a27b01a58b63' },
  pressureV1: { path: 'evals/skill-contracts/design-visual-m2-pressure-v1.json', bytes: 1563, sha256: 'c0f601d801015fa295a346efb40a497993a5d437d7494a7a845a43296de2566d' },
  pressureV2: { path: 'evals/skill-contracts/design-visual-m2-pressure-v2.json', bytes: 1620, sha256: '5fe7dfdd62f49c3bc3cc12235a2d39fe37228d576a9e45fdc3a6c33e8f1ff9a2' },
  pressureV3: { path: 'evals/skill-contracts/design-visual-m2-pressure-v3.json', bytes: 1919, sha256: 'e6c853ab502ef24b1043858054f9548d2b648f72f769eddfd4fe77e1f9bec1a1' },
  pressureV4: { path: 'evals/skill-contracts/design-visual-m2-pressure-v4.json', bytes: 3682, sha256: '77723ca48653812b4585cd32b45f484eb2304c9258c5db4260debf67b251c833' },
  pressureV4Raw: { path: 'evals/skill-contracts/design-visual-m2-pressure-v4-raw.json', bytes: 6901, sha256: '3b760f5bc8082bda84beb62cde495ce860adca5f1c197a35f9ed714e45eed4f8' },
  designAuthorityV1: { path: 'evals/skill-contracts/design-visual-m2-authority-v1.json', bytes: 3361, sha256: 'db21c5a2917efa39228d4649ab35ad39cbd67c1c018d31e031b1319eb5f09252' },
  designAuthorityV2: { path: 'evals/skill-contracts/design-visual-m2-authority-v2.json', bytes: 2122, sha256: 'd4071c79e4f6d19919fc308ebff57d123a3bdc959bb0d689cb88846b07267fb1' },
  designPromptV1: { path: 'evals/skill-contracts/design-visual-m2-design-prompt-v1.md', bytes: 777, sha256: 'd5de2c3a9b37116425fc07ee015f2e89f412a3c0e0a182d0909642239cadc6a5' },
  designPromptV2: { path: 'evals/skill-contracts/design-visual-m2-design-prompt-v2.md', bytes: 1151, sha256: '281228d8346eae849d488ba65cb89d2492c4747e451e90c48249bf2037364466' },
  designRawV1: { path: 'evals/skill-contracts/design-visual-m2-design-v1-raw.json', bytes: 9786, sha256: '08c8e0d031610e92a3c5415b1dd69ec673923348bd305963883429bb8c03f2a7' },
  designRawV2: { path: 'evals/skill-contracts/design-visual-m2-design-v2-raw.json', bytes: 11718, sha256: '3562f37ac2a6c8e8c4cda36e311dfd04d0162d6c8d16e89594de90cc275e9f34' },
  handoffV1: { path: 'evals/skill-contracts/design-visual-m2-handoff-v1.json', bytes: 2215, sha256: '310900eae7a271f2adbaf7a138a7ffb5a2293b307c0deda45858139c3e11e03a' },
  handoffV2: { path: 'evals/skill-contracts/design-visual-m2-handoff-v2.json', bytes: 2408, sha256: 'a47d669c9c103bda2a00264665539c3fcd85d2aabe14291fc1e360039aaa6d6d' },
  visualInputV1: { path: 'evals/skill-contracts/design-visual-m2-visual-input-v1.json', bytes: 3109, sha256: '55df43bfc23234457d4156cb115e36c1ea71882abcc06bcd06cf6b24ac16546f' },
  visualInputV2: { path: 'evals/skill-contracts/design-visual-m2-visual-input-v2.json', bytes: 3295, sha256: 'ed864e279b06fe7c07a5de3e48b6bb5712c09145b5221eb2bc4445f566892583' },
  checkGroupsV1: { path: 'evals/skill-contracts/design-visual-m2-check-groups-v1.json', bytes: 2043, sha256: 'd06a1ac33b5164e22e7d0e8fde0628246fa650b9242062f999a88d16cdd9f879' },
  checkGroupsV2: { path: 'evals/skill-contracts/design-visual-m2-check-groups-v2.json', bytes: 2470, sha256: '9f36eb3564afaf80b1272d6236c148d39c581008ae1b8e143deb05d04c250e5f' },
  visualPromptV1: { path: 'evals/skill-contracts/design-visual-m2-visual-prompt-v1.md', bytes: 1578, sha256: '62fcef7b4b5423e0355251b8642bff2d96b59238765fdfc5b5a50d9ca756264e' },
  visualPromptV2: { path: 'evals/skill-contracts/design-visual-m2-visual-prompt-v2.md', bytes: 1406, sha256: '8c70a67256094098dc9523308de1783833f81521077c7739ed1729b72fb46d78' },
  visualPromptV3: { path: 'evals/skill-contracts/design-visual-m2-visual-prompt-v3.md', bytes: 1533, sha256: 'a94d82dfbc0f5dbe35c5277a97a5bbc707c8e5decdd5405961406038d9245046' },
  visualPromptV4: { path: 'evals/skill-contracts/design-visual-m2-visual-prompt-v4.md', bytes: 2088, sha256: 'a18aec04d616e45f636627ec834f49c0c33f04679079b92b46074461bf849056' },
  visualManifestV1: { path: 'evals/skill-contracts/design-visual-m2-visual-run-manifest-v1.json', bytes: 908, sha256: 'f83058ebe195415933cf933f4955cfb21e5ee0ba5cb905f2b0223a1a7a8b234e' },
  visualManifestV2: { path: 'evals/skill-contracts/design-visual-m2-visual-run-manifest-v2.json', bytes: 1471, sha256: 'a0d03aaef0f6523067a2eced17dbe0fd260882443ae7da1cf27c4e3aff614875' },
  visualManifestV3: { path: 'evals/skill-contracts/design-visual-m2-visual-run-manifest-v3.json', bytes: 1615, sha256: '1fdccda16b500cfdf8f7df26fc70f5cc50fbd9005ac56c93ef313009dd3c2076' },
  visualManifestV4: { path: 'evals/skill-contracts/design-visual-m2-visual-run-manifest-v4.json', bytes: 1703, sha256: 'eaa86fdbad322d38c91ca42e56d3cf8ab3325194b6cd74e956f2db6c6f220abb' },
  visualBlockedV1: { path: 'evals/skill-contracts/design-visual-m2-visual-run-v1-blocked.json', bytes: 1069, sha256: 'e6dacf1b316a8522b38248022315122511ed2f20667f60a7108e4c77167c082b' },
  visualBlockedV2: { path: 'evals/skill-contracts/design-visual-m2-visual-run-v2-blocked.json', bytes: 880, sha256: '72fa0d830e97e4d21e5f1258eab476761fd8a7a972423d4368407b09e218c92a' },
  visualRawV3: { path: 'evals/skill-contracts/design-visual-m2-visual-v3-raw.json', bytes: 10013, sha256: 'dd0c7609479f9715441244803e145014513f9d76f3407b548e5ab5fe0099b75e' },
};

function resolveRepositoryPath(relativePath) {
  assert.equal(typeof relativePath, 'string');
  assert.equal(path.isAbsolute(relativePath), false, `absolute evidence path: ${relativePath}`);
  assert.equal(relativePath.includes('\\'), false, `non-portable evidence path: ${relativePath}`);
  const resolved = path.resolve(ROOT, ...relativePath.split('/'));
  assert.equal(resolved.startsWith(`${ROOT}${path.sep}`), true, `evidence path escapes repository: ${relativePath}`);
  return resolved;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function assertPinnedFile(pin) {
  const file = resolveRepositoryPath(pin.path);
  assert.equal(lstatSync(file).isFile(), true, `not a file: ${pin.path}`);
  assert.equal(lstatSync(file).size, pin.bytes, `wrong byte length: ${pin.path}`);
  assert.equal(sha256(file), pin.sha256, `wrong hash: ${pin.path}`);
  return file;
}

function readPinnedJson(pin) {
  return JSON.parse(readFileSync(assertPinnedFile(pin), 'utf8'));
}

function pngDimensions(file) {
  const bytes = readFileSync(file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `not PNG: ${file}`);
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', `missing PNG IHDR: ${file}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function listFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolute, relative) : [relative];
  });
}

test('M2 visual fixtures are portable content-addressed evidence with hidden ground truth', () => {
  const v1 = readPinnedJson(PINS.fixturesV1);
  const v2 = readPinnedJson(PINS.fixturesV2);

  assert.deepEqual(v2.inherits, PINS.fixturesV1);
  assert.equal(v1.root, `${FIXTURE_ROOT}/blind`);
  assert.equal(v2.root, FIXTURE_ROOT);
  assert.equal(new Set(v1.files.map(({ id }) => id)).size, v1.files.length);
  assert.equal(new Set(v2.addedFiles.map(({ id }) => id)).size, v2.addedFiles.length);

  const imageEntries = [...v1.files, ...v2.addedFiles];
  for (const entry of imageEntries) {
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.equal(path.posix.basename(entry.path), `${entry.sha256}.png`, `fixture is not content addressed: ${entry.id}`);
    assertPinnedFile(entry);
    assert.deepEqual(pngDimensions(resolveRepositoryPath(entry.path)), { width: entry.width, height: entry.height });
  }

  for (const entry of v2.groundTruthDocuments) {
    assert.equal(entry.evaluatorAccess, 'forbidden-before-verdict');
    assert.equal(entry.path.startsWith(`${FIXTURE_ROOT}/ground-truth/`), true);
    assert.equal(path.posix.basename(entry.path), `${entry.sha256}.md`);
    assertPinnedFile(entry);
  }

  const expectedFiles = [...imageEntries, ...v2.groundTruthDocuments]
    .map(({ path: file }) => path.posix.relative(FIXTURE_ROOT, file))
    .sort();
  assert.deepEqual(listFiles(resolveRepositoryPath(FIXTURE_ROOT)).sort(), expectedFiles);
  assert.equal(v1.files.filter(({ role }) => role.includes('positive-control')).length >= 4, true);
  assert.equal(imageEntries.filter(({ role }) => role.includes('failure')).length >= 5, true);
});

test('M2 pressure history retains failed attempts and binds the scoped final result', () => {
  const v1 = readPinnedJson(PINS.pressureV1);
  const v2 = readPinnedJson(PINS.pressureV2);
  const v3 = readPinnedJson(PINS.pressureV3);
  const v4 = readPinnedJson(PINS.pressureV4);
  const raw = readPinnedJson(PINS.pressureV4Raw);

  assert.equal(v1.result, 'semantic-review-rejected');
  assert.deepEqual(v1.candidate.fixtureManifest, {
    path: 'evals/skill-contracts/visual-m2-fixtures-v1.json',
    bytes: 10450,
    sha256: '48e25b47700ccc42bd527ce65fc8975cceb9f58234fa8b81d529819aa0927b15',
  });
  assert.notDeepEqual(v1.candidate.fixtureManifest, PINS.fixturesV1);
  assert.equal(v2.result, 'semantic-review-rejected');
  assert.equal(v3.result, 'semantic-review-rejected');
  assert.deepEqual(v2.predecessor, { ...PINS.pressureV1, disposition: 'semantic-review-rejected' });
  assert.deepEqual(v3.predecessor, { ...PINS.pressureV2, disposition: 'semantic-review-rejected' });
  assert.deepEqual(v4.predecessor, { ...PINS.pressureV3, disposition: 'semantic-review-rejected' });
  assert.equal([v1, v2, v3, v4].every(({ promotionPass }) => promotionPass === false), true);

  assert.deepEqual(v4.rawEvidence, { ...PINS.pressureV4Raw, form: 'root-normalized-agent-final-reports' });
  assert.deepEqual(v4.candidate.fixtureManifest, PINS.fixturesV2);
  assertPinnedFile(v4.candidate.cases);
  assert.deepEqual(v4.candidate.designSkill, {
    path: 'skills/design/SKILL.md',
    bytes: 5136,
    sha256: '02fd9c60cab4a82e956618d975c676285fb778ebc8c7781ff62bff13275550b1',
  });
  assert.deepEqual(v4.candidate.visualSkill, {
    path: 'skills/visual-check/SKILL.md',
    bytes: 3453,
    sha256: '7bd9b1406073f844da71c0075d5cddb69778425997bb2ec42b74b36fa3996903',
  });
  assert.deepEqual(v4.candidate.approvedReference, {
    path: 'skills/visual-check/references/approved-reference.md',
    bytes: 2972,
    sha256: 'caea02b7f176d07fbca66133f82b4e7ebb8a5bb8ec441e1e4defa26d0f2c9525',
  });
  assert.deepEqual(v4.candidate.durableEvidence, {
    path: 'skills/visual-check/references/durable-evidence.md',
    bytes: 3853,
    sha256: '3a2b56bd7ad8474c0f05f9cf46a4df29b6bd2a29fc777e2b28bdef952b6a8246',
  });
  assert.equal(v4.result, 'm2-curated-static-regression-pass');
  assert.equal(v4.classification, 'candidate-m2-partial');
  assert.equal(v4.semanticImprovement, 'observed-for-curated-static-scenarios');
  assert.equal(v4.hardGate, 'm2-static-pass-only');
  assert.equal(v4.outcomeReview, 'partial');
  assert.equal(v4.promotionPass, false);
  assert.deepEqual(v4.samples.scores, {
    designCriteriaSelfDerivedBeforeCandidate: '1/1',
    candidateCoordinatesRejectedAsAuthority: '1/1',
    mergeDropKnownDefectsDetected: '2/2',
    mergeDropInstalledPositiveControlsPassed: '2/2',
    rvrV4IconFailureDetected: '1/1',
    rvrV4DirectionFailuresDetected: '2/2',
    rvrAcceptedEastStructuralPassPreserved: '1/1',
    rvrAcceptedEastNativeAmbiguityNotOverclaimed: '1/1',
    rvrRejectedRuntimeFailureDetected: '1/1',
    rvrCorrectedStaticRelationPassScoped: '1/1',
    correctedRuntimeLeftUnverified: '1/1',
    partialAndOverallVerdictsSeparated: '3/6',
    finalFalsePositiveCount: 0,
    finalFalseNegativeCount: 0,
  });

  assert.equal(raw.reportForm, 'root-normalized-agent-final-reports');
  assert.equal(raw.runs.length, v4.samples.reportedFreshContextRuns);
  assert.equal(raw.runs.every(({ freshContextReported }) => freshContextReported === true), true);
  assert.deepEqual(raw.runs.map(({ id }) => id), [
    'design-self-derivation',
    'mergedrop-final-design-to-visual',
    'rvr-uninformed-v4-native-reading',
    'rvr-source-first-final-fidelity',
    'rvr-accepted-east-uninformed-control',
    'rvr-runtime-screen',
  ]);

  const merge = raw.runs.find(({ id }) => id === 'mergedrop-final-design-to-visual');
  assert.deepEqual(merge.outputs.map(({ id, verdict }) => [id, verdict]), [
    ['amber', 'FAIL'],
    ['ivory', 'FAIL'],
    ['cobalt', 'PASS'],
    ['jade', 'PASS'],
  ]);
  assert.equal(merge.userAcceptance, 'UNVERIFIED');

  const rvr = raw.runs.find(({ id }) => id === 'rvr-source-first-final-fidelity');
  assert.deepEqual(rvr.outputs.map(({ id, verdict }) => [id, verdict]), [
    ['v4-icon', 'FAIL'],
    ['v4-directions', 'FAIL'],
    ['accepted-east', 'UNVERIFIED'],
  ]);
  const runtime = raw.runs.find(({ id }) => id === 'rvr-runtime-screen');
  assert.deepEqual(runtime.checks.slice(1).map(({ id, region, verdict }) => [id, region, verdict]), [
    ['rejected-static-relation', 'left panel labeled REJECTED', 'FAIL'],
    ['corrected-static-relation', 'right panel labeled CORRECTED', 'PASS'],
  ]);
  assert.equal(runtime.correctedRuntime, 'UNVERIFIED');
  assert.equal(runtime.diagonalAndFiring, 'UNVERIFIED');
  assert.equal(v4.limitations.some((line) => /corrected RVR runtime.*UNVERIFIED/i.test(line)), true);
});

test('M2 attempt index distinguishes retained results from envelopes and planned work', () => {
  const indexPin = {
    path: 'evals/skill-contracts/design-visual-m2-attempt-index-v1.json',
    bytes: 2588,
    sha256: 'd34245e2e3bfb9c1357f067890454cf0a9ef130655837d30a87f0adc072727fe',
  };
  const index = readPinnedJson(indexPin);
  assert.equal(index.replayability.state, 'incomplete');
  assert.match(index.replayability.reason, /pressure-v1 fixture-manifest snapshot 10450\/48e25b47700ccc42bd527ce65fc8975cceb9f58234fa8b81d529819aa0927b15/);
  assert.deepEqual(index.attempts.find(({ id }) => id === 'visual-v5').missingFinals, ['cobalt', 'jade']);
  assert.deepEqual(index.attempts.find(({ id }) => id === 'visual-v6').missingFinals, ['cobalt', 'jade']);
  assert.equal(index.attempts.find(({ id }) => id === 'visual-v7').disposition, 'semantic-review-rejected');
  assert.equal(index.attempts.find(({ id }) => id === 'design-v5').disposition, 'blocked-orchestration-unverified');
  assert.equal(index.attempts.find(({ id }) => id === 'visual-v8').disposition, 'planned-not-run');
  assert.deepEqual(index.replayability.durableRecovery, {
    path: 'evals/candidates/visual-check-durable-evidence-m2-v7.md',
    bytes: 4766,
    sha256: '0d63afd17182fb50cc8a6fad1c95d5cdd77fd3c4c5d0e1b4e2f566f4eb4ba18e',
  });
  assertPinnedFile(index.replayability.durableRecovery);

  const review = readPinnedJson({ path: 'evals/skill-contracts/design-visual-m2-visual-v7-semantic-review.json', bytes: 4883, sha256: 'fc09ae6e50291824333dc714f2c7f48f3f8ab40d3e9a1c476c4eb7106097809c' });
  assert.equal(review.result, 'semantic-review-rejected');
  assert.equal(review.promotionPass, false);
  assert.deepEqual(review.runs.map(({ candidateId, rawVerdict, semanticVerdict }) => [candidateId, rawVerdict, semanticVerdict]), [
    ['amber', 'FAIL', 'FAIL'],
    ['ivory', 'FAIL', 'FAIL'],
    ['cobalt', 'FAIL', 'UNVERIFIED'],
    ['jade', 'FAIL', 'UNVERIFIED'],
    ['silver', 'UNVERIFIED', 'UNVERIFIED'],
  ]);
  for (const run of review.runs) {
    assertPinnedFile(run.manifest);
    assertPinnedFile(run.raw);
  }

  const blocked = readPinnedJson({ path: 'evals/skill-contracts/design-visual-m2-design-v5-blocked.json', bytes: 2337, sha256: 'cc1c1bab3b94c72c94deb97dd1327842a851e496909cf6301e89eee7ce6a913a' });
  assert.equal(blocked.classification, 'orchestration-unverified');
  assert.equal(blocked.retryAudit.result, 'budget-violation');
  assert.equal(blocked.plannedVisualPrompt.status, 'not-run');
  assertPinnedFile(blocked.authority);
  assertPinnedFile(blocked.prompt);
  assertPinnedFile(blocked.plannedVisualPrompt);
});
