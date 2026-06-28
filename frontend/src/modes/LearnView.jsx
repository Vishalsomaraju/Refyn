import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOPICS = [
  { id: 'dsa', icon: '🧮', label: 'Data Structures & Algorithms', prompt: 'Teach me about a data structure or algorithm.' },
  { id: 'patterns', icon: '🧩', label: 'Design Patterns', prompt: 'Teach me about a software design pattern.' },
  { id: 'security', icon: '🔒', label: 'Security Best Practices', prompt: 'Teach me about a code security best practice.' },
  { id: 'performance', icon: '⚡', label: 'Performance Optimization', prompt: 'Teach me about code performance optimization.' },
  { id: 'testing', icon: '🧪', label: 'Testing Strategies', prompt: 'Teach me about software testing strategies.' },
  { id: 'clean', icon: '✨', label: 'Clean Code Principles', prompt: 'Teach me about clean code and refactoring.' },
];

const LANGUAGES_LEARN = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go'];

export default function LearnView() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [language, setLanguage] = useState('python');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (userMsg) => {
    if (!userMsg?.trim()) return;
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = selectedTopic
        ? `You are an expert programming tutor teaching ${language}. Topic: ${selectedTopic.label}. 
Rules:
- Give clear, concise explanations with real code examples in ${language}
- Use markdown formatting for code blocks
- Break complex topics into digestible steps
- Include time/space complexity when relevant
- End each explanation with a mini-challenge for the student
- Keep responses focused and under 400 words`
        : `You are an expert programming tutor. Help the student learn ${language} programming. Use code examples and markdown formatting. Be concise.`;

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `// Learning ${language} - Topic: ${selectedTopic?.label || 'General'}`,
          language,
          analysis: {},
          offline: false,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Failed to get response. Please try again.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  }, [messages, selectedTopic, language]);

  const startTopic = useCallback((topic) => {
    setSelectedTopic(topic);
    setMessages([]);
    sendMessage(`I want to learn about ${topic.label} in ${language}. Start with the fundamentals and give me a practical example.`);
  }, [language, sendMessage]);

  // Topic selection screen
  if (!selectedTopic) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 40, overflow: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Interactive Learning
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420 }}>
            Choose a topic and language to start an AI-guided lesson with code examples and challenges
          </p>
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {LANGUAGES_LEARN.map(l => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 8,
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

        {/* Topic grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          maxWidth: 640, width: '100%',
        }}>
          {TOPICS.map(topic => (
            <motion.button
              key={topic.id}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startTopic(topic)}
              style={{
                padding: '20px 16px', borderRadius: 12,
                background: 'var(--surface)', border: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'border-color 200ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: 28 }}>{topic.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                {topic.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Lesson chat screen
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <button
          onClick={() => { setSelectedTopic(null); setMessages([]); }}
          style={{
            padding: '4px 10px', fontSize: 12, borderRadius: 6,
            background: 'var(--surface-high)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 18 }}>{selectedTopic.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{selectedTopic.label}</span>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4,
          background: 'var(--accent)', color: '#fff',
        }}>
          {language}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                fontSize: 13.5, lineHeight: 1.7,
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface-high)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                whiteSpace: 'pre-wrap',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div style={{ display: 'flex', gap: 6, padding: '10px 0', color: 'var(--text-muted)' }}>
            <span style={{ animation: 'bounceDot 1.4s infinite' }}>●</span>
            <span style={{ animation: 'bounceDot 1.4s 0.2s infinite' }}>●</span>
            <span style={{ animation: 'bounceDot 1.4s 0.4s infinite' }}>●</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Ask a follow-up question or request more examples…"
          disabled={loading}
          style={{
            flex: 1, padding: '10px 14px', fontSize: 13, borderRadius: 10,
            background: 'var(--surface-high)', border: '1px solid var(--border)',
            color: 'var(--text)', outline: 'none',
            fontFamily: "'Inter', sans-serif",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: input.trim() ? 'var(--accent)' : 'var(--surface-high)',
            color: input.trim() ? '#fff' : 'var(--text-muted)',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: 13, fontWeight: 600, transition: 'all 150ms',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
