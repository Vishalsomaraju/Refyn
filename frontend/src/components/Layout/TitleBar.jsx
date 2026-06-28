import { useTheme } from "../../utils/theme";

export default function TitleBar() {
  const { theme, isDark, toggleTheme } = useTheme();

  const menuItems = ["File", "Edit", "Selection", "View", "Run"];

  return (
    <div
      className="flex items-center justify-between select-none"
      style={{
        height: 30,
        background: theme.activityBar,
        borderBottom: `1px solid ${theme.border}`,
        fontSize: 12,
        color: theme.text,
      }}
    >
      {/* Left: logo + menu */}
      <div className="flex items-center gap-3 pl-3">
        <div className="flex items-center gap-1.5">
          <span style={{ color: theme.accent, fontSize: 14, fontWeight: 700 }}>
            ⬡
          </span>
          <span style={{ fontWeight: 600, color: theme.textBright }}>
            Refyn
          </span>
        </div>
        {menuItems.map((item) => (
          <span
            key={item}
            className="cursor-pointer px-1.5 py-0.5 rounded"
            style={{ color: theme.textMuted }}
            onMouseEnter={(e) => (e.target.style.background = theme.activeBg)}
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
          >
            {item}
          </span>
        ))}
      </div>

      {/* Center: search */}
      <div
        className="flex items-center gap-1.5 rounded px-2"
        style={{
          background: theme.inputBg,
          height: 20,
          width: 240,
          color: theme.textMuted,
          fontSize: 11,
        }}
      >
        <i className="codicon codicon-search" style={{ fontSize: 12 }} />
        <span>Refyn</span>
      </div>

      {/* Right: theme toggle */}
      <div className="pr-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer"
          style={{
            background: theme.inputBg,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            fontFamily: "'Consolas', 'Courier New', monospace",
          }}
        >
          <i
            className={`codicon ${isDark ? "codicon-sun-large" : "codicon-moon"}`}
            style={{ fontSize: 12 }}
          />
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}
