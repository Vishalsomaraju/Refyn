import { useState } from 'react';
import { useTheme } from '../../utils/theme';

export default function InterviewPanel({ analysis }) {
  const { T } = useTheme();
  const [revealedIdx, setRevealedIdx] = useState(new Set());

  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <i className="codicon codicon-mortar-board" style={{ fontSize: 32, color: T.textDim }} />
          <span style={{ fontSize: 13, color: T.textDim }}>Run analysis for interview prep questions</span>
        </div>
      </div>
    );
  }

  const issues = analysis.issues || [];

  const toggleReveal = (idx) => {
    setRevealedIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const revealAll = () => {
    if (revealedIdx.size === issues.length) {
      setRevealedIdx(new Set());
    } else {
      setRevealedIdx(new Set(issues.map((_, i) => i)));
    }
  };

  const questionTemplates = [
    (issue) => `What security/bug issue exists at line ${issue.line}?`,
    (issue) => `How would you fix the ${issue.category} problem on line ${issue.line}?`,
    (issue) => `Can you identify what's wrong with line ${issue.line}?`,
    (issue) => `A reviewer flagged line ${issue.line}. What would you change?`,
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: T.sidebar }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-2">
          <i className="codicon codicon-mortar-board" style={{ color: T.warning, fontSize: 14 }} />
          <span style={{ fontSize: 11, fontWeight: 'bold', color: T.textMuted, textTransform: 'uppercase' }}>
            Interview Prep
          </span>
        </div>
        <button
          onClick={revealAll}
          style={{
            fontSize: 10, background: T.accent + '22', color: T.accent,
            border: `1px solid ${T.accent}44`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer'
          }}
        >
          {revealedIdx.size === issues.length ? 'Hide All' : 'Reveal All'}
        </button>
      </div>

      {/* Score badge */}
      <div className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div style={{
          fontSize: 18, fontWeight: 700,
          color: analysis.score < 40 ? T.critical : analysis.score < 70 ? T.warning : T.success
        }}>
          {analysis.score}/100
        </div>
        <div style={{ fontSize: 11, color: T.textMuted }}>
          {issues.length} questions based on code issues
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {issues.map((issue, idx) => {
          const isRevealed = revealedIdx.has(idx);
          const question = questionTemplates[idx % questionTemplates.length](issue);

          return (
            <div key={idx} style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              overflow: 'hidden'
            }}>
              {/* Question */}
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <span style={{
                    background: T.warning + '22', color: T.warning,
                    padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', flexShrink: 0
                  }}>
                    Q{idx + 1}
                  </span>
                  <span style={{ fontSize: 12, color: T.text, lineHeight: '1.5' }}>
                    {question}
                  </span>
                </div>
              </div>

              {/* Answer / Reveal button */}
              {isRevealed ? (
                <div className="px-3 pb-3">
                  <div className="rounded p-2" style={{
                    background: T.success + '11',
                    borderLeft: `3px solid ${T.success}`,
                    fontSize: 12, color: T.text, lineHeight: '1.5'
                  }}>
                    <strong style={{ color: T.success }}>Answer:</strong> {issue.title}<br />
                    <span style={{ color: T.textMuted }}>{issue.description}</span>
                    {issue.fix && (
                      <div className="mt-2" style={{
                        fontFamily: "'Consolas', monospace",
                        background: T.bg, padding: 8, borderRadius: 4,
                        whiteSpace: 'pre-wrap', fontSize: 11
                      }}>
                        <span style={{ color: T.success, fontSize: 9, fontWeight: 'bold' }}>FIX:</span>{'\n'}{issue.fix}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-3 pb-3">
                  <button
                    onClick={() => toggleReveal(idx)}
                    className="flex items-center gap-1"
                    style={{
                      fontSize: 11, color: T.accent, background: 'transparent',
                      border: 'none', cursor: 'pointer', padding: 0
                    }}
                  >
                    <i className="codicon codicon-eye" style={{ fontSize: 12 }} />
                    Reveal Answer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
