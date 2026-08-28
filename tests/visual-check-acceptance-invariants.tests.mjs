import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DURABLE_EVIDENCE = path.join(
  ROOT,
  'skills',
  'visual-check',
  'references',
  'durable-evidence.md',
);
const CONCRETE_DEFECT = path.join(
  ROOT,
  'skills',
  'visual-check',
  'references',
  'concrete-defect.md',
);

const durableEvidence = readFileSync(DURABLE_EVIDENCE, 'utf8');
const concreteDefect = readFileSync(CONCRETE_DEFECT, 'utf8');

test('visual-check freezes sourced acceptance axes before candidate interpretation', () => {
  assert.match(
    durableEvidence,
    /before (?:inspecting|interpreting) (?:a |the )?candidate[\s\S]*freeze[\s\S]*sourced acceptance (?:axes|invariants)[\s\S]*(?:change|determine) the verdict/iu,
  );
});

test('visual-check rechecks only materially impacted invariants after a correction', () => {
  assert.match(
    concreteDefect,
    /correction mechanism[\s\S]*materially affects[\s\S]*(?:required|acceptance) invariant[\s\S]*recheck/iu,
  );
  assert.match(
    concreteDefect,
    /do not[\s\S]*(?:recheck|rerun)[\s\S]*(?:unrelated|unaffected)/iu,
  );
});
