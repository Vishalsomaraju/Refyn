import { useState } from 'react';
import { useTheme } from '../../utils/theme';

export default function LearnPanel({ analysis }) {
  const { T } = useTheme();
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <i className="codicon codicon-book" style={{ fontSize: 32, color: T.textDim }} />
          <span style={{ fontSize: 13, color: T.textDim }}>Run analysis to get learning insights</span>
        </div>
      </div>
    );
  }

  const issues = analysis.issues || [];
  const score = analysis.score || 0;

  const severityIcon = (s) =>
    s === 'critical' ? 'codicon-error' : s === 'warning' ? 'codicon-warning' : 'codicon-info';
  const severityColor = (s) =>
    s === 'critical' ? T.critical : s === 'warning' ? T.warning : T.info;

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: T.sidebar }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-2">
          <i className="codicon codicon-book" style={{ color: T.accent, fontSize: 14 }} />
          <span style={{ fontSize: 11, fontWeight: 'bold', color: T.textMuted, textTransform: 'uppercase' }}>
            Learning Mode
          </span>
        </div>
        <span style={{ fontSize: 10, color: T.textDim }}>{issues.length} lessons</span>
      </div>

      {/* Summary */}
      <div className="px-3 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.text, lineHeight: '1.5' }}>
          {analysis.summary || `Your code scored ${score}/100. Review the lessons below to improve it.`}
        </div>
      </div>

      {/* Lesson cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {issues.map((issue, idx) => {
          const isExpanded = expandedIdx === idx;
          return (
            <div key={idx} style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              overflow: 'hidden'
            }}>
              <div
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                style={{ background: isExpanded ? T.hoverBg : 'transparent' }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: severityColor(issue.severity) + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <i className={`codicon ${severityIcon(issue.severity)}`}
                    style={{ fontSize: 12, color: severityColor(issue.severity) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.textBright }}>
                    Lesson {idx + 1}: {issue.title}
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim }}>
                    Line {issue.line} · {issue.category}
                  </div>
                </div>
                <i className={`codicon ${isExpanded ? 'codicon-chevron-up' : 'codicon-chevron-down'}`}
                  style={{ fontSize: 14, color: T.textDim }} />
              </div>

              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="rounded p-2 mt-1" style={{ background: T.activeBg, fontSize: 12, color: T.text, lineHeight: '1.6' }}>
                    <strong style={{ color: T.accent }}>What's wrong:</strong><br />
                    {issue.description}
                  </div>
                  {issue.fix && (
                    <div className="rounded p-2 mt-2" style={{
                      background: T.success + '11',
                      borderLeft: `3px solid ${T.success}`,
                      fontSize: 12, color: T.text, lineHeight: '1.5',
                      fontFamily: "'Consolas', monospace"
                    }}>
                      <strong style={{ color: T.success }}>How to fix:</strong><br />
                      <span style={{ whiteSpace: 'pre-wrap' }}>{issue.fix}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
