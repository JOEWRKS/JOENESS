export function parseRunId(value) {
  const match = /^(.*)-r([12])-(bare|joeness)$/.exec(value);
  if (!match || !match[1]) throw new Error(`Invalid run ID: ${value}`);
  return { caseId: match[1], repetition: Number(match[2]), arm: match[3] };
}

export function normalizeHistoricalInstructions(value) {
  let text = value.replaceAll('D:\\JOEWRKS\\MergeDrop', '.').replaceAll('D:/JOEWRKS/MergeDrop', '.');
  const start = text.indexOf('\n## JOENESS design pilot evaluation');
  const end = text.indexOf('<!-- JOEWRKS-PROJECT:END -->', start);
  if (start < 0 || end < 0) throw new Error('Historical pilot boundary missing');
  text = text.slice(0, start) + '\n' + text.slice(end);
  return text;
}

export function tallyUsage(usages) {
  const total = { input: 0, cachedInput: 0, output: 0, noncachedInputPlusOutput: 0 };
  for (const usage of usages) {
    const input = usage?.input_tokens;
    const cached = usage?.cached_input_tokens;
    const output = usage?.output_tokens;
    if (![input, cached, output].every(value => Number.isSafeInteger(value) && value >= 0) || cached > input) {
      throw new Error('Invalid usage');
    }
    total.input += input;
    total.cachedInput += cached;
    total.output += output;
    total.noncachedInputPlusOutput += input - cached + output;
  }
  return total;
}

export function parseNUnitCases(xml) {
  const cases = [];
  for (const match of xml.matchAll(/<test-case\b([^>]*)>/g)) {
    const attributes = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
    if (!attributes.fullname || !attributes.result) throw new Error('Malformed NUnit test case');
    cases.push({ fullname: attributes.fullname, result: attributes.result });
  }
  if (cases.length === 0) throw new Error('No NUnit test cases');
  return cases;
}

export function gradeTestResults(focusedCases, fullCases, baselineCases, oracleNames) {
  if (![focusedCases, fullCases, baselineCases, oracleNames].every(Array.isArray) ||
      focusedCases.length === 0 || fullCases.length === 0 || baselineCases.length === 0 || oracleNames.length === 0) {
    throw new Error('Missing test evidence');
  }
  const focused = new Map(focusedCases.map(item => [item.fullname, item.result]));
  const full = new Map(fullCases.map(item => [item.fullname, item.result]));
  const baselineFailures = new Set(baselineCases.filter(item => item.result === 'Failed').map(item => item.fullname));
  const missingTests = baselineCases.map(item => item.fullname).filter(name => !full.has(name)).sort();
  const newFailures = fullCases.filter(item => item.result === 'Failed' && !baselineFailures.has(item.fullname)).map(item => item.fullname).sort();
  const focusedFailures = focusedCases.filter(item => item.result !== 'Passed').map(item => item.fullname).sort();
  const oraclePass = oracleNames.every(name => focused.get(name) === 'Passed' && full.get(name) === 'Passed');
  return {
    pass: oraclePass && focusedFailures.length === 0 && missingTests.length === 0 && newFailures.length === 0,
    oraclePass, focusedFailures, missingTests, newFailures,
  };
}
