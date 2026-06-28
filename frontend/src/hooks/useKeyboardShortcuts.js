import { useEffect } from 'react';

export function useKeyboardShortcuts({ onRun, onAnalyze, onChat, onExport, onEscape }) {
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'Enter')            { e.preventDefault(); onRun?.(); }
      if (ctrl && e.shiftKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); onAnalyze?.(); }
      if (ctrl && e.key === 'k')                { e.preventDefault(); onChat?.(); }
      if (ctrl && e.key === 's')                { e.preventDefault(); onExport?.(); }
      if (e.key === 'Escape')                   { onEscape?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRun, onAnalyze, onChat, onExport, onEscape]);
}
