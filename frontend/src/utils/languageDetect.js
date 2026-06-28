/**
 * Auto-detect programming language from code content.
 * Checks the first 20 lines for known patterns.
 * @param {string} code
 * @returns {{ language: string, confidence: 'high'|'medium'|'low' }}
 */
export function detectLanguage(code) {
  if (!code || !code.trim()) return { language: 'python', confidence: 'low' };

  const lines = code.split('\n').slice(0, 20).join('\n');
  const scores = {};

  const patterns = {
    python: [
      /\bdef\s+\w+\s*\(/, /\bimport\s+\w+/, /\bfrom\s+\w+\s+import/,
      /\bprint\s*\(/, /^\s{4}\S/m, /\bclass\s+\w+.*:/, /\belif\b/, /\bself\b/
    ],
    javascript: [
      /\bfunction\s+\w+/, /\bconst\s+\w+/, /\blet\s+\w+/, /\bvar\s+\w+/,
      /=>/, /\brequire\s*\(/, /\bconsole\.log\s*\(/, /\bdocument\./,
      /\bmodule\.exports/
    ],
    typescript: [
      /\binterface\s+\w+/, /:\s*string\b/, /:\s*number\b/, /:\s*boolean\b/,
      /\btype\s+\w+\s*=/, /\benum\s+\w+/, /\bas\s+\w+/,
      /\bconst\s+\w+/, /\blet\s+\w+/, /=>/
    ],
    java: [
      /\bpublic\s+class\b/, /\bpublic\s+static\s+void\b/, /\bSystem\.out\./,
      /\bprivate\s+\w+/, /\bimport\s+java\./, /\bnew\s+\w+\s*\(/,
      /\bString\b/, /\bvoid\b/
    ],
    cpp: [
      /#include\s*</, /\bcout\s*<</, /\bint\s+main\s*\(/, /\bstd::/,
      /\busing\s+namespace\b/, /\bcin\s*>>/, /\bvector\s*</
    ],
    go: [
      /\bfunc\s+\w+/, /\bpackage\s+main\b/, /:=/, /\bfmt\.Print/,
      /\bimport\s+\(/, /\bgo\s+\w+/, /\bdefer\b/
    ],
    rust: [
      /\bfn\s+main\b/, /\blet\s+mut\b/, /\bprintln!\s*\(/, /\bimpl\s+\w+/,
      /\buse\s+std::/, /\bmatch\s+\w+/, /\b->\s*\w+/
    ],
    php: [
      /<\?php/, /\becho\s+/, /\$\w+/, /\bfunction\s+\w+\s*\(/,
      /\barray\s*\(/, /->/, /\bclass\s+\w+/
    ],
  };

  for (const [lang, pats] of Object.entries(patterns)) {
    scores[lang] = 0;
    for (const pat of pats) {
      if (pat.test(lines)) scores[lang]++;
    }
  }

  // TypeScript inherits JS patterns — subtract overlap
  if (scores.typescript > 0 && scores.javascript > 0) {
    // Only prefer TS if it has TS-specific hits beyond shared JS patterns
    const tsSpecific = [/\binterface\s+/, /:\s*string\b/, /:\s*number\b/, /\btype\s+\w+\s*=/];
    const tsOnlyHits = tsSpecific.filter((p) => p.test(lines)).length;
    if (tsOnlyHits === 0) scores.typescript = 0;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const second = sorted[1];

  if (best[1] === 0) return { language: 'python', confidence: 'low' };

  let confidence;
  if (best[1] >= 4) confidence = 'high';
  else if (best[1] >= 2 && best[1] - (second?.[1] || 0) >= 1) confidence = 'medium';
  else confidence = 'low';

  return { language: best[0], confidence };
}
