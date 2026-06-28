import { useTheme } from "../../utils/theme";

const FILES = [
  {
    name: "find_user.py",
    icon: "codicon-symbol-misc",
    iconColor: "#4584b6",
    active: true,
  },
  {
    name: "main.js",
    icon: "codicon-symbol-misc",
    iconColor: "#f0db4f",
    active: false,
  },
  {
    name: "algo.java",
    icon: "codicon-symbol-misc",
    iconColor: "#e76f00",
    active: false,
  },
  {
    name: "utils.go",
    icon: "codicon-symbol-misc",
    iconColor: "#00add8",
    active: false,
  },
];

export default function FileExplorer() {
  const { theme } = useTheme();

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: theme.sidebar }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 select-none"
        style={{
          height: 34,
          fontSize: 11,
          color: theme.textMuted,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <span>Explorer</span>
        <i
          className="codicon codicon-ellipsis"
          style={{ fontSize: 14, cursor: "pointer" }}
        />
      </div>

      {/* Section header */}
      <div
        className="flex items-center gap-1 px-2 select-none cursor-pointer"
        style={{
          height: 22,
          fontSize: 11,
          color: theme.textBright,
          fontWeight: 600,
          background: theme.panelHeader,
        }}
      >
        <i className="codicon codicon-chevron-down" style={{ fontSize: 12 }} />
        <span>REFYN</span>
      </div>

      {/* File list */}
      <div className="flex flex-col py-0.5">
        {FILES.map((file) => (
          <div
            key={file.name}
            className="flex items-center gap-1.5 px-4 py-0.5 cursor-pointer select-none"
            style={{
              fontSize: 13,
              color: file.active ? theme.text : theme.textMuted,
              background: file.active ? theme.activeBg : "transparent",
              borderLeft: file.active
                ? `2px solid ${theme.accent}`
                : "2px solid transparent",
            }}
          >
            <i
              className={`codicon ${file.icon}`}
              style={{ fontSize: 14, color: file.iconColor }}
            />
            <span>{file.name}</span>
            {file.active && (
              <span
                className="ml-auto rounded px-1"
                style={{
                  fontSize: 10,
                  background: theme.inputBg,
                  color: theme.textMuted,
                }}
              >
                auto
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
