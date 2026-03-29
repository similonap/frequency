import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Mode      = 'single' | 'multi' | 'world'
type GamePhase = 'listen' | 'guess' | 'result'

// ── Main screen oscilloscope ───────────────────────────────────

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

function OscilloscopeCanvas({ mode, isDark }: { mode: Mode | null; isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const timeRef   = useRef(0)
  const modeRef   = useRef(mode)
  const isDarkRef = useRef(isDark)
  const ampsRef   = useRef([0.24, 0, 0, 0, 0, 0, 0])

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
      const ctx  = canvas.getContext('2d')
      if (!ctx) return
      const dpr  = window.devicePixelRatio || 1
      const w    = canvas.width  / dpr
      const h    = canvas.height / dpr
      const t    = timeRef.current
      const amps = ampsRef.current
      const dark = isDarkRef.current

      const tgt = TARGETS[modeRef.current ?? 'default']
      for (let i = 0; i < amps.length; i++) amps[i] += (tgt[i] - amps[i]) * 0.05

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      for (let i = 1; i < COMPS.length; i++) {
        if (amps[i] < 0.01) continue
        const { freq, phase, speed } = COMPS[i]
        ctx.save()
        ctx.strokeStyle = dark ? 'rgba(0,255,136,0.18)' : 'rgba(0,100,50,0.20)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          const y = h / 2 + amps[i] * (h / 2) * Math.sin((px / w) * freq * Math.PI * 2 + phase + t * speed)
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()
      }

      const drawComposite = (alpha: number, blur: number, tOff: number) => {
        ctx.save()
        ctx.strokeStyle = dark ? `rgba(0,255,136,${alpha})` : `rgba(0,122,56,${alpha})`
        ctx.lineWidth = 1.5
        if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = dark ? '#00ff88' : '#007a38' }
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

      drawComposite(0.06, 0,  -0.12)
      drawComposite(0.14, 0,  -0.06)
      drawComposite(0.50, dark ? 10 : 4, 0)
      drawComposite(1.0,  dark ? 22 : 8, 0)

      timeRef.current += 0.016
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="osc-canvas" />
}

// ── Game: pure-sine canvas ────────────────────────────────────

function FreqCanvas({ freq, isDark }: { freq: number; isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const timeRef   = useRef(0)
  const freqRef   = useRef(freq)
  const isDarkRef = useRef(isDark)

  useEffect(() => { freqRef.current  = freq   }, [freq])
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
      const ctx  = canvas.getContext('2d')
      if (!ctx) return
      const dpr  = window.devicePixelRatio || 1
      const w    = canvas.width  / dpr
      const h    = canvas.height / dpr
      const t    = timeRef.current
      const f    = freqRef.current
      const dark = isDarkRef.current

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // cycles visible = f/100 so higher freq = more cycles = visually different
      const cycles = f / 100
      const amp    = h * 0.36

      const drawLine = (alpha: number, blur: number, tOff: number) => {
        ctx.save()
        ctx.strokeStyle = dark ? `rgba(0,255,136,${alpha})` : `rgba(0,122,56,${alpha})`
        ctx.lineWidth = 1.5
        if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = dark ? '#00ff88' : '#007a38' }
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          const phase = (px / w) * cycles * Math.PI * 2 + (t + tOff) * 2.5
          const y = h / 2 + amp * Math.sin(phase)
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()
      }

      drawLine(0.06, 0,           -0.12)
      drawLine(0.14, 0,           -0.06)
      drawLine(0.50, dark ? 10 : 4, 0)
      drawLine(1.0,  dark ? 20 : 6, 0)

      timeRef.current += 0.016
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="freq-canvas" />
}

// ── Web Audio ─────────────────────────────────────────────────

function useAudio() {
  const ctxRef  = useRef<AudioContext | null>(null)
  const oscRef  = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const ensure = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }

  const play = useCallback((freq: number) => {
    const ctx = ensure()
    if (oscRef.current) { oscRef.current.frequency.value = freq; return }
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.06)
    osc.start()
    oscRef.current  = osc
    gainRef.current = gain
  }, [])

  const stop = useCallback(() => {
    if (!gainRef.current || !ctxRef.current || !oscRef.current) return
    const ctx  = ctxRef.current
    const gain = gainRef.current
    const osc  = oscRef.current
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08)
    setTimeout(() => { try { osc.stop(); osc.disconnect() } catch {} }, 120)
    oscRef.current  = null
    gainRef.current = null
  }, [])

  const setFreq = useCallback((freq: number) => {
    if (oscRef.current) oscRef.current.frequency.value = freq
  }, [])

  return { play, stop, setFreq }
}

// ── Helpers ───────────────────────────────────────────────────

const FREQ_MIN = 110
const FREQ_MAX = 880

const sliderToFreq = (v: number) =>
  Math.round(FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, v / 1000))

const freqToSlider = (f: number) =>
  Math.round(1000 * Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN))

const randomFreq = () => {
  const t = Math.random()
  return Math.round(sliderToFreq(t * 1000) / 5) * 5
}

const calcScore = (target: number, guess: number) => {
  const cents = Math.abs(1200 * Math.log2(guess / target))
  return Math.max(0, Math.round(100 - cents / 12))
}

const scoreLabel = (s: number) => {
  if (s >= 98) return 'perfect'
  if (s >= 85) return 'close'
  if (s >= 65) return 'almost'
  if (s >= 40) return 'off'
  return 'way off'
}

const NOTE_NAMES = ['A','A♯','B','C','C♯','D','D♯','E','F','F♯','G','G♯']
const freqToNote = (freq: number) => {
  const semis  = Math.round(12 * Math.log2(freq / 440))
  const idx    = ((semis % 12) + 12) % 12
  const octave = 4 + Math.floor((semis + 9) / 12)
  return `${NOTE_NAMES[idx]}${octave}`
}

// ── Game Screen ───────────────────────────────────────────────

function GameScreen({ isDark, onBack }: { isDark: boolean; onBack: () => void }) {
  const [phase,      setPhase]     = useState<GamePhase>('listen')
  const [targetFreq, setTargetFreq] = useState(randomFreq)
  const [guessFreq,  setGuessFreq]  = useState(440)
  const [countdown,  setCountdown]  = useState(5)
  const audio = useAudio()

  // Stop audio on unmount
  useEffect(() => () => { audio.stop() }, [])

  // Listen phase
  useEffect(() => {
    if (phase !== 'listen') return
    audio.play(targetFreq)
    setCountdown(5)
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(tick)
          audio.stop()
          setPhase('guess')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => { clearInterval(tick); audio.stop() }
  }, [phase, targetFreq])

  // Guess phase: play current guess
  useEffect(() => {
    if (phase !== 'guess') return
    audio.play(guessFreq)
    return () => audio.stop()
  }, [phase])

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = sliderToFreq(Number(e.target.value))
    setGuessFreq(f)
    audio.setFreq(f)
  }

  const submit = () => { audio.stop(); setPhase('result') }

  const playAgain = () => {
    setTargetFreq(randomFreq())
    setGuessFreq(440)
    setPhase('listen')
  }

  const score = calcScore(targetFreq, guessFreq)

  return (
    <div className="game-screen">
      <button className="back-btn" onClick={onBack}>← back</button>

      {phase === 'listen' && (
        <div className="phase-listen">
          <p className="phase-label">listen carefully</p>
          <div className="countdown">{countdown}</div>
          <div className="game-canvas-wrap">
            <FreqCanvas freq={targetFreq} isDark={isDark} />
          </div>
        </div>
      )}

      {phase === 'guess' && (
        <div className="phase-guess">
          <p className="phase-label">match the frequency</p>
          <div className="game-canvas-wrap">
            <FreqCanvas freq={guessFreq} isDark={isDark} />
          </div>
          <div className="slider-section">
            <div className="freq-display">
              <span className="freq-hz">{guessFreq} Hz</span>
              <span className="freq-note">{freqToNote(guessFreq)}</span>
            </div>
            <input
              type="range"
              className="freq-slider"
              min={0} max={1000}
              value={freqToSlider(guessFreq)}
              onChange={handleSlider}
            />
            <div className="slider-ends">
              <span>{FREQ_MIN} Hz</span>
              <span>{FREQ_MAX} Hz</span>
            </div>
          </div>
          <button className="submit-btn" onClick={submit}>submit →</button>
        </div>
      )}

      {phase === 'result' && (
        <div className="phase-result">
          <div className="score-block">
            <span className="score-num">{score}%</span>
            <span className="score-label">{scoreLabel(score)}</span>
          </div>
          <div className="result-waves">
            <div className="result-row">
              <div className="result-meta">
                <span className="result-tag">original</span>
                <span className="result-freq">{targetFreq} Hz · {freqToNote(targetFreq)}</span>
              </div>
              <div className="game-canvas-wrap">
                <FreqCanvas freq={targetFreq} isDark={isDark} />
              </div>
            </div>
            <div className="result-divider" />
            <div className="result-row">
              <div className="result-meta">
                <span className="result-tag">your answer</span>
                <span className="result-freq">{guessFreq} Hz · {freqToNote(guessFreq)}</span>
              </div>
              <div className="game-canvas-wrap">
                <FreqCanvas freq={guessFreq} isDark={isDark} />
              </div>
            </div>
          </div>
          <button className="submit-btn" onClick={playAgain}>play again →</button>
        </div>
      )}
    </div>
  )
}

// ── Main screen icons ─────────────────────────────────────────

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
    <button className="theme-toggle" onClick={onToggle}>
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2"  x2="12" y2="5"  /><line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2"  y1="12" x2="5"  y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
          <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
        </svg>
      ) : (
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

// ── App ───────────────────────────────────────────────────────

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
        <header className="site-header">
          <span className="header-mark">FREQ</span>
          <div className="header-right">
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} />
            <span className="header-ver">v 0.1.0</span>
          </div>
        </header>
        <GameScreen isDark={isDark} onBack={() => setLaunched(null)} />
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
