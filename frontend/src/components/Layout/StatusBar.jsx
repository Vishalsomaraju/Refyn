import { useTheme } from "../../utils/theme";

export default function StatusBar({ offline, language, analysis, loading, usedModel, onAnalyze }) {
  const { theme } = useTheme();

  const issues = (analysis?.issues || []).reduce((acc, issue) => {
    const sev = issue.severity?.toLowerCase() || 'info';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, { critical: 0, warning: 0, info: 0 });

  const displayModel = usedModel 
    ? (usedModel.toLowerCase().includes('qwen') ? 'Qwen2.5 (Offline)' : usedModel)
    : (offline ? "Ollama (Offline)" : "Auto");

  return (
    <div
      className="flex items-center justify-between select-none px-2"
      style={{
        height: 22,
        background: offline ? theme.statusBarOffline : theme.statusBar,
        color: "#ffffff",
        fontSize: 11,
      }}
    >
      {/* Left items */}
      <div className="flex items-center gap-3">
        <span style={{ fontWeight: 600 }}>⬡ Refyn</span>
        
        <span className="flex items-center gap-1">
          <i className="codicon codicon-server" style={{ fontSize: 12 }} />
          {displayModel}
        </span>
        
        <span className="flex items-center gap-1">
          <i className="codicon codicon-symbol-misc" style={{ fontSize: 12 }} />
          {language ? (language.charAt(0).toUpperCase() + language.slice(1)) : 'Unknown'}
        </span>
        
        {analysis && (
          <span className="flex items-center gap-1">
            <i className="codicon codicon-error" style={{ fontSize: 12 }} />
            {issues.critical}
            <i className="codicon codicon-warning" style={{ fontSize: 12, marginLeft: 4 }} />
            {issues.warning}
          </span>
        )}
      </div>

      {/* Right items */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1 rounded px-2 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#ffffff",
            fontSize: 11,
            height: 18,
            fontFamily: "Consolas, 'Courier New', monospace",
          }}
        >
          <i className="codicon codicon-play" style={{ fontSize: 12 }} />
          Run
        </button>
        
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-1 rounded px-2 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.25)",
            border: "none",
            color: "#ffffff",
            fontSize: 11,
            height: 18,
            fontFamily: "Consolas, 'Courier New', monospace",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
             <i className="codicon codicon-loading codicon-modifier-spin" style={{ fontSize: 12 }} />
          ) : (
             <i className="codicon codicon-beaker" style={{ fontSize: 12 }} />
          )}
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}
