import { useState } from 'react';
import { useTheme } from '../../utils/theme';

export default function IssueCard({ issue, usedModel, onApplyFix }) {
  const { T } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Severity colors and icons
  const severityMap = {
    critical: { color: T.critical, icon: 'codicon-error', label: 'Critical' },
    warning: { color: T.warning, icon: 'codicon-warning', label: 'Warning' },
    info: { color: T.info, icon: 'codicon-info', label: 'Info' }
  };
  
  const sev = severityMap[issue.severity?.toLowerCase()] || severityMap.info;

  // Render "3/4 models" badge if we're in All Together mode
  // The backend might not actually send this for now, but we prepare the UI
  const showModelBadge = usedModel === 'All Together';

  return (
    <div 
      style={{ 
        background: T.bg, 
        border: `1px solid ${T.border}`,
        borderRadius: 4,
        overflow: 'hidden'
      }}
    >
      <div 
        className="flex items-start gap-2 p-3 cursor-pointer"
        style={{ background: expanded ? T.hoverBg : 'transparent' }}
        onClick={() => setExpanded(!expanded)}
      >
        <i className={`codicon ${sev.icon} mt-0.5`} style={{ color: sev.color, fontSize: 16 }} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span style={{ fontSize: 13, fontWeight: '500', color: T.textBright, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {issue.title}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {showModelBadge && (
                <span style={{ fontSize: 10, background: T.activeBg, padding: '2px 6px', borderRadius: 4, color: T.textMuted }}>
                  3/4 models
                </span>
              )}
              <span style={{ fontSize: 12, color: T.textDim }}>Line {issue.line}</span>
            </div>
          </div>
          
          <div style={{ fontSize: 12, color: T.textMuted, display: expanded ? 'none' : '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {issue.description}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-3 pt-0 border-t" style={{ borderColor: T.border }}>
          <div className="mt-2 mb-3 rounded p-2" style={{ background: T.activeBg, fontSize: 12, color: T.text }}>
            {issue.description}
          </div>
          
          {issue.fix && (
            <div className="flex flex-col gap-2 mt-3">
              <div 
                className="p-2 rounded relative group" 
                style={{ 
                  background: '#00000022', 
                  borderLeft: `3px solid ${T.success}`,
                  fontFamily: "'Consolas', monospace",
                  fontSize: 12,
                  color: T.string,
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto'
                }}
              >
                <div style={{ color: T.success, fontSize: 10, marginBottom: 4, fontWeight: 'bold', textTransform: 'uppercase' }}>Suggested Fix</div>
                {issue.fix}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyFix(issue);
                }}
                className="flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition-all"
                style={{
                  background: T.success,
                  color: '#fff',
                  opacity: 0.9
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.9'}
              >
                <i className="codicon codicon-check" />
                Apply Smart Fix
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
