export const buildReviewPrompt = (code, language) => `
You are an expert ${language} code reviewer with 15 years of production experience.
Analyze the following code thoroughly across all dimensions.

Return ONLY a valid JSON object in this exact structure, nothing else:
{
  "score": <integer from 0 to 100, where 100 = perfect code with zero issues,
             90-99 = excellent, 70-89 = good minor issues,
             50-69 = fair several issues, 30-49 = poor significant problems,
             0-29 = critical multiple severe issues>,
  "breakdown": {
    "security":    <0-100>,
    "bugs":        <0-100>,
    "performance": <0-100>,
    "quality":     <0-100>
  },
  "issues": [
    {
      "id":          "<unique string, e.g. issue_1>",
      "title":       "<short title>",
      "severity":    "<CRITICAL | WARNING | INFO>",
      "category":    "<bug | security | performance | quality>",
      "line":        <line number as integer or null>,
      "description": "<clear explanation of the problem>",
      "fix":         "<specific actionable fix>",
      "beforeCode":  "<the problematic code snippet, exact as it appears>",
      "afterCode":   "<the fixed version of that same snippet>",
      "scoreDelta":  <integer, how many points fixing this would add, e.g. 15>,
      "detectedBy":  ["gemini"]
    }
  ],
  "optimizedCode": "<the fully corrected and improved version of the entire code>",
  "summary": "<one sentence overall assessment>"
}

CRITICAL RULES:
- score MUST be between 0 and 100 as an integer
- A file with zero issues MUST have score 90-100
- A file with one minor warning should be 70-85
- breakdown scores must also be 0-100 integers
- scoreDelta for all issues combined should not exceed (100 - score)
- beforeCode and afterCode are REQUIRED for every issue — use empty string "" if unsure
- detectedBy array must contain the model name that found this issue
- Return ONLY the JSON object — no markdown, no explanation, no text before or after
- Start your response with { and end with }

Code to analyze (${language}):
\`\`\`${language}
${code}
\`\`\`
`;
