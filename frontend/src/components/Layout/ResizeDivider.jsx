import { useTheme } from "../../utils/theme";

export default function ResizeDivider({ onMouseDown, vertical = true }) {
  const { theme } = useTheme();

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: vertical ? 4 : "100%",
        height: vertical ? "100%" : 4,
        cursor: vertical ? "col-resize" : "row-resize",
        background: "transparent",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = theme.accent + "55")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    />
  );
}
