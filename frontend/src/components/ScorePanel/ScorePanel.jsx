import { useTheme } from "../../utils/theme";
import { useEffect, useState } from "react";

function ScoreBar({ label, value, theme }) {
  const getColor = (v) =>
    v < 40 ? theme.critical : v < 70 ? theme.warning : theme.success;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between" style={{ fontSize: 11 }}>
        <span style={{ color: theme.textMuted }}>{label}</span>
        <span style={{ color: theme.text }}>{value}</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 4, background: theme.inputBg }}>
        <div
          className="rounded-full"
          style={{ height: 4, width: `${value}%`, background: getColor(value), transition: "width 0.5s ease" }}
        />
      </div>
    </div>
  );
}

// Custom hook to animate score number counting up
function useAnimatedScore(targetScore) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (targetScore === undefined || targetScore === null) {
      setScore(0);
      return;
    }
    
    let start = 0;
    const duration = 500; // ms
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setScore(Math.floor(easeProgress * targetScore));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetScore]);

  return score;
}

export default function ScorePanel({ analysis, offline }) {
  const { theme } = useTheme();

  const targetScore = analysis?.score || 0;
  const animatedScore = useAnimatedScore(targetScore);

  if (!analysis) {
    return (
      <div className="flex flex-col h-full overflow-y-auto items-center justify-center p-4 text-center" 
           style={{ background: theme.sidebar, borderLeft: `1px solid ${theme.border}` }}>
         <i className="codicon codicon-dashboard mb-2" style={{ fontSize: 32, color: theme.textDim }} />
         <span style={{ fontSize: 13, color: theme.textDim }}>Run analysis to see score</span>
      </div>
    );
  }

  const scores = analysis.scores || { bugs: 0, security: 0, performance: 0, quality: 0 };
  
  // Count issues by severity
  const issues = (analysis.issues || []).reduce((acc, issue) => {
    const sev = issue.severity?.toLowerCase() || 'info';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, { critical: 0, warning: 0, info: 0 });

  const getScoreColor = (s) =>
    s < 40 ? theme.critical : s < 70 ? theme.warning : theme.success;

  const MODELS_AGREEMENT = [
    { name: "OpenRouter", pct: 85, color: "#8b5cf6", isCloud: true },
    { name: "Groq", pct: 72, color: "#f55036", isCloud: true },
    { name: "Local", pct: 68, color: "#4ec9b0", isCloud: false },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto"
      style={{ background: theme.sidebar, borderLeft: `1px solid ${theme.border}` }}>
      
      {/* Header */}
      <div className="flex items-center px-3 select-none"
        style={{ height: 34, fontSize: 11, color: theme.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>
        Analysis Output
      </div>

      {/* Score */}
      <div className="flex flex-col items-center py-3 px-3">
        <div style={{ fontSize: 48, fontWeight: 700, color: getScoreColor(targetScore), lineHeight: 1 }}>
          {animatedScore}
        </div>
        <span style={{ fontSize: 11, color: theme.textDim, marginTop: 2 }}>
          out of 100
        </span>
        {/* Gradient bar */}
        <div className="w-full rounded-full overflow-hidden mt-2" style={{ height: 6, background: theme.inputBg }}>
          <div className="rounded-full"
            style={{
              height: 6,
              width: `${targetScore}%`,
              background: `linear-gradient(90deg, ${theme.critical}, ${theme.warning}, ${theme.success})`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      <div style={{ height: 1, background: theme.border, margin: "0 12px" }} />

      {/* Sub-scores */}
      <div className="flex flex-col gap-2 px-3 py-2">
        <ScoreBar label="Bugs" value={scores.bugs} theme={theme} />
        <ScoreBar label="Security" value={scores.security} theme={theme} />
        <ScoreBar label="Performance" value={scores.performance} theme={theme} />
        <ScoreBar label="Quality" value={scores.quality} theme={theme} />
      </div>

      <div style={{ height: 1, background: theme.border, margin: "0 12px" }} />

      {/* Issue counts */}
      <div className="flex flex-col gap-1 px-3 py-2">
        <span style={{ fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
          Issues Found
        </span>
        <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
          <div className="flex flex-col items-center flex-1 rounded py-1" style={{ background: theme.critical + "22", border: `1px solid ${theme.critical}44` }}>
            <span style={{ color: theme.critical, fontSize: 14, fontWeight: 'bold' }}>{issues.critical}</span>
            <span style={{ color: theme.critical, fontSize: 10 }}>Critical</span>
          </div>
          <div className="flex flex-col items-center flex-1 rounded py-1" style={{ background: theme.warning + "22", border: `1px solid ${theme.warning}44` }}>
            <span style={{ color: theme.warning, fontSize: 14, fontWeight: 'bold' }}>{issues.warning}</span>
            <span style={{ color: theme.warning, fontSize: 10 }}>Warning</span>
          </div>
          <div className="flex flex-col items-center flex-1 rounded py-1" style={{ background: theme.info + "22", border: `1px solid ${theme.info}44` }}>
            <span style={{ color: theme.info, fontSize: 14, fontWeight: 'bold' }}>{issues.info}</span>
            <span style={{ color: theme.info, fontSize: 10 }}>Info</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: theme.border, margin: "0 12px" }} />

      {/* Model agreement */}
      <div className="flex flex-col gap-1.5 px-3 py-2">
        <span style={{ fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Model Agreement
        </span>
        {MODELS_AGREEMENT.map((m) => {
          const isGreyedOut = offline && m.isCloud;
          return (
             <div key={m.name} className="flex items-center gap-2" style={{ opacity: isGreyedOut ? 0.3 : 1 }}>
               <span style={{ fontSize: 11, color: theme.textMuted, width: 50 }}>{m.name}</span>
               <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: theme.inputBg }}>
                 <div className="rounded-full"
                   style={{
                     height: 4,
                     width: isGreyedOut ? 0 : `${m.pct}%`,
                     background: m.color,
                     transition: "width 0.5s ease",
                   }}
                 />
               </div>
               <span style={{ fontSize: 10, color: theme.textDim, width: 24 }}>
                 {isGreyedOut ? '--' : `${m.pct}%`}
               </span>
             </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: theme.border, margin: "0 12px" }} />

      {/* Quick actions */}
      <div className="flex flex-col gap-1 px-3 py-2 pb-4">
        <span style={{ fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
          Quick Actions
        </span>
        {[
          { icon: "codicon-copy", label: "Copy Optimized" },
          { icon: "codicon-export", label: "Export Report" },
          { icon: "codicon-link-external", label: "Share" },
        ].map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer"
            style={{
              background: "transparent",
              border: "none",
              color: theme.textMuted,
              fontSize: 12,
              fontFamily: "Consolas, 'Courier New', monospace",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.activeBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <i className={`codicon ${action.icon}`} style={{ fontSize: 14 }} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
