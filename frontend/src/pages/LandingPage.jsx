import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, History } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

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
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Ambient Glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '80vw', height: '80vw', maxWidth: 800, maxHeight: 800,
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
        opacity: 0.5, pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 440 }}>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h1 style={{
            fontSize: clamp(64, '12vw', 88),
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.04em',
            margin: 0,
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Refyn<span style={{ color: 'var(--accent)', WebkitTextFillColor: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            marginTop: 12,
            fontWeight: 500,
            letterSpacing: '0.01em'
          }}>
            Your code. Reviewed. Remembered. Refined.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
            background: 'var(--surface)',
            padding: 32,
            borderRadius: 24,
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Enter your workspace name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: 16,
                background: 'var(--surface-high)',
                border: `2px solid ${isFocused ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12,
                color: 'var(--text)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isFocused ? '0 0 0 4px var(--accent-glow)' : 'none'
              }}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!username.trim()}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: 16,
              fontWeight: 600,
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              cursor: username.trim() ? 'pointer' : 'not-allowed',
              opacity: username.trim() ? 1 : 0.6,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transform: username.trim() ? 'translateY(0)' : 'none',
              boxShadow: username.trim() ? '0 8px 16px var(--accent-glow)' : 'none'
            }}
            onMouseEnter={(e) => username.trim() && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => username.trim() && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Start Session <ArrowRight size={18} />
          </button>
        </motion.div>

        <AnimatePresence>
          {sessions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ width: '100%', marginTop: 32, overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-secondary)' }}>
                <History size={16} />
                <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Recent Sessions
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map((session, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={handleStart}
                    style={{
                      background: 'var(--surface)',
                      padding: '16px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>Session {new Date(session.timestamp || Date.now()).toLocaleDateString()}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{session.language || 'Code'} file</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Utility for responsive font sizing
function clamp(min, pref, max) {
  return `clamp(${min}px, ${pref}, ${max}px)`;
}

