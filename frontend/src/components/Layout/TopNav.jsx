import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, User, Brain } from 'lucide-react';

const TABS = ['Analyze', 'Compare', 'Learn', 'Interview'];

export default function TopNav({ activeMode, onModeChange, isDark, onThemeToggle }) {
  const navigate = useNavigate();
  const tabRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [memoryCount, setMemoryCount] = useState(0);
  const username = localStorage.getItem("refyn_username");

  useEffect(() => {
    if (username) {
      fetch(`\${window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://refyn-production-5a6b.up.railway.app'}/api/memory/${username}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setMemoryCount(data.data.totalMemories || 0);
          }
        })
        .catch(() => {});
    }

    const handleMemoryUpdate = (e) => setMemoryCount(e.detail.count);
    window.addEventListener('memoryUpdated', handleMemoryUpdate);
    return () => window.removeEventListener('memoryUpdated', handleMemoryUpdate);
  }, [username]);

  useEffect(() => {
    const idx = TABS.indexOf(activeMode);
    const el = tabRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeMode]);

  return (
    <nav style={{
      height: 60, display: 'flex', alignItems: 'center',
      background: 'var(--bg)', borderBottom: '1px solid var(--border)',
      padding: '0 20px', position: 'sticky', top: 0, zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', userSelect: 'none', flexShrink: 0,
        }}
      >
        <span style={{ color: 'var(--accent)', fontSize: 20, fontWeight: 700 }}>⬡</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Refyn
        </span>
      </div>

      {/* Center tabs */}
      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ position: 'relative', display: 'flex', gap: 0 }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              ref={el => tabRefs.current[i] = el}
              onClick={() => onModeChange(tab)}
              style={{
                padding: '8px 20px', fontSize: 13, fontWeight: 500,
                color: activeMode === tab ? 'var(--text)' : 'var(--text-muted)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'color 200ms ease',
                position: 'relative',
              }}
            >
              {tab}
            </button>
          ))}
          {/* Sliding underline */}
          <div style={{
            position: 'absolute', bottom: 0, height: 2,
            background: 'var(--accent)', borderRadius: 1,
            transition: 'left 250ms cubic-bezier(0.25,0.46,0.45,0.94), width 200ms cubic-bezier(0.25,0.46,0.45,0.94)',
            left: indicator.left, width: indicator.width,
          }} />
        </div>
      </div>

      {/* Theme toggle */}
      <button
        onClick={onThemeToggle}
        style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 8, background: 'var(--surface-high)', border: '1px solid var(--border)',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? 'moon' : 'sun'}
            initial={{ rotate: -180, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 180, scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {isDark
              ? <Moon size={16} color="var(--text-secondary)" />
              : <Sun size={16} color="var(--text-secondary)" />
            }
          </motion.div>
        </AnimatePresence>
      </button>
      
      {username && (
        <div style={{
          marginLeft: 16,
          background: 'var(--surface)',
          padding: '6px 12px',
          borderRadius: 16,
          fontSize: 13,
          color: 'var(--accent)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid var(--border)'
        }}>
          <User size={14} style={{ marginRight: -4 }} /> {username} <span style={{color: 'var(--text-muted)'}}>•</span> <Brain size={14} style={{ marginRight: -4 }} /> {memoryCount} patterns
        </div>
      )}
    </nav>
  );
}
