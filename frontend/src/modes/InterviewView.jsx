import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Circle, Rocket, Loader2, Clock, Check, BarChart2, RefreshCw } from 'lucide-react';

const DIFFICULTY = [
  { id: 'easy', label: 'Easy', color: '#22c55e', icon: <Circle size={12} fill="#22c55e" stroke="none" /> },
  { id: 'medium', label: 'Medium', color: '#f59e0b', icon: <Circle size={12} fill="#f59e0b" stroke="none" /> },
  { id: 'hard', label: 'Hard', color: '#ef4444', icon: <Circle size={12} fill="#ef4444" stroke="none" /> },
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
      const res = await fetch(`\${window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://refyn-production-5a6b.up.railway.app'}/api/chat`, {
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
      const res = await fetch(`\${window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://refyn-production-5a6b.up.railway.app'}/api/chat`, {
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
              content: `You are a strict technical interviewer. The candidate has submitted a solution for the "${problem.title}" problem.
Analyze their solution for:
1. **Correctness** - Does it solve the problem? Are there edge cases missed?
2. **Time & Space Complexity** - What is the Big-O complexity? Does it meet the constraints?
3. **Code Quality** - Is it readable and idiomatic?

Keep it constructive, precise, and professional. Use markdown.`
            },
            {
              role: 'user',
              content: `Here is my ${language} solution. Please review it.\n\n\`\`\`${language}\n${code}\n\`\`\``
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setReview(data.data.reply);
        setStage('review');
      }
    } catch (err) {
      console.error('Failed to submit solution:', err);
    } finally {
      setLoading(false);
    }
  }, [code, language, problem]);

  // Setup screen
  if (stage === 'setup') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 40, overflow: 'auto', background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Rocket size={40} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Mock Interview
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
            Practice real-world coding interview questions customized to your skill level.
          </p>
        </div>

        <div style={{
          background: 'var(--surface)', padding: '32px 40px', borderRadius: 16,
          border: '1px solid var(--border)', width: '100%', maxWidth: 500,
          marginBottom: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
        }}>
          {/* Difficulty */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Difficulty
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {DIFFICULTY.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                  border: '1px solid ' + (difficulty === d.id ? d.color : 'var(--border)'),
                  background: difficulty === d.id ? `${d.color}11` : 'var(--surface-high)',
                  color: difficulty === d.id ? d.color : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 200ms',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {d.icon} {d.label}
              </button>
            ))}
          </div>

          {/* Category */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Topic Category
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14, borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', marginBottom: 24, cursor: 'pointer',
              outline: 'none', transition: 'border-color 200ms',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Language */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Language
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                  border: '1px solid ' + (language === l ? 'var(--accent)' : 'var(--border)'),
                  background: language === l ? 'var(--accent)' : 'var(--surface-high)',
                  color: language === l ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 200ms',
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateProblem}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 40px', fontSize: 15, fontWeight: 700, borderRadius: 12,
            background: loading ? 'var(--surface-high)' : 'linear-gradient(135deg, var(--accent), #818cf8)',
            color: loading ? 'var(--text-muted)' : '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 24px var(--accent-glow)',
            transition: 'all 200ms',
          }}
        >
          {loading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                <Loader2 size={18} />
              </motion.div>
              Generating Problem…
            </>
          ) : (
            <>
              <Rocket size={18} /> Start Challenge
            </>
          )}
        </motion.button>
      </div>
    );
  }

  // Solving screen
  if (stage === 'solving') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
          borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 700,
            background: DIFFICULTY.find(d => d.id === difficulty)?.color + '18',
            color: DIFFICULTY.find(d => d.id === difficulty)?.color,
            border: `1px solid ${DIFFICULTY.find(d => d.id === difficulty)?.color}33`,
            letterSpacing: '0.05em'
          }}>
            {DIFFICULTY.find(d => d.id === difficulty)?.icon}
            {difficulty.toUpperCase()}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
            {problem?.title || 'Coding Challenge'}
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            color: timer > 1800 ? '#ef4444' : timer > 900 ? '#f59e0b' : 'var(--text-muted)',
            background: 'var(--surface-high)', padding: '4px 12px', borderRadius: 8,
            border: '1px solid var(--border)'
          }}>
            <Clock size={14} /> {formatTime(timer)}
          </span>
          <button
            onClick={submitSolution}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: loading ? 'var(--surface-high)' : '#22c55e',
              color: loading ? 'var(--text-muted)' : '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
              transition: 'all 150ms'
            }}
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                  <Loader2 size={14} />
                </motion.div>
                Reviewing…
              </>
            ) : (
              <>
                <Check size={14} /> Submit
              </>
            )}
          </button>
        </div>

        {/* Problem + Editor split */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Problem description */}
          <div style={{
            width: 360, flexShrink: 0, borderRight: '1px solid var(--border)',
            overflow: 'auto', padding: '24px', background: 'var(--surface)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
              {problem?.title}
            </h3>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {problem?.description}
            </div>
            {problem?.examples && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Examples
                </div>
                <pre style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: 13,
                  background: 'var(--bg)', color: 'var(--text)',
                  whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace",
                  border: '1px solid var(--border)', lineHeight: 1.5
                }}>
                  {problem.examples}
                </pre>
              </div>
            )}
            {problem?.constraints && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Constraints
                </div>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", background: 'var(--accent-glow)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
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
                scrollBeyondLastLine: false, padding: { top: 16 },
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <BarChart2 size={20} color="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
          Solution Review — {problem?.title}
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
          background: 'var(--surface-high)', padding: '4px 10px', borderRadius: 6,
          border: '1px solid var(--border)'
        }}>
          <Clock size={12} /> Completed in {formatTime(timer)}
        </span>
        <button
          onClick={() => { setStage('setup'); setProblem(null); setCode(''); setReview(null); setTimer(0); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            transition: 'all 150ms'
          }}
        >
          <RefreshCw size={14} /> New Challenge
        </button>
      </div>

      {/* Review content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Your code */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <div style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 700, color: 'var(--accent)',
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
                fontSize: 14, minimap: { enabled: false }, readOnly: true,
                scrollBeyondLastLine: false, padding: { top: 16 },
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>
        </div>

        {/* AI review */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '24px 32px',
          background: 'var(--bg)',
        }}>
          <div style={{
            fontSize: 14, lineHeight: 1.8, color: 'var(--text)',
            whiteSpace: 'pre-wrap',
          }}>
            {review || 'No review available.'}
          </div>
        </div>
      </div>
    </div>
  );
}
