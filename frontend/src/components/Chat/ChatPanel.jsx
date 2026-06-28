import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';

// Props:
// isOpen: boolean
// onClose: () => void
// context: null | { type:'issue'|'error', issue?, error?, line?, code, language }
// onClearContext: () => void

function buildSystemPrompt(context) {
  if (!context) return 'You are Refyn AI assistant. Help with code quality, security, and best practices. Be concise and practical. Use markdown formatting for code.';

  if (context.type === 'issue') return `You are Refyn AI assistant. The user is asking about this specific code issue:
Issue: ${context.issue?.title || context.issue?.message || 'Unknown'} (${context.issue?.severity || 'info'})
Line: ${context.issue?.line || 'unknown'}
Description: ${context.issue?.description || context.issue?.message || ''}
Language: ${context.language}
Code:
\`\`\`${context.language}
${context.code}
\`\`\`
Answer specifically about this issue and this code. Be concise and practical. Don't repeat the entire code back.`;

  if (context.type === 'error') return `You are Refyn AI assistant. The user has a runtime error:
Error: ${context.error}
Line: ${context.line || 'unknown'}
Language: ${context.language}
Code:
\`\`\`${context.language}
${context.code}
\`\`\`
Help them understand and fix this specific error. Be direct and concise.`;

  return 'You are Refyn AI assistant. Help with code quality, security, and best practices.';
}

function getSuggestions(context) {
  if (context?.type === 'issue') return [
    `Why is "${context.issue?.title || context.issue?.message || 'this'}" dangerous?`,
    `Show me a real-world exploit for this`,
    `How do I test that my fix works?`,
    `Could this appear elsewhere in my code?`,
  ];
  if (context?.type === 'error') return [
    `Why am I getting this error?`,
    `How do I fix line ${context.line || '?'}?`,
    `Show me the corrected version`,
  ];
  return [
    `What's the biggest risk in my code?`,
    `How do I get the score above 80?`,
    `Explain the security issues in simple terms`,
  ];
}

// Simple markdown-to-JSX: handles ```code``` blocks and inline `code`
function MessageContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).replace(/^\w+\n/, ''); // strip language hint
          return (
            <pre key={i} style={{
              background: 'var(--bg)', borderRadius: 6, padding: '8px 12px',
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
              color: 'var(--text)', margin: '6px 0', overflowX: 'auto', whiteSpace: 'pre-wrap'
            }}>{code}</pre>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ background: 'var(--surface-high)', padding: '1px 5px', borderRadius: 3, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function ChatPanel({ isOpen, onClose, context, onClearContext, editorCode, editorLanguage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isOpen && messages.length > 0) setHasUnread(true);
  }, [messages, isOpen]);

  // clear unread when opened
  useEffect(() => { if (isOpen) setHasUnread(false); }, [isOpen]);

  // focus input when opened
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  const sendMessage = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(context);

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: context?.code || editorCode || ' ',
          language: context?.language || editorLanguage || 'text',
          analysis: context?.issue || {},
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          offline: false
        })
      });
      const data = await res.json();
      const reply = data.data?.reply || data.reply || data.content || data.message || 'Sorry, I could not get a response.';
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* sliding drawer */}
      <motion.div
        animate={{ x: isOpen ? 0 : 360 }}
        initial={{ x: 360 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          position: 'fixed', right: 0, top: 60, width: 360, height: 'calc(100vh - 60px)',
          background: 'var(--surface)', borderLeft: '1px solid var(--border)',
          zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        {/* header */}
        <div style={{
          height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', borderBottom: '1px solid var(--border)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={16} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ask Refyn</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        {/* context pill */}
        <AnimatePresence>
          {context && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', flexShrink: 0 }}
            >
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px',
                  background: context.type === 'issue' ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${context.type === 'issue' ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)'
                }}>
                  <span>{context.type === 'issue' ? '🔴' : '✕'}</span>
                  <span>
                    {context.type === 'issue'
                      ? `${context.issue?.title || context.issue?.message || 'Issue'} · Line ${context.issue?.line || '?'}`
                      : `Error · Line ${context.line || '?'}`
                    }
                  </span>
                  <button
                    onClick={onClearContext}
                    style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, background: 'none', border: 'none' }}
                  >×</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* messages area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* suggested questions — only before first message */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
                SUGGESTED
              </p>
              {getSuggestions(context).map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => sendMessage(q)}
                  style={{
                    textAlign: 'left', padding: '8px 12px', fontSize: 13,
                    background: 'var(--surface-high)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer',
                    transition: 'all 150ms', fontFamily: "'Inter', sans-serif",
                  }}
                  whileHover={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          )}

          {/* messages */}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '8px 12px', fontSize: 13, lineHeight: 1.55,
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface-high)',
                color: 'var(--text)'
              }}>
                <MessageContent text={msg.content} />
              </div>
            </div>
          ))}

          {/* loading dots */}
          {loading && (
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)',
                  display: 'inline-block',
                  animation: `bounceDot 0.8s ease-in-out ${i * 0.15}s infinite`
                }} />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* input area */}
        <div style={{ borderTop: '1px solid var(--border)', padding: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
              }}
              placeholder="Ask anything about your code..."
              rows={1}
              style={{
                flex: 1, resize: 'none', padding: '8px 12px', fontSize: 13,
                background: 'var(--surface-high)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', outline: 'none',
                fontFamily: 'Inter,sans-serif', lineHeight: 1.5,
                maxHeight: 80, overflowY: 'auto'
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface-high)',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms'
              }}
            >
              <Send size={15} color={input.trim() && !loading ? 'white' : 'var(--text-muted)'} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </motion.div>

      {/* floating trigger (when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              position: 'fixed', bottom: 24, right: 24, width: 52, height: 52, borderRadius: '50%',
              background: 'var(--accent)', border: 'none', cursor: 'pointer', zIndex: 150,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px var(--accent-glow)'
            }}
          >
            <MessageCircle size={22} color="white" />
            {hasUnread && (
              <span style={{
                position: 'absolute', top: 4, right: 4, width: 10, height: 10,
                borderRadius: '50%', background: 'var(--error)',
                border: '2px solid var(--surface)'
              }} />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
