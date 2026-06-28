import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ChevronDown, Wand2, Activity } from 'lucide-react';

const MODEL_NAMES = ['OpenRouter', 'Groq Llama', 'Mixtral', 'Qwen 2.5'];
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

const bodyVariants = {
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
  expanded: { height: 'auto', opacity: 1, overflow: 'visible', transition: { duration: 0.22, ease: 'easeOut' } },
};

function severityColor(sev) {
  const s = (sev || 'info').toLowerCase();
  if (s === 'critical') return 'var(--error)';
  if (s === 'warning') return 'var(--warning)';
  return 'var(--accent)';
}

function severityEmoji(sev) {
  const s = (sev || 'info').toLowerCase();
  if (s === 'critical') return '🔴';
  if (s === 'warning') return '🟡';
  return '🔵';
}

/* ─── Single Issue Card ─── */
export const IssueCard = memo(function IssueCard({ issue, index, onApplyFix, onShowDiff, onAskAbout, onRevealLine }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const sev = (issue.severity || 'info').toLowerCase();
  const color = severityColor(sev);
  const isCritical = sev === 'critical';

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), index * 60 + 100);
    return () => clearTimeout(t);
  }, [index]);

  const handleApplyFix = async () => {
    setIsApplying(true);
    try {
      await onApplyFix(issue);
      setIsFixed(true);
    } catch { /* ignore */ }
    setIsApplying(false);
  };

  if (isFixed) return null;

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      style={{
        position: 'relative', borderRadius: 10, overflow: 'hidden',
        background: 'var(--surface)', border: '1px solid var(--border)',
        marginBottom: 8, cursor: 'pointer',
        animation: isCritical ? `crit-glow 1.2s ease-out forwards` : 'none',
        animationDelay: `${index * 0.06 + 0.4}s`,
        transition: 'all 200ms ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}
      whileHover={{ 
        y: -2, 
        borderColor: 'var(--accent)', 
        boxShadow: '0 8px 16px rgba(0,0,0,0.06)' 
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 3,
        height: isVisible ? '100%' : '0%',
        background: color,
        transition: `height 300ms ease ${index * 60 + 300}ms`,
      }} />

      {/* Fix sweep overlay */}
      {isApplying && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(34,197,94,0.12)',
          width: isApplying ? '100%' : '0%',
          transition: 'width 400ms ease',
          zIndex: 1,
        }} />
      )}

      {/* Header (clickable) */}
      <div
        onClick={() => {
          setIsExpanded(prev => !prev);
          if (issue.line) onRevealLine?.(issue.line);
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px 10px 16px',
        }}
      >
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          color, padding: '1px 6px', borderRadius: 3,
          background: `color-mix(in srgb, ${color === 'var(--error)' ? '#ef4444' : color === 'var(--warning)' ? '#f59e0b' : '#6366f1'} 15%, transparent)`,
          flexShrink: 0,
        }}>
          {severityEmoji(sev)} {sev}
        </span>

        <span style={{
          fontSize: 13, color: 'var(--text)', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {issue.message || issue.title || issue.description || 'Issue'}
        </span>

        {issue.line && (
          <span style={{
            fontSize: 11, color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
          }}>
            Ln {issue.line}
          </span>
        )}

        <ChevronDown
          size={14}
          color="var(--text-muted)"
          style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 200ms ease',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Body (collapsible) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={bodyVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div style={{ padding: '0 16px 12px', borderTop: '1px solid var(--border)' }}>
              {/* Description */}
              <p style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                margin: '10px 0',
              }}>
                {issue.description || issue.message || ''}
              </p>

              {/* Confidence / model agreement */}
              {issue.models && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, color: 'var(--text-muted)', marginBottom: 10,
                }}>
                  <span>Detected by:</span>
                  {MODEL_NAMES.map((m, i) => {
                    const agreed = issue.models?.includes(m.split(' ')[0].toLowerCase());
                    return (
                      <span key={m} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          border: agreed ? 'none' : '1px solid var(--text-muted)',
                          background: agreed ? '#22c55e' : 'transparent',
                          display: 'inline-block',
                        }} />
                        <span style={{ fontSize: 10 }}>{m.split(' ')[0]}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                {issue.fix && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApplyFix(); }}
                    disabled={isApplying}
                    style={{
                      padding: '4px 10px', fontSize: 11, borderRadius: 4,
                      border: isApplying ? '1px solid var(--success)' : '1px solid var(--accent)',
                      color: isApplying ? 'var(--success)' : 'var(--accent)',
                      background: 'transparent', cursor: isApplying ? 'wait' : 'pointer',
                      fontFamily: "'Inter', sans-serif", transition: 'all 150ms ease',
                    }}
                  >
                    {isApplying ? '◌ Applying…' : '✓ Apply Fix'}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onShowDiff?.(issue); }}
                  style={cardBtnStyle}
                >
                  → See Diff
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAskAbout?.(issue); }}
                  style={cardBtnStyle}
                >
                  💬 Ask
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/* ─── Issues Panel ─── */
export default function IssuesPanel({
  issues, isAnalyzing, onApplyFix, onShowDiff, onAskAbout, onSmartFixAll, onRevealLine
}) {
  const [filter, setFilter] = useState('all');
  const [analyzeModel, setAnalyzeModel] = useState(0);

  /* ─── Model name cycling ─── */
  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setAnalyzeModel(prev => (prev + 1) % MODEL_NAMES.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  /* ─── Filter ─── */
  const criticalCount = issues.filter(i => (i.severity || '').toLowerCase() === 'critical').length;
  const warningCount = issues.filter(i => (i.severity || '').toLowerCase() === 'warning').length;
  const infoCount = issues.filter(i => !['critical', 'warning'].includes((i.severity || '').toLowerCase())).length;

  const filtered = filter === 'all' ? issues
    : filter === 'critical' ? issues.filter(i => (i.severity || '').toLowerCase() === 'critical')
    : filter === 'warning' ? issues.filter(i => (i.severity || '').toLowerCase() === 'warning')
    : issues.filter(i => !['critical', 'warning'].includes((i.severity || '').toLowerCase()));

  /* ─── Analyzing state ─── */
  if (isAnalyzing) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
      }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Analyzing with <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{MODEL_NAMES[analyzeModel]}</span>…
        </div>
        {/* Indeterminate bar */}
        <div style={{
          width: '80%', height: 4, borderRadius: 2,
          background: 'var(--surface-high)', position: 'relative', overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            position: 'absolute', height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            boxShadow: '0 0 10px var(--accent-glow)',
            animation: 'indeterminate 1.5s ease-in-out infinite',
          }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Running all 4 models simultaneously
        </div>
      </div>
    );
  }

  /* ─── Empty state ─── */
  if (!issues || issues.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
      }}>
        <Code2
          size={40}
          color="var(--text-muted)"
          style={{
            animation: 'pulse-dot 3s ease-in-out infinite',
          }}
        />
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Ready to analyze
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          Press <Activity size={12} /> Analyze or Ctrl+Shift+A
        </div>
      </div>
    );
  }

  /* ─── Issues list ─── */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Filter pills */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 12px',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {[
          { key: 'all', label: `All ×${issues.length}` },
          { key: 'critical', label: `🔴 ×${criticalCount}` },
          { key: 'warning', label: `🟡 ×${warningCount}` },
          { key: 'info', label: `🔵 ×${infoCount}` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              background: filter === f.key ? 'var(--accent)' : 'var(--surface-high)',
              color: filter === f.key ? '#fff' : 'var(--text-muted)',
              transition: 'all 150ms ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((issue, i) => (
            <IssueCard
              key={issue.id || `${issue.line}-${i}`}
              issue={issue}
              index={i}
              onApplyFix={onApplyFix}
              onShowDiff={onShowDiff}
              onAskAbout={onAskAbout}
              onRevealLine={onRevealLine}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Smart Fix All — sticky */}
      <div style={{
        padding: 12, borderTop: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <button
          onClick={onSmartFixAll}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            position: 'relative', overflow: 'hidden',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Wand2 size={16} />
            Smart Fix All ({issues.length} issues)
          </div>
          {/* Shimmer sweep on hover */}
          <span style={{
            position: 'absolute', top: 0, left: '-100%',
            height: '100%', width: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            transition: 'left 0.6s ease',
          }}
            className="shimmer-sweep"
          />
        </button>
      </div>
    </div>
  );
}

const cardBtnStyle = {
  padding: '4px 10px', fontSize: 11, borderRadius: 4,
  border: '1px solid var(--border)', color: 'var(--text-muted)',
  background: 'transparent', cursor: 'pointer',
  fontFamily: "'Inter', sans-serif", transition: 'all 150ms ease',
};
