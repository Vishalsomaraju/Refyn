# PROJECT CONSTITUTION — CodeRefine

> Auto-loaded by GitHub Copilot for every chat in this workspace.
> Read this entire file before writing a single line of code.
> Do not deviate from anything written here without asking first.

---

## What Is CodeRefine?

CodeRefine is an AI-powered Code Intelligence Workspace — a browser-based IDE-style
application where developers paste or write code and receive deep AI analysis across
multiple dimensions. It is NOT just a paste-and-review tool. It is a full workspace
with multiple modes, multi-model AI, offline support, resizable panels, full
dark/light theming, and an interactive smart fix system.

**One-line pitch:**
"The only code intelligence platform that works offline, uses 4 AI models simultaneously,
and doesn't just find problems — it fixes them interactively and teaches you why."

---

## Tech Stack — EXACT, DO NOT CHANGE

### Frontend

- Framework: React with Vite (NOT Next.js, NOT CRA)
- Styling: Tailwind CSS utility classes ONLY — no inline styles except dynamic values
- Code Editor: Monaco Editor via @monaco-editor/react
- Icons: Codicons (@vscode/codicons) — NO emojis anywhere in the UI
- HTTP: Native fetch or axios for backend calls
- No UI component libraries — build everything from scratch

### Backend

- Runtime: Node.js
- Framework: Express.js
- Port: 5000
- No database — fully stateless
- No authentication
- CORS enabled for localhost:5173

### AI Models — ALL FOUR REQUIRED

1. Google Gemini 2.0 Flash (primary — deep analysis)
   - SDK: @google/generative-ai
   - Used for: main code review, smart fix generation
2. Groq Llama 3.3 70B Versatile (secondary — fast fallback)
   - SDK: groq-sdk | model: 'llama-3.3-70b-versatile'
   - Used for: fallback analysis, chat responses
3. Groq Mixtral 8x7B (tertiary — second Groq fallback)
   - SDK: groq-sdk (SAME key as Llama) | model: 'mixtral-8x7b-32768'
   - Used for: third fallback in waterfall chain
4. Ollama Qwen2.5-Coder (local — always available, offline fallback)
   - REST API: http://localhost:11434 — no SDK needed
   - Already installed on user's machine

### Code Execution

- Judge0 API (free tier) — https://judge0-ce.p.rapidapi.com
- Supports 50+ languages, sandboxed execution

### Environment Variables (backend/.env)

```
GEMINI_API_KEY=
GROQ_API_KEY=
JUDGE0_API_KEY=
PORT=5000
OLLAMA_URL=http://localhost:11434
```

GROQ_API_KEY covers BOTH Llama and Mixtral — same key, different model strings.

---

## Project Structure — EXACT

```
coderefine/
├── .github/
│   └── copilot-instructions.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── TitleBar.jsx
│   │   │   │   ├── TabBar.jsx
│   │   │   │   ├── ActivityBar.jsx
│   │   │   │   ├── StatusBar.jsx
│   │   │   │   └── ResizeDivider.jsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── FileExplorer.jsx
│   │   │   │   └── ModelPanel.jsx
│   │   │   ├── Editor/
│   │   │   │   └── CodeEditor.jsx
│   │   │   ├── Results/
│   │   │   │   ├── IssueList.jsx
│   │   │   │   ├── IssueCard.jsx
│   │   │   │   └── ChatPanel.jsx
│   │   │   ├── ScorePanel/
│   │   │   │   └── ScorePanel.jsx
│   │   │   ├── SmartFix/
│   │   │   │   ├── SmartFixPanel.jsx
│   │   │   │   └── FixCard.jsx
│   │   │   ├── Modes/
│   │   │   │   ├── CompareMode.jsx
│   │   │   │   ├── LearnMode.jsx
│   │   │   │   └── InterviewMode.jsx
│   │   │   └── Terminal/
│   │   │       └── TerminalPanel.jsx
│   │   ├── hooks/
│   │   │   ├── useAnalysis.js
│   │   │   ├── useSmartFix.js
│   │   │   ├── useChat.js
│   │   │   └── usePanelResize.js
│   │   ├── utils/
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── languageDetect.js
│   │   │   ├── parseAnalysis.js
│   │   │   └── samples.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/
│   ├── routes/
│   │   ├── analyze.js
│   │   ├── chat.js
│   │   ├── smartfix.js
│   │   └── execute.js
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── groqService.js
│   │   ├── ollamaService.js
│   │   ├── aiRouter.js
│   │   └── judge0Service.js
│   ├── prompts/
│   │   ├── reviewPrompt.js
│   │   ├── smartFixPrompt.js
│   │   └── chatPrompt.js
│   ├── server.js
│   ├── .env
│   └── package.json
└── .gitignore
```

---

## UI Design — VSCode-Accurate Layout

### Overall Layout

```
[TitleBar — full width, 30px]
[TabBar — full width, 36px]
[ActivityBar 48px] | [Sidebar] ⟺ [Editor] ⟺ [Results] ⟺ [ScorePanel]
                     ResizeDividers between every column
[ResizeDivider — horizontal, above terminal]
[TerminalPanel — resizable height, default 130px]
[StatusBar — full width, 22px]
```

### Resizable Panels — ALL columns draggable

- Sidebar: default 210px, min 150px, max 350px
- Results panel: default 320px, min 220px, max 500px
- Score panel: default 220px, min 180px, max 320px
- Terminal: default 130px, min 80px, max 280px (vertical)
- Editor takes remaining flex space automatically
- usePanelResize(default, min, max) hook — see hooks/usePanelResize.js
- ResizeDivider: 4px strip, hover turns accent blue, drag changes cursor to col-resize

### Theme System

- ThemeContext in src/utils/ThemeContext.jsx — exports DARK + LIGHT token objects
- useTheme() returns { T, isDark, toggle }
- Default: dark. Toggle button in TitleBar right side.
- Icons: codicon-sun (shown in dark mode to switch to light) / codicon-moon (shown in light mode)
- Monaco theme: T.monacoTheme = 'vs-dark' or 'vs'
- ALL components get colors from T — zero hardcoded hex values in JSX

### Dark Theme Tokens

```
bg:#1e1e1e  sidebar:#252526  activityBar:#333333  tabBar:#2d2d2d
tabActive:#1e1e1e  panelHeader:#252526  statusBar:#007acc  border:#454545
text:#cccccc  textMuted:#858585  textDim:#6a6a6a  textBright:#d4d4d4
accent:#007acc  inputBg:#3c3c3c  hoverBg:#2a2d2e  activeBg:#37373d
critical:#f44747  warning:#cca700  info:#3794ff  success:#4ec9b0
keyword:#569cd6  string:#ce9178  comment:#6a9955  fn:#dcdcaa
monacoTheme:'vs-dark'
```

### Light Theme Tokens

```
bg:#ffffff  sidebar:#f3f3f3  activityBar:#2c2c2c  tabBar:#ececec
tabActive:#ffffff  panelHeader:#f3f3f3  statusBar:#007acc  border:#e0e0e0
text:#1f1f1f  textMuted:#717171  textDim:#999999  textBright:#0f0f0f
accent:#005fb8  inputBg:#ffffff  hoverBg:#e8e8e8  activeBg:#d6d6d6
critical:#c72e0f  warning:#9b6a00  info:#005fb8  success:#1e7e6a
keyword:#0000ff  string:#a31515  comment:#008000  fn:#795e26
monacoTheme:'vs'
```

### Status Bar

- Default background: #007acc (blue)
- Offline mode: #16825d (green)
- Shows: logo | active model | language | error counts | cursor pos
- Right: Run button + Analyze button

---

## Core Features

### Feature 1: 4-Model AI Analysis

- Auto waterfall: Gemini → Llama → Mixtral → Qwen (never fails)
- All Together: all 4 in parallel, confidence = 3-4/4 high, 2/4 medium, 1/4 low
- Manual: user picks model, Ollama fallback if it fails
- Offline: skip all cloud, go direct to Ollama

### Feature 2: Smart Fix (FLAGSHIP)

- Sequential fix cards with before/after diff + plain English why
- Apply: editor updates live, score recalculates, green flash
- Skip: line marked amber, advance to next
- Apply All: one-click remaining fixes
- Summary: score before → after, applied/skipped counts

### Feature 3: Resizable Panels

- Every column draggable via ResizeDivider
- Terminal resizable vertically
- Min/max enforced

### Feature 4: Dark / Light Theme

- Full theme switch, affects all components + Monaco

### Feature 5: Auto Language Detection

- Pattern match in frontend, AI confirms in backend

### Feature 6: Chat With Code

- Groq Llama for speed, full conversation history
- Starter chips, context-aware, references line numbers

### Feature 7: Code Execution

- Judge0 API, output in TERMINAL tab

### Feature 8: Compare Mode

- Two editors, AI compares, metric bar charts

### Feature 9: Learn Mode

- Step-by-step lessons, progressive unlock

### Feature 10: Interview Prep

- Questions from specific submitted code, AI evaluates answers

---

## AI Router (aiRouter.js)

```
AUTO:     Gemini → Llama → Mixtral → Ollama
ALL:      Promise.allSettled([Gemini, Llama, Mixtral, Ollama])
MANUAL:   selected model → Ollama fallback
OFFLINE:  Ollama only
```

---

## API Endpoints

```
POST /api/analyze   { code, language, modelMode, selectedModel?, offline? }
POST /api/smartfix  { code, language, issues }
POST /api/chat      { code, language, analysis, messages }
POST /api/execute   { code, language }
GET  /health
```

---

## Model Panel — 4 Cards

```
Gemini 2.0 Flash    · google · cloud  · 15/m
Llama 3.3 70B       · groq   · cloud  · 30/m
Mixtral 8x7B        · groq   · cloud  · 30/m
Qwen2.5 Coder       · ollama · local  · ∞
```

Offline: cloud model dots go grey. Qwen stays lit. Status bar turns green.

---

## Prompt Response Shapes

### Review:

```json
{
  "score": 0-100,
  "scores": { "bugs":0-100, "security":0-100, "performance":0-100, "quality":0-100 },
  "issues": [{ "category":"bug|security|performance|quality", "severity":"critical|warning|info",
    "line":number, "title":"", "description":"", "fix":"" }],
  "optimizedCode": "full fixed code",
  "summary": "2 sentences"
}
```

### Smart Fix:

```json
{
  "fixes": [{ "order":1, "severity":"critical|warning|info", "line":number,
    "title":"", "before":"original lines", "after":"fixed lines",
    "why":"plain English", "impact":"security|performance|reliability|readability" }]
}
```

---

## Code Standards

- useTheme() for all colors — no hardcoded hex anywhere in components
- No emojis — Codicons only
- Functional components only
- All async in try/catch with loading + error states
- Consistent API response: { success: true, data:{} } or { success: false, error:"" }

---

## Demo Samples (src/utils/samples.js)

Three samples — Python, JavaScript, Java — all scoring 35-55/100.
After Smart Fix: +25 to +40 points each.

## NOT Building

No auth, no database, no file upload, no GitHub integration, no mobile app.
