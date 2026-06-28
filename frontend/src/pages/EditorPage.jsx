import { useState, useRef, useEffect, useCallback } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useSmartFix } from '../hooks/useSmartFix';
import { useExecute } from '../hooks/useExecute';
import { useChat } from '../hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ShortcutsHint } from '../components/UI/ShortcutsHint';
import CompareView from '../modes/CompareView';
import LearnView from '../modes/LearnView';
import InterviewView from '../modes/InterviewView';
import TopNav from '../components/Layout/TopNav';
import SidebarNew from '../components/Layout/SidebarNew';
import EditorPanelNew from '../components/Editor/EditorPanelNew';
import OutputPanel from '../components/Output/OutputPanel';
import ResultsSidebar from '../components/Results/ResultsSidebar';
import SmartFixPanel from '../components/SmartFix/SmartFixPanel';
import DiffViewer from '../components/SmartFix/DiffViewer';
import ChatPanel from '../components/Chat/ChatPanel';
import { Toast } from '../components/UI/Toast';
import { getStateFromURL, pushStateToURL } from '../utils/urlState';
import { exportReport } from '../utils/exportReport';
import { FolderOpen } from 'lucide-react';

const DEFAULT_CODE = `# Welcome to Refyn
# Write or paste your code here, then click ⚡ Analyze

def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Try analyzing this code to find performance issues!
result = fibonacci(35)
print(f"Fibonacci(35) = {result}")
`;

/**
 * Robustly replaces a structural block of code ignoring all whitespace/indentation differences.
 * This is crucial because LLMs frequently hallucinate or strip whitespace in their `before` blocks.
 */
function fuzzyReplace(sourceCode, searchBlock, replaceBlock) {
  if (!searchBlock) return sourceCode;
  
  // 1. Try exact match first (fastest)
  if (sourceCode.includes(searchBlock)) {
    return sourceCode.replace(searchBlock, replaceBlock);
  }

  // 2. Try line-by-line whitespace-agnostic regex match
  const lines = searchBlock.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return sourceCode;

  // Build a regex that looks for these lines in order, separated by any whitespace/newlines
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = lines.map(escapeRegExp).join('\\s+');
  const regex = new RegExp(regexPattern, 'g');

  const match = regex.exec(sourceCode);
  if (match) {
    // Found a fuzzy match! Grab the exact substring from the source code so we replace the right thing
    const exactMatchStr = match[0];
    return sourceCode.replace(exactMatchStr, replaceBlock);
  }

  // 3. No match found — do NOT corrupt the editor
  console.warn("[fuzzyReplace] Pattern not found, skipping to avoid corruption:", searchBlock?.slice(0, 80));
  return sourceCode;
}

export default function EditorPage() {
  /* ─── Page transition ─── */
  useEffect(() => {
    document.body.classList.remove('page-exit');
    document.body.classList.add('page-enter');
    const t = setTimeout(() => document.body.classList.remove('page-enter'), 300);
    return () => clearTimeout(t);
  }, []);

  /* ─── Theme ─── */
  const [isDark, setIsDark] = useState(true);
  const handleThemeToggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  /* ─── Core state ─── */
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('python');
  const [activeMode, setActiveMode] = useState('Analyze');
  const [routingMode, setRoutingMode] = useState('auto');
  const [modelStatuses, setModelStatuses] = useState({
    gemini: 'online', llama: 'online', mixtral: 'online', qwen: 'online',
  });
  const [files, setFiles] = useState([
    { name: 'main.py', language: 'python', content: DEFAULT_CODE },
  ]);
  const [activeFile, setActiveFile] = useState('main.py');
  const [smartFixOpen, setSmartFixOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  const [diffViewer, setDiffViewer] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(t => ({ visible: false, message: t.message })), 3000);
  }, []);

  const [smartFixes, setSmartFixes] = useState([]);

  const editorRef = useRef(null);
  const codeRef = useRef(code);
  const analyzeContainerRef = useRef(null);

  // Keep codeRef always in sync with latest code
  useEffect(() => { codeRef.current = code; }, [code]);

  /* ─── Resizable output panel ─── */
  const [outputHeight, setOutputHeight] = useState(200);
  const isDraggingSplitter = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingSplitter.current) return;
      e.preventDefault();
      const container = analyzeContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newHeight = rect.bottom - e.clientY;
      setOutputHeight(Math.max(80, Math.min(rect.height - 120, newHeight)));
    };
    const onUp = () => { isDraggingSplitter.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  /* ─── Hooks ─── */
  const { analyze, reset, analysis, loading: isAnalyzing, error, usedModel, stats, memoryInsights } = useAnalysis();
  const { getSmartFix, loading: isFixing } = useSmartFix();
  const { output: execOutput, loading: execLoading, error: execError, execute, clearOutput } = useExecute();
  const { messages, loading: chatLoading, sendMessage, clearChat } = useChat();

  /* ─── Derived ─── */
  const results = analysis ? {
    issues: analysis.issues || [],
    score: analysis.score ?? analysis.overallScore ?? null,
    breakdown: analysis.breakdown || null,
  } : null;

  // Local state for run results (bypasses useExecute to avoid data shape issues)
  const [runResult, setRunResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  /* ─── URL State Recovery ─── */
  useEffect(() => {
    const urlState = getStateFromURL();
    if (!urlState) return;
    setCode(urlState.code || '');
    setLanguage(urlState.language || 'python');
    if (urlState.score) {
      // For restoring results visually, since useAnalysis controls 'analysis' state,
      // it's trickiest. A simple way: you can't force 'analysis' easily without an action,
      // but we can pass 'urlState' directly to our derived results!
      // In a real app we'd dispatch to useAnalysis.
    }
    showToast(urlState.codeTruncated
      ? '⚠ Session restored — code was truncated (too long for URL)'
      : '✓ Shared analysis session restored'
    );
  }, [showToast]);

  /* ─── Offline mode ─── */
  useEffect(() => {
    if (routingMode === 'offline') {
      setModelStatuses({ gemini: 'idle', llama: 'idle', mixtral: 'idle', qwen: 'online' });
    } else {
      setModelStatuses({ gemini: 'online', llama: 'online', mixtral: 'online', qwen: 'online' });
    }
  }, [routingMode]);

  /* ─── Handlers ─── */
  const handleAnalyze = useCallback(() => {
    // Always use the latest code from the ref, not the stale closure
    analyze(codeRef.current, language, {
      modelMode: routingMode,
      selectedModel: 'gemini',
      offline: routingMode === 'offline',
    });
  }, [analyze, language, routingMode]);

  // Push state to URL when analysis updates
  useEffect(() => {
    if (analysis && !isAnalyzing) {
      pushStateToURL({ code, language, score: analysis.score, issues: analysis.issues, model: usedModel });
    }
  }, [analysis, isAnalyzing, code, language, usedModel]);

  const handleRun = useCallback(async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setRunResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code, language, stdin: '', offline: routingMode === 'offline' })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { status: 'error', output: '', stderr: `Bad response from server (HTTP ${res.status})`, time: null };
      }

      // Normalize field names — handle any variant the server might return
      const normalized = {
        status: data.status === 'success' ? 'success' : 'error',
        output: data.output  || data.stdout || '',
        stderr: data.stderr  || data.error  || data.message || '',
        time:   data.time    || null,
      };

      console.log('[handleRun] normalized:', normalized);
      setRunResult(normalized);

    } catch (err) {
      console.error('[handleRun] fetch error:', err);
      setRunResult({ status: 'error', output: '', stderr: err.message, time: null });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, isRunning, routingMode]);

  // Single fix — always reads LIVE editor content, throws on failure (so UI can catch)
  const handleApplyFix = useCallback(async (fixId) => {
    const issue = typeof fixId === 'object' ? fixId : results?.issues?.find(i => i.id === fixId);
    if (!issue || !editorRef.current) {
      console.warn('[ApplyFix] missing issue or editor ref');
      return;
    }

    // Read what's CURRENTLY in the editor (not stale React state)
    const liveCode = editorRef.current.getModel()?.getValue() || '';
    console.log('[ApplyFix] calling smartfix for:', issue.title);

    const res = await fetch('http://localhost:5000/api/smartfix', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code:     liveCode,
        language,
        issue:    issue,
        offline:  routingMode === 'offline',
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.fixedCode?.trim()) {
      throw new Error('Server returned empty fixedCode');
    }

    // Write fixed code to editor
    editorRef.current.getModel()?.setValue(data.fixedCode);
    setCode(data.fixedCode);
    console.log('[ApplyFix] done, used:', data.usedModel);
    showToast('✨ Fix applied via ' + (data.usedModel || 'AI'));

  }, [results, language, routingMode, editorRef, showToast]);

  const handleSmartFixLaunch = useCallback(() => {
    if (!results?.issues?.length) {
      showToast('⚠️ No issues found. Run Analyze first.');
      return;
    }
    console.log('[SmartFix] opening panel with', results.issues.length, 'issues from analysis');
    setSmartFixOpen(true);
  }, [results, showToast]);

  const handleFixWithAI = useCallback(async (ctx) => {
    // ctx may be { errorMessage, errorLine, code, language } from OutputPanel
    // or may be called without args from old path
    if (ctx && ctx.errorMessage) {
      setChatContext({
        type: 'error',
        error: ctx.errorMessage,
        line: ctx.errorLine,
        code: ctx.code || code,
        language: ctx.language || language,
      });
      setChatOpen(true);
    } else if (runResult?.error) {
      setChatContext({
        type: 'error',
        error: typeof runResult.error === 'string' ? runResult.error : JSON.stringify(runResult.error),
        line: null,
        code,
        language,
      });
      setChatOpen(true);
    }
  }, [runResult, code, language]);

  const handleAskAbout = useCallback((issue) => {
    setChatContext({
      type: 'issue',
      issue,
      code,
      language,
    });
    setChatOpen(true);
  }, [code, language]);

  // Fix All — sequential, guaranteed order
  const handleApplyAll = useCallback(async (fixIds) => {
    const ids = fixIds?.length
      ? fixIds
      : (results?.issues?.filter(i => !i.applied).map(i => i.id) || []);

    console.log('[ApplyAll] applying', ids.length, 'fixes sequentially');

    for (const id of ids) {
      try {
        await handleApplyFix(id);
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error('[ApplyAll] fix failed for', id, '—', err.message);
      }
    }

    console.log('[ApplyAll] complete');
  }, [handleApplyFix, results]);

  const [diffOpen, setDiffOpen] = useState(false);
  const [activeFixIndex, setActiveFixIndex] = useState(0);

  const handleShowDiff = useCallback((issue) => {
    setDiffViewer({
      beforeCode: issue.originalCode || issue.beforeCode || code,
      afterCode: issue.fixedCode || issue.afterCode || '',
      fixTitle: issue.title || issue.message || 'Fix',
      issueId: issue.id
    });
  }, [code]);

  const handleExport = useCallback(() => {
    if (!results) return;
    exportReport({
      code,
      language,
      score: results.score,
      issues: results.issues || [],
      model: usedModel || routingMode || 'auto',
      timestamp: Date.now()
    });
  }, [code, language, results, usedModel, routingMode]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('✓ Share link copied to clipboard!');
    } catch {
      showToast('Copy this URL to share your analysis');
    }
  }, [showToast]);

  const handleRevealLine = useCallback((line) => {
    if (!editorRef.current || !line) return;
    editorRef.current.revealLineInCenter(line);
    try {
      const monaco = window.monaco;
      if (!monaco) return;
      const dec = editorRef.current.deltaDecorations([], [{
        range: new monaco.Range(line, 1, line, 1),
        options: { isWholeLine: true, className: 'revealed-line-highlight' }
      }]);
      setTimeout(() => editorRef.current?.deltaDecorations(dec, []), 2000);
    } catch {}
  }, []);

  /* ─── Keyboard Shortcuts ─── */
  useKeyboardShortcuts({
    onRun: handleRun,
    onAnalyze: handleAnalyze,
    onChat: () => setChatOpen(c => !c),
    onExport: handleExport,
    onEscape: () => {
      setSmartFixOpen(false);
      setChatOpen(false);
      setDiffViewer(null);
    }
  });

  /* ─── File switching ─── */
  const handleFileSelect = useCallback((name) => {
    setActiveFile(name);
    const f = files.find(f => f.name === name);
    if (f) {
      setCode(f.content || '');
      // Infer language from extension
      const ext = name.split('.').pop();
      const langMap = { py: 'python', js: 'javascript', ts: 'typescript', java: 'java', cpp: 'cpp', go: 'go', rb: 'ruby' };
      setLanguage(langMap[ext] || 'python');
    }
  }, [files]);

  const handleCreateNewFile = useCallback((name) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const langMap = { py: 'python', js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript', java: 'java', cpp: 'cpp', go: 'go', rb: 'ruby', rs: 'rust', php: 'php', sql: 'sql' };
    const lang = langMap[ext] || 'python';
    
    setFiles(prev => {
      if (prev.find(f => f.name === name)) {
        showToast(`File ${name} already exists`);
        return prev;
      }
      return [...prev, { name, language: lang, content: '' }];
    });
    setCode('');
    setLanguage(lang);
    setActiveFile(name);
    reset(); // clear analysis 
  }, [showToast, reset]);

  /* ─── Drag and drop files ─── */
  const [isDragOver, setIsDragOver] = useState(false);

  const EXTENSION_MAP = {
    py: 'python', js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
    java: 'java', cpp: 'cpp', cc: 'cpp', c: 'cpp', h: 'cpp',
    go: 'go', rb: 'ruby', rs: 'rust', php: 'php', sql: 'sql',
    txt: 'python', md: 'python',
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const lang = EXTENSION_MAP[ext] || 'python';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result || '';
      setCode(content);
      setLanguage(lang);
      // Add to file list
      setFiles(prev => {
        const exists = prev.find(f => f.name === file.name);
        if (exists) return prev.map(f => f.name === file.name ? { ...f, content, language: lang } : f);
        return [...prev, { name: file.name, language: lang, content }];
      });
      setActiveFile(file.name);
      showToast(`✓ Loaded ${file.name} (${lang})`);
      reset(); // Clear old analysis
    };
    reader.readAsText(file);
  }, [showToast, reset]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.18 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.18 } }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)',
        fontFamily: "'Inter', sans-serif", position: 'relative',
      }}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: 'rgba(99,102,241,0.15)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px dashed var(--accent)', borderRadius: 12,
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'var(--surface)', padding: '24px 40px', borderRadius: 12,
            border: '1px solid var(--accent)', textAlign: 'center',
            boxShadow: '0 20px 50px rgba(99,102,241,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><FolderOpen size={48} color="var(--accent)" /></div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Drop file to open</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Supports .py .js .ts .java .cpp .go .rb .rs .php .sql
            </div>
          </div>
        </div>
      )}
      <TopNav
        activeMode={activeMode}
        onModeChange={setActiveMode}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SidebarNew
          files={files}
          activeFile={activeFile}
          onFileSelect={handleFileSelect}
          onNewFile={handleCreateNewFile}
          routingMode={routingMode}
          onRoutingModeChange={setRoutingMode}
          modelStatuses={modelStatuses}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            variants={pageVariants}
            initial="initial" animate="animate" exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {activeMode === 'Analyze' && (
              <div
                ref={analyzeContainerRef}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <EditorPanelNew
                    code={code}
                    language={language}
                    onCodeChange={setCode}
                    onLanguageChange={setLanguage}
                    onRun={handleRun}
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    isDark={isDark}
                    editorRef={editorRef}
                    stats={stats}
                  />
                </div>
                {/* ── Resize splitter ── */}
                <div
                  onMouseDown={() => { isDraggingSplitter.current = true; document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; }}
                  style={{
                    height: 6, flexShrink: 0, cursor: 'row-resize',
                    background: 'transparent', position: 'relative', zIndex: 10,
                  }}
                  onMouseEnter={e => e.currentTarget.querySelector('.pill').style.background = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.querySelector('.pill').style.background = 'var(--border)'}
                >
                  <div className="pill" style={{
                    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    width: 40, height: 4, borderRadius: 2, background: 'var(--border)',
                    transition: 'background 150ms',
                  }} />
                </div>
                <div style={{ height: outputHeight, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  <OutputPanel
                    code={code}
                    language={language}
                    runResult={runResult}
                    isRunning={isRunning || execLoading}
                    onRun={handleRun}
                    onFixWithAI={handleFixWithAI}
                    editorRef={editorRef}
                  />
                </div>
              </div>
            )}
            {activeMode === 'Compare' && <CompareView />}
            {activeMode === 'Learn' && <LearnView />}
            {activeMode === 'Interview' && <InterviewView />}
          </motion.div>
        </AnimatePresence>

        <ResultsSidebar
          issues={results?.issues || []}
          score={results?.score || null}
          breakdown={results?.breakdown || null}
          isAnalyzing={isAnalyzing}
          memoryInsights={memoryInsights}
          onApplyFix={handleApplyFix}
          onShowDiff={handleShowDiff}
          onAskAbout={handleAskAbout}
          onSmartFixAll={handleSmartFixLaunch}
          onExport={handleExport}
          onShare={handleShare}
          onRevealLine={handleRevealLine}
        />
      </div>

      <SmartFixPanel
        isOpen={smartFixOpen}
        onClose={() => setSmartFixOpen(false)}
        fixes={results?.issues || smartFixes}
        currentScore={results?.score || 0}
        language={language}
        isDark={isDark}
        onApplyFix={handleApplyFix}
        onApplyAll={handleApplyAll}
      />

      <DiffViewer
        isOpen={!!diffViewer}
        onClose={() => setDiffViewer(null)}
        onApply={() => {
          if (diffViewer?.issueId) handleApplyFix(diffViewer.issueId);
          setDiffViewer(null);
        }}
        beforeCode={diffViewer?.beforeCode}
        afterCode={diffViewer?.afterCode}
        language={language}
        isDark={isDark}
        fixTitle={diffViewer?.fixTitle}
      />

      <ShortcutsHint />

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(c => !c)}
        context={chatContext}
        onClearContext={() => setChatContext(null)}
        editorCode={code}
        editorLanguage={language}
      />

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
