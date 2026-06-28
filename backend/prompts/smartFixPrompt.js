export const buildSmartFixPrompt = (code, language, issues) => `
You are a code fix assistant. Generate a precise, ordered list of fixes for the following ${language} code.

CRITICAL: Return ONLY valid JSON. No markdown. No explanation. Raw JSON only.

Return this exact structure:
{
  "fixes": [
    {
      "order": 1,
      "severity": "critical|warning|info",
      "line": <line number>,
      "title": "<issue name>",
      "before": "<the original problematic line(s) exactly as they appear>",
      "after": "<the corrected replacement line(s)>",
      "why": "<plain English, 1-2 sentences explaining why this change matters>",
      "impact": "security|performance|reliability|readability"
    }
  ]
}

Order fixes from most critical to least critical.
Keep "before" and "after" as minimal as possible — only the changed lines.
Make "why" understandable to a junior developer.

Known issues to fix:
${JSON.stringify(issues, null, 2)}

Code (${language}):
\`\`\`${language}
${code}
\`\`\`
`;
