import { motion, AnimatePresence } from 'framer-motion';

export function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', bottom: 88, right: 24, zIndex: 9999,
            background: 'var(--surface-high)', border: '1px solid var(--border)',
            borderLeft: '3px solid var(--accent)',
            padding: '11px 18px', borderRadius: 8,
            fontSize: 13, color: 'var(--text)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            maxWidth: 300, lineHeight: 1.4, pointerEvents: 'none',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
