export function scoreInteraction(focusedCases, fullCases, baselineCases, oracleNames) {
  const focused = new Map(focusedCases.map(item => [item.fullname, item.result]));
  const full = new Map(fullCases.map(item => [item.fullname, item.result]));
  const baseline = new Map(baselineCases.map(item => [item.fullname, item.result]));
  const oraclePass = oracleNames.length > 0 && oracleNames.every(name => focused.get(name) === 'Passed');
  const missingBaseline = [...baseline.keys()].filter(name => !full.has(name)).sort();
  const newFailures = fullCases.filter(item => item.result !== 'Passed' &&
    item.result !== baseline.get(item.fullname)).map(item => item.fullname).sort();
  return {
    pass: oraclePass && missingBaseline.length === 0 && newFailures.length === 0,
    oraclePass,
    missingBaseline,
    newFailures
  };
}

export function meaningfulStateRestored(_statusBefore, _statusAfter,
  diffBefore, diffAfter, untrackedBefore, untrackedAfter) {
  return diffBefore === diffAfter && untrackedBefore === untrackedAfter;
}
