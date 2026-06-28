import { useState } from "react";
import { useTheme } from "../../utils/theme";

const TABS = ["TERMINAL", "PROBLEMS", "OUTPUT"];

export default function TerminalPanel({ code, language, analysis, execOutput, execLoading, execError, onExecute }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("TERMINAL");

  const getSeverityColor = (s) =>
    s === "critical"
      ? theme.critical
      : s === "warning"
        ? theme.warning
        : theme.info;

  const issues = analysis?.issues || [];

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: theme.sidebar,
        borderTop: `1px solid ${theme.border}`,
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center select-none"
        style={{
          height: 28,
          borderBottom: `1px solid ${theme.border}`,
          paddingLeft: 12,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 h-full cursor-pointer"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? `1px solid ${theme.accent}`
                  : "1px solid transparent",
                color: isActive ? theme.text : theme.textDim,
                fontSize: 11,
                fontFamily: "Consolas, 'Courier New', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {tab}
              {tab === "PROBLEMS" && issues.length > 0 && (
                <span style={{
                  marginLeft: 4,
                  background: theme.critical,
                  color: '#fff',
                  padding: '0 5px',
                  borderRadius: 8,
                  fontSize: 9,
                }}>{issues.length}</span>
              )}
            </button>
          );
        })}

        {/* Run Button */}
        <button
          onClick={onExecute}
          disabled={execLoading}
          className="ml-auto mr-2 flex items-center gap-1 px-3 rounded cursor-pointer"
          style={{
            background: theme.success + '22',
            border: `1px solid ${theme.success}44`,
            color: theme.success,
            fontSize: 11,
            fontFamily: "Consolas, monospace",
            height: 20,
            opacity: execLoading ? 0.5 : 1,
          }}
        >
          <i className={`codicon ${execLoading ? 'codicon-loading codicon-modifier-spin' : 'codicon-play'}`} style={{ fontSize: 12 }} />
          {execLoading ? 'Running...' : 'Run'}
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-3 py-1.5"
        style={{ fontSize: 12 }}
      >
        {activeTab === "TERMINAL" && (
          <div>
            {!execOutput && !execError && !execLoading && (
              <div style={{ color: theme.textDim, lineHeight: "18px" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  $ Click <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run to execute your code
                </div>
                <div style={{ color: theme.textDim, opacity: 0.6 }}>Using active execution engine</div>
              </div>
            )}

            {execLoading && (
              <div className="flex items-center gap-2" style={{ color: theme.warning }}>
                <i className="codicon codicon-loading codicon-modifier-spin" style={{ fontSize: 14 }} />
                Executing {language} code...
              </div>
            )}

            {execOutput && (
              <div>
                <div style={{ color: theme.success, lineHeight: "18px" }}>
                  $ {language} execution
                </div>
                {execOutput.stdout && (
                  <div style={{ color: theme.text, lineHeight: "18px", whiteSpace: 'pre-wrap' }}>
                    {execOutput.stdout}
                  </div>
                )}
                {execOutput.stderr && (
                  <div style={{ color: theme.critical, lineHeight: "18px", whiteSpace: 'pre-wrap' }}>
                    {execOutput.stderr}
                  </div>
                )}
                <div style={{ color: theme.textDim, lineHeight: "18px", marginTop: 4 }}>
                  [{execOutput.status}] Time: {execOutput.time}s · Memory: {execOutput.memory} KB
                </div>
              </div>
            )}

            {execError && (
              <div style={{ color: theme.critical, lineHeight: "18px" }}>
                ⚠ Execution error: {execError}
              </div>
            )}
          </div>
        )}

        {activeTab === "PROBLEMS" && (
          <div>
            {issues.length === 0 ? (
              <div style={{ color: theme.textDim }}>No problems detected. Run analysis first.</div>
            ) : (
              issues.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2"
                  style={{ lineHeight: "20px" }}
                >
                  <i
                    className={`codicon ${p.severity === "critical" ? "codicon-error" : p.severity === "warning" ? "codicon-warning" : "codicon-info"}`}
                    style={{ fontSize: 12, color: getSeverityColor(p.severity) }}
                  />
                  <span style={{ color: theme.text }}>{p.title || p.description}</span>
                  <span style={{ color: theme.textDim, marginLeft: "auto" }}>
                    Line {p.line}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "OUTPUT" && (
          <div style={{ color: theme.textDim, lineHeight: "18px" }}>
            {analysis ? (
              <div>
                <div>[Refyn] Analysis complete — Score: {analysis.score}/100</div>
                <div>[Refyn] Model: {analysis.usedModel || 'auto'}</div>
                <div>[Refyn] Issues found: {issues.length}</div>
              </div>
            ) : (
              <div>[Refyn] Waiting for analysis...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
