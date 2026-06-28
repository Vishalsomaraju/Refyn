import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';

import { FileCode, FileJson, FileType2, Coffee, Settings, Boxes, Gem, Database } from 'lucide-react';

const LANG_ICONS = {
  python: <FileCode size={14} />, javascript: <FileJson size={14} />, typescript: <FileType2 size={14} />, java: <Coffee size={14} />,
  cpp: <Settings size={14} />, go: <Boxes size={14} />, ruby: <Gem size={14} />, sql: <Database size={14} />,
};

const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'ruby', 'sql'];

export default function EditorPanelNew({
  code, language, onCodeChange, onLanguageChange,
  onRun, onAnalyze, isAnalyzing, isDark, editorRef, stats
}) {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [langDropdown, setLangDropdown] = useState(false);

  const handleEditorMount = useCallback((editor) => {
    if (editorRef) editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
  }, [editorRef]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Monaco Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(val) => onCodeChange(val || '')}
          onMount={handleEditorMount}
          theme={isDark ? 'vs-dark' : 'vs'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Inline toolbar */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        {/* Left: language badge + cursor pos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangDropdown(!langDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                background: 'var(--surface-high)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span>{LANG_ICONS[language] || <FileCode size={14} />}</span>
              <span style={{ textTransform: 'capitalize' }}>{language}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▾</span>
            </button>

            {langDropdown && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 4, minWidth: 140, zIndex: 50,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                marginBottom: 4,
              }}>
                {LANGUAGES.map(lang => (
                  <div
                    key={lang}
                    onClick={() => { onLanguageChange(lang); setLangDropdown(false); }}
                    style={{
                      padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                      borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8,
                      color: language === lang ? 'var(--text)' : 'var(--text-secondary)',
                      background: language === lang ? 'var(--surface-high)' : 'transparent',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-high)'}
                    onMouseLeave={e => {
                      if (language !== lang) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{LANG_ICONS[lang] || <FileCode size={14} />}</span>
                    <span style={{ textTransform: 'capitalize' }}>{lang}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cursor position */}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
        </div>

        {/* Right: Run + Analyze */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onRun}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: '1px solid var(--success)', color: 'var(--success)',
              background: 'transparent', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--success)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--success)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Run
          </button>

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: isAnalyzing ? 'var(--surface-high)' : 'var(--accent)',
              color: isAnalyzing ? 'var(--text-muted)' : '#fff',
              border: 'none', cursor: isAnalyzing ? 'default' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              position: 'relative', overflow: 'hidden',
              transition: 'all 150ms ease',
            }}
          >
            {isAnalyzing ? (
              <>
                <svg className="spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Analyze
              </>
            )}
            {/* Shimmer overlay */}
            {isAnalyzing && (
              <span style={{
                position: 'absolute', top: 0, left: 0,
                height: '100%', width: '60%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{
          height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, background: 'var(--surface)', color: 'var(--text-muted)',
          fontSize: 12, borderTop: '1px solid var(--border)', flexShrink: 0,
          fontFamily: "'Inter', sans-serif"
        }}>
          <span>Model: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats.model}</span></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Complexity: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats.complexity}/100</span></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Cost: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>${stats.cost}</span></span>
          {stats.saved && (
            <>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>Saved: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats.saved}% vs Gemini</span></span>
            </>
          )}
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Latency: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats.latency}ms</span></span>
        </div>
      )}
    </div>
  );
}
