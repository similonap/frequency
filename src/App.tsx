import { useEffect, useRef, useState } from 'react'
import './App.css'

type Mode  = 'single' | 'multi' | 'world'

const COMPS = [
  { freq: 2.0,  phase: 0.0, speed: 0.90 },
  { freq: 3.7,  phase: 0.8, speed: 1.30 },
  { freq: 5.9,  phase: 1.6, speed: 0.75 },
  { freq: 9.3,  phase: 2.4, speed: 1.50 },
  { freq: 14.8, phase: 0.3, speed: 1.10 },
  { freq: 23.1, phase: 1.1, speed: 1.80 },
  { freq: 37.4, phase: 2.0, speed: 0.60 },
]

const TARGETS: Record<string, number[]> = {
  default: [0.24, 0,    0,    0,    0,    0,    0   ],
  single:  [0.34, 0,    0,    0,    0,    0,    0   ],
  multi:   [0.18, 0.15, 0.10, 0,    0,    0,    0   ],
  world:   [0.11, 0.09, 0.08, 0.08, 0.07, 0.05, 0.04],
}

// Canvas colours per theme
const THEME_COLORS = {
  dark: {
    bg:        '#020407',
    grid:      'rgba(0,255,136,0.055)',
    axis:      'rgba(0,255,136,0.12)',
    comp:      'rgba(0,255,136,0.18)',
    wave:      '#00ff88',
    glow:      '#00ff88',
    glowBlur1: 10,
    glowBlur2: 22,
  },
  light: {
    bg:        '#eceae3',
    grid:      'rgba(0,100,50,0.09)',
    axis:      'rgba(0,100,50,0.18)',
    comp:      'rgba(0,100,50,0.20)',
    wave:      '#007a38',
    glow:      '#007a38',
    glowBlur1: 4,
    glowBlur2: 8,
  },
}

function OscilloscopeCanvas({ mode, isDark }: { mode: Mode | null; isDark: boolean }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const animRef    = useRef<number>(0)
  const timeRef    = useRef(0)
  const modeRef    = useRef(mode)
  const isDarkRef  = useRef(isDark)
  const ampsRef    = useRef([0.24, 0, 0, 0, 0, 0, 0])

  useEffect(() => { modeRef.current  = mode   }, [mode])
  useEffect(() => { isDarkRef.current = isDark }, [isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr  = window.devicePixelRatio || 1
      canvas.width  = rect.width  * dpr
      canvas.height = rect.height * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr  = window.devicePixelRatio || 1
      const w    = canvas.width  / dpr
      const h    = canvas.height / dpr
      const t    = timeRef.current
      const amps = ampsRef.current
      const C    = isDarkRef.current ? THEME_COLORS.dark : THEME_COLORS.light

      // Lerp amplitudes toward current mode target
      const tgt = TARGETS[modeRef.current ?? 'default']
      for (let i = 0; i < amps.length; i++) {
        amps[i] += (tgt[i] - amps[i]) * 0.05
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Faint individual components (multi / world)
      for (let i = 1; i < COMPS.length; i++) {
        if (amps[i] < 0.01) continue
        const { freq, phase, speed } = COMPS[i]
        ctx.save()
        ctx.strokeStyle = C.comp
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          const y = h / 2 + amps[i] * (h / 2) * Math.sin((px / w) * freq * Math.PI * 2 + phase + t * speed)
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()
      }

      // Composite line — ghost + glow + sharp
      const drawComposite = (alpha: number, blur: number, tOff: number) => {
        ctx.save()
        ctx.strokeStyle = isDarkRef.current
          ? `rgba(0,255,136,${alpha})`
          : `rgba(0,122,56,${alpha})`
        ctx.lineWidth = 1.5
        if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = C.glow }
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          let y = 0
          for (let i = 0; i < COMPS.length; i++) {
            if (amps[i] < 0.001) continue
            const { freq, phase, speed } = COMPS[i]
            y += amps[i] * Math.sin((px / w) * freq * Math.PI * 2 + phase + (t + tOff) * speed)
          }
          const fy = h / 2 + y * (h / 2)
          px === 0 ? ctx.moveTo(px, fy) : ctx.lineTo(px, fy)
        }
        ctx.stroke()
        ctx.restore()
      }

      drawComposite(0.06, 0,               -0.12)
      drawComposite(0.14, 0,               -0.06)
      drawComposite(0.50, C.glowBlur1,      0)
      drawComposite(1.0,  C.glowBlur2,      0)

      timeRef.current += 0.016
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="osc-canvas" />
}

function ModeIcon({ mode }: { mode: Mode }) {
  if (mode === 'single') return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
  if (mode === 'multi') return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9"  cy="8" r="3.5" />
      <circle cx="16" cy="8" r="3.5" />
      <path d="M2 20c0-3.3 2.9-6 7-6" />
      <path d="M15 14c4 0 7 2.5 7 6" />
      <path d="M9 14c1-.4 2.2-.6 3.5-.6s2.5.2 3.5.6" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a14 14 0 0 1 3.5 9A14 14 0 0 1 12 21a14 14 0 0 1-3.5-9A14 14 0 0 1 12 3z" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button className="theme-toggle" onClick={onToggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {isDark ? (
        // Sun
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2"  x2="12" y2="5"  />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2"  y1="12" x2="5"  y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
          <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
        </svg>
      ) : (
        // Moon
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      )}
    </button>
  )
}

const MODE_META: { id: Mode; label: string; sub: string }[] = [
  { id: 'single', label: 'Single',      sub: 'solo signal'      },
  { id: 'multi',  label: 'Multiplayer', sub: 'sync wavelengths' },
  { id: 'world',  label: 'World',       sub: 'global broadcast' },
]

function App() {
  const [hovered,  setHovered]  = useState<Mode | null>(null)
  const [launched, setLaunched] = useState<Mode | null>(null)
  const [isDark,   setIsDark]   = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  if (launched) {
    return (
      <div className="game-view">
        <button className="back-btn" onClick={() => setLaunched(null)}>← back</button>
        <div className="game-placeholder">
          <div className="placeholder-scope">
            <OscilloscopeCanvas mode={launched} isDark={isDark} />
          </div>
          <p className="placeholder-label">{launched} · initializing signal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="start-screen">
      <header className="site-header">
        <span className="header-mark">FREQ</span>
        <div className="header-right">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} />
          <span className="header-ver">v 0.1.0</span>
        </div>
      </header>

      <section className="hero-section">
        <h1 className="game-title">FREQUENCY</h1>
      </section>

      <section className="modes-section">
        <div className="modes-grid">
          {MODE_META.map(({ id, label, sub }) => (
            <button
              key={id}
              className={`mode-btn${hovered === id ? ' is-active' : ''}`}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setLaunched(id)}
            >
              <div className="mode-btn-icon"><ModeIcon mode={id} /></div>
              <span className="mode-btn-label">{label}</span>
              <span className="mode-btn-sub">{sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="scope-section">
        <div className="scope-frame">
          <OscilloscopeCanvas mode={hovered} isDark={isDark} />
        </div>
      </section>
    </div>
  )
}

export default App
