import { useMemo } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Props:
// isOpen: boolean
// onClose: () => void
// onApply: () => void
// beforeCode: string
// afterCode: string
// language: string
// isDark: boolean
// fixTitle: string

function countChanges(before, after) {
  const bLines = (before || '').split('\n');
  const aLines = (after || '').split('\n');
  const removed = bLines.filter(l => !aLines.includes(l)).length;
  const added = aLines.filter(l => !bLines.includes(l)).length;
  return { removed, added };
}

export default function DiffViewer({ isOpen, onClose, onApply, beforeCode, afterCode, language, isDark, fixTitle }) {
  const { removed, added } = useMemo(
    () => countChanges(beforeCode, afterCode),
    [beforeCode, afterCode]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
              zIndex: 500
            }}
          />

          {/* panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: Math.min(typeof window !== 'undefined' ? window.innerWidth - 48 : 900, 900),
              maxHeight: '82vh',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, overflow: 'hidden', zIndex: 501,
              display: 'flex', flexDirection: 'column'
            }}
          >
            {/* header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0
            }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Code Diff</span>
                {fixTitle && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>· {fixTitle}</span>
                )}
              </div>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={16} />
              </button>
            </div>

            {/* Monaco diff editor */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {beforeCode !== undefined && afterCode !== undefined && (beforeCode || afterCode) ? (
                <DiffEditor
                  original={beforeCode || ''}
                  modified={afterCode || ''}
                  language={language || 'python'}
                  theme={isDark ? 'vs-dark' : 'vs'}
                  options={{
                    readOnly: true,
                    renderSideBySide: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineNumbers: 'on',
                    renderOverviewRuler: false,
                    overviewRulerLanes: 0,
                    folding: false,
                    wordWrap: 'on',
                  }}
                  height="360px"
                />
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No diff data available for this issue.
                </div>
              )}
            </div>

            {/* stats + footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0
            }}>
              {/* change stats */}
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {removed + added > 0 ? (
                  <>
                    {removed + added} line{removed + added !== 1 ? 's' : ''} changed &nbsp;·&nbsp;
                    <span style={{ color: 'var(--error)' }}>{removed} removed</span>
                    &nbsp;·&nbsp;
                    <span style={{ color: 'var(--success)' }}>{added} added</span>
                  </>
                ) : (
                  'Viewing diff'
                )}
              </span>

              {/* action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '7px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
                    transition: 'all 150ms', fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onApply?.(); onClose(); }}
                  disabled={!beforeCode && !afterCode}
                  style={{
                    padding: '7px 18px', fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                    background: beforeCode || afterCode ? 'var(--accent)' : 'var(--surface-high)',
                    color: beforeCode || afterCode ? 'white' : 'var(--text-muted)',
                    border: 'none', transition: 'all 150ms', fontFamily: "'Inter', sans-serif",
                  }}
                >
                  ✓ Apply This Fix
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
