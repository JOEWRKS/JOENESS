import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const COMPATIBILITY = path.join(VENDOR, 'compatibility');
const MANIFEST = path.join(VENDOR, 'source-manifest.json');
const ROOT_AGENTS = path.join(ROOT, 'AGENTS.md');
const HISTORICAL_COMMON_CORE = path.join(ROOT, 'evals', 'candidates', 'common-core-v1.md');
const EVALUATED_COMMON_CORE = path.join(ROOT, 'common-core.md');
const RETRY_SAFETY_CORE = path.join(ROOT, 'evals', 'candidates', 'retry-safety-core-v1.md');
const INTERACTION_SAFETY_CORE_V1 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v1.md');
const INTERACTION_SAFETY_CORE_V2 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v2.md');
const INTERACTION_SAFETY_CORE_V3 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v3.md');
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
const EXPECTED_COMPATIBILITY_FILES = [
  { sourcePath: 'skills/joewrks-design-frontend/SKILL.md', archivePath: 'vendor/compatibility/joeness-0.1/skills/joewrks-design-frontend/SKILL.md', bytes: 3335, sha256: 'a5a0c3c64b94b8565a53e19e10d15fa96dcc995bd152da6c1886ed938261a05e' },
  { sourcePath: 'skills/joewrks-design-frontend/agents/openai.yaml', archivePath: 'vendor/compatibility/joeness-0.1/skills/joewrks-design-frontend/agents/openai.yaml', bytes: 263, sha256: '3d0bc6bf72b93b3bd185852f080b19caeb17aed45f582df339d61c2633f81892' },
  { sourcePath: 'skills/joewrks-project-setup/SKILL.md', archivePath: 'vendor/compatibility/joeness-0.1/skills/joewrks-project-setup/SKILL.md', bytes: 5764, sha256: '777eecb563479f813015548284b43a2a94b2fa0fd10b2ee0f55198396fe9173c' },
  { sourcePath: 'skills/joewrks-project-setup/agents/openai.yaml', archivePath: 'vendor/compatibility/joeness-0.1/skills/joewrks-project-setup/agents/openai.yaml', bytes: 353, sha256: '1581633a8cea5dce3dd33a49bc8fb593169deddc01e496347190928a23cfeffc' },
  { sourcePath: 'skills/joewrks-project-setup/scripts/project-setup.ps1', archivePath: 'vendor/compatibility/joeness-0.1/skills/joewrks-project-setup/scripts/project-setup.ps1', bytes: 17495, sha256: '4ffc548078a5c87357fd0e4e63538567ea2666f118243a0558bff29278d13105' },
  { sourcePath: 'skills/handoff/SKILL.md', archivePath: 'vendor/compatibility/joeness-0.1/skills/handoff/SKILL.md', bytes: 3700, sha256: '5c49bbe372921e95530d566359670f760cc25da95efe38a4d16c5125a1ca30b4' },
  { sourcePath: 'skills/handoff/agents/openai.yaml', archivePath: 'vendor/compatibility/joeness-0.1/skills/handoff/agents/openai.yaml', bytes: 141, sha256: '5c479fd562c691851690e8b18c8501045bef0943c10743d636b2fae26add1d28' },
  { sourcePath: 'skills/handoff/LICENSE', archivePath: 'vendor/compatibility/joeness-0.1/skills/handoff/LICENSE', bytes: 1068, sha256: '0e7ac423bf2c6e223b7c5b156f8cf72da49d748e56a1641402c31f22ad07dbb5' },
];
const EXPECTED_STATE_SCHEMA_V1 = {
  commonCore: {
    sourcePath: 'evals/candidates/common-core-v1.md',
    localPath: 'AGENTS.md',
    sha256: '5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495',
  },
  skillName: 'joewrks-design-frontend',
  sourceDependencies: ['ui-ux-pro-max', 'apple-design'],
  files: [
    {
      sourcePath: 'vendor/compatibility/joeness-0.1/skills/joewrks-design-frontend/SKILL.md',
      localPath: 'skills/joewrks-design-frontend/SKILL.md',
      bytes: 3335,
      sha256: 'a5a0c3c64b94b8565a53e19e10d15fa96dcc995bd152da6c1886ed938261a05e',
    },
    {
      sourcePath: 'vendor/compatibility/joeness-0.1/skills/joewrks-design-frontend/agents/openai.yaml',
      localPath: 'skills/joewrks-design-frontend/agents/openai.yaml',
      bytes: 263,
      sha256: '3d0bc6bf72b93b3bd185852f080b19caeb17aed45f582df339d61c2633f81892',
    },
  ],
};
const EXPECTED_RELEASE_0_1 = {
  activeCommonCore: {
    sourcePath: 'evals/candidates/interaction-safety-core-v1.md',
    localPath: 'AGENTS.md',
    bytes: 2044,
    sha256: 'e7a3c02d4c147eaadde2c00a0452c7de21b3e0f51fa02cf7bd7085c43d97ac4d',
  },
  files: EXPECTED_COMPATIBILITY_FILES.map(({ archivePath, sourcePath, bytes, sha256 }) => ({
    sourcePath: archivePath,
    localPath: sourcePath,
    bytes,
    sha256,
  })),
};
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
const EXPECTED_DESIGN_SKILL = {
  authorship: 'joewrks-canonical',
  evaluationState: 'candidate',
  activationPolicy: 'hybrid',
  sourceDependencies: ['ui-ux-pro-max', 'apple-design'],
  intentionalDifferences: [
    'Local activation and routing contract.',
    'Local OpenAI product metadata.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/design/SKILL.md',
      bytes: 3792,
      sha256: 'baf7abb9c298c87aaee00bf46296fdff4ef494f8d3dd2e6102b2ee8f35550384',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/design/agents/openai.yaml',
      bytes: 233,
      sha256: '0819087aca545cd84638680c79e5a5d390d9a8792ed0c1df2d298b714bddfd7b',
      exactUpstreamCopy: false,
    },
  ],
};
const EXPECTED_PROJECT_SKILL = {
  authorship: 'joewrks-canonical',
  evaluationState: 'candidate',
  activationPolicy: 'hybrid-offer-explicit-write',
  sourceDependencies: [],
  intentionalDifferences: [
    'Conditional long-project planning offer with explicit writes, bounded discovery, single-ledger reuse, and snapshot-guarded AGENTS.md updates.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/project/SKILL.md',
      bytes: 6592,
      sha256: '9c930573910f526b6354096b59d29474432eed8b436685438e00152f15d62884',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/project/agents/openai.yaml',
      bytes: 318,
      sha256: 'd5757afbeb0e378b6356c118804cdf7989d4394ecd5218bee5365a246efba720',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/project/scripts/project-setup.ps1',
      bytes: 17495,
      sha256: '4ffc548078a5c87357fd0e4e63538567ea2666f118243a0558bff29278d13105',
      exactUpstreamCopy: false,
    },
  ],
};
const EXPECTED_VISUAL_CHECK_SKILL = {
  authorship: 'joewrks-canonical',
  evaluationState: 'candidate',
  activationPolicy: 'hybrid-visual-verification',
  sourceDependencies: [],
  intentionalDifferences: [
    'Concrete visual-verification and approved-reference translation contract.',
    'Local OpenAI product metadata.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/visual-check/SKILL.md',
      bytes: 2626,
      sha256: '9c846818099f33f2a70878f43ad5c9706cd9e1ddaa0f4b7581b7b767714f6477',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/visual-check/agents/openai.yaml',
      bytes: 659,
      sha256: '7382214ea145b1182eb27f264af2f8654a72c07233f762a5d3bf9decf0635918',
      exactUpstreamCopy: false,
    },
  ],
};
const EXPECTED_HANDOFF_SKILL = {
  authorship: 'upstream-adapted',
  evaluationState: 'candidate',
  activationPolicy: 'explicit-only',
  sourceDependencies: [],
  upstream: {
    repository: 'mattpocock/skills',
    url: 'https://github.com/mattpocock/skills',
    commit: '2ab958093e83e0ec752e6c1c5932da465bf23e0c',
    upstreamPath: 'skills/productivity/handoff',
    license: {
      name: 'MIT',
      upstreamPath: 'LICENSE',
      localPath: 'skills/handoff/LICENSE',
      sha256: '0e7ac423bf2c6e223b7c5b156f8cf72da49d748e56a1641402c31f22ad07dbb5',
    },
  },
  intentionalDifferences: [
    'Removed unsupported argument-hint and disable-model-invocation frontmatter; agents/openai.yaml preserves explicit-only activation.',
    'Relocated the skill and included the exact repository license beside it.',
    'Added compact evidence and cost receipts, target-root binding, current-state revalidation, handoff-bound authorization checks, and material-failure classification.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/handoff/SKILL.md',
      bytes: 4005,
      sha256: '096abd4d56fdcbf48c077f52ba9bfbfd38168401d0fbe3404f8bfac5dd5a6d99',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/handoff/agents/openai.yaml',
      bytes: 141,
      sha256: '5c479fd562c691851690e8b18c8501045bef0943c10743d636b2fae26add1d28',
      exactUpstreamCopy: true,
    },
    {
      localPath: 'skills/handoff/LICENSE',
      bytes: 1068,
      sha256: '0e7ac423bf2c6e223b7c5b156f8cf72da49d748e56a1641402c31f22ad07dbb5',
      exactUpstreamCopy: true,
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
  validator: {
    path: 'evals/design-frontend/validate-hybrid-router-evidence.mjs',
    sha256: '4ae8a2fd461456af9568bd8f6c33a1697620ac90d5e5a501a304c3f9775e134d',
  },
  validation: {
    state: 'retained-evidence-validated',
    scope: 'Retained output claims, runtime isolation and inventory, repository and materialized-root snapshots.',
    limitation: 'V1 retains no normalized command, file, or tool events; event-only failures are rejected as unsubstantiated, so this is not event-level certification.',
  },
  cases: {
    path: 'evals/design-frontend/cases.json',
    sha256: '8a940cd84b4f2cbf265154c060941734ad6e983d0f49cb7dd5d06fc3df5ee1f7',
  },
  router: {
    path: 'evals/candidates/design-frontend-router-hybrid-v1.md',
    sha256: '0694f0d0880c079ab50b2af2621ef37f9745eae356f0c9ebc5a1351cd0d8a67d',
  },
  commonCore: {
    path: 'evals/candidates/common-core-v1.md',
    sha256: '5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495',
  },
  classification: 'implicit-unverified',
  hardGate: 'pass',
  outcomeReview: 'human-review-required',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_CURRENT_EVALUATION = {
  mode: 'active-skill-contract-v1',
  version: 1,
  state: 'unvalidated',
  cases: {
    path: 'evals/skill-contracts/cases.json',
    sha256: '6f2148c44e5565563a71c850ab66fd78c5261402f375e927e20b9e2509779f81',
  },
  hardGate: 'unverified',
  classification: 'candidate',
  outcomeReview: 'pending',
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
const EXPECTED_BEHAVIOR_EVIDENCE_HISTORY = [
  {
    pairVersion: 1,
    mode: 'run-pair-v1',
    resultPath: 'evals/design-frontend/router-pair-v1.json',
    sha256: 'bd37c7a245e5705be555e9b759f8d5fee0e20d6a55c72943e76fedad1c2b4042',
    promotionPass: false,
  },
  {
    pairVersion: 2,
    mode: 'run-pair-v2',
    resultPath: 'evals/design-frontend/router-pair-v2.json',
    sha256: '0d2129bdaceb8ad858cb7a19c9c041a25f2d955834c94565e4ef4a73dbc4a610',
    promotionPass: false,
  },
  {
    pairVersion: 3,
    mode: 'run-pair-v3',
    resultPath: 'evals/design-frontend/router-pair-v3.json',
    sha256: '3646ca28cfab0a6ec1ccec5bb7600715275388410d6661c031cbabcb548e2327',
    promotionPass: false,
  },
];
const EXPECTED_BEHAVIOR_EVIDENCE = {
  pairVersion: 3,
  mode: 'run-pair-v3',
  resultPath: 'evals/design-frontend/router-pair-v3.json',
  runIds: { control: 'design-router-control-v3', candidate: 'design-router-candidate-v3' },
  evaluator: {
    path: 'evals/design-frontend/collect-router-evaluation.mjs',
    sha256: 'f2f13c00e22ac12dac83c91a116ee9d5de4a3530be54142b1eccf312585690b6',
  },
  cases: {
    path: 'evals/design-frontend/cases.json',
    sha256: '8a940cd84b4f2cbf265154c060941734ad6e983d0f49cb7dd5d06fc3df5ee1f7',
  },
  router: {
    path: 'evals/candidates/design-frontend-router-pair-v3.md',
    sha256: 'd641c0210e02ca10cc70f1f3219eafbff99c480fb4e0f7ccca5348e6d2e14dfa',
  },
  p0Baseline: {
    path: 'evals/p0/common-core-v5.json',
    sha256: '05631b136be55626987f7deed16ec8bf4c34b38880e4764b2375051f42249316',
  },
  syntheticLimitation: 'Selection evidence only; no live Figma connection or browser result is proven.',
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
    if ((stat.isDirectory() && entry.name === '__pycache__') || (!stat.isDirectory() && entry.name.endsWith('.pyc'))) {
      return [];
    }
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
  assert.deepEqual(manifest.release, {
    name: 'JOENESS',
    version: '0.1',
    entrypoint: 'JOENESS.ps1',
  });
  assert.equal(manifest.evaluation.state, 'candidate');
  assert.deepEqual(manifest.evaluation.tests, [
    'tests/design-vendor-integrity.tests.mjs',
    'tests/thin-hybrid-core.tests.mjs',
    'tests/skill-contracts.tests.mjs',
    'vendor/ui-ux-pro-max/scripts/validate_data.py',
    'vendor/ui-ux-pro-max/scripts/tests/test_core.py',
  ]);
  assert.deepEqual(Object.keys(manifest.sources).sort(), Object.keys(EXPECTED_SOURCES).sort());
  assert.deepEqual(Object.keys(manifest.activeSkills).sort(), [
    'design',
    'handoff',
    'project',
    'visual-check',
  ]);
  const design = manifest.activeSkills.design;
  const handoff = manifest.activeSkills.handoff;
  const project = manifest.activeSkills.project;
  const visualCheck = manifest.activeSkills['visual-check'];
  assert.equal(handoff.activationPolicy, 'explicit-only');
  assert.equal(design.activationPolicy, 'hybrid');
  assert.equal(project.activationPolicy, 'hybrid-offer-explicit-write');
  assert.equal(visualCheck.activationPolicy, 'hybrid-visual-verification');
  for (const skill of Object.values(manifest.activeSkills)) {
    assert.equal(skill.evaluationState, 'candidate');
  }
  assert.deepEqual(design.sourceDependencies, ['ui-ux-pro-max', 'apple-design']);
  for (const skill of [handoff, project, visualCheck]) {
    assert.deepEqual(skill.sourceDependencies, []);
  }
  assert.deepEqual(
    project.files.map(({ localPath }) => localPath),
    EXPECTED_PROJECT_SKILL.files.map(({ localPath }) => localPath),
  );

  for (const skillName of ['design', 'handoff', 'project', 'visual-check']) {
    for (const entry of manifest.activeSkills[skillName].files) {
      const text = readFileSync(path.join(ROOT, entry.localPath), 'utf8');
      assert.doesNotMatch(
        text,
        /(?:^|[\s'"`(])(?:[A-Za-z]:[\\/]|\/Users\/|\/home\/)/m,
        `${entry.localPath} contains a personal absolute path`,
      );
    }
  }
  assert.deepEqual(design, EXPECTED_DESIGN_SKILL);
  assert.deepEqual(project, EXPECTED_PROJECT_SKILL);
  assert.deepEqual(visualCheck, EXPECTED_VISUAL_CHECK_SKILL);
  assert.deepEqual(handoff, EXPECTED_HANDOFF_SKILL);
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
  const actual = vendorFiles(VENDOR)
    .filter((file) => file !== 'vendor/source-manifest.json' && !file.startsWith('vendor/compatibility/'))
    .sort();
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
  for (const skill of [EXPECTED_DESIGN_SKILL, EXPECTED_PROJECT_SKILL, EXPECTED_VISUAL_CHECK_SKILL, EXPECTED_HANDOFF_SKILL]) {
    for (const file of skill.files) {
      const localFile = path.join(ROOT, ...file.localPath.split('/'));
      assert.equal(lstatSync(localFile).size, file.bytes, `wrong active byte length: ${file.localPath}`);
      assert.equal(sha256(localFile), file.sha256, `wrong active hash: ${file.localPath}`);
    }
  }
});

test('the JOENESS 0.1 compatibility archive is an exact separate source set', () => {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  assert.ok(manifest.compatibility, 'missing compatibility manifest contract');
  const legacyInstallSources = manifest.compatibility.legacyInstallSources;
  assert.deepEqual(legacyInstallSources.stateSchemaV1, EXPECTED_STATE_SCHEMA_V1);
  assert.deepEqual(legacyInstallSources['release0.1'], EXPECTED_RELEASE_0_1);

  const expectedPaths = EXPECTED_COMPATIBILITY_FILES.map(({ archivePath }) => archivePath).sort();
  const actualPaths = vendorFiles(COMPATIBILITY, 'vendor/compatibility').sort();
  assert.deepEqual(actualPaths, expectedPaths);

  for (const entry of legacyInstallSources['release0.1'].files) {
    assert.deepEqual(Object.keys(entry).sort(), ['bytes', 'localPath', 'sha256', 'sourcePath']);
    const archiveFile = path.join(ROOT, ...entry.sourcePath.split('/'));
    assert.ok(existsSync(archiveFile), `missing compatibility source: ${entry.sourcePath}`);
    assert.equal(lstatSync(archiveFile).isSymbolicLink(), false, `compatibility source is a symlink: ${entry.sourcePath}`);
    assert.equal(lstatSync(archiveFile).size, entry.bytes, `wrong original byte length: ${entry.sourcePath}`);
    assert.equal(sha256(archiveFile), entry.sha256, `wrong original hash: ${entry.sourcePath}`);
  }
  for (const retiredRoot of [
    path.join(ROOT, 'skills', 'joewrks-design-frontend'),
    path.join(ROOT, 'skills', 'joewrks-project-setup'),
  ]) {
    assert.equal(existsSync(retiredRoot), false, `retired active source still exists: ${retiredRoot}`);
  }
});

test('the interaction safety core is active without rewriting broader Core evidence', () => {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

  assert.equal(lstatSync(HISTORICAL_COMMON_CORE).size, 7933);
  assert.equal(
    sha256(HISTORICAL_COMMON_CORE),
    '5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495',
  );
  assert.equal(
    sha256(INTERACTION_SAFETY_CORE_V1),
    'e7a3c02d4c147eaadde2c00a0452c7de21b3e0f51fa02cf7bd7085c43d97ac4d',
  );
  assert.deepEqual(manifest.activeCommonCore, {
    path: 'evals/candidates/interaction-safety-core-v3.md',
    sha256: '75a2ecd35404e98ecdbb4a429805b2c59e1f00e445d5daf680cb34b61e785191',
  });
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V3).size, 2048);
  assert.equal(sha256(INTERACTION_SAFETY_CORE_V3), manifest.activeCommonCore.sha256);
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V2).size, 2048);
  assert.equal(sha256(INTERACTION_SAFETY_CORE_V2), '3f10f1ba56864b4ba3bf1dd2b9f3200281749280a09375b2d843d1d0838049a5');
  assert.equal(lstatSync(RETRY_SAFETY_CORE).size, 1261);
  assert.equal(sha256(RETRY_SAFETY_CORE), '0f1ef55811e4507b3f2fb21d41ad9d992a6f7fabc24d3e44a110468bd6ac5813');
  assert.equal(readFileSync(path.join(ROOT, 'evals', 'candidates', 'no-common-core.md'), 'utf8'), '\n');
  assert.equal(lstatSync(EVALUATED_COMMON_CORE).size, 3744);
  assert.equal(
    sha256(EVALUATED_COMMON_CORE),
    '73d4a1ba6ab88b0064705e81a946a8c1199b9f6c3368ec604a2a7ec197a3a5b3',
  );
  assert.notEqual(sha256(EVALUATED_COMMON_CORE), sha256(HISTORICAL_COMMON_CORE));
  assert.notEqual(sha256(ROOT_AGENTS), sha256(RETRY_SAFETY_CORE));
  assert.doesNotMatch(readFileSync(ROOT_AGENTS, 'utf8'), /^# Common Work Core$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/common-core\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/no-common-core\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/retry-safety-core-v1\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/interaction-safety-core-v2\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/interaction-safety-core-v3\.md text eol=lf$/m);
});

test('candidate ledger separates the unvalidated active contract from retained hybrid evidence', async () => {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const current = manifest.evaluation.current;
  assert.deepEqual(current, EXPECTED_CURRENT_EVALUATION);
  assert.deepEqual(manifest.evaluation.history, [EXPECTED_HYBRID_EVALUATION]);

  for (const [name, expected] of Object.entries(EXPECTED_SOURCE_EVALUATION)) {
    assert.equal(manifest.sources[name].evaluationStatus, expected.evaluationStatus);
    assert.deepEqual(manifest.sources[name].enforcingTests, expected.enforcingTests);
  }

  const [historical] = manifest.evaluation.history;
  assert.equal(lstatSync(path.join(ROOT, ...current.cases.path.split('/'))).size, 1664);
  assert.equal(sha256(path.join(ROOT, ...current.cases.path.split('/'))), current.cases.sha256);
  for (const [key, evidence] of Object.entries({
    artifact: historical.artifact,
    collector: historical.collector,
    validator: historical.validator,
    cases: historical.cases,
    router: historical.router,
    commonCore: historical.commonCore,
  })) {
    const localFile = path.join(ROOT, ...evidence.path.split('/'));
    assert.ok(existsSync(localFile), `missing ${key}: ${evidence.path}`);
    assert.equal(sha256(localFile), evidence.sha256, `wrong ${key} hash: ${evidence.path}`);
  }

  const artifact = JSON.parse(readFileSync(path.join(ROOT, ...historical.artifact.path.split('/')), 'utf8'));
  const { validateHybridRouterEvidence } = await import(pathToFileURL(path.join(ROOT, ...historical.validator.path.split('/'))));
  assert.equal(validateHybridRouterEvidence(artifact), true);
  assert.equal(artifact.implicit.classification, historical.classification);
  assert.equal(artifact.hardGate.status, historical.hardGate);
  assert.equal(current.promotionPass, false);
  for (const comparison of artifact.outcomeComparisons) {
    assert.equal(comparison.reviewStatus, historical.outcomeReview);
    assert.equal(comparison.semanticImprovement, historical.semanticImprovement);
  }

  assert.deepEqual(manifest.behaviorEvidenceHistory, EXPECTED_BEHAVIOR_EVIDENCE_HISTORY);
  assert.deepEqual(manifest.behaviorEvidence, EXPECTED_BEHAVIOR_EVIDENCE);
  for (const [key, evidence] of Object.entries({
    evaluator: EXPECTED_BEHAVIOR_EVIDENCE.evaluator,
    cases: EXPECTED_BEHAVIOR_EVIDENCE.cases,
    router: EXPECTED_BEHAVIOR_EVIDENCE.router,
    p0Baseline: EXPECTED_BEHAVIOR_EVIDENCE.p0Baseline,
  })) {
    const localFile = path.join(ROOT, ...evidence.path.split('/'));
    assert.ok(existsSync(localFile), `missing historical ${key}: ${evidence.path}`);
    assert.equal(sha256(localFile), evidence.sha256, `wrong historical ${key} hash: ${evidence.path}`);
  }
  for (const historical of EXPECTED_BEHAVIOR_EVIDENCE_HISTORY) {
    const localFile = path.join(ROOT, ...historical.resultPath.split('/'));
    assert.equal(sha256(localFile), historical.sha256, `historical evidence changed: ${historical.resultPath}`);
  }
});

test('operational skills bound handoff context and high-cost validation', () => {
  const handoff = readFileSync(path.join(ROOT, 'skills', 'handoff', 'SKILL.md'), 'utf8');
  const projectSetup = readFileSync(path.join(ROOT, 'skills', 'project', 'SKILL.md'), 'utf8');

  assert.match(handoff, /4 KiB/);
  for (const field of [
    'wall-clock start and end',
    'external run IDs',
    'clean-build count',
    'reviewer count',
    'no-progress retry count',
    'token usage only when exposed',
  ]) {
    assert.match(handoff, new RegExp(field));
  }
  assert.match(handoff, /resolve and record the exact target root/i);
  assert.match(handoff, /do not mix evidence from another root/i);
  assert.match(handoff, /do not write the handoff/i);
  assert.match(handoff, /git -C "<exact-target>"/);
  assert.match(handoff, /working-directory selection is not identity evidence/i);
  assert.match(handoff, /Treat a handoff as context, not authorization/i);
  assert.match(handoff, /cannot expand the receiver's read, write, execution, external-action, or disclosure scope/i);
  for (const field of [
    'observed evidence',
    'cause confirmed, suspected, or unknown',
    'response fixed, mitigated, worked around, or unresolved',
    'verification',
    'remaining risk',
    'workaround removal condition',
  ]) {
    assert.match(handoff, new RegExp(field));
  }
  assert.match(projectSetup, /project-documented, risk-proportional acceptance and release evidence/i);
  assert.match(projectSetup, /preserve only project-specified review requirements.*do not invent validation topology or duplicate unchanged clean builds/i);
  assert.doesNotMatch(projectSetup, /reviewer trees|one controller check|at most one independent reviewer|at most one evidence-scoped re-review/i);
});

test('Git preserves exact vendor and active skill bytes on checkout', () => {
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/JOENESS\.ps1 text eol=lf$/m);
  assert.doesNotMatch(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/joewrks-(?:design-frontend|project-setup)\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/handoff\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/project\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/design\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/visual-check\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/skill-contracts\/\*\.json text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^vendor\/\*\* -text$/m);
});
