import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../utils/ThemeContext';
import { detectLanguage } from '../../utils/languageDetect';

export default function CodeEditor({ code, language, onChange, highlightedLines = [], filename }) {
  const { T } = useTheme();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const detected = detectLanguage(code);
  const displayLang = language || detected.language;
  const confidence = detected.confidence;

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyDecorations(editor, monaco, highlightedLines);
  }, [highlightedLines]);

  /* Update decorations whenever highlightedLines changes */
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (editor && monaco) {
      applyDecorations(editor, monaco, highlightedLines);
    }
  }, [highlightedLines]);

  function applyDecorations(editor, monaco, lines) {
    if (!lines || lines.length === 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const newDecorations = lines.map(({ line, severity }) => {
      const isCritical = severity === 'critical';
      return {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: isCritical ? 'line-highlight-critical' : 'line-highlight-warning',
          glyphMarginClassName: isCritical ? 'glyph-critical' : 'glyph-warning',
          glyphMarginHoverMessage: {
            value: isCritical ? '⛔ Critical issue on this line' : '⚠ Warning on this line',
          },
        },
      };
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }

  const monacoLangMap = {
    python: 'python',
    javascript: 'javascript',
    typescript: 'typescript',
    java: 'java',
    cpp: 'cpp',
    go: 'go',
    rust: 'rust',
    php: 'php',
  };

  return (
    <div className="flex flex-col h-full" style={{ background: T.bg }}>
      {/* Breadcrumb bar */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{
          height: 28,
          background: T.tabBar,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <span
          className="flex items-center gap-1"
          style={{
            fontSize: 12,
            color: T.textBright,
            background: T.activeBg,
            padding: '2px 8px',
            borderRadius: 3,
          }}
        >
          <i className="codicon codicon-file" style={{ fontSize: 12 }} />
          {filename || 'untitled'}
        </span>
        <span
          style={{
            fontSize: 11,
            color: T.textMuted,
            background: T.inputBg,
            padding: '2px 8px',
            borderRadius: 3,
          }}
        >
          {displayLang.charAt(0).toUpperCase() + displayLang.slice(1)}
          {' · '}
          {confidence === 'high'
            ? 'auto-detected'
            : confidence === 'medium'
            ? 'likely'
            : 'guessed'}
        </span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={monacoLangMap[displayLang] || 'plaintext'}
          theme={T.monacoTheme}
          value={code}
          onChange={(val) => onChange?.(val || '')}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Consolas', 'Courier New', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            glyphMargin: true,
            folding: true,
            renderLineHighlight: 'line',
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}
