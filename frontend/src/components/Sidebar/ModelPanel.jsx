import { useTheme } from "../../utils/theme";

const MODELS = [
  { id: "openrouter", name: "OpenRouter", sub: "Gemma / Qwen / Llama", color: "#8b5cf6", rate: "free", isCloud: true },
  { id: "groq", name: "Llama 3.3 70B", sub: "Groq Cloud", color: "#f55036", rate: "30/m", isCloud: true },
  { id: "mixtral", name: "Mixtral 8x7B", sub: "Groq Cloud", color: "#ff6f00", rate: "30/m", isCloud: true },
  { id: "ollama", name: "Qwen2.5-Coder", sub: "Local (Ollama)", color: "#4ec9b0", rate: "∞", isCloud: false },
];

const MODES = [
  { id: "auto", label: "Auto Select" },
  { id: "manual", label: "Manual" },
  { id: "all", label: "All Together" },
];

export default function ModelPanel({
  modelMode,
  setModelMode,
  selectedModel,
  setSelectedModel,
  offline,
  setOffline,
}) {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full overflow-y-auto min-h-0" style={{ background: theme.sidebar }}>
      {/* Header */}
      <div className="flex items-center px-4 select-none"
        style={{ height: 34, fontSize: 11, color: theme.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>
        AI Models
      </div>

      {/* Mode selector */}
      <div className="flex flex-col gap-1 px-3 pb-2">
        {MODES.map((mode) => (
          <label key={mode.id} className="flex flex-col gap-1 cursor-pointer py-0.5" style={{ fontSize: 12, color: theme.text }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full"
                style={{ width: 14, height: 14, border: `1.5px solid ${modelMode === mode.id ? theme.accent : theme.textDim}` }}>
                {modelMode === mode.id && <div className="rounded-full" style={{ width: 8, height: 8, background: theme.accent }} />}
              </div>
              <span>{mode.label}</span>
            </div>
            {/* Show all 4 dots under All Together mode */}
            {mode.id === 'all' && modelMode === 'all' && (
               <div className="flex items-center gap-1.5 ml-6 mt-1">
                 {MODELS.map(m => (
                    <div key={m.id} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: (offline && m.isCloud) ? theme.border : m.color
                    }} />
                 ))}
                 <span style={{ fontSize: 10, color: theme.textDim }}>Parallel Analysis</span>
               </div>
            )}
            
          </label>
        ))}
      </div>

      <div style={{ height: 1, background: theme.border, margin: "0 12px" }} />

      {/* Model cards */}
      <div className="flex flex-col gap-1.5 px-3 py-3">
        {MODELS.map((model) => {
          const isSelected = selectedModel === model.id && modelMode === 'manual';
          const isGreyedOut = offline && model.isCloud;
          
          return (
            <button
              key={model.id}
              onClick={() => {
                if (!isGreyedOut) {
                   setSelectedModel(model.id);
                   setModelMode("manual");
                }
              }}
              disabled={isGreyedOut}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left"
              style={{
                background: isSelected ? theme.activeBg : "transparent",
                border: isSelected ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                fontFamily: "Consolas, 'Courier New', monospace",
                cursor: isGreyedOut ? "not-allowed" : "pointer",
                opacity: isGreyedOut ? 0.5 : 1
              }}
            >
              <div className="rounded flex-shrink-0" style={{ width: 10, height: 10, background: isGreyedOut ? theme.textDim : model.color }} />
              <div className="flex flex-col min-w-0">
                <span style={{ fontSize: 12, color: isGreyedOut ? theme.textDim : theme.text, fontWeight: 500 }}>{model.name}</span>
                <span style={{ fontSize: 10, color: theme.textDim }}>{model.sub}</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <span style={{ fontSize: 9, color: theme.textDim }}>{model.rate}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Offline toggle */}
      <div className="flex items-center justify-between px-3 py-3 border-t" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2">
          <i className="codicon codicon-globe" style={{ fontSize: 14, color: theme.textMuted }} />
          <span style={{ fontSize: 12, color: theme.text }}>Offline Mode</span>
        </div>
        <button
          onClick={() => {
             const newOffline = !offline;
             setOffline(newOffline);
             if (newOffline && MODELS.find(m => m.id === selectedModel)?.isCloud) {
                // Auto switch to local if cloud was selected
                setSelectedModel('ollama');
             }
          }}
          className="relative cursor-pointer"
          style={{ width: 34, height: 18, borderRadius: 9, background: offline ? theme.success : theme.inputBg, border: "none", transition: "background 0.2s" }}
        >
          <div className="absolute rounded-full"
            style={{ width: 14, height: 14, top: 2, left: offline ? 18 : 2, background: "#fff", transition: "left 0.2s" }} />
        </button>
      </div>
    </div>
  );
}
