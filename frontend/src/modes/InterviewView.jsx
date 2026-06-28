import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';

const DIFFICULTY = [
  { id: 'easy', label: 'Easy', color: '#22c55e', icon: '🟢' },
  { id: 'medium', label: 'Medium', color: '#f59e0b', icon: '🟡' },
  { id: 'hard', label: 'Hard', color: '#ef4444', icon: '🔴' },
];

const CATEGORIES = [
  'Arrays & Strings', 'Linked Lists', 'Trees & Graphs',
  'Dynamic Programming', 'Searching & Sorting', 'Stack & Queue',
  'Recursion', 'Math & Logic',
];

const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'go'];

export default function InterviewView() {
  const [stage, setStage] = useState('setup'); // setup | solving | review
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('Arrays & Strings');
  const [language, setLanguage] = useState('python');
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (stage === 'solving') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const generateProblem = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '// generate problem',
          language,
          analysis: {},
          offline: false,
          messages: [
            {
              role: 'system',
              content: `You are a coding interview problem generator. Generate ONE coding problem. 
Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "title": "Problem Title",
  "description": "Clear problem description with constraints",
  "examples": "Input: [example]\\nOutput: [example]\\nExplanation: [brief]",
  "constraints": "Time: O(n), Space: O(1)",
  "starter": "starter code template in ${language}"
}`
            },
            {
              role: 'user',
              content: `Generate a ${difficulty} level coding problem about ${category} for ${language}. Return ONLY the JSON object, nothing else.`
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        try {
          // Try to parse JSON from the response
          let reply = data.data.reply;
          // Strip markdown code block delimiters if present
          reply = reply.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const parsed = JSON.parse(reply);
          setProblem(parsed);
          setCode(parsed.starter || `# Write your ${language} solution here\n`);
          setStage('solving');
          setTimer(0);
        } catch {
          // If JSON parsing fails, use the raw text as the problem description
          setProblem({
            title: `${category} Challenge`,
            description: data.data.reply,
            examples: '',
            constraints: '',
            starter: `# Write your ${language} solution here\n`
          });
          setCode(`# Write your ${language} solution here\n`);
          setStage('solving');
          setTimer(0);
        }
      }
    } catch (err) {
      console.error('Failed to generate problem:', err);
    } finally {
      setLoading(false);
    }
  }, [difficulty, category, language]);

  const submitSolution = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          analysis: {},
          offline: false,
          messages: [
            {
              role: 'system',
              content: `You are an expert coding interviewer evaluating a candidate's solution. Give a thorough review:
1. **Correctness** — Does it solve the problem? Edge cases?
2. **Time Complexity** — Big-O analysis
3. **Space Complexity** — Big-O analysis
4. **Code Quality** — Readability, naming, structure
5. **Score** — Rate 0-100
6. **Verdict** — PASS, BORDERLINE, or FAIL with reasoning
7. **Optimal Solution** — Show the ideal approach if the candidate's differs

Use markdown formatting. Be encouraging but honest.`
            },
            {
              role: 'user',
              content: `Problem: ${problem?.title}\n${problem?.description}\n\nCandidate's ${language} solution (completed in ${formatTime(timer)}):\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease review this solution.`
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setReview(data.data.reply);
        setStage('review');
        clearInterval(timerRef.current);
      }
    } catch (err) {
      console.error('Failed to review:', err);
    } finally {
      setLoading(false);
    }
  }, [code, language, problem, timer]);

  // Setup screen
  if (stage === 'setup') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 40, overflow: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Mock Interview
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420 }}>
            Get a timed coding challenge with AI-powered review of your solution
          </p>
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Difficulty
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFICULTY.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                  border: '2px solid ' + (difficulty === d.id ? d.color : 'var(--border)'),
                  background: difficulty === d.id ? d.color + '18' : 'var(--surface-high)',
                  color: difficulty === d.id ? d.color : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 150ms',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {d.icon} {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Category
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 500 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '6px 14px', fontSize: 12, borderRadius: 6,
                  border: '1px solid ' + (category === cat ? 'var(--accent)' : 'var(--border)'),
                  background: category === cat ? 'var(--accent)' : 'var(--surface-high)',
                  color: category === cat ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 150ms',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Language
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                style={{
                  padding: '6px 14px', fontSize: 12, borderRadius: 6,
                  border: '1px solid ' + (language === l ? 'var(--accent)' : 'var(--border)'),
                  background: language === l ? 'var(--accent)' : 'var(--surface-high)',
                  color: language === l ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 150ms',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={generateProblem}
          disabled={loading}
          style={{
            padding: '12px 40px', fontSize: 15, fontWeight: 700, borderRadius: 12,
            background: loading ? 'var(--surface-high)' : 'linear-gradient(135deg, var(--accent), #818cf8)',
            color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            transition: 'all 200ms',
          }}
        >
          {loading ? '⏳ Generating Problem…' : '🚀 Start Challenge'}
        </motion.button>
      </div>
    );
  }

  // Solving screen
  if (stage === 'solving') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
          borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
        }}>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
            background: DIFFICULTY.find(d => d.id === difficulty)?.color + '22',
            color: DIFFICULTY.find(d => d.id === difficulty)?.color,
          }}>
            {difficulty.toUpperCase()}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
            {problem?.title || 'Coding Challenge'}
          </span>
          <span style={{
            fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            color: timer > 1800 ? '#ef4444' : timer > 900 ? '#f59e0b' : 'var(--text-muted)',
          }}>
            ⏱ {formatTime(timer)}
          </span>
          <button
            onClick={submitSolution}
            disabled={loading}
            style={{
              padding: '6px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: loading ? 'var(--surface-high)' : '#22c55e',
              color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? '⏳ Reviewing…' : '✅ Submit'}
          </button>
        </div>

        {/* Problem + Editor split */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Problem description */}
          <div style={{
            width: 340, flexShrink: 0, borderRight: '1px solid var(--border)',
            overflow: 'auto', padding: '16px 20px', background: 'var(--surface)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              {problem?.title}
            </h3>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {problem?.description}
            </div>
            {problem?.examples && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Examples
                </div>
                <pre style={{
                  padding: '10px 12px', borderRadius: 8, fontSize: 12,
                  background: 'var(--surface-high)', color: 'var(--text)',
                  whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace",
                  border: '1px solid var(--border)',
                }}>
                  {problem.examples}
                </pre>
              </div>
            )}
            {problem?.constraints && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                  Constraints
                </div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {problem.constraints}
                </div>
              </div>
            )}
          </div>

          {/* Code editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={val => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14, minimap: { enabled: false },
                scrollBeyondLastLine: false, padding: { top: 12 },
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Review screen
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
          Solution Review — {problem?.title}
        </span>
        <span style={{
          fontSize: 12, color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Completed in {formatTime(timer)}
        </span>
        <button
          onClick={() => { setStage('setup'); setProblem(null); setCode(''); setReview(null); setTimer(0); }}
          style={{
            padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          🔄 New Challenge
        </button>
      </div>

      {/* Review content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Your code */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <div style={{
            padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--accent)',
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Your Solution
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-dark"
              options={{
                fontSize: 13, minimap: { enabled: false }, readOnly: true,
                scrollBeyondLastLine: false, padding: { top: 10 },
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>
        </div>

        {/* AI review */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '16px 20px',
          background: 'var(--bg)',
        }}>
          <div style={{
            fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)',
            whiteSpace: 'pre-wrap',
          }}>
            {review || 'No review available.'}
          </div>
        </div>
      </div>
    </div>
  );
}
