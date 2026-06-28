import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Brain, Building2, Zap, Lock, Sparkles, Beaker, Loader2, ArrowLeft, Send, AlertCircle } from 'lucide-react';

const LANGUAGES_LEARN = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'ruby', 'sql'];

const TOPICS = [
  { id: 'algorithms', label: 'Algorithms & Data Structures', icon: <Brain size={28} color="var(--accent)" /> },
  { id: 'patterns', label: 'Design Patterns', icon: <Building2 size={28} color="#f59e0b" /> },
  { id: 'optimization', label: 'Performance Optimization', icon: <Zap size={28} color="#3b82f6" /> },
  { id: 'security', label: 'Security Best Practices', icon: <Lock size={28} color="#ef4444" /> },
  { id: 'clean-code', label: 'Clean Code Principles', icon: <Sparkles size={28} color="#8b5cf6" /> },
  { id: 'testing', label: 'Testing & TDD', icon: <Beaker size={28} color="#10b981" /> },
];

export default function LearnView() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const systemPrompt = `You are a friendly, expert programming tutor. 
Topic: ${selectedTopic?.label}
Language: ${language}

Your goal is to teach the user interactively. 
- Keep explanations very concise (1-2 short paragraphs).
- Always include a small code example.
- End your response with a quick question or challenge to test their understanding.
- Do NOT output large walls of text. Make it feel like a real-time chat.
- Use markdown formatting for code.`;

    try {
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
        setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.', isError: true }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message, isError: true }]);
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
        background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <BookOpen size={40} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Interactive Learning
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
            Choose a topic and language to start an AI-guided lesson with code examples and challenges
          </p>
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 600 }}>
          {LANGUAGES_LEARN.map(l => (
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
                boxShadow: language === l ? '0 4px 12px var(--accent-glow)' : 'none'
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Topic grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          maxWidth: 720, width: '100%',
        }}>
          {TOPICS.map(topic => (
            <motion.button
              key={topic.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startTopic(topic)}
              style={{
                padding: '24px 20px', borderRadius: 16,
                background: 'var(--surface)', border: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 200ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              <div>{topic.icon}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <button
          onClick={() => { setSelectedTopic(null); setMessages([]); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', fontSize: 13, fontWeight: 500, borderRadius: 8,
            background: 'var(--surface-high)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 150ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--border)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface-high)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {selectedTopic.icon}
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{selectedTopic.label}</span>
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
            background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {language}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
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
                marginBottom: 16,
              }}
            >
              <div style={{
                maxWidth: '75%', padding: '14px 18px', borderRadius: 16,
                fontSize: 14, lineHeight: 1.7,
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                whiteSpace: 'pre-wrap',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                boxShadow: msg.role === 'user' ? '0 4px 12px var(--accent-glow)' : '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                {msg.isError ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
                    <AlertCircle size={16} /> {msg.content}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
              <Loader2 size={16} />
            </motion.div>
            <span>Tutor is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 32px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask a follow-up question or request more examples…"
            disabled={loading}
            style={{
              flex: 1, padding: '14px 20px', paddingRight: 50, fontSize: 14, borderRadius: 12,
              background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', outline: 'none',
              fontFamily: "'Inter', sans-serif", transition: 'border-color 200ms',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              position: 'absolute', right: 8, top: 8, bottom: 8,
              padding: '0 12px', borderRadius: 8, border: 'none',
              background: input.trim() ? 'var(--accent)' : 'transparent',
              color: input.trim() ? '#fff' : 'var(--text-muted)',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 200ms',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
