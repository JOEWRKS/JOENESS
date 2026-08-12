const VERDICTS = new Set(["PASS", "FAIL", "UNVERIFIED"]);

export function summarizeTicketVerdicts(criteria) {
  if (!Array.isArray(criteria)) {
    throw new TypeError("criteria must be an array");
  }

  const counts = { PASS: 0, FAIL: 0, UNVERIFIED: 0 };
  const failedIds = [];
  const unverifiedRequiredIds = [];
  const seenIds = new Set();

  for (const [index, criterion] of criteria.entries()) {
    if (criterion === null || typeof criterion !== "object") {
      throw new TypeError(`criterion at index ${index} must be an object`);
    }

    const { id, required, verdict } = criterion;

    if (typeof id !== "string" || id.trim().length === 0) {
      throw new TypeError(`criterion at index ${index} must have a non-empty id`);
    }
    if (seenIds.has(id)) {
      throw new Error(`duplicate id: ${id}`);
    }
    if (typeof required !== "boolean") {
      throw new TypeError(`required must be boolean for criterion: ${id}`);
    }
    if (!VERDICTS.has(verdict)) {
      throw new Error(`invalid verdict: ${String(verdict)}`);
    }

    seenIds.add(id);
    counts[verdict] += 1;

    if (verdict === "FAIL") {
      failedIds.push(id);
    } else if (verdict === "UNVERIFIED" && required) {
      unverifiedRequiredIds.push(id);
    }
  }

  const state = failedIds.length > 0
    ? "REWORK"
    : unverifiedRequiredIds.length > 0
      ? "UNVERIFIED"
      : "ACCEPTED";

  return { state, counts, failedIds, unverifiedRequiredIds };
}
