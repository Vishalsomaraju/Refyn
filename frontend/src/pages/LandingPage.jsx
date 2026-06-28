import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [sessions, setSessions] = useState([]);

  // Load sessions if username is typed
  useEffect(() => {
    if (!username.trim()) {
      setSessions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`http://localhost:5000/api/memory/${username}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSessions(data);
          } else if (data.sessions && Array.isArray(data.sessions)) {
            setSessions(data.sessions);
          } else {
            setSessions([]);
          }
        })
        .catch(() => setSessions([]));
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleStart = () => {
    if (!username.trim()) return;
    localStorage.setItem("refyn_username", username.trim());
    navigate("/editor");
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: 20
    }}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: 'var(--accent)',
          letterSpacing: '-2px',
          marginBottom: 16
        }}
      >
        Refyn
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: 20,
          color: 'var(--text-muted)',
          marginBottom: 48,
          fontWeight: 500
        }}
      >
        Your code. Reviewed. Remembered. Refined.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          maxWidth: 400
        }}
      >
        <input
          type="text"
          placeholder="Enter your name to start"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          style={{
            width: '100%',
            padding: '16px 20px',
            fontSize: 16,
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 12,
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />

        <button
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '16px 20px',
            fontSize: 16,
            fontWeight: 600,
            background: 'var(--accent)',
            color: '#1f1f1e',
            border: 'none',
            borderRadius: 12,
            cursor: username.trim() ? 'pointer' : 'not-allowed',
            opacity: username.trim() ? 1 : 0.5,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => username.trim() && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Start Reviewing →
        </button>
      </motion.div>

      {sessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 48,
            width: '100%',
            maxWidth: 400
          }}
        >
          <h3 style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Recent Sessions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((session, i) => (
              <div key={i} style={{
                background: 'var(--surface)',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 14,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Session {new Date(session.timestamp || Date.now()).toLocaleDateString()}</span>
                <span style={{ color: 'var(--text-muted)' }}>{session.language || 'Code'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
