import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

const circumference = 314.16

function MiniRing({ score }) {
  const color  = score >= 66 ? '#22c55e' : score >= 41 ? '#f59e0b' : '#ef4444'
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
  return (
    <svg viewBox="0 0 120 120" width={90} height={90}>
      <circle cx={60} cy={60} r={50} fill="none" stroke="var(--border)" strokeWidth={10}/>
      <circle cx={60} cy={60} r={50} fill="none" stroke={color} strokeWidth={10}
        strokeLinecap="round" transform="rotate(-90 60 60)"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition:'stroke-dashoffset 600ms ease-out, stroke 300ms' }}
      />
      <text x={60} y={60} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize:26, fontWeight:700, fill:color, fontFamily:'Inter,sans-serif' }}>
        {score}
      </text>
    </svg>
  )
}

const SEV_COLOR = { CRITICAL:'#ef4444', WARNING:'#f59e0b', INFO:'#6366f1' }

export default function SmartFixPanel({
  isOpen, onClose, fixes = [], currentScore,
  language, isDark, onApplyFix, onApplyAll
}) {
  const [idx, setIdx]           = useState(0)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(new Set())
  const [liveScore, setLive]    = useState(currentScore || 0)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState(null)

  // ── Drag state ──
  const [pos, setPos] = useState({ x: 0, y: 0 }) // offset from center
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const onDragStart = useCallback((e) => {
    // Only drag from header, not buttons
    if (e.target.tagName === 'BUTTON') return
    dragging.current = true
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    document.body.style.userSelect = 'none'
  }, [pos])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setIdx(0)
      setApplied(new Set())
      setLive(currentScore || 0)
      setDone(false)
      setError(null)
      setPos({ x: 0, y: 0 }) // re-center on open
    }
  }, [isOpen, currentScore])

  if (!isOpen) return null

  const fix = fixes[idx]
  const sevColor = fix ? (SEV_COLOR[(fix.severity || '').toUpperCase()] || '#6366f1') : '#6366f1'
  const totalDelta = fixes.reduce((s, f) => s + (f.scoreDelta || 8), 0)

  const advance = () => {
    if (idx + 1 >= fixes.length) setDone(true)
    else setIdx(i => i + 1)
  }

  const doApply = async () => {
    if (!fix || applying) return
    setApplying(true)
    setError(null)
    try {
      await onApplyFix(fix.id)
      setApplied(s => new Set([...s, fix.id]))
      setLive(s => Math.min(100, s + (fix.scoreDelta || 8)))
      await new Promise(r => setTimeout(r, 300))
      advance()
    } catch (err) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  const doApplyAll = async () => {
    if (applying) return
    setApplying(true)
    setError(null)
    try {
      const remaining = fixes.filter(f => !applied.has(f.id)).map(f => f.id)
      await onApplyAll(remaining)
      setApplied(new Set(fixes.map(f => f.id)))
      setLive(Math.min(100, (currentScore || 0) + totalDelta))
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose}
            style={{
              position:'fixed', inset:0,
              background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)',
              zIndex:400
            }}
          />

          {/* panel — draggable */}
          <motion.div
            initial={{ opacity:0, scale:0.95 }}
            animate={{ opacity:1, scale:1 }}
            exit={{    opacity:0, scale:0.95 }}
            transition={{ duration:0.2 }}
            onClick={e => e.stopPropagation()}
            style={{
              position:'fixed',
              top: `calc(50% + ${pos.y}px)`,
              left: `calc(50% + ${pos.x}px)`,
              transform:'translate(-50%,-50%)',
              width: Math.min(typeof window !== 'undefined' ? window.innerWidth - 40 : 780, 780),
              maxHeight:'85vh',
              background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:12, overflow:'hidden', zIndex:401,
              display:'flex', flexDirection:'column',
              boxShadow:'0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            {/* ── HEADER (drag handle) ── */}
            <div
              onMouseDown={onDragStart}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'14px 20px', borderBottom:'1px solid var(--border)', flexShrink:0,
                cursor: dragging.current ? 'grabbing' : 'grab', userSelect:'none'
              }}
            >
              <span style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>
                ⚡ Smart Fix
              </span>

              {!done && fixes.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {idx + 1} / {fixes.length}
                  </span>
                  {fixes.map((f, i) => (
                    <span key={f.id || i} style={{
                      width:8, height:8, borderRadius:'50%', display:'inline-block',
                      background: applied.has(f.id) ? '#22c55e'
                        : i === idx ? 'var(--accent)' : 'var(--border)',
                      transition:'background 300ms'
                    }}/>
                  ))}
                </div>
              )}

              <button onClick={onClose}
                style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:20, cursor:'pointer', lineHeight:1 }}>
                ✕
              </button>
            </div>

            {done ? (
              /* ── COMPLETION ── */
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{
                  flex:1, display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:16, padding:40
                }}
              >
                <motion.div
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ type:'spring', stiffness:200 }}
                  style={{ fontSize:52, lineHeight:1 }}
                >✅</motion.div>

                <h2 style={{ fontSize:20, color:'var(--text)', margin:0 }}>
                  All fixes applied!
                </h2>

                <div style={{ display:'flex', alignItems:'center', gap:16, margin:'8px 0' }}>
                  <span style={{ fontSize:44, fontWeight:700, color:'var(--error)' }}>
                    {currentScore || 0}
                  </span>
                  <span style={{ fontSize:24, color:'var(--text-muted)' }}>→</span>
                  <span style={{ fontSize:44, fontWeight:700, color:'var(--success)' }}>
                    {liveScore}
                  </span>
                  <span style={{ fontSize:18, fontWeight:700, color:'var(--success)' }}>
                    +{liveScore - (currentScore || 0)}
                  </span>
                </div>

                <p style={{ fontSize:13, color:'var(--text-muted)', margin:0 }}>
                  {applied.size} fix{applied.size !== 1 ? 'es' : ''} applied
                  · {fixes.length - applied.size} skipped
                </p>

                <button onClick={onClose} style={{
                  padding:'10px 28px', background:'var(--accent)',
                  color:'white', border:'none', borderRadius:8,
                  fontSize:14, fontWeight:600, cursor:'pointer', marginTop:8
                }}>
                  Done
                </button>
              </motion.div>

            ) : fix ? (
              /* ── FIX VIEW ── */
              <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

                {/* LEFT — fix info */}
                <div style={{
                  flex:'0 0 58%', padding:20, overflow:'auto',
                  borderRight:'1px solid var(--border)',
                  display:'flex', flexDirection:'column', gap:14
                }}>
                  {/* title row */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{
                      padding:'3px 8px', borderRadius:4, fontSize:11,
                      fontWeight:700, color:'white', background: sevColor
                    }}>
                      {(fix.severity || 'INFO').toUpperCase()}
                    </span>
                    <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>
                      {fix.title}
                    </span>
                    {fix.line && (
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                        · Line {fix.line}
                      </span>
                    )}
                  </div>

                  {/* description */}
                  <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>
                    {fix.description || fix.explanation || ''}
                  </p>

                  {/* what will be fixed */}
                  {fix.fix && (
                    <div style={{
                      background:'rgba(99,102,241,0.08)',
                      border:'1px solid rgba(99,102,241,0.2)',
                      borderRadius:8, padding:'10px 14px'
                    }}>
                      <div style={{ fontSize:11, color:'var(--accent)', fontWeight:700, marginBottom:6, letterSpacing:'0.08em' }}>
                        HOW IT WILL BE FIXED
                      </div>
                      <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0, lineHeight:1.55 }}>
                        {fix.fix}
                      </p>
                    </div>
                  )}

                  {/* detected by */}
                  {fix.detectedBy?.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em', fontWeight:600 }}>
                        DETECTED BY
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {['gemini','llama','mixtral','qwen'].map(m => (
                          <span key={m} style={{
                            padding:'3px 10px', borderRadius:20, fontSize:12,
                            background: fix.detectedBy.includes(m)
                              ? 'rgba(34,197,94,0.12)' : 'var(--surface-high)',
                            color: fix.detectedBy.includes(m)
                              ? 'var(--success)' : 'var(--text-muted)',
                            border: `1px solid ${fix.detectedBy.includes(m) ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`
                          }}>
                            {fix.detectedBy.includes(m) ? '● ' : '○ '}{m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* error message */}
                  {error && (
                    <div style={{
                      padding:'10px 14px', background:'rgba(239,68,68,0.1)',
                      border:'1px solid rgba(239,68,68,0.3)', borderRadius:6,
                      fontSize:13, color:'var(--error)'
                    }}>
                      ✕ {error} — try skipping this fix
                    </div>
                  )}

                  {/* action buttons */}
                  <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:8 }}>
                    <button
                      onClick={doApply}
                      disabled={applying}
                      style={{
                        padding:'9px 20px', fontSize:13, fontWeight:600,
                        borderRadius:6, cursor: applying ? 'wait' : 'pointer',
                        background:'var(--success)', color:'#0a0a0f', border:'none',
                        opacity: applying ? 0.75 : 1, transition:'opacity 150ms',
                        display:'flex', alignItems:'center', gap:8, flexShrink:0
                      }}
                    >
                      {applying ? (
                        <>
                          <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>◌</span>
                          Fixing with AI...
                        </>
                      ) : '✓ Apply Fix'}
                    </button>

                    <button
                      onClick={() => { setError(null); advance() }}
                      disabled={applying}
                      style={{
                        padding:'9px 16px', fontSize:13, borderRadius:6,
                        cursor:'pointer', background:'transparent',
                        border:'1px solid var(--border)', color:'var(--text-muted)'
                      }}
                    >
                      Skip
                    </button>

                    <button
                      onClick={doApplyAll}
                      disabled={applying}
                      style={{
                        padding:'9px 16px', fontSize:13, borderRadius:6,
                        cursor: applying ? 'wait' : 'pointer', background:'transparent',
                        border:'1px solid var(--accent)', color:'var(--accent)',
                        marginLeft:'auto', flexShrink:0
                      }}
                    >
                      {applying ? '◌ Working...' : `Apply All ${fixes.length}`}
                    </button>
                  </div>
                </div>

                {/* RIGHT — score tracker */}
                <div style={{
                  flex:'0 0 42%', padding:24,
                  display:'flex', flexDirection:'column', alignItems:'center', gap:16,
                  overflow:'auto'
                }}>
                  <MiniRing score={liveScore || 0} />

                  <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:0 }}>
                    {[
                      { label:'Current score', val: currentScore ?? '—', color:'var(--text-secondary, #aaa)' },
                      { label:'This fix adds', val: fix?.scoreDelta ? `+${fix.scoreDelta}` : '+~8', color:'#22c55e' },
                      { label:'All fixes add', val: `+${totalDelta}`, color:'#818cf8' },
                      { label:'Final score', val: Math.min(100, (currentScore || 0) + totalDelta), color:'#22c55e' },
                    ].map(row => (
                      <div key={row.label} style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'10px 0', borderBottom:'1px solid var(--border)',
                        fontSize:13
                      }}>
                        <span style={{ color:'var(--text-muted, #888)' }}>{row.label}</span>
                        <span style={{ color:row.color, fontWeight:700, fontSize:15 }}>{row.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* applying indicator */}
                  {applying && (
                    <div style={{
                      width:'100%', marginTop:8, padding:'12px 14px',
                      background:'rgba(99,102,241,0.08)',
                      border:'1px solid rgba(99,102,241,0.25)',
                      borderRadius:8, textAlign:'center'
                    }}>
                      <div style={{ fontSize:12, color:'var(--accent)', marginBottom:8, fontWeight:600 }}>
                        ⚡ Groq + Ollama cascade...
                      </div>
                      <div style={{
                        height:3, background:'var(--border)', borderRadius:2, overflow:'hidden'
                      }}>
                        <div style={{
                          height:'100%', width:'40%',
                          background:'var(--accent)', borderRadius:2,
                          animation:'indeterminate 1.2s ease infinite'
                        }}/>
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
                        First to respond wins
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* no fixes */
              <div style={{
                flex:1, display:'flex', alignItems:'center',
                justifyContent:'center', color:'var(--text-muted)', fontSize:14, padding:40
              }}>
                No issues to fix. Run Analyze first.
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}
