import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const COMPATIBILITY = path.join(VENDOR, 'compatibility');
const MANIFEST = path.join(VENDOR, 'source-manifest.json');
const LEAN_READINESS_LEDGER = path.join(ROOT, 'evals', 'joeness-lean-candidate-readiness-v1.json');
const LEAN_KERNEL = path.join(ROOT, 'evals', 'candidates', 'joeness-lean-kernel-v1.md');
const CONTROL_COMMIT = '80c79e9f4be91d730b1b3cdc62d7bf51508895e8';
const README = path.join(ROOT, 'README.md');
const ROOT_AGENTS = path.join(ROOT, 'AGENTS.md');
const HISTORICAL_COMMON_CORE = path.join(ROOT, 'evals', 'candidates', 'common-core-v1.md');
const EVALUATED_COMMON_CORE = path.join(ROOT, 'common-core.md');
const RETRY_SAFETY_CORE = path.join(ROOT, 'evals', 'candidates', 'retry-safety-core-v1.md');
const INTERACTION_SAFETY_CORE_V1 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v1.md');
const INTERACTION_SAFETY_CORE_V2 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v2.md');
const INTERACTION_SAFETY_CORE_V3 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v3.md');
const INTERACTION_SAFETY_CORE_V4 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v4.md');
const INTERACTION_SAFETY_CORE_V5 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v5.md');
const INTERACTION_SAFETY_CORE_V6 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v6.md');
const INTERACTION_SAFETY_CORE_V7 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v7.md');
const INTERACTION_SAFETY_CORE_V8 = path.join(ROOT, 'evals', 'candidates', 'interaction-safety-core-v8.md');
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
    'Local stage-aware orchestration and project design contract.',
    'Local OpenAI metadata and DESIGN.md template.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/design/SKILL.md',
      bytes: 14510,
      sha256: '244543bca87b1ac1f46f3c318c32eeba059c00425223832ac086dcd8f44e97b4',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/design/agents/openai.yaml',
      bytes: 515,
      sha256: 'bdf38986c6e079f89be1e993a9fda02d9d41eb234d8374c0b6c96168a6c226a6',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/design/templates/DESIGN.md',
      bytes: 2781,
      sha256: '21a67e4bcaae510c2f9bbc9e028ca62a846ac6398c98e17b9c5238ad87e19b80',
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
    'Explicit full-contract setup keeps external skill workflows subordinate to independently authorized user or project scope.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/project/SKILL.md',
      bytes: 6904,
      sha256: '451b10444092b9349c42268a24962daf4bd637e1dfd7917f586997e1b4f84887',
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
    'Compact visual-completion router with always-required durable evidence and conditional defect or translation references.',
    'Local OpenAI product metadata.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/visual-check/SKILL.md',
      bytes: 3453,
      sha256: '7bd9b1406073f844da71c0075d5cddb69778425997bb2ec42b74b36fa3996903',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/visual-check/agents/openai.yaml',
      bytes: 603,
      sha256: 'bffc2c66c0534431d56ae1998f2680fde94742775fc43b9d7bf7e74dbdb8021f',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/visual-check/references/concrete-defect.md',
      bytes: 935,
      sha256: '1a620c8ef21081597ab1bf87b84b7dfc0d9b7ebe8cdacffbc10a31318831a209',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/visual-check/references/approved-reference.md',
      bytes: 2972,
      sha256: 'caea02b7f176d07fbca66133f82b4e7ebb8a5bb8ec441e1e4defa26d0f2c9525',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/visual-check/references/durable-evidence.md',
      bytes: 5391,
      sha256: 'cb2636a4df90775d4658a2d204b6b8e2ea11ba0173774d172a72ec6a8417195a',
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
    'Added compact evidence summaries, target-root binding, current-state revalidation, handoff-bound authorization checks, and material-failure classification without fixed empty fields.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/handoff/SKILL.md',
      bytes: 4274,
      sha256: '56bbe775a6b133a51dfdcf2539a3293fb08e4312c86b668e67f201c53399f785',
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
const EXPECTED_SPEC_SKILL = {
  authorship: 'joewrks-canonical',
  evaluationState: 'candidate',
  activationPolicy: 'implicit-persistent-spec-delivery',
  sourceDependencies: [],
  intentionalDifferences: ['Conditional user-language decision digest for a created or materially revised persistent specification.'],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/spec/SKILL.md',
      bytes: 1720,
      sha256: '2b03833c69b64a8329eb436ddc2d7094277f33007b54d43ccad0a40308709af0',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/spec/agents/openai.yaml',
      bytes: 411,
      sha256: 'c0236e7b365a2f329f463c43c37033f8d7d8b443090a71b475f88799d3389dc8',
      exactUpstreamCopy: false,
    },
  ],
};
const EXPECTED_TICKET_SKILL = {
  authorship: 'joewrks-canonical',
  evaluationState: 'candidate',
  activationPolicy: 'implicit-important-ticket-review',
  sourceDependencies: [],
  intentionalDifferences: [
    'Conditional single-writer delivery, new-context candidate review, and bounded optional Ponytail over-engineering audit for important prepared work, with explicit shared-model and shared-permission limitations.',
  ],
  validatorSha256: '5347a0a09cfb546bba1c0d1a30dae0a233d9a05f57bd4e7877155c588bcdabf7',
  files: [
    {
      localPath: 'skills/ticket/SKILL.md',
      bytes: 4791,
      sha256: 'db0711bbb305310f8ee8ab0653426d6719b62d73274600e6b67499b0c6439307',
      exactUpstreamCopy: false,
    },
    {
      localPath: 'skills/ticket/agents/openai.yaml',
      bytes: 339,
      sha256: '9c145a3c51ae22611fdb00d00c4793be83f87cfffc8a3741b8ff6dff9a0b04de',
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
const EXPECTED_SKILL_CONTRACT_V2 = {
  mode: 'active-skill-contract-v2',
  version: 2,
  state: 'unvalidated',
  cases: {
    path: 'evals/skill-contracts/cases-v2.json',
    sha256: '5f0b06d4041ff276967c49cbf17d110ff0942db900e94eeac9c2dac2421a040b',
  },
  hardGate: 'unverified',
  classification: 'candidate',
  outcomeReview: 'pending',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V3_REJECTED = {
  mode: 'active-skill-contract-v3',
  version: 3,
  state: 'semantic-review-rejected',
  cases: {
    path: 'evals/skill-contracts/cases-v3.json',
    sha256: '6067437488db01ce3660f4df7ff97d3b45bfed17b94812f3a4c3851557243a9f',
  },
  pressureEvidence: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v3.json',
    sha256: 'd0b22bcdd34f3bedb7b6a9db90ab156ce4eb877e1b142858bd77fd6168104d0d',
  },
  rawEvidence: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v3-raw.md',
    sha256: '91fb643ad327ddff8ccb3180d8fd00377476405adc87c4dfd35d5e77fa0a9979',
  },
  hardGate: 'failed-semantic-review',
  classification: 'semantic-review-rejected',
  outcomeReview: 'failed',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V4_REJECTED = {
  mode: 'active-skill-contract-v4',
  version: 4,
  state: 'semantic-review-rejected',
  cases: {
    path: 'evals/skill-contracts/cases-v4.json',
    sha256: '4bc1005c00129cb478703aaae9edf030dfad211ead7660d220c45f3768c836c3',
  },
  pressureEvidence: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v4.json',
    sha256: '7af70b6048985cedfae82b8122c75d1ed76a376c4283be9aacb22fb4c2d14d2e',
  },
  rawEvidence: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v4-raw.md',
    sha256: '95bfca841a49c22e2697f044d850c5515557c5f8da7f0f1a18a6aaf0841ededd',
  },
  hardGate: 'failed-semantic-review',
  classification: 'semantic-review-rejected',
  outcomeReview: 'failed',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V5 = {
  mode: 'active-skill-contract-v5',
  version: 5,
  state: 'unvalidated',
  cases: {
    path: 'evals/skill-contracts/cases-v4.json',
    sha256: '4bc1005c00129cb478703aaae9edf030dfad211ead7660d220c45f3768c836c3',
  },
  pressureEvidence: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v5.json',
    sha256: 'e1dec17c021bbb9fb68dd562d67b6c00dce5cb9e6e387918366fe15c8fe347ee',
  },
  hardGate: 'unverified',
  classification: 'candidate',
  outcomeReview: 'pending',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V6 = {
  mode: 'active-skill-contract-v6',
  version: 6,
  state: 'unvalidated',
  cases: {
    path: 'evals/skill-contracts/cases-v6.json',
    sha256: 'be3c59c6d3f55298af2b75f106e5339e3c2ab6e2476b9b4fd0e01a227aad5b80',
  },
  inheritedPressureEvidence: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v5.json',
    sha256: 'e1dec17c021bbb9fb68dd562d67b6c00dce5cb9e6e387918366fe15c8fe347ee',
    scope: 'Inherited visual-check cases only.',
  },
  specPressureEvidence: {
    path: 'evals/skill-contracts/spec-delivery-pressure-v2.json',
    sha256: '46e9eae98f0507d1af3c05d43a4409bcf09d85d12cd1ecb33b48d9bb958103d2',
  },
  specPressureHistory: [{
    path: 'evals/skill-contracts/spec-delivery-pressure-v1-semantic-review.json',
    sha256: 'ba605b10c5428a0c9074f514dd3e32e9c93435843ef78427188a0561af94594b',
    disposition: 'semantic-review-rejected',
  }],
  hardGate: 'unverified',
  classification: 'candidate',
  outcomeReview: 'pending',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V7 = {
  mode: 'active-skill-contract-v7',
  version: 7,
  state: 'unvalidated',
  cases: {
    path: 'evals/skill-contracts/cases-v7.json',
    sha256: '09ae4db37fa1d7d7697947486629836ac93da1957cc107bc55473502b39610e8',
  },
  visualPredecessorEvidence: {
    pressure: {
      path: 'evals/skill-contracts/visual-verdict-pressure-v5.json',
      sha256: 'e1dec17c021bbb9fb68dd562d67b6c00dce5cb9e6e387918366fe15c8fe347ee',
    },
    skill: {
      path: 'evals/candidates/visual-check-skill-v5.md',
      bytes: 7290,
      sha256: 'a90a23f72b48581a65a3ba30e2fa7b3592a64d30506d7c4122754323e568e1bf',
    },
    metadata: {
      path: 'evals/candidates/visual-check-openai-v5.yaml',
      bytes: 1114,
      sha256: '564320118d97ade92d8645c92bf08026694662c0a47979cb4ea4bce745e67ee8',
    },
    scope: 'Rejected or superseded predecessor evidence only; it does not validate the compact current skill.',
  },
  specPressureEvidence: EXPECTED_SKILL_CONTRACT_V6.specPressureEvidence,
  specPressureHistory: EXPECTED_SKILL_CONTRACT_V6.specPressureHistory,
  hardGate: 'unverified',
  classification: 'candidate',
  outcomeReview: 'pending',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V8 = {
  ...EXPECTED_SKILL_CONTRACT_V7,
  mode: 'active-skill-contract-v8',
  version: 8,
  cases: {
    path: 'evals/skill-contracts/cases-v8.json',
    sha256: '9f59ccbe5e52c66de08abd5ebf483a0bdb9036c726c742439e641ab856ac4f4c',
  },
  ticketPressureEvidence: {
    path: 'evals/skill-contracts/ticket-delivery-pressure-v1.json',
    sha256: 'c682e16e377eda576cb981d81d9db833067b2b5a5a8be3aa189604f99342b882',
  },
};
const EXPECTED_SKILL_CONTRACT_V9 = {
  ...EXPECTED_SKILL_CONTRACT_V8,
  mode: 'active-skill-contract-v9',
  version: 9,
  cases: {
    path: 'evals/skill-contracts/cases-v9.json',
    sha256: 'b9aa05ea16b0e57f3bc233dc148db046bf4b9d1ea0306c0e5a8ca5bac27d40b2',
  },
  visualCoverageEvidence: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v7.json',
    sha256: '9998b9fbce625ebd720bf33d4696d64e1cda3b26f2477d4d49b1b4550223835b',
  },
  visualCoverageHistory: [{
    path: 'evals/skill-contracts/visual-verdict-pressure-v6.json',
    sha256: '1ce225c361bfb5185c8cac0f2870a5794eca5aedcb1b219af765c5231baaffba',
    disposition: 'semantic-review-rejected',
  }],
  ticketPressureEvidence: {
    ...EXPECTED_SKILL_CONTRACT_V8.ticketPressureEvidence,
    scope: 'Validates inherited ticket cases only; it does not validate v9 visual coverage.',
  },
};
const EXPECTED_SKILL_CONTRACT_V10_REJECTED = {
  mode: 'active-skill-contract-v10',
  version: 10,
  state: 'semantic-review-rejected',
  cases: {
    path: 'evals/skill-contracts/cases-v10.json',
    sha256: 'd99b5c36099221c98f870e0e82e6f70237258ff1e25eaf248fbeaa187fa39e60',
  },
  designVisualEvidence: {
    path: 'evals/skill-contracts/design-visual-m2-pressure-v2.json',
    sha256: '5fe7dfdd62f49c3bc3cc12235a2d39fe37228d576a9e45fdc3a6c33e8f1ff9a2',
  },
  hardGate: 'failed-semantic-review',
  classification: 'semantic-review-rejected',
  outcomeReview: 'failed',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V11_REJECTED = {
  mode: 'active-skill-contract-v11',
  version: 11,
  state: 'semantic-review-rejected',
  cases: {
    path: 'evals/skill-contracts/cases-v11.json',
    sha256: 'a81799cf3aa737930d9f063bba5155187a3ec9d8eca5e5e191a25010e84dec33',
  },
  designVisualEvidence: {
    path: 'evals/skill-contracts/design-visual-m2-pressure-v3.json',
    sha256: 'e6c853ab502ef24b1043858054f9548d2b648f72f769eddfd4fe77e1f9bec1a1',
  },
  hardGate: 'failed-semantic-review',
  classification: 'semantic-review-rejected',
  outcomeReview: 'failed',
  semanticImprovement: 'not-asserted',
  promotionPass: false,
};
const EXPECTED_SKILL_CONTRACT_V12 = {
  mode: 'active-skill-contract-v12',
  version: 12,
  state: 'unvalidated',
  cases: {
    path: 'evals/skill-contracts/cases-v12.json',
    sha256: '94b5eec0368769e568f13c491b4ca05bc56fd3f2c795cb1caf84089134c4692d',
  },
  designVisualEvidence: {
    path: 'evals/skill-contracts/design-visual-m2-pressure-v4.json',
    sha256: '77723ca48653812b4585cd32b45f484eb2304c9258c5db4260debf67b251c833',
  },
  designVisualHistory: [
    {
      path: 'evals/skill-contracts/design-visual-m2-pressure-v1.json',
      sha256: 'c0f601d801015fa295a346efb40a497993a5d437d7494a7a845a43296de2566d',
      disposition: 'semantic-review-rejected',
    },
    {
      path: 'evals/skill-contracts/design-visual-m2-pressure-v2.json',
      sha256: '5fe7dfdd62f49c3bc3cc12235a2d39fe37228d576a9e45fdc3a6c33e8f1ff9a2',
      disposition: 'semantic-review-rejected',
    },
    {
      path: 'evals/skill-contracts/design-visual-m2-pressure-v3.json',
      sha256: 'e6c853ab502ef24b1043858054f9548d2b648f72f769eddfd4fe77e1f9bec1a1',
      disposition: 'semantic-review-rejected',
    },
  ],
  visualCoveragePredecessor: {
    path: 'evals/skill-contracts/visual-verdict-pressure-v7.json',
    sha256: '9998b9fbce625ebd720bf33d4696d64e1cda3b26f2477d4d49b1b4550223835b',
    scope: 'Pre-M2 collection coverage pressure only.',
  },
  specPressureEvidence: EXPECTED_SKILL_CONTRACT_V6.specPressureEvidence,
  ticketPressureEvidence: {
    ...EXPECTED_SKILL_CONTRACT_V8.ticketPressureEvidence,
    scope: 'Validates inherited ticket cases only; it does not validate M2 visual behavior.',
  },
  hardGate: 'm2-static-pass-only',
  classification: 'candidate',
  outcomeReview: 'partial',
  semanticImprovement: 'observed-for-curated-static-scenarios',
  promotionPass: false,
};
const EXPECTED_CURRENT_EVALUATION = {
  mode: 'active-skill-contract-v15',
  version: 15,
  state: 'unvalidated',
  cases: {
    path: 'evals/skill-contracts/cases-v15.json',
    sha256: 'c583bb1a3d5ce1d631a3afa34b3cbe7102b30aa2f799eac44269bfe461b986a6',
  },
  staticContractEvidence: {
    path: 'evals/skill-contracts/design-foundation-v15-contract-test-v1.json',
    sha256: '844907a03c1eb44f3bfcef4caf5ec9f6160e5ed4a2992e8aa74be3a1f30b27df',
    scope: 'Static contract assertions only; raw stdout is not retained.',
  },
  attemptIndex: {
    path: 'evals/skill-contracts/design-visual-m2-attempt-index-v1.json',
    sha256: 'd34245e2e3bfb9c1357f067890454cf0a9ef130655837d30a87f0adc072727fe',
  },
  designVisualEvidence: {
    path: 'evals/skill-contracts/design-visual-m2-visual-v7-semantic-review.json',
    sha256: 'fc09ae6e50291824333dc714f2c7f48f3f8ab40d3e9a1c476c4eb7106097809c',
    disposition: 'semantic-review-rejected',
  },
  designOrchestrationEvidence: {
    path: 'evals/skill-contracts/design-visual-m2-design-v5-blocked.json',
    sha256: 'cc1c1bab3b94c72c94deb97dd1327842a851e496909cf6301e89eee7ce6a913a',
    disposition: 'blocked-orchestration-unverified',
  },
  runtimeEvidence: {
    state: 'unverified',
    scope: 'Exact corrected MergeDrop and RVR commit/build/install/state/capture bindings are not available.',
  },
  specPressureEvidence: EXPECTED_SKILL_CONTRACT_V6.specPressureEvidence,
  ticketPressureEvidence: {
    ...EXPECTED_SKILL_CONTRACT_V8.ticketPressureEvidence,
    scope: 'Validates inherited ticket cases only; it does not validate M2 visual behavior.',
  },
  hardGate: 'design-foundation-static-contract-only',
  classification: 'candidate',
  outcomeReview: 'partial',
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

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function controlManifest() {
  return JSON.parse(execFileSync(
    'git',
    ['show', `${CONTROL_COMMIT}:vendor/source-manifest.json`],
    { cwd: ROOT, encoding: 'utf8' },
  ));
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

test('the distribution manifest exposes only the Lean desired state and migration inputs', () => {
  const manifestText = readFileSync(MANIFEST, 'utf8');
  const manifest = JSON.parse(manifestText);

  assert.deepEqual(Object.keys(manifest), [
    'schemaVersion',
    'release',
    'activeCommonCore',
    'activeSkills',
    'sources',
    'compatibility',
  ]);
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.release, {
    name: 'JOENESS',
    version: '0.1',
    entrypoint: 'JOENESS.ps1',
  });
  assert.deepEqual(manifest.activeCommonCore, {
    path: 'evals/candidates/joeness-lean-kernel-v1.md',
    localPath: 'AGENTS.md',
    bytes: 1690,
    sha256: '0727f159bb33f67d40e4e0a1f1f391f76f96a6d980f7e1e6177df193208c3054',
  });
  assert.equal(lstatSync(LEAN_KERNEL).size, manifest.activeCommonCore.bytes);
  assert.equal(sha256(LEAN_KERNEL), manifest.activeCommonCore.sha256);
  assert.deepEqual(manifest.activeSkills, {});
  assert.deepEqual(manifest.compatibility.installIdentities.controlSixSkill, {
    commit: '80c79e9f4be91d730b1b3cdc62d7bf51508895e8',
    distributionManifest: {
      path: 'vendor/source-manifest.json',
      bytes: 37845,
      sha256: 'f7866fb42f3336e0bd82f01e0f3940ab8b6a5d5b55e4677b9306e461be3c0158',
    },
    activeCommonCore: {
      path: 'evals/candidates/interaction-safety-core-v8.md',
      sha256: '41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea',
    },
    selection: {
      canonicalization: 'ordinal-sorted localPath=sha256 UTF-8 lines joined by LF without trailing LF',
      activeSkillNames: ['design', 'handoff', 'project', 'spec', 'ticket', 'visual-check'],
      wholeFileCount: 64,
      sha256: 'f4a3c7fbacd8d6f8cfb1b958c094e73f5ba739a1bb633d3fff5614e34b8a7587',
    },
  });
  assert.deepEqual(
    Object.values(manifest.activeSkills).flatMap((skill) => skill.sourceDependencies ?? []),
    [],
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(manifest.sources).map(([name, source]) => [name, Object.keys(source)])),
    {
      'ui-ux-pro-max': ['files'],
      'apple-design': ['files'],
    },
    'legacy vendor bytes remain migration inputs, not active/default dependency metadata',
  );
  for (const source of Object.values(manifest.sources)) {
    for (const file of source.files) {
      assert.deepEqual(Object.keys(file), ['localPath', 'bytes', 'sha256']);
      assertVendorPath(file.localPath);
      const sourcePath = path.join(ROOT, ...file.localPath.split('/'));
      assert.equal(lstatSync(sourcePath).size, file.bytes, file.localPath);
      assert.equal(sha256(sourcePath), file.sha256, file.localPath);
    }
  }
  for (const removedKey of ['evaluation', 'behaviorEvidenceHistory', 'behaviorEvidence']) {
    assert.equal(removedKey in manifest, false, `${removedKey} belongs under evals, not distribution`);
  }
});

test('the Lean readiness ledger binds candidate status without claiming A/B promotion', () => {
  assert.equal(existsSync(LEAN_READINESS_LEDGER), true, 'missing additive Lean readiness ledger');
  assert.match(
    readFileSync(GITATTRIBUTES, 'utf8'),
    /^\/evals\/joeness-lean-candidate-readiness-v1\.json text eol=lf$/m,
  );
  const ledger = JSON.parse(readFileSync(LEAN_READINESS_LEDGER, 'utf8'));

  assert.deepEqual(ledger.control, {
    repository: 'JOEWRKS/joewrks-work-harness',
    commit: '80c79e9f4be91d730b1b3cdc62d7bf51508895e8',
    tree: '8ba2159f1aa4b425ee523f2b6eebe43d4778bb8f',
    distributionManifest: {
      path: 'vendor/source-manifest.json',
      bytes: 37845,
      sha256: 'f7866fb42f3336e0bd82f01e0f3940ab8b6a5d5b55e4677b9306e461be3c0158',
    },
  });
  assert.deepEqual(ledger.approvedSpec, {
    path: 'docs/superpowers/specs/2026-09-04-joeness-lean-split-design.md',
    commit: 'f338238558aa0863ed68ebc9d0f9ff500ca002df',
    bytes: 32428,
    sha256: 'e15dddf5230307f499e67a118ef1a891fd62a39269e02efbdc546bbf3ecc34b9',
  });
  assert.deepEqual(ledger.leanKernel, {
    path: 'evals/candidates/joeness-lean-kernel-v1.md',
    commit: '78d2f8ae390543d0cdc1f36e5b44ffec0981fa73',
    bytes: 1690,
    sha256: '0727f159bb33f67d40e4e0a1f1f391f76f96a6d980f7e1e6177df193208c3054',
  });
  assert.deepEqual(ledger.candidate, {
    state: 'deterministic-implementation-in-progress',
    distributionManifest: {
      path: 'vendor/source-manifest.json',
      bytes: 14688,
      sha256: 'ff1b4fa0f6cecf568c927dc9c5312060bc6154363f05a8a6b25d20841613757f',
    },
    publicSkillCount: 0,
    defaultVendorDependencyCount: 0,
  });
  assert.deepEqual(ledger.evaluation, {
    abStatus: 'NOT-RUN',
    promotionPass: false,
  });
  assert.deepEqual(ledger.historicalEvidence, {
    owner: 'Git history and existing evals artifacts',
    controlCommit: '80c79e9f4be91d730b1b3cdc62d7bf51508895e8',
    roots: ['evals/', 'vendor/compatibility/joeness-0.1/'],
    mutationPolicy: 'preserve; record reruns as additive artifacts',
  });

  assert.equal(
    execFileSync('git', ['rev-parse', `${ledger.control.commit}^{tree}`], { cwd: ROOT, encoding: 'utf8' }).trim(),
    ledger.control.tree,
  );
  const controlManifestBytes = execFileSync(
    'git',
    ['show', `${ledger.control.commit}:${ledger.control.distributionManifest.path}`],
    { cwd: ROOT },
  );
  assert.equal(controlManifestBytes.length, ledger.control.distributionManifest.bytes);
  assert.equal(sha256Bytes(controlManifestBytes), ledger.control.distributionManifest.sha256);

  for (const binding of [ledger.approvedSpec, ledger.leanKernel]) {
    const committedBytes = execFileSync('git', ['show', `${binding.commit}:${binding.path}`], { cwd: ROOT });
    assert.equal(committedBytes.length, binding.bytes, `${binding.path} committed bytes`);
    assert.equal(sha256Bytes(committedBytes), binding.sha256, `${binding.path} committed hash`);
  }
  const workingKernelBytes = readFileSync(path.join(ROOT, ...ledger.leanKernel.path.split('/')));
  assert.equal(workingKernelBytes.length, ledger.leanKernel.bytes);
  assert.equal(sha256Bytes(workingKernelBytes), ledger.leanKernel.sha256);
  const candidateManifestBytes = readFileSync(path.join(ROOT, ...ledger.candidate.distributionManifest.path.split('/')));
  assert.equal(candidateManifestBytes.length, ledger.candidate.distributionManifest.bytes);
  assert.equal(sha256Bytes(candidateManifestBytes), ledger.candidate.distributionManifest.sha256);
});

test('Control vendor and public-skill identities remain exact historical facts', () => {
  assert.ok(existsSync(MANIFEST), 'missing vendor/source-manifest.json');
  const manifestText = readFileSync(MANIFEST, 'utf8');
  assert.doesNotMatch(manifestText, /(?:[A-Za-z]:\\\\|[A-Za-z]:\/(?!\/)|(?:^|["\s])\/(?:Users|home)\/)/i, 'manifest contains a personal absolute path');
  const manifest = controlManifest();

  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.release, {
    name: 'JOENESS',
    version: '0.1',
    entrypoint: 'JOENESS.ps1',
  });
  assert.equal(manifest.evaluation.state, 'candidate');
  assert.deepEqual(manifest.evaluation.tests, [
    'tests/design-vendor-integrity.tests.mjs',
    'tests/design-visual-m2.tests.mjs',
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
    'spec',
    'ticket',
    'visual-check',
  ]);
  const design = manifest.activeSkills.design;
  const handoff = manifest.activeSkills.handoff;
  const project = manifest.activeSkills.project;
  const spec = manifest.activeSkills.spec;
  const ticket = manifest.activeSkills.ticket;
  const visualCheck = manifest.activeSkills['visual-check'];
  assert.equal(handoff.activationPolicy, 'explicit-only');
  assert.equal(design.activationPolicy, 'hybrid');
  assert.equal(project.activationPolicy, 'hybrid-offer-explicit-write');
  assert.equal(spec.activationPolicy, 'implicit-persistent-spec-delivery');
  assert.equal(ticket.activationPolicy, 'implicit-important-ticket-review');
  assert.equal(visualCheck.activationPolicy, 'hybrid-visual-verification');
  for (const skill of Object.values(manifest.activeSkills)) {
    assert.equal(skill.evaluationState, 'candidate');
  }
  assert.deepEqual(design.sourceDependencies, ['ui-ux-pro-max', 'apple-design']);
  for (const skill of [handoff, project, spec, ticket, visualCheck]) {
    assert.deepEqual(skill.sourceDependencies, []);
  }
  assert.deepEqual(
    project.files.map(({ localPath }) => localPath),
    EXPECTED_PROJECT_SKILL.files.map(({ localPath }) => localPath),
  );

  for (const skillName of ['design', 'handoff', 'project', 'spec', 'ticket', 'visual-check']) {
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
  assert.deepEqual(spec, EXPECTED_SPEC_SKILL);
  assert.deepEqual(ticket, EXPECTED_TICKET_SKILL);
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
      assert.equal(lstatSync(localFile).size, file.bytes, `wrong original byte length: ${file.localPath}`);
      assert.equal(sha256(localFile), file.sha256, `wrong original hash: ${file.localPath}`);
    }
  }
  for (const skill of [EXPECTED_DESIGN_SKILL, EXPECTED_PROJECT_SKILL, EXPECTED_VISUAL_CHECK_SKILL, EXPECTED_SPEC_SKILL, EXPECTED_TICKET_SKILL, EXPECTED_HANDOFF_SKILL]) {
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

test('the Control interaction safety core remains exact historical evidence', () => {
  const manifest = controlManifest();

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
    path: 'evals/candidates/interaction-safety-core-v8.md',
    sha256: '41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea',
  });
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V8).size, 2934);
  assert.ok(lstatSync(INTERACTION_SAFETY_CORE_V8).size <= 3072);
  assert.equal(sha256(INTERACTION_SAFETY_CORE_V8), manifest.activeCommonCore.sha256);
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V7).size, 2441);
  assert.ok(lstatSync(INTERACTION_SAFETY_CORE_V7).size <= 3072);
  assert.equal(
    sha256(INTERACTION_SAFETY_CORE_V7),
    '4c7cc5836f99d19ce67837ad3a138acc3a6522f4a1c1d3fc07b37a6396b383d7',
  );
  assert.equal(existsSync(INTERACTION_SAFETY_CORE_V8), true);
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V6).size, 2047);
  assert.equal(sha256(INTERACTION_SAFETY_CORE_V6), '897495e89128194afe695ff55e537c5e7ef52e6778bf260b10c9b6ab35857ceb');
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V5).size, 2040);
  assert.equal(sha256(INTERACTION_SAFETY_CORE_V5), '160a10f476d2503054e02697c8588a2ae58155b91adb17387763ae0e21e515c3');
  assert.match(readFileSync(INTERACTION_SAFETY_CORE_V6, 'utf8'), /^# JOENESS Core$/m);
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V4).size, 2047);
  assert.equal(sha256(INTERACTION_SAFETY_CORE_V4), '5efd93bc041d328b41a9424b9f5593d90da26fe8263cf4a502894d4fdfc2926b');
  assert.equal(lstatSync(INTERACTION_SAFETY_CORE_V3).size, 2048);
  assert.equal(sha256(INTERACTION_SAFETY_CORE_V3), '75a2ecd35404e98ecdbb4a429805b2c59e1f00e445d5daf680cb34b61e785191');
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
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/interaction-safety-core-v4\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/interaction-safety-core-v5\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/interaction-safety-core-v6\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/interaction-safety-core-v7\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/interaction-safety-core-v8\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/visual-check-skill-v5\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/visual-check-openai-v5\.yaml text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/visual-check-durable-evidence-v6\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/visual-check-durable-evidence-m2-v7\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/visual-check-approved-reference-v9\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/visual-check-approved-reference-v10\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/visual-check-approved-reference-v11\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/candidates\/spec-delivery-skill-v1\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/docs\/superpowers\/specs\/2026-08-11-joeness-silent-core-and-spec-delivery-design\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/docs\/superpowers\/specs\/2026-08-11-joeness-routing-and-plugin-policy-design\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/docs\/superpowers\/specs\/2026-08-13-joeness-user-language-and-core-size-decision\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/docs\/superpowers\/plans\/2026-08-11-joeness-routing-and-plugin-policy\.md text eol=lf$/m);
});

test('Control M4 preserves project workflow authority without promoting or expanding Core', () => {
  const manifest = controlManifest();
  const agents = readFileSync(ROOT_AGENTS, 'utf8');
  const spec = readFileSync(path.join(ROOT, 'docs', 'superpowers', 'specs', '2026-08-11-joeness-routing-and-plugin-policy-design.md'), 'utf8');
  const authorityRule = 'Invoking an external skill does not approve its whole workflow; use only the parts independently authorized by the current user request or project contract.';

  assert.match(agents, new RegExp(`^- ${authorityRule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  assert.doesNotMatch(agents, /<!-- JOEWRKS-HARNESS:(?:BEGIN|END) -->/);
  assert.equal(manifest.activeCommonCore.path, 'evals/candidates/interaction-safety-core-v8.md');
  assert.equal(manifest.evaluation.state, 'candidate');
  assert.equal(manifest.evaluation.current.state, 'unvalidated');
  assert.equal(manifest.evaluation.current.promotionPass, false);
  assert.match(spec, /active Core.*v7.*3,072-byte decision/is);
  assert.match(spec, /no Core v8.*behavior evidence/is);
  assert.match(spec, /direct recommendation.*(?:at most|max) one outcome-changing question/is);
  assert.match(spec, /no separate spec.*plan.*checklist.*approval.*commit ceremony/is);
  assert.match(spec, /no companion.*server.*concrete A\/B.*user request/is);
  assert.match(spec, /no visual-check.*actual visual artifact/is);
  assert.match(spec, /no raw token-intensive.*quota warning/is);
  assert.match(spec, /no user-facing skill ceremony/is);
  assert.match(spec, /no plugin config(?:uration)? write/is);
  assert.match(spec, /installed-plugin activation.*unverified.*separate activation evidence/is);
});

test('Control evaluation history remains available from its immutable Git owner', async () => {
  const manifest = controlManifest();
  const current = manifest.evaluation.current;
  assert.deepEqual(current, EXPECTED_CURRENT_EVALUATION);
  assert.deepEqual(manifest.evaluation.history, [EXPECTED_HYBRID_EVALUATION, EXPECTED_SKILL_CONTRACT_V2, EXPECTED_SKILL_CONTRACT_V3_REJECTED, EXPECTED_SKILL_CONTRACT_V4_REJECTED, EXPECTED_SKILL_CONTRACT_V5, EXPECTED_SKILL_CONTRACT_V6, EXPECTED_SKILL_CONTRACT_V7, EXPECTED_SKILL_CONTRACT_V8, EXPECTED_SKILL_CONTRACT_V9, EXPECTED_SKILL_CONTRACT_V10_REJECTED, EXPECTED_SKILL_CONTRACT_V11_REJECTED, EXPECTED_SKILL_CONTRACT_V12]);

  for (const [name, expected] of Object.entries(EXPECTED_SOURCE_EVALUATION)) {
    assert.equal(manifest.sources[name].evaluationStatus, expected.evaluationStatus);
    assert.deepEqual(manifest.sources[name].enforcingTests, expected.enforcingTests);
  }

  const [historical] = manifest.evaluation.history;
  const v1Cases = path.join(ROOT, 'evals', 'skill-contracts', 'cases.json');
  const v2Cases = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v2.json');
  assert.equal(lstatSync(v1Cases).size, 1664);
  assert.equal(sha256(v1Cases), '6f2148c44e5565563a71c850ab66fd78c5261402f375e927e20b9e2509779f81');
  assert.equal(lstatSync(v2Cases).size, 4353);
  assert.equal(sha256(v2Cases), EXPECTED_SKILL_CONTRACT_V2.cases.sha256);
  const v3Cases = path.join(ROOT, ...EXPECTED_SKILL_CONTRACT_V3_REJECTED.cases.path.split('/'));
  const v3Pressure = path.join(ROOT, ...EXPECTED_SKILL_CONTRACT_V3_REJECTED.pressureEvidence.path.split('/'));
  const v3Raw = path.join(ROOT, ...EXPECTED_SKILL_CONTRACT_V3_REJECTED.rawEvidence.path.split('/'));
  assert.equal(lstatSync(v3Cases).size, 7112);
  assert.equal(sha256(v3Cases), EXPECTED_SKILL_CONTRACT_V3_REJECTED.cases.sha256);
  assert.equal(lstatSync(v3Pressure).size, 7440);
  assert.equal(sha256(v3Pressure), EXPECTED_SKILL_CONTRACT_V3_REJECTED.pressureEvidence.sha256);
  assert.equal(lstatSync(v3Raw).size, 13987);
  assert.equal(sha256(v3Raw), EXPECTED_SKILL_CONTRACT_V3_REJECTED.rawEvidence.sha256);
  const v4Pressure = path.join(ROOT, ...EXPECTED_SKILL_CONTRACT_V4_REJECTED.pressureEvidence.path.split('/'));
  const v4Raw = path.join(ROOT, ...EXPECTED_SKILL_CONTRACT_V4_REJECTED.rawEvidence.path.split('/'));
  assert.equal(lstatSync(v4Pressure).size, 8427);
  assert.equal(sha256(v4Pressure), EXPECTED_SKILL_CONTRACT_V4_REJECTED.pressureEvidence.sha256);
  assert.equal(lstatSync(v4Raw).size, 14333);
  assert.equal(sha256(v4Raw), EXPECTED_SKILL_CONTRACT_V4_REJECTED.rawEvidence.sha256);
  const v7Cases = path.join(ROOT, ...EXPECTED_SKILL_CONTRACT_V7.cases.path.split('/'));
  assert.equal(lstatSync(v7Cases).size, 1237);
  assert.equal(sha256(v7Cases), EXPECTED_SKILL_CONTRACT_V7.cases.sha256);
  const v8Cases = path.join(ROOT, ...EXPECTED_SKILL_CONTRACT_V8.cases.path.split('/'));
  assert.equal(lstatSync(v8Cases).size, 4376);
  assert.equal(sha256(v8Cases), EXPECTED_SKILL_CONTRACT_V8.cases.sha256);
  assert.equal(lstatSync(path.join(ROOT, ...current.cases.path.split('/'))).size, 6006);
  assert.equal(sha256(path.join(ROOT, ...current.cases.path.split('/'))), current.cases.sha256);
  for (const key of ['staticContractEvidence', 'attemptIndex', 'designVisualEvidence', 'designOrchestrationEvidence']) {
    const evidence = current[key];
    const evidencePath = path.join(ROOT, ...evidence.path.split('/'));
    assert.equal(sha256(evidencePath), evidence.sha256, `wrong current evidence hash: ${key}`);
  }
  const staticReceipt = JSON.parse(readFileSync(path.join(ROOT, ...current.staticContractEvidence.path.split('/')), 'utf8'));
  assert.equal(staticReceipt.exitCode, 0);
  assert.deepEqual(staticReceipt.result, { tests: 17, pass: 17, fail: 0, cancelled: 0, skipped: 0, todo: 0, runnerDurationMs: 232.262 });
  const semanticReview = JSON.parse(readFileSync(path.join(ROOT, ...current.designVisualEvidence.path.split('/')), 'utf8'));
  assert.equal(semanticReview.result, 'semantic-review-rejected');
  assert.equal(semanticReview.promotionPass, false);
  const orchestration = JSON.parse(readFileSync(path.join(ROOT, ...current.designOrchestrationEvidence.path.split('/')), 'utf8'));
  assert.equal(orchestration.classification, 'orchestration-unverified');
  assert.equal(orchestration.retryAudit.result, 'budget-violation');
  assert.equal(current.runtimeEvidence.state, 'unverified');
  const visualContractV9 = manifest.evaluation.history.find(({ mode }) => mode === 'active-skill-contract-v9');
  const coveragePressurePath = path.join(ROOT, ...visualContractV9.visualCoverageEvidence.path.split('/'));
  assert.equal(lstatSync(coveragePressurePath).size, 3148);
  assert.equal(sha256(coveragePressurePath), visualContractV9.visualCoverageEvidence.sha256);
  const coveragePressure = JSON.parse(readFileSync(coveragePressurePath, 'utf8'));
  assert.equal(coveragePressure.candidate.skill.sha256, EXPECTED_VISUAL_CHECK_SKILL.files[0].sha256);
  assert.equal(coveragePressure.candidate.durableEvidence.sha256, '3a2b56bd7ad8474c0f05f9cf46a4df29b6bd2a29fc777e2b28bdef952b6a8246');
  assert.equal(coveragePressure.candidate.concreteDefect.sha256, EXPECTED_VISUAL_CHECK_SKILL.files[2].sha256);
  assert.deepEqual(coveragePressure.samples.scores, {
    controlMeaningDefectDetection: '2/2',
    defaultPreviewDefectDetection: '2/2',
    pixelPreviewDefectDetection: '2/2',
    pairwiseGapOverlapObservation: '2/2',
    opticalCenterObservation: '2/2',
    narrowPassDoesNotUpgradeWholeScreen: '2/2',
    combinedSurfacesIndependentVerdicts: '2/2',
    userRejectionWithdrawsPropertyPass: '2/2',
    userLanguageOverallVerdictFirst: '2/2',
  });
  assert.equal(coveragePressure.result, 'candidate-pressure-regression-pass');
  assert.equal(coveragePressure.classification, 'candidate-unvalidated');
  assert.equal(coveragePressure.semanticImprovement, 'not-asserted');
  assert.equal(coveragePressure.promotionPass, false);
  assert.equal(coveragePressure.evidence.every(({ sourceTracked }) => sourceTracked === false), true);
  const coverageRawPath = path.join(ROOT, ...coveragePressure.rawEvidence.path.split('/'));
  assert.equal(lstatSync(coverageRawPath).size, 5638);
  assert.equal(lstatSync(coverageRawPath).size, coveragePressure.rawEvidence.bytes);
  assert.equal(sha256(coverageRawPath), coveragePressure.rawEvidence.sha256);
  const coverageRaw = readFileSync(coverageRawPath, 'utf8');
  assert.match(coverageRaw, /## Sample 1[\s\S]*## Sample 2[\s\S]*## Limitations/);
  assert.match(coverageRaw, /### A[\s\S]*FAIL[\s\S]*### B[\s\S]*UNVERIFIED[\s\S]*### C[\s\S]*Collection[\s\S]*UNVERIFIED[\s\S]*### D[\s\S]*(?:철회|withdraw)/);
  const rejectedCoveragePath = path.join(ROOT, ...visualContractV9.visualCoverageHistory[0].path.split('/'));
  assert.equal(lstatSync(rejectedCoveragePath).size, 3050);
  assert.equal(sha256(rejectedCoveragePath), visualContractV9.visualCoverageHistory[0].sha256);
  const rejectedCoverage = JSON.parse(readFileSync(rejectedCoveragePath, 'utf8'));
  assert.equal(rejectedCoverage.result, 'candidate-pressure-partial-failure');
  assert.equal(rejectedCoverage.classification, 'semantic-review-rejected');
  assert.deepEqual(rejectedCoverage.samples.scores, {
    controlMeaningDefectDetection: '2/2',
    defaultPreviewDefectDetection: '0/2',
    pixelPreviewDefectDetection: '2/2',
    narrowPassDoesNotUpgradeWholeScreen: '2/2',
    combinedSurfacesIndependentVerdicts: '2/2',
    userRejectionWithdrawsPropertyPass: '2/2',
    userLanguageOverallVerdictFirst: '2/2',
  });
  assert.equal(coveragePressure.supersedes.sha256, visualContractV9.visualCoverageHistory[0].sha256);
  const rejectedDurable = path.join(ROOT, ...rejectedCoverage.candidate.durableEvidence.path.split('/'));
  assert.equal(lstatSync(rejectedDurable).size, rejectedCoverage.candidate.durableEvidence.bytes);
  assert.equal(sha256(rejectedDurable), rejectedCoverage.candidate.durableEvidence.sha256);
  const visualV5 = manifest.evaluation.history.find(({ mode }) => mode === 'active-skill-contract-v5');
  assert.equal(visualContractV9.visualPredecessorEvidence.pressure.path, visualV5.pressureEvidence.path);
  assert.equal(visualContractV9.visualPredecessorEvidence.pressure.sha256, visualV5.pressureEvidence.sha256);
  for (const key of ['skill', 'metadata']) {
    const archived = visualContractV9.visualPredecessorEvidence[key];
    const archivedPath = path.join(ROOT, ...archived.path.split('/'));
    assert.equal(lstatSync(archivedPath).size, archived.bytes);
    assert.equal(sha256(archivedPath), archived.sha256);
  }
  const pressurePath = path.join(ROOT, ...visualV5.pressureEvidence.path.split('/'));
  assert.equal(lstatSync(pressurePath).size, 6107);
  assert.equal(sha256(pressurePath), visualV5.pressureEvidence.sha256);
  const pressure = JSON.parse(readFileSync(pressurePath, 'utf8'));
  assert.equal(pressure.classification, 'candidate-pressure-sample-pass');
  assert.equal(pressure.promotionPass, false);
  assert.equal(pressure.supersedes.disposition, 'semantic-review-rejected');
  assert.equal(pressure.supersedes.reasons.length, 2);
  assert.equal(pressure.supersedes.cases.sha256, EXPECTED_SKILL_CONTRACT_V4_REJECTED.cases.sha256);
  assert.equal(pressure.supersedes.pressureEvidence.sha256, EXPECTED_SKILL_CONTRACT_V4_REJECTED.pressureEvidence.sha256);
  assert.equal(pressure.supersedes.rawEvidence.sha256, EXPECTED_SKILL_CONTRACT_V4_REJECTED.rawEvidence.sha256);
  assert.equal(pressure.finalCandidate.skillSha256, visualContractV9.visualPredecessorEvidence.skill.sha256);
  assert.equal(pressure.finalCandidate.metadataSha256, visualContractV9.visualPredecessorEvidence.metadata.sha256);
  assert.equal(pressure.finalCandidate.casesSha256, visualV5.cases.sha256);
  const rawPath = path.join(ROOT, ...pressure.rawEvidence.path.split('/'));
  assert.equal(lstatSync(rawPath).size, 19133);
  assert.equal(sha256(rawPath), pressure.rawEvidence.sha256);
  const raw = readFileSync(rawPath, 'utf8');
  const samples = pressure.finalCandidate.samples;
  assert.equal(samples.length, 5);
  assert.equal(new Set(samples.map((sample) => sample.sampleId)).size, 5);
  assert.deepEqual(pressure.finalCandidate.sharedOutcome, {
    overall: 'unverified-first-korean',
    authorityBoundNarrowPass: 'tracked-approved-source-only',
    relationship: 'unverified-no-authority',
    representatives: 'separate-representative-required-not-prepassed',
    bulkAndInGame: 'blocked-or-unverified',
    explicitAssetContract: 'pass-without-runtime-overreach',
    overwriteControl: 'requires-old-verdict-invalidation-byte-preserved-new-evidence-recheck',
    visibleFailure: 'fail-first-korean',
    postViewCriterion: 'future-only-new-attempt',
    noCriteriaAsset: 'unverified-no-candidate-derived-pass',
    candidateSelfLabel: 'unverified-not-authority',
  });
  for (const sample of samples) {
    assert.equal(sample.rawSection, sample.sampleId);
    const heading = `## ${sample.rawSection}`;
    const start = raw.indexOf(heading);
    assert.notEqual(start, -1, `missing raw section ${sample.rawSection}`);
    const next = raw.indexOf('\n## ', start + heading.length);
    const section = raw.slice(start, next === -1 ? raw.length : next);
    assert.match(section, /A\.[\s\S]{0,80}(?:UNVERIFIED|미검증)/, `${sample.sampleId} A verdict`);
    assert.match(section, /B\.[\s\S]{0,80}(?:PASS|합격|통과)/, `${sample.sampleId} B verdict`);
    assert.match(section, /C\.[\s\S]{0,80}(?:무효|invalid)/i, `${sample.sampleId} C verdict`);
    assert.match(section, /D\.[\s\S]{0,80}(?:FAIL|실패)/, `${sample.sampleId} D verdict`);
    assert.match(section, /E\.[\s\S]{0,120}(?:UNVERIFIED|미검증|PASS 불가)/, `${sample.sampleId} E verdict`);
    assert.match(section, /F\.[\s\S]{0,120}(?:UNVERIFIED|미검증|PASS 불가)/, `${sample.sampleId} F verdict`);
    assert.match(section, /G\.[\s\S]{0,120}(?:UNVERIFIED|미검증|PASS 불가)/, `${sample.sampleId} G verdict`);
    assert.match(section, /C\.[\s\S]{0,350}(?:새 시도별 프로젝트 경로|콘텐츠 주소)/, `${sample.sampleId} C evidence preservation`);
    assert.match(section, /F\.[\s\S]{0,350}(?:합격 기준|출처 있는)[\s\S]{0,250}(?:될 수 없다|만들 수 없다|PASS 불가|PASS.*없)/, `${sample.sampleId} F no candidate-derived pass`);
    assert.match(section, /G\.[\s\S]{0,350}User authority[\s\S]{0,250}(?:승인 권위|증거가 아니다|권위가 될 수 없다|PASS.*불가)/, `${sample.sampleId} G candidate label rejected`);
  }
  assert.match(raw, /Git 추적된 사용자 승인 4방향 총기 원본/);
  assert.match(raw, /reference-comparison\.png.*character-scale\.png.*후보 출력물/s);
  assert.match(raw, /32×32 캔버스.*비투명 픽셀.*총열은 오른쪽/s);
  assert.match(raw, /합격 기준이 없다.*후보에서 발견한 특징만으로/s);
  assert.equal(pressure.evidence.filter((entry) => entry.role === 'user-approved-four-direction-authority' && entry.sourceTracked).length, 1);
  assert.equal(pressure.evidence.filter((entry) => entry.role === 'candidate-comparison-not-authority' && !entry.sourceTracked).length, 1);
  for (const evidence of pressure.evidence) {
    const fixture = path.join(ROOT, ...evidence.fixturePath.split('/'));
    assert.equal(lstatSync(fixture).size, evidence.bytes);
    assert.equal(sha256(fixture), evidence.sha256);
  }
  const specContractV6 = manifest.evaluation.history.find(({ mode }) => mode === 'active-skill-contract-v6');
  const specPressurePath = path.join(ROOT, ...specContractV6.specPressureEvidence.path.split('/'));
  assert.equal(lstatSync(specPressurePath).size, 2151);
  assert.equal(sha256(specPressurePath), specContractV6.specPressureEvidence.sha256);
  const specPressure = JSON.parse(readFileSync(specPressurePath, 'utf8'));
  assert.equal(specPressure.skill.sha256, EXPECTED_SPEC_SKILL.files[0].sha256);
  assert.equal(specPressure.cases.sha256, specContractV6.cases.sha256);
  assert.equal(specPressure.candidate.sampleCount, 5);
  assert.equal(specPressure.candidate.scores.exactArtifactMarkdownLink, '5/5');
  assert.equal(specPressure.candidate.scores.implementationDecisionsAtMostThree, '5/5');
  assert.equal(specPressure.candidate.scores.notStartedOrUnverifiedBoundary, '5/5');
  assert.equal(specPressure.candidate.scores.noGenericReviewOrTransitionCeremony, '5/5');
  assert.equal(specPressure.result, 'candidate-pressure-regression-pass');
  assert.equal(specPressure.promotionPass, false);
  const specArtifact = path.join(ROOT, ...specPressure.artifact.path.split('/'));
  assert.equal(lstatSync(specArtifact).size, specPressure.artifact.bytes);
  assert.equal(sha256(specArtifact), specPressure.artifact.sha256);
  const specRaw = path.join(ROOT, ...specPressure.rawEvidence.path.split('/'));
  assert.equal(lstatSync(specRaw).size, specPressure.rawEvidence.bytes);
  assert.equal(sha256(specRaw), specPressure.rawEvidence.sha256);
  assert.match(readFileSync(specRaw, 'utf8'), /## Candidate 1[\s\S]*## Candidate 5/);
  assert.equal(specContractV6.specPressureHistory.length, 1);
  assert.equal(specPressure.predecessor.sha256, specContractV6.specPressureHistory[0].sha256);
  assert.equal(specPressure.predecessor.disposition, 'semantic-review-rejected');
  const rejectedSpecPressurePath = path.join(ROOT, ...specContractV6.specPressureHistory[0].path.split('/'));
  assert.equal(sha256(rejectedSpecPressurePath), specContractV6.specPressureHistory[0].sha256);
  const rejectedSpecReview = JSON.parse(readFileSync(rejectedSpecPressurePath, 'utf8'));
  assert.equal(rejectedSpecReview.disposition, 'semantic-review-rejected');
  assert.equal(rejectedSpecReview.scores.noApprovalOrTransitionCeremony, '0/5');
  const rejectedSpecSkillPath = path.join(ROOT, ...rejectedSpecReview.archivedCandidate.path.split('/'));
  assert.equal(lstatSync(rejectedSpecSkillPath).size, 1326);
  assert.equal(sha256(rejectedSpecSkillPath), rejectedSpecReview.archivedCandidate.sha256);
  const originalSpecPressurePath = path.join(ROOT, ...rejectedSpecReview.evaluatedEvidence.path.split('/'));
  assert.equal(lstatSync(originalSpecPressurePath).size, 1759);
  assert.equal(sha256(originalSpecPressurePath), rejectedSpecReview.evaluatedEvidence.sha256);
  const originalSpecPressure = JSON.parse(readFileSync(originalSpecPressurePath, 'utf8'));
  assert.equal(originalSpecPressure.skill.sha256, rejectedSpecReview.archivedCandidate.sha256);
  assert.equal(originalSpecPressure.result, 'explicit-output-shape-pass');
  const originalSpecRawPath = path.join(ROOT, ...rejectedSpecReview.rawEvidence.path.split('/'));
  assert.equal(lstatSync(originalSpecRawPath).size, 4786);
  assert.equal(sha256(originalSpecRawPath), rejectedSpecReview.rawEvidence.sha256);
  const ticketPressurePath = path.join(ROOT, ...current.ticketPressureEvidence.path.split('/'));
  assert.equal(lstatSync(ticketPressurePath).size, 2163);
  assert.equal(sha256(ticketPressurePath), current.ticketPressureEvidence.sha256);
  const ticketPressure = JSON.parse(readFileSync(ticketPressurePath, 'utf8'));
  assert.equal(
    ticketPressure.skill.sha256,
    '1c783553bbc3a0bd0b7e8a1dd376ee912ef00840670e06fa4945bde1ab78211f',
  );
  assert.equal(ticketPressure.cases.sha256, EXPECTED_SKILL_CONTRACT_V8.cases.sha256);
  assert.equal(ticketPressure.routing.candidateSampleCount, 5);
  assert.deepEqual(new Set(Object.values(ticketPressure.routing.scores)), new Set(['5/5']));
  assert.equal(ticketPressure.orchestration.implementerCandidateCreated, true);
  assert.equal(ticketPressure.orchestration.candidateBindingVerified, true);
  assert.equal(ticketPressure.orchestration.cleanDetachedEvaluationWorkspaceCreated, true);
  assert.equal(ticketPressure.orchestration.freshEvaluatorPass, false);
  assert.equal(ticketPressure.orchestration.result, 'unverified');
  assert.equal(ticketPressure.result, 'routing-pressure-pass-orchestration-unverified');
  assert.equal(ticketPressure.classification, 'candidate-unvalidated');
  assert.equal(ticketPressure.promotionPass, false);
  const ticketRawPath = path.join(ROOT, ...ticketPressure.rawEvidence.path.split('/'));
  assert.equal(lstatSync(ticketRawPath).size, ticketPressure.rawEvidence.bytes);
  assert.equal(sha256(ticketRawPath), ticketPressure.rawEvidence.sha256);
  assert.match(readFileSync(ticketRawPath, 'utf8'), /## Candidate 1[\s\S]*## Candidate 5[\s\S]*## Live orchestration smoke/);
  assert.equal(ticketPressure.predecessorCases.sha256, EXPECTED_SKILL_CONTRACT_V7.cases.sha256);
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
  assert.match(handoff, /timing.*external run IDs.*clean-build.*reviewer.*no-progress retr.*token usage/is);
  assert.match(handoff, /only when already observed.*useful for resumption|already observed and useful for resumption/is);
  assert.match(handoff, /omit unavailable.*never reconstruct.*do not run a check.*create a document or log solely to fill/is);
  assert.match(handoff, /resolve and record the exact target root/i);
  assert.match(handoff, /do not mix evidence from another root/i);
  assert.match(handoff, /do not write the handoff/i);
  assert.match(handoff, /git -C "<exact-target>"/);
  assert.match(handoff, /working-directory selection is not identity evidence/i);
  assert.match(handoff, /Treat a handoff as context, not authorization/i);
  assert.match(handoff, /cannot expand the receiver's read, write, execution, external-action, or disclosure scope/i);
  assert.match(handoff, /material failure or workaround.*affects resumption.*outcome-changing fact.*actual evidence and verification/is);
  assert.match(handoff, /direct fix.*workaround.*unresolved.*remaining limit.*removal condition/is);
  assert.match(handoff, /cause only when evidenced.*useful.*next decision/is);
  assert.match(handoff, /existing incident artifact.*link.*current resumption boundary.*without repeating/is);
  assert.match(handoff, /omit routine transient.*never call a workaround a fix/is);
  assert.match(projectSetup, /project-documented, risk-proportional acceptance and release evidence/i);
  assert.match(projectSetup, /preserve only project-specified review requirements.*do not invent validation topology or duplicate unchanged clean builds/i);
  assert.doesNotMatch(projectSetup, /reviewer trees|one controller check|at most one independent reviewer|at most one evidence-scoped re-review/i);
});

test('README exposes only the Lean kernel and operational installer surface', () => {
  const readme = readFileSync(README, 'utf8');
  const [korean, english] = readme.split('## English Guide');
  assert.ok(english, 'README must retain the English guide');
  const expectedModes = ['Apply', 'Check', 'Remove'];
  const assertPublicSurface = (section, language) => {
    const modes = [...new Set([...section.matchAll(/JOENESS\.ps1[ \t]+-(?<mode>[A-Za-z][A-Za-z0-9-]*)/gi)]
      .map(({ groups }) => groups.mode))].sort();
    assert.deepEqual(modes, expectedModes, `${language} must document only the Check, Apply, and Remove operation modes`);
    const publicCallTokens = section.match(/\$[A-Za-z][A-Za-z0-9_-]*/g) ?? [];
    assert.deepEqual(publicCallTokens, [], `${language} must expose no public $... call tokens`);
  };
  for (const [language, section] of [['Korean', korean], ['English', english]]) {
    assertPublicSurface(section, language);
    assert.throws(
      () => assertPublicSurface(`${section}\npowershell.exe -NoProfile -File .\\JOENESS.ps1 -Repair`, language),
      /must document only the Check, Apply, and Remove operation modes/,
    );
    assert.throws(
      () => assertPublicSurface(`${section}\n$joewrks-project-setup $joewrks-design-frontend`, language),
      /must expose no public \$\.\.\. call tokens/,
    );
    assert.match(section, /small[\s\S]{0,100}always-on[\s\S]{0,100}work-safety kernel|작고[\s\S]{0,100}항상 적용되는[\s\S]{0,100}작업 안전 커널/i);
    assert.match(section, /after installation[\s\S]{0,140}work normally|설치한 뒤[\s\S]{0,140}평소처럼 작업/i);
    assert.match(section, /PowerShell output[\s\S]{0,100}not a Codex chat response|PowerShell 출력[\s\S]{0,100}Codex 채팅 답변이 아닙니다/i);
    const backupTerms = language === 'Korean'
      ? [/변경 대상 파일을 백업/, /기존 `AGENTS\.md` 전체/, /관리 블록 밖/]
      : [/backs up affected files/i, /entire pre-change `AGENTS\.md`/i, /user-owned content outside its managed block/i];
    for (const term of backupTerms) assert.match(section, term);
    assert.match(section, /only JOENESS-owned[\s\S]{0,220}user-owned|JOENESS가 소유한[\s\S]{0,220}사용자 소유/i);
    assert.doesNotMatch(section, /Figma|Superpowers|Ponytail|UI UX Pro Max|Apple Design/i);
  }
});

test('Git preserves exact vendor and active skill bytes on checkout', () => {
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/JOENESS\.ps1 text eol=lf$/m);
  assert.doesNotMatch(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/joewrks-(?:design-frontend|project-setup)\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/handoff\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/project\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/design\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/visual-check\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/spec\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/skills\/ticket\/\*\* text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/skill-contracts\/visual-verdict-pressure-v\*-raw\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/skill-contracts\/spec-delivery-pressure-v\*-raw\.md text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/skill-contracts\/fixtures\/\*\* binary$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^\/evals\/skill-contracts\/\*\.json text eol=lf$/m);
  assert.match(readFileSync(GITATTRIBUTES, 'utf8'), /^vendor\/\*\* -text$/m);
});
