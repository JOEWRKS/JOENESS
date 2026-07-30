import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const MANIFEST = path.join(VENDOR, 'source-manifest.json');
const AGENTS = path.join(ROOT, 'AGENTS.md');
const GITATTRIBUTES = path.join(ROOT, '.gitattributes');
const UI_FILES = [
  'SKILL.md',
  'data/app-interface.csv', 'data/charts.csv', 'data/colors.csv',
  'data/google-fonts.csv', 'data/icons.csv', 'data/landing.csv',
  'data/motion.csv', 'data/products.csv', 'data/react-performance.csv',
  'data/styles.csv', 'data/typography.csv', 'data/ui-reasoning.csv',
  'data/ux-guidelines.csv',
  'data/stacks/angular.csv', 'data/stacks/astro.csv',
  'data/stacks/avalonia.csv', 'data/stacks/flutter.csv',
  'data/stacks/html-tailwind.csv', 'data/stacks/javafx.csv',
  'data/stacks/jetpack-compose.csv', 'data/stacks/laravel.csv',
  'data/stacks/nextjs.csv', 'data/stacks/nuxt-ui.csv',
  'data/stacks/nuxtjs.csv', 'data/stacks/react-native.csv',
  'data/stacks/react.csv', 'data/stacks/shadcn.csv',
  'data/stacks/svelte.csv', 'data/stacks/swiftui.csv',
  'data/stacks/threejs.csv', 'data/stacks/uno.csv',
  'data/stacks/uwp.csv', 'data/stacks/vue.csv', 'data/stacks/winui.csv',
  'data/stacks/wpf.csv',
  'references/pro-rules.md', 'references/quick-reference.md',
  'scripts/core.py', 'scripts/design_system.py', 'scripts/search.py',
  'scripts/tests/test_core.py', 'scripts/validate_data.py',
];
const EXPECTED_FILES = [
  ...UI_FILES.map((file) => `vendor/ui-ux-pro-max/${file}`),
  'vendor/apple-design/SKILL.md',
  'vendor/notices/apple-design-LICENSE',
  'vendor/notices/ui-ux-pro-max-LICENSE',
].sort();
const EXPECTED_SOURCES = {
  'ui-ux-pro-max': {
    repository: 'nextlevelbuilder/ui-ux-pro-max-skill',
    url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
    commit: '3b5df7547964f0cb3424de74cff55b69039250d3',
    upstreamPath: '.claude/skills/ui-ux-pro-max/**',
    archiveSha256: 'ba29a4e0e380a0017f833a1041f558972a55fbad81d056c3d9a549e1609f0841',
    licenseSha256: '738f69dfa83db5c347c678fb9d90e560877059f0de93a327c39001bff92dc014',
  },
  'apple-design': {
    repository: 'emilkowalski/skills',
    url: 'https://github.com/emilkowalski/skills',
    commit: 'e695d13cb298db0f46d5ef05be2ad13fa12908a6',
    upstreamPath: 'skills/apple-design/SKILL.md',
    archiveSha256: '870b5b75ddc1763b5f8bb19cbac2c2478b54e12c8a42ec8627c189f95c286670',
    licenseSha256: '4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b',
  },
};
const EXPECTED_ACTIVE_SKILL = {
  authorship: 'joewrks-canonical',
  evaluationState: 'candidate',
  sourceDependencies: ['ui-ux-pro-max', 'apple-design'],
  intentionalDifferences: [
    'Local activation and routing contract.',
    'Local OpenAI product metadata.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/joewrks-design-frontend/SKILL.md',
      bytes: 2685,
      sha256: '0694f0d0880c079ab50b2af2621ef37f9745eae356f0c9ebc5a1351cd0d8a67d',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/joewrks-design-frontend/agents/openai.yaml',
      bytes: 263,
      sha256: '3d0bc6bf72b93b3bd185852f080b19caeb17aed45f582df339d61c2633f81892',
      exactUpstreamCopy: false,
    },
  ],
};
const EXPECTED_HYBRID_EVALUATION = {
  mode: 'run-hybrid-v1',
  version: 1,
  artifact: {
    path: 'evals/design-frontend/router-hybrid-v1.json',
    sha256: '10ddbd6d14bf3153e53561314245607d36c7d950af231585a8b5ae78fc590554',
  },
  collector: {
    path: 'evals/design-frontend/collect-hybrid-router-evaluation.mjs',
    sha256: '24e04d090c5c7535718878d0e9cd40a2c8324e1bd52c362ba292e68585e9ac12',
  },
  cases: {
    path: 'evals/design-frontend/cases.json',
    sha256: '8a940cd84b4f2cbf265154c060941734ad6e983d0f49cb7dd5d06fc3df5ee1f7',
  },
  router: {
    path: 'skills/joewrks-design-frontend/SKILL.md',
    sha256: '0694f0d0880c079ab50b2af2621ef37f9745eae356f0c9ebc5a1351cd0d8a67d',
  },
  commonCore: {
    path: 'AGENTS.md',
    sha256: '5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495',
  },
  classification: 'implicit-unverified',
  hardGate: 'pass',
  outcomeReview: 'human-review-required',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SOURCE_EVALUATION = {
  'ui-ux-pro-max': {
    evaluationStatus: 'validated',
    enforcingTests: [
      'tests/design-vendor-integrity.tests.mjs',
      'vendor/ui-ux-pro-max/scripts/validate_data.py',
      'vendor/ui-ux-pro-max/scripts/tests/test_core.py',
    ],
  },
  'apple-design': {
    evaluationStatus: 'validated',
    enforcingTests: ['tests/design-vendor-integrity.tests.mjs'],
  },
};

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function vendorFiles(directory, relative = 'vendor') {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const file = path.join(directory, entry.name);
    const localPath = `${relative}/${entry.name}`;
    const stat = lstatSync(file);
    assert.equal(stat.isSymbolicLink(), false, `vendor path is a symlink: ${localPath}`);
    return stat.isDirectory() ? vendorFiles(file, localPath) : [localPath];
  });
}

function assertVendorPath(localPath) {
  assert.equal(typeof localPath, 'string');
  assert.match(localPath, /^vendor\/(?:[^/]+\/)*[^/]+$/);
  assert.equal(localPath.includes('\\'), false, `backslash path: ${localPath}`);
  assert.equal(path.isAbsolute(localPath), false, `absolute path: ${localPath}`);
  assert.equal(localPath.includes('..'), false, `traversal path: ${localPath}`);
}

test('vendor bundle is exactly the pinned non-discoverable source set', () => {
  assert.ok(existsSync(MANIFEST), 'missing vendor/source-manifest.json');
  const manifestText = readFileSync(MANIFEST, 'utf8');
  assert.doesNotMatch(manifestText, /(?:[A-Za-z]:\\\\|[A-Za-z]:\/(?!\/)|(?:^|["\s])\/(?:Users|home)\/)/i, 'manifest contains a personal absolute path');
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.evaluation.state, 'candidate');
  assert.deepEqual(manifest.evaluation.tests, [
    'tests/design-vendor-integrity.tests.mjs',
    'vendor/ui-ux-pro-max/scripts/validate_data.py',
    'vendor/ui-ux-pro-max/scripts/tests/test_core.py',
  ]);
  assert.deepEqual(Object.keys(manifest.sources).sort(), Object.keys(EXPECTED_SOURCES).sort());
  assert.deepEqual(manifest.activeSkills, { 'joewrks-design-frontend': EXPECTED_ACTIVE_SKILL });
  assert.deepEqual(manifest.sources['ui-ux-pro-max'].upstreamAuditNotes, [
    'SKILL.md reports 98 UX and 104 icon rows; the pinned data contains 99 and 105.',
    'styles.csv omits No=54; search behavior is unaffected.',
  ]);

  const registered = [];
  for (const [name, expected] of Object.entries(EXPECTED_SOURCES)) {
    const source = manifest.sources[name];
    assert.equal(source.repository, expected.repository);
    assert.equal(source.url, expected.url);
    assert.equal(source.commit, expected.commit);
    assert.equal(source.upstreamPath, expected.upstreamPath);
    assert.equal(source.archiveSha256, expected.archiveSha256);
    assert.equal(source.activationMode, 'non-discoverable-router-only');
    assert.deepEqual(source.license, {
      name: 'MIT',
      upstreamPath: 'LICENSE',
      sha256: expected.licenseSha256,
    });
    assert.ok(Array.isArray(source.files), `${name} files must be an array`);
    for (const file of source.files) {
      assert.deepEqual(Object.keys(file).sort(), ['bytes', 'exactUpstreamCopy', 'localPath', 'sha256']);
      assertVendorPath(file.localPath);
      assert.equal(Number.isSafeInteger(file.bytes) && file.bytes >= 0, true, `invalid byte length: ${file.localPath}`);
      assert.match(file.sha256, /^[a-f0-9]{64}$/);
      assert.equal(file.exactUpstreamCopy, true, `not exact upstream copy: ${file.localPath}`);
      registered.push(file.localPath);
    }
  }

  assert.deepEqual(registered.sort(), EXPECTED_FILES);
  const actual = vendorFiles(VENDOR).filter((file) => file !== 'vendor/source-manifest.json').sort();
  assert.deepEqual(actual, EXPECTED_FILES);

  for (const [name, source] of Object.entries(manifest.sources)) {
    for (const file of source.files) {
      const localFile = path.join(ROOT, ...file.localPath.split('/'));
      assert.ok(existsSync(localFile), `missing registered file: ${file.localPath}`);
      assert.equal(lstatSync(localFile).isSymbolicLink(), false, `registered symlink: ${file.localPath}`);
      assert.equal(lstatSync(localFile).size, file.bytes, `wrong byte length: ${file.localPath}`);
      assert.equal(sha256(localFile), file.sha256, `wrong hash: ${file.localPath}`);
    }
  }
  for (const file of EXPECTED_ACTIVE_SKILL.files) {
    const localFile = path.join(ROOT, ...file.localPath.split('/'));
    assert.equal(lstatSync(localFile).size, file.bytes, `wrong active byte length: ${file.localPath}`);
    assert.equal(sha256(localFile), file.sha256, `wrong active hash: ${file.localPath}`);
  }
});

test('Common Core remains byte-identical', () => {
  assert.equal(lstatSync(AGENTS).size, 7933);
  assert.equal(sha256(AGENTS), '5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495');
});

test('candidate ledger binds the reviewed hybrid artifact without promoting implicit routing', async () => {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const current = manifest.evaluation.current;
  assert.deepEqual(current, EXPECTED_HYBRID_EVALUATION);

  for (const [name, expected] of Object.entries(EXPECTED_SOURCE_EVALUATION)) {
    assert.equal(manifest.sources[name].evaluationStatus, expected.evaluationStatus);
    assert.deepEqual(manifest.sources[name].enforcingTests, expected.enforcingTests);
  }

  for (const [key, evidence] of Object.entries({
    artifact: current.artifact,
    collector: current.collector,
    cases: current.cases,
    router: current.router,
    commonCore: current.commonCore,
  })) {
    const localFile = path.join(ROOT, ...evidence.path.split('/'));
    assert.ok(existsSync(localFile), `missing ${key}: ${evidence.path}`);
    assert.equal(sha256(localFile), evidence.sha256, `wrong ${key} hash: ${evidence.path}`);
  }

  const artifact = JSON.parse(readFileSync(path.join(ROOT, ...current.artifact.path.split('/')), 'utf8'));
  const { validateArtifact } = await import(pathToFileURL(path.join(ROOT, ...current.collector.path.split('/'))));
  assert.equal(validateArtifact(artifact), true);
  assert.equal(artifact.implicit.classification, current.classification);
  assert.equal(artifact.hardGate.status, current.hardGate);
  assert.equal(current.promotionPass, false);
  for (const comparison of artifact.outcomeComparisons) {
    assert.equal(comparison.reviewStatus, current.outcomeReview);
    assert.equal(comparison.semanticImprovement, current.semanticImprovement);
  }

  for (const historical of manifest.behaviorEvidenceHistory) {
    const localFile = path.join(ROOT, ...historical.resultPath.split('/'));
    assert.equal(sha256(localFile), historical.sha256, `historical evidence changed: ${historical.resultPath}`);
  }
});

test('Git preserves exact vendor and active skill bytes on checkout', () => {
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/joewrks-design-frontend\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^vendor\/\*\* -text$/m);
});
