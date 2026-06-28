import { useTheme } from "../../utils/theme";

const TABS = [
  { id: "files", icon: "codicon-files" },
  { id: "models", icon: "codicon-server" },
  { id: "chat", icon: "codicon-comment-discussion" },
];

export default function ActivityBar({ activeSideTab, setActiveSideTab }) {
  const { theme } = useTheme();

  return (
    <div
      className="flex flex-col items-center pt-1"
      style={{
        width: 48,
        background: theme.activityBar,
        borderRight: `1px solid ${theme.border}`,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeSideTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveSideTab(tab.id)}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 48,
              height: 48,
              background: "transparent",
              border: "none",
              borderLeft: isActive
                ? `2px solid ${theme.accent}`
                : "2px solid transparent",
              color: isActive ? theme.text : theme.textDim,
            }}
            title={tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
          >
            <i className={`codicon ${tab.icon}`} style={{ fontSize: 22 }} />
          </button>
        );
      })}
    </div>
  );
}
