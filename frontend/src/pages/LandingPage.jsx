import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, History, Code, Braces, Terminal, Bug, ShieldCheck, Zap, Brain, Search } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Load sessions if username is typed
  useEffect(() => {
    if (!username.trim()) {
      setSessions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/memory/${username}`)
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
      {/* Grid Pattern Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4,
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
      }} />

      {/* Subtle Warm Radial Glow behind Logo */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100vw', height: '100vw', maxWidth: 1000, maxHeight: 1000,
        background: 'radial-gradient(circle, rgba(197, 124, 94, 0.05) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Floating 3D Icons (Only Code Relevant) */}
      <FloatingIcon icon={<Code />} size={48} x="12vw" y="25vh" delay={0} color="#8b5cf6" mPos={mousePos} speed={1.5} />
      <FloatingIcon icon={<Braces />} size={40} x="82vw" y="20vh" delay={1} color="#3b82f6" mPos={mousePos} speed={-1} />
      <FloatingIcon icon={<Zap />} size={56} x="18vw" y="75vh" delay={2} color="#f59e0b" mPos={mousePos} speed={0.8} />
      <FloatingIcon icon={<ShieldCheck />} size={44} x="78vw" y="70vh" delay={0.5} color="#10b981" mPos={mousePos} speed={-1.2} />
      <FloatingIcon icon={<Bug />} size={32} x="85vw" y="45vh" delay={1.5} color="#ec4899" mPos={mousePos} speed={2} />
      <FloatingIcon icon={<Terminal />} size={36} x="10vw" y="50vh" delay={0.8} color="#6366f1" mPos={mousePos} speed={-0.5} />

      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 480 }}>
        
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ textAlign: 'center', marginBottom: 56, position: 'relative' }}
        >
          <h1 style={{
            fontSize: clamp(72, '14vw', 104),
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.04em',
            margin: 0,
            lineHeight: 1.05,
            textShadow: '0 0 40px rgba(197, 124, 94, 0.2)'
          }}>
            Refyn<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{
            fontSize: 20,
            color: 'var(--text-secondary)',
            marginTop: 12,
            fontWeight: 500,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap'
          }}>
            Your code. Reviewed. Remembered. Refined.
          </p>
        </motion.div>

        {/* Input & Button Section (Directly on page) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
          }}
        >
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
              padding: '20px 24px',
              fontSize: 16,
              background: 'var(--surface)',
              border: `2px solid ${isFocused ? '#c57c5e' : 'var(--border)'}`,
              borderRadius: 14,
              color: 'var(--text)',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              boxShadow: isFocused ? '0 8px 30px rgba(197, 124, 94, 0.15)' : '0 10px 24px rgba(0,0,0,0.04)'
            }}
          />

          <button
            onClick={handleStart}
            disabled={!username.trim()}
            style={{
              width: '100%',
              padding: '20px 24px',
              fontSize: 16,
              fontWeight: 700,
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              cursor: username.trim() ? 'pointer' : 'not-allowed',
              opacity: username.trim() ? 1 : 0.6,
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transform: username.trim() ? 'translateY(0)' : 'none',
              boxShadow: username.trim() ? '0 12px 24px var(--accent-glow)' : 'none'
            }}
            onMouseEnter={(e) => username.trim() && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => username.trim() && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Start Session <ArrowRight size={18} />
          </button>
          
          {/* Stat Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2c2c2b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', color: '#8a8784', fontSize: 12, fontWeight: 500 }}>
              <Zap size={12} /> CascadeFlow Routing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2c2c2b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', color: '#8a8784', fontSize: 12, fontWeight: 500 }}>
              <Brain size={12} /> Hindsight Memory
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2c2c2b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', color: '#8a8784', fontSize: 12, fontWeight: 500 }}>
              <Search size={12} /> Multi-Model Analysis
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {sessions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', marginTop: 40, overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-secondary)' }}>
                <History size={16} />
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Recent Sessions
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c57c5e';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(197, 124, 94, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Session {new Date(session.timestamp || Date.now()).toLocaleDateString()}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{session.language || 'Code'} file</div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-high)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <ArrowRight size={14} color="var(--text-muted)" />
                    </div>
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

// Floating icon component for background depth
function FloatingIcon({ icon, size, x, y, delay, color, mPos, speed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.35, y: 0 }}
      transition={{ delay, duration: 1 }}
      style={{
        position: 'absolute', left: x, top: y,
        color: color, width: size, height: size,
        pointerEvents: 'none', zIndex: 1
      }}
    >
      <motion.div
        animate={{
          y: [0, -15, 0],
          x: mPos.x * speed,
          y: (mPos.y * speed) + [0, -15, 0][0] // simplistic parallax merge
        }}
        transition={{
          y: { repeat: Infinity, duration: 4 + Math.random() * 2, ease: "easeInOut" },
          x: { type: "spring", damping: 50 },
        }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Render icon with forced size */}
        <div style={{ transform: `scale(${size/24})` }}>
          {icon}
        </div>
      </motion.div>
    </motion.div>
  );
}
