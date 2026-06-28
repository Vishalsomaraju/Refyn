import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Zap, Loader2, AlertCircle } from 'lucide-react';

const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'ruby', 'sql'];

export default function CompareView() {
  const [leftCode, setLeftCode] = useState('// Paste your first code snippet here\n');
  const [rightCode, setRightCode] = useState('// Paste your second code snippet here\n');
  const [language, setLanguage] = useState('javascript');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = useCallback(async () => {
    if (!leftCode.trim() || !rightCode.trim()) return;
    setLoading(true);
    setComparison(null);

    try {
      const res = await fetch(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: leftCode,
          language,
          analysis: {},
          offline: false,
          messages: [
            {
              role: 'system',
              content: `You are a code comparison expert. Compare two code snippets thoroughly. Analyze:
1. **Readability** — Which is cleaner?
2. **Performance** — Which is faster and why?
3. **Correctness** — Are there bugs in either?
4. **Best Practices** — Which follows conventions better?
5. **Verdict** — Give a clear winner with reasoning.

Use markdown formatting. Be concise but thorough.`
            },
            {
              role: 'user',
              content: `Compare these two ${language} code snippets:\n\n**Snippet A:**\n\`\`\`${language}\n${leftCode}\n\`\`\`\n\n**Snippet B:**\n\`\`\`${language}\n${rightCode}\n\`\`\``
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setComparison(data.data.reply);
      } else {
        setComparison('Failed to compare. Please try again.');
      }
    } catch (err) {
      setComparison('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [leftCode, rightCode, language]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          <Scale size={16} color="var(--accent)" /> Compare Code
        </div>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          style={{
            padding: '4px 10px', fontSize: 12, borderRadius: 6,
            background: 'var(--surface-high)', color: 'var(--text)',
            border: '1px solid var(--border)', cursor: 'pointer',
            outline: 'none'
          }}
        >
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCompare}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            background: loading ? 'var(--surface-high)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
            transition: 'all 150ms',
          }}
        >
          {loading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                <Loader2 size={14} />
              </motion.div>
              Comparing…
            </>
          ) : (
            <>
              <Zap size={14} />
              Compare
            </>
          )}
        </button>
      </div>

      {/* Editors side by side */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, background: 'var(--bg)' }}>
        {/* Left editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <div style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 600, color: 'var(--accent)',
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Snippet A
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language}
              value={leftCode}
              onChange={val => setLeftCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13, minimap: { enabled: false },
                scrollBeyondLastLine: false, padding: { top: 12 },
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>
        </div>

        {/* Right editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 600, color: '#22c55e',
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Snippet B
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language}
              value={rightCode}
              onChange={val => setRightCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13, minimap: { enabled: false },
                scrollBeyondLastLine: false, padding: { top: 12 },
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>
        </div>
      </div>

      {/* Comparison result */}
      <AnimatePresence>
        {(comparison || loading) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              borderTop: '1px solid var(--border)', background: 'var(--surface)',
              overflow: 'auto', flexShrink: 0,
            }}
          >
            <div style={{ padding: '16px 20px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                    <Loader2 size={16} />
                  </motion.div>
                  <span>AI is analyzing both snippets…</span>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {comparison.startsWith('Error') || comparison.startsWith('Failed') ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
                      <AlertCircle size={16} /> {comparison}
                    </div>
                  ) : (
                    comparison
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
