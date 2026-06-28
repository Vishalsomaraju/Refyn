import { useState, useCallback, useEffect } from "react";
import { useTheme } from "./utils/theme";
import { usePanelResize } from "./hooks/usePanelResize";
import { detectLanguage } from "./utils/languageDetect";
import { SAMPLES } from "./utils/samples";
import { useAnalysis } from "./hooks/useAnalysis";
import { useSmartFix } from './hooks/useSmartFix';
import { useChat } from './hooks/useChat';
import { useExecute } from './hooks/useExecute';
import TitleBar from "./components/Layout/TitleBar";
import TabBar from "./components/Layout/TabBar";
import ActivityBar from "./components/Layout/ActivityBar";
import StatusBar from "./components/Layout/StatusBar";
import ResizeDivider from "./components/Layout/ResizeDivider";
import FileExplorer from "./components/Sidebar/FileExplorer";
import ModelPanel from "./components/Sidebar/ModelPanel";
import ChatPanel from "./components/Chat/ChatPanel";
import CodeEditor from "./components/Editor/CodeEditor";
import ScorePanel from "./components/ScorePanel/ScorePanel";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import IssueList from "./components/Results/IssueList";
import ComparePanel from "./components/Modes/ComparePanel";
import LearnPanel from "./components/Modes/LearnPanel";
import InterviewPanel from "./components/Modes/InterviewPanel";

export default function App() {
  const { theme } = useTheme();

  const [activeMode, setActiveMode] = useState("Review");
  const [activeSideTab, setActiveSideTab] = useState("files");
  const [modelMode, setModelMode] = useState("auto");
  const [selectedModel, setSelectedModel] = useState("openrouter");
  const [offline, setOffline] = useState(false);

  /* ─── Code state ─── */
  const [selectedSample, setSelectedSample] = useState("python");
  const [code, setCode] = useState(SAMPLES.python.code);
  const [detectedLanguage, setDetectedLanguage] = useState(
    detectLanguage(SAMPLES.python.code)
  );

  /* ─── AI Analysis Hook ─── */
  const { analyze, reset, analysis, loading, error, usedModel } = useAnalysis();
  const { getSmartFix, loading: fixing } = useSmartFix();
  const { messages, loading: chatLoading, sendMessage, clearChat } = useChat();
  const { output: execOutput, loading: execLoading, error: execError, execute, clearOutput } = useExecute();

  /* ─── Panel sizes ─── */
  const sidebar = usePanelResize(210, 150, 350);
  const results = usePanelResize(320, 220, 500);
  const scorePanel = usePanelResize(220, 180, 320);
  const terminal = usePanelResize(130, 80, 280);

  /* ─── Page Intro ─── */
  useEffect(() => {
    document.body.classList.remove("page-exit");
    document.body.classList.add("page-enter");
    const t = setTimeout(() => document.body.classList.remove("page-enter"), 300);
    return () => clearTimeout(t);
  }, []);

  /* ─── Handlers ─── */
  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    setDetectedLanguage(detectLanguage(newCode));
    // Optionally reset analysis when code changes significantly, but for now we keep it
  }, []);

  const handleSampleSwitch = useCallback((key) => {
    const sample = SAMPLES[key];
    if (!sample) return;
    setSelectedSample(key);
    setCode(sample.code);
    setDetectedLanguage(detectLanguage(sample.code));
    reset(); // Clear old analysis when switching files
  }, [reset]);

  const handleApplyFix = async (issue) => {
    if (!issue.fix) return;
    const result = await getSmartFix(code, detectedLanguage.language, issue, offline, selectedModel);
    if (result && result.fixes && result.fixes.length > 0) {
      let newCode = code;
      result.fixes.forEach(f => {
        if (newCode.includes(f.before)) {
          newCode = newCode.replace(f.before, f.after);
        }
      });
      if (newCode !== code) {
        setCode(newCode);
        setTimeout(() => {
          analyze(newCode, detectedLanguage.language, { modelMode, selectedModel, offline });
        }, 100);
      }
    }
  };

  const handleAnalyzeClick = useCallback(() => {
    analyze(code, detectedLanguage.language, {
      modelMode,
      selectedModel,
      offline
    });
  }, [analyze, code, detectedLanguage.language, modelMode, selectedModel, offline]);

  /* ─── Editor Highlights ─── */
  const highlightedLines = analysis?.issues?.map(issue => ({
    line: issue.line,
    severity: issue.severity?.toLowerCase() || 'info'
  })) || [];

  const sampleKeys = Object.keys(SAMPLES);

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Consolas', 'Courier New', monospace",
      }}
    >
      <TitleBar />
      <TabBar activeMode={activeMode} setActiveMode={setActiveMode} filename={SAMPLES[selectedSample]?.name || "untitled"} />

      <div className="flex flex-1 min-h-0">
        <ActivityBar activeSideTab={activeSideTab} setActiveSideTab={setActiveSideTab} />

        {/* Sidebar */}
        <div className="overflow-hidden" style={{ width: sidebar.width, flexShrink: 0 }}>
          {activeSideTab === "files" ? (
            <FileExplorer />
          ) : activeSideTab === "models" ? (
            <ModelPanel
              modelMode={modelMode}
              setModelMode={setModelMode}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              offline={offline}
              setOffline={setOffline}
            />
          ) : (
            <ChatPanel
              code={code}
              language={detectedLanguage.language}
              analysis={analysis}
              offline={offline}
              messages={messages}
              loading={chatLoading}
              onSendMessage={(text) => sendMessage(text, code, detectedLanguage.language, analysis, offline)}
            />
          )}
        </div>

        <ResizeDivider onMouseDown={sidebar.onMouseDown} />

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: theme.bg }}>
          {/* Sample switcher */}
          <div className="flex items-center gap-1 px-2 flex-shrink-0"
            style={{ height: 30, background: theme.tabBar, borderBottom: `1px solid ${theme.border}` }}>
            {sampleKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleSampleSwitch(key)}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 3,
                  border: `1px solid ${selectedSample === key ? theme.accent : theme.border}`,
                  background: selectedSample === key ? theme.accent + "22" : "transparent",
                  color: selectedSample === key ? theme.accent : theme.textMuted,
                  cursor: "pointer",
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  transition: "all 0.15s ease",
                }}
              >
                {SAMPLES[key].name}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            <CodeEditor
              code={code}
              language={detectedLanguage.language}
              onChange={handleCodeChange}
              highlightedLines={highlightedLines}
              filename={SAMPLES[selectedSample]?.name || "untitled"}
            />
          </div>
        </div>

        <ResizeDivider onMouseDown={results.onMouseDown} />

        {/* Results area */}
        <div className="flex flex-col overflow-hidden"
          style={{ width: results.width, flexShrink: 0, background: theme.sidebar }}>
          {activeMode === "Review" && (
            <IssueList 
               analysis={analysis} 
               loading={loading} 
               usedModel={usedModel} 
               onApplyFix={handleApplyFix}
            />
          )}
          {activeMode === "Compare" && (
            <ComparePanel analysis={analysis} code={code} />
          )}
          {activeMode === "Learn" && (
            <LearnPanel analysis={analysis} />
          )}
          {activeMode === "Interview" && (
            <InterviewPanel analysis={analysis} />
          )}
        </div>

        <ResizeDivider onMouseDown={scorePanel.onMouseDown} />

        {/* Score Panel */}
        <div style={{ width: scorePanel.width, flexShrink: 0 }}>
          <ScorePanel analysis={analysis} offline={offline} />
        </div>
      </div>

      <ResizeDivider onMouseDown={terminal.onMouseDown} vertical={false} />

      {/* Terminal Panel */}
      <div style={{ height: terminal.width, flexShrink: 0 }}>
        <TerminalPanel
          code={code}
          language={detectedLanguage.language}
          analysis={analysis}
          execOutput={execOutput}
          execLoading={execLoading}
          execError={execError}
          onExecute={() => execute(code, detectedLanguage.language)}
        />
      </div>

      {/* Status Bar */}
      <StatusBar
        offline={offline}
        language={detectedLanguage.language}
        analysis={analysis}
        loading={loading}
        usedModel={usedModel}
        onAnalyze={handleAnalyzeClick}
      />
    </div>
  );
}
