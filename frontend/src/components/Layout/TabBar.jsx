import { useTheme } from "../../utils/theme";

const MODES = [
  { id: "Review", icon: "codicon-checklist" },
  { id: "Compare", icon: "codicon-diff" },
  { id: "Learn", icon: "codicon-book" },
  { id: "Interview", icon: "codicon-mortar-board" },
];

export default function TabBar({ activeMode, setActiveMode, filename }) {
  const { theme } = useTheme();

  return (
    <div
      className="flex items-center justify-between select-none"
      style={{
        height: 36,
        background: theme.tabBar,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      {/* Left: file tab */}
      <div className="flex items-center h-full">
        <div
          className="flex items-center gap-1.5 px-3 h-full"
          style={{
            background: theme.tabActive,
            borderBottom: `2px solid ${theme.accent}`,
            fontSize: 12,
            color: theme.text,
          }}
        >
          <i
            className="codicon codicon-symbol-misc"
            style={{ color: "#4584b6", fontSize: 13 }}
          />
          <span>{filename || "untitled"}</span>
          <i
            className="codicon codicon-close"
            style={{ fontSize: 12, color: theme.textDim, marginLeft: 4 }}
          />
        </div>
      </div>

      {/* Right: mode tabs */}
      <div className="flex items-center h-full pr-2">
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className="flex items-center gap-1.5 px-3 h-full cursor-pointer"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? `2px solid ${theme.accent}`
                  : "2px solid transparent",
                color: isActive ? theme.textBright : theme.textDim,
                fontSize: 12,
                fontFamily: "Consolas, 'Courier New', monospace",
              }}
            >
              <i className={`codicon ${mode.icon}`} style={{ fontSize: 12 }} />
              {mode.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}

