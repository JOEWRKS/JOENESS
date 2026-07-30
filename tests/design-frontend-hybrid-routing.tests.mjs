import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKILL = path.join(ROOT, 'skills', 'joewrks-design-frontend', 'SKILL.md');

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
  assert.doesNotMatch(text, /(?:^|\n)\s*1\.\s+(?=[^\n]*(?:search|read|inspect|verify|Figma|browser))[\s\S]{0,500}(?:^|\n)\s*2\.\s+(?=[^\n]*(?:search|read|inspect|verify|Figma|browser))[\s\S]{0,500}(?:^|\n)\s*3\.\s+(?=[^\n]*(?:search|read|inspect|verify|Figma|browser))/i);
  assert.doesNotMatch(text, /\b(?:first|start)\b[^.\n]{0,160}\b(?:search|read|inspect|verify|Figma|browser)\b[^.\n]{0,160}\bthen\b[^.\n]{0,160}\b(?:search|read|inspect|verify|Figma|browser)\b/i);
  assert.doesNotMatch(text, /(?:^|\n)(?![^\n]*\b(?:if|when|only|unless)\b)[^\n]*\b(?:Figma|browser)\b[^\n]*\b(?:must|required)\b/i);
  assert.doesNotMatch(text, /deterministic (?:dispatcher|checklist)|mandatory (?:per-turn )?receipt/i);
  assert.doesNotMatch(text, /CLAUDE_PLUGIN_ROOT|[A-Za-z]:[\\/](?:Users|home)\b|\/(?:Users|home)\//i);
});
