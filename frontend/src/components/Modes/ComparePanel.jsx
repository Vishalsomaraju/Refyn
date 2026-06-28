import { useTheme } from '../../utils/theme';

export default function ComparePanel({ analysis, code }) {
  const { T } = useTheme();

  if (!analysis || !analysis.optimizedCode) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <i className="codicon codicon-diff" style={{ fontSize: 32, color: T.textDim }} />
          <span style={{ fontSize: 13, color: T.textDim }}>Run analysis to compare original vs optimized code</span>
        </div>
      </div>
    );
  }

  const originalLines = code.split('\n');
  const optimizedLines = analysis.optimizedCode.split('\n');
  const maxLines = Math.max(originalLines.length, optimizedLines.length);

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: T.sidebar }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: T.border }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', color: T.textMuted, textTransform: 'uppercase' }}>
          Compare View
        </div>
        <span style={{ fontSize: 10, color: T.textDim }}>
          {originalLines.length} → {optimizedLines.length} lines
        </span>
      </div>

      {/* Side-by-side */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Original */}
        <div className="flex-1 flex flex-col min-w-0 border-r" style={{ borderColor: T.border }}>
          <div className="px-3 py-1" style={{ fontSize: 10, color: T.critical, background: T.critical + '11', borderBottom: `1px solid ${T.border}` }}>
            ● Original
          </div>
          <div className="flex-1 overflow-auto" style={{ fontSize: 12, fontFamily: "'Consolas', monospace" }}>
            {originalLines.map((line, i) => {
              const changed = optimizedLines[i] !== line;
              return (
                <div key={i} className="flex" style={{
                  background: changed ? T.critical + '11' : 'transparent',
                  borderLeft: changed ? `3px solid ${T.critical}` : '3px solid transparent',
                }}>
                  <span style={{ width: 35, textAlign: 'right', paddingRight: 8, color: T.textDim, fontSize: 11, userSelect: 'none' }}>{i + 1}</span>
                  <span style={{ color: T.text, whiteSpace: 'pre' }}>{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimized */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-3 py-1" style={{ fontSize: 10, color: T.success, background: T.success + '11', borderBottom: `1px solid ${T.border}` }}>
            ● Optimized
          </div>
          <div className="flex-1 overflow-auto" style={{ fontSize: 12, fontFamily: "'Consolas', monospace" }}>
            {optimizedLines.map((line, i) => {
              const changed = originalLines[i] !== line;
              return (
                <div key={i} className="flex" style={{
                  background: changed ? T.success + '11' : 'transparent',
                  borderLeft: changed ? `3px solid ${T.success}` : '3px solid transparent',
                }}>
                  <span style={{ width: 35, textAlign: 'right', paddingRight: 8, color: T.textDim, fontSize: 11, userSelect: 'none' }}>{i + 1}</span>
                  <span style={{ color: T.text, whiteSpace: 'pre' }}>{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
