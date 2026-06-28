import { useState, useEffect } from 'react';
import { PlayCircle, Wand2 } from 'lucide-react';

const STDIN_PATTERNS = /\binput\s*\(|\bScanner\b|\breadline\b|\bgets\b|\bstdin\b/;

function parseErrorLine(stderr) {
  if (!stderr) return null;
  const m = stderr.match(/[Ll]ine\s+(\d+)|:(\d+):|line (\d+)/i);
  return m ? parseInt(m[1] || m[2] || m[3]) : null;
}

export default function OutputPanel({ code, language, runResult, isRunning, onRun, onFixWithAI, editorRef }) {
  const [stdin, setStdin]             = useState('');
  const [showStdin, setShowStdin]     = useState(false);
  const [history, setHistory]         = useState([]);
  const [historyView, setHistoryView] = useState(null);

  const needsStdin = STDIN_PATTERNS.test(code || '');

  console.log('[OutputPanel]', { isRunning, runResult, status: runResult?.status });

  // Add new results to history
  useEffect(() => {
    if (!runResult) return;
    setHistory(h => [{ ...runResult, ts: Date.now() }, ...h].slice(0, 3));
    setHistoryView(null);
  }, [runResult]);

  // Derive state — explicit, no string tricks
  let state = 'idle';
  if (isRunning)                             state = 'running';
  else if (runResult?.status === 'success') state = 'success';
  else if (runResult?.status === 'error')   state = 'error';

  const displayResult = (historyView !== null && history[historyView]) ? history[historyView] : runResult;
  const displayState  = (historyView !== null && history[historyView])
    ? (history[historyView].status === 'success' ? 'success' : 'error')
    : state;

  const errorLine = parseErrorLine(displayResult?.stderr);

  // Highlight error line in Monaco
  useEffect(() => {
    if (!errorLine || !editorRef?.current) return;
    try {
      const monaco = window.monaco;
      if (!monaco) return;
      const dec = editorRef.current.deltaDecorations([], [{
        range: new monaco.Range(errorLine, 1, errorLine, 1),
        options: { isWholeLine: true, className: 'error-line-highlight' }
      }]);
      const t = setTimeout(() => editorRef.current?.deltaDecorations(dec, []), 5000);
      return () => clearTimeout(t);
    } catch {}
  }, [errorLine, editorRef]);

  return (
    <div style={{
      height: '100%',
      flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--surface)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0
      }}>
        <span style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600 }}>
          OUTPUT
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {displayState === 'success' && (
            <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: -2 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
              {displayResult?.time ? `${displayResult.time}s` : 'ok'}
            </span>
          )}
          {displayState === 'error' && (
            <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: -2 }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Error
            </span>
          )}
          {displayState === 'running' && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <svg className="spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: -2 }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
              Running...
            </span>
          )}
          {(displayState === 'success' || displayState === 'error') && (
            <button
              onClick={() => { setHistoryView(null); onRun(); }}
              style={{
                fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
                padding: '3px 8px', border: '1px solid var(--border)',
                borderRadius: 4, background: 'transparent',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Re-run
            </button>
          )}
          {displayState === 'idle' && (
            <button
              onClick={onRun}
              style={{
                fontSize: 12, fontWeight: 500, color: 'var(--success)', cursor: 'pointer',
                padding: '5px 14px', border: '1px solid var(--success)',
                borderRadius: 5, background: 'transparent', transition: 'all 150ms',
                display: 'flex', alignItems: 'center', gap: 4
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--success)'; e.currentTarget.style.color = '#0a0a0f'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--success)'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Run Code
            </button>
          )}
        </div>
      </div>

      {/* STDIN */}
      {(needsStdin || showStdin) && (
        <div style={{ padding: '6px 14px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            {needsStdin ? 'stdin · your code expects input' : 'stdin'}
          </div>
          <textarea
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            placeholder="Enter input values, one per line"
            rows={2}
            style={{
              width: '100%', padding: '6px 8px', fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              background: 'var(--surface-high)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text)', outline: 'none', resize: 'none'
            }}
          />
        </div>
      )}

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', position: 'relative' }}>

        {displayState === 'idle' && (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <PlayCircle size={24} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Run your code to see output here
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <kbd style={{
                background: 'var(--surface-high)', border: '1px solid var(--border)',
                borderRadius: 3, padding: '1px 5px', fontSize: 10
              }}>Ctrl+Enter</kbd>
            </span>
            {!needsStdin && !showStdin && (
              <button
                onClick={() => setShowStdin(true)}
                style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', border: 'none', marginTop: 2 }}
              >
                ＋ Add stdin
              </button>
            )}
          </div>
        )}

        {displayState === 'running' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 3, background: 'var(--surface-high)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', height: '100%', width: '40%',
                background: 'var(--accent)', borderRadius: 2,
                animation: 'indeterminate 1.2s ease infinite'
              }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Executing {language}...
            </span>
          </div>
        )}

        {displayState === 'success' && (
          <pre style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            color: 'var(--text)', lineHeight: 1.65, margin: 0,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all'
          }}>
            {(displayResult?.output || '').trim()
              ? displayResult.output
              : <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Code ran successfully with no output.</span>
            }
          </pre>
        )}

        {displayState === 'error' && (
          <div style={{ paddingBottom: 44 }}>
            <pre style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              color: 'var(--error)', lineHeight: 1.65, margin: 0,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontWeight: 600
            }}>
              {displayResult?.stderr || 'Unknown error'}
            </pre>
            {errorLine && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                → Line {errorLine}
              </p>
            )}
            <button
              onClick={() => onFixWithAI({
                errorMessage: displayResult?.stderr,
                errorLine,
                code,
                language
              })}
              style={{
                position: 'absolute', bottom: 10, right: 14,
                padding: '6px 14px', fontSize: 12, fontWeight: 600,
                background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: 6, cursor: 'pointer'
              }}
            >
              <Wand2 size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> Fix with AI
            </button>
          </div>
        )}
      </div>

      {/* HISTORY */}
      {history.length > 0 && (
        <div style={{
          height: 28, borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6, flexShrink: 0
        }}>
          {history.map((h, i) => (
            <button
              key={h.ts}
              onClick={() => setHistoryView(historyView === i ? null : i)}
              style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', border: 'none',
                background: historyView === i ? 'var(--accent)' : 'var(--surface-high)',
                color: historyView === i ? 'white'
                  : h.status === 'success' ? 'var(--success)' : 'var(--error)'
              }}
            >
              {h.status === 'success' ? '✓' : '✕'} {h.time ? `${h.time}s` : 'run'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
