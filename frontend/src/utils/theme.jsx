import { useState, useCallback, createContext, useContext } from "react";

export const DARK = {
  bg: "#07070a", // deep background
  sidebar: "#0a0a0f", // slightly elevated
  activityBar: "#050508", // lowest elevation
  tabBar: "#0a0a0f",
  tabActive: "#1a1a24",
  tabInactive: "#0a0a0f",
  panelHeader: "#111118",
  statusBar: "#6366f1",
  statusBarOffline: "#22c55e",
  border: "#2a2a3a",
  text: "#f1f1f5",
  textMuted: "#a0a0b0",
  textDim: "#505060",
  textBright: "#ffffff",
  accent: "#6366f1", // indigo
  inputBg: "#111118",
  inputBorder: "#2a2a3a",
  hoverBg: "rgba(255, 255, 255, 0.04)",
  activeBg: "rgba(255, 255, 255, 0.08)",
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  success: "#22c55e",
  keyword: "#c678dd",
  string: "#98c379",
  comment: "#5c6370",
  fn: "#61afef",
  monacoTheme: "vs-dark",
};

export const LIGHT = {
  bg: "#ffffff",
  sidebar: "#f3f3f3",
  activityBar: "#2c2c2c",
  tabBar: "#ececec",
  tabActive: "#ffffff",
  tabInactive: "#ececec",
  panelHeader: "#f3f3f3",
  statusBar: "#007acc",
  statusBarOffline: "#16825d",
  border: "#e0e0e0",
  text: "#1f1f1f",
  textMuted: "#717171",
  textDim: "#999999",
  textBright: "#0f0f0f",
  accent: "#005fb8",
  inputBg: "#ffffff",
  inputBorder: "#cecece",
  hoverBg: "#e8e8e8",
  activeBg: "#d6d6d6",
  critical: "#c72e0f",
  warning: "#9b6a00",
  info: "#005fb8",
  success: "#1e7e6a",
  keyword: "#0000ff",
  string: "#a31515",
  comment: "#008000",
  fn: "#795e26",
  monacoTheme: "vs",
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DARK : LIGHT;
  const toggleTheme = useCallback(() => setIsDark((prev) => !prev), []);

  return (
    <ThemeContext.Provider value={{ theme, T: theme, isDark, toggleTheme, toggle: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
