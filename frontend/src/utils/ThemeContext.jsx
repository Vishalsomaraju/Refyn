// Re-export everything from theme.jsx so components can import from either
// "../../utils/theme" or "../../utils/ThemeContext" — both work identically.
export { DARK, LIGHT, ThemeProvider, useTheme } from "./theme";
