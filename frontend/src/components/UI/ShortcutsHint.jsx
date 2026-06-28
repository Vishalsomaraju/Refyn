import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ShortcutsHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // only show once per session
    const seen = sessionStorage.getItem('shortcuts-seen');
    if (seen) return;
    const t = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem('shortcuts-seen', '1');
      setTimeout(() => setVisible(false), 5000);
    }, 1500); // show 1.5s after page loads
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--surface-high)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 20px', fontSize: 12, color: 'var(--text-muted)',
            zIndex: 500, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}
        >
          <kbd style={{ background: 'var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 11 }}>Ctrl+Enter</kbd> Run &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 11 }}>Ctrl+⇧A</kbd> Analyze &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 11 }}>Ctrl+K</kbd> Chat &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 11 }}>Ctrl+S</kbd> Export
        </motion.div>
      )}
    </AnimatePresence>
  );
}
