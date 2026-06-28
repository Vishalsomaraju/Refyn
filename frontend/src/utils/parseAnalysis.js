/**
 * Normalize the raw AI analysis response into a guaranteed-shape object.
 * All downstream components can rely on these fields always existing.
 */
export function parseAnalysis(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    score: typeof raw.score === "number" ? Math.round(raw.score) : 0,
    scores: {
      bugs: raw.scores?.bugs ?? 0,
      security: raw.scores?.security ?? 0,
      performance: raw.scores?.performance ?? 0,
      quality: raw.scores?.quality ?? 0,
    },
    issues: Array.isArray(raw.issues)
      ? raw.issues.map((issue) => ({
          category: issue.category || "quality",
          severity: issue.severity || "info",
          line: issue.line || null,
          title: issue.title || "Untitled issue",
          description: issue.description || "",
          fix: issue.fix || "",
          confidence: issue.confidence || null,
          count: issue.count || 1,
        }))
      : [],
    optimizedCode: raw.optimizedCode || "",
    summary: raw.summary || "",
    usedModel: raw.usedModel || "unknown",
    modelsUsed: raw.modelsUsed || 1,
  };
}

/**
 * Group issues by category for the filter tabs in IssueList.
 */
export function groupIssuesByCategory(issues) {
  return {
    security: issues.filter((i) => i.category === "security"),
    bug: issues.filter((i) => i.category === "bug"),
    performance: issues.filter((i) => i.category === "performance"),
    quality: issues.filter((i) => i.category === "quality"),
  };
}

/**
 * Map highlighted lines for Monaco decorations from analysis issues.
 * Returns [{ line, severity }]
 */
export function getHighlightedLines(issues) {
  return issues
    .filter((i) => i.line != null)
    .map((i) => ({ line: i.line, severity: i.severity }));
}
