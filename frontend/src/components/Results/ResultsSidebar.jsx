import { useState } from 'react';
import { Brain } from 'lucide-react';
import IssuesPanel from './IssuesPanel';
import ScorePanel from './ScorePanel';

export default function ResultsSidebar({
  issues, score, breakdown, isAnalyzing, memoryInsights,
  onApplyFix, onShowDiff, onAskAbout,
  onSmartFixAll, onExport, onShare, onRevealLine
}) {
  const [memoryExpanded, setMemoryExpanded] = useState(false);

  return (
    <div style={{
      width: 340, height: '100%', borderLeft: '1px solid var(--border)',
      background: 'var(--surface)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
          Results
        </span>
      </div>

      {/* Issues — top flex 1.4 */}
      <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <IssuesPanel
          issues={issues}
          isAnalyzing={isAnalyzing}
          onApplyFix={onApplyFix}
          onShowDiff={onShowDiff}
          onAskAbout={onAskAbout}
          onSmartFixAll={onSmartFixAll}
          onRevealLine={onRevealLine}
        />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />

      {/* Score — bottom flex 1 */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <ScorePanel
          score={score}
          breakdown={breakdown}
          onExport={onExport}
          onShare={onShare}
        />
        
        {/* Memory Panel */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setMemoryExpanded(!memoryExpanded)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={16} /> Your Patterns
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{memoryExpanded ? '▾' : '▸'}</span>
            </button>
            
            {memoryExpanded && (
              <div style={{ padding: '0 16px 16px' }}>
                {(!memoryInsights || memoryInsights.length === 0) ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                    No patterns yet — run your first review
                  </div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                    {memoryInsights.map((pattern, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        <span style={{ color: 'var(--accent)', marginLeft: -16, marginRight: 8 }}>•</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
