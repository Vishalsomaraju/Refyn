import { useState, useEffect, memo } from 'react';

const ScorePanel = memo(function ScorePanel({ score, breakdown, onExport, onShare }) {
  /* ─── Count-up animation ─── */
  const [displayed, setDisplayed] = useState(0);
  const [countDone, setCountDone] = useState(false);

  useEffect(() => {
    if (score == null) { setDisplayed(0); setCountDone(false); return; }
    const duration = 800;
    const start = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplayed(Math.round(easeOut(t) * score));
      if (t < 1) requestAnimationFrame(tick);
      else setCountDone(true);
    };
    requestAnimationFrame(tick);
  }, [score]);

  /* ─── Score ring ─── */
  const circumference = 314.16; // 2π·50
  const offset = (score === null || score === undefined)
    ? circumference
    : circumference - (score / 100) * circumference;
  const ringColor = (score === null || score === undefined) ? 'var(--border)'
    : score >= 86 ? '#6366f1'
    : score >= 66 ? '#22c55e'
    : score >= 41 ? '#f59e0b'
    : '#ef4444';

  const label = (score === null || score === undefined) ? '—'
    : score >= 86 ? 'Excellent'
    : score >= 66 ? 'Good'
    : score >= 41 ? 'Fair'
    : 'Needs Work';

  /* ─── Sub-score categories ─── */
  const defaultBreakdown = breakdown || {};
  const categories = Object.entries(defaultBreakdown);

  return (
    <div style={{
      padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 12,
    }}>
      {/* SVG Score Ring */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 120 120" width={120} height={120}>
          {/* Track */}
          <circle cx={60} cy={60} r={50} fill="none" stroke="var(--border)" strokeWidth={8} />
          {/* Progress */}
          <circle
            cx={60} cy={60} r={50} fill="none"
            stroke={ringColor} strokeWidth={8} strokeLinecap="round"
            transform="rotate(-90 60 60)"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1000ms ease-out, stroke 500ms ease' }}
          />
        </svg>
        {/* Score number overlay */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 28, fontWeight: 700, color: 'var(--text)',
            fontFamily: "'Inter', sans-serif",
            animation: score != null ? 'scoreIn 0.5s ease forwards' : 'none',
          }}>
            {score != null ? displayed : '—'}
          </div>
        </div>
      </div>

      {/* Score label */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: ringColor,
        letterSpacing: '0.02em',
      }}>
        {label}
      </div>

      {/* Sub-score bars */}
      {categories.length > 0 && (
        <div style={{ width: '100%', padding: '0 4px' }}>
          {categories.map(([key, value], i) => {
            const barColor = value >= 66 ? '#22c55e' : value >= 41 ? '#f59e0b' : '#ef4444';
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4,
                }}>
                  <span style={{ textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
                </div>
                <div style={{
                  height: 4, borderRadius: 2, background: 'var(--surface-high)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: barColor,
                    width: countDone ? `${(value / 100) * 100}%` : '0%',
                    transition: 'width 400ms ease-out',
                    transitionDelay: `${i * 100}ms`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export / Share buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        <button
          onClick={onExport}
          style={ghostBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          ↓ Export Report
        </button>
        <button
          onClick={onShare}
          style={ghostBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          ↗ Share
        </button>
      </div>
    </div>
  );
});

const ghostBtnStyle = {
  width: '100%', padding: '8px 0', borderRadius: 6,
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
  transition: 'all 150ms ease',
};

export default ScorePanel;
