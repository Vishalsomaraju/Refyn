import { useState, useCallback } from 'react';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text, code, language, analysis, offline = false) => {
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`\${window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://refyn-production-5a6b.up.railway.app'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          analysis: analysis || {},
          messages: [...messages, userMsg],
          offline
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Chat failed');

      const aiMsg = { role: 'assistant', content: result.data.reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message);
      const errMsg = { role: 'assistant', content: `⚠️ ${err.message}` };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat };
}
