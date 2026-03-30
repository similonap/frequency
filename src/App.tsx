import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Mode      = 'single' | 'world'
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

// ── Game: multi-frequency sine canvas ────────────────────────

function FreqCanvas({ freqs, isDark }: { freqs: number[]; isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const timeRef   = useRef(0)
  const freqsRef  = useRef(freqs)
  const isDarkRef = useRef(isDark)

  useEffect(() => { freqsRef.current  = freqs  }, [freqs])
  useEffect(() => { isDarkRef.current = isDark  }, [isDark])

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
      const fs   = freqsRef.current
      const dark = isDarkRef.current
      const amp  = h * 0.36

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const drawLine = (alpha: number, blur: number, tOff: number) => {
        ctx.save()
        ctx.strokeStyle = dark ? `rgba(0,255,136,${alpha})` : `rgba(0,122,56,${alpha})`
        ctx.lineWidth = 1.5
        if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = dark ? '#00ff88' : '#007a38' }
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          // sum all frequencies, normalise by count
          let sum = 0
          for (const f of fs) {
            const cycles = f / 100
            sum += Math.sin((px / w) * cycles * Math.PI * 2 + (t + tOff) * 2.5)
          }
          const y = h / 2 + amp * (sum / fs.length)
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

// ── Web Audio (multi-oscillator) ──────────────────────────────

function useAudio() {
  const ctxRef   = useRef<AudioContext | null>(null)
  const oscsRef  = useRef<OscillatorNode[]>([])
  const gainsRef = useRef<GainNode[]>([])

  const ensure = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }

  const stopAll = useCallback(() => {
    if (!ctxRef.current) return
    const ctx = ctxRef.current
    gainsRef.current.forEach((gain, i) => {
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08)
      const osc = oscsRef.current[i]
      setTimeout(() => { try { osc.stop(); osc.disconnect() } catch {} }, 120)
    })
    oscsRef.current  = []
    gainsRef.current = []
  }, [])

  const play = useCallback((freqs: number[]) => {
    const ctx = ensure()
    // if already playing the right number, just tune them
    if (oscsRef.current.length === freqs.length) {
      freqs.forEach((f, i) => { oscsRef.current[i].frequency.value = f })
      return
    }
    stopAll()
    const vol = 0.18 / freqs.length  // keep loudness constant
    freqs.forEach(f => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.06)
      osc.start()
      oscsRef.current.push(osc)
      gainsRef.current.push(gain)
    })
  }, [stopAll])

  const setFreqs = useCallback((freqs: number[]) => {
    freqs.forEach((f, i) => {
      if (oscsRef.current[i]) oscsRef.current[i].frequency.value = f
    })
  }, [])

  return { play, stop: stopAll, setFreqs }
}

// ── Helpers ───────────────────────────────────────────────────

const FREQ_MIN = 110
const FREQ_MAX = 880

const sliderToFreq = (v: number) =>
  Math.round(FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, v / 1000))

const freqToSlider = (f: number) =>
  Math.round(1000 * Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN))

const randomFreq = () =>
  Math.round(sliderToFreq(Math.random() * 1000) / 5) * 5

const randomTwoFreqs = (): [number, number] => {
  let f1 = randomFreq(), f2 = randomFreq()
  // ensure at least 4 semitones apart to be clearly distinguishable
  while (Math.abs(1200 * Math.log2(f2 / f1)) < 400) f2 = randomFreq()
  return f1 < f2 ? [f1, f2] : [f2, f1]
}

const calcScore = (target: number, guess: number) => {
  const cents = Math.abs(1200 * Math.log2(guess / target))
  return Math.max(0, Math.round(100 - cents / 12))
}

// Best-assignment matching: try both pairings, take higher total
const calcDualScore = (targets: [number, number], guesses: [number, number]) => {
  const [t1, t2] = targets
  const [g1, g2] = guesses
  const s_straight = calcScore(t1, g1) + calcScore(t2, g2)
  const s_swapped  = calcScore(t1, g2) + calcScore(t2, g1)
  if (s_straight >= s_swapped) {
    return { total: Math.round(s_straight / 2), pairs: [[t1, g1], [t2, g2]] as const }
  }
  return { total: Math.round(s_swapped / 2), pairs: [[t1, g2], [t2, g1]] as const }
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

const LISTEN_STEPS = [
  { label: 'freq · 1' },
  { label: 'freq · 2' },
  { label: 'combined' },
] as const

function GameScreen({ isDark, onBack, freqCount }: { isDark: boolean; onBack: () => void; freqCount: 1 | 2 }) {
  const [phase,       setPhase]      = useState<GamePhase>('listen')
  const [targetFreqs, setTargetFreqs] = useState<[number, number]>(() =>
    freqCount === 1 ? [randomFreq(), 0] as [number, number] : randomTwoFreqs()
  )
  const [guessFreqs,  setGuessFreqs]  = useState<[number, number]>([220, 440])
  const [listenStep,  setListenStep]  = useState<0 | 1 | 2>(0)
  const audio = useAudio()

  useEffect(() => () => { audio.stop() }, [])

  // Listen phase
  useEffect(() => {
    if (phase !== 'listen') return
    if (freqCount === 1) {
      audio.play([targetFreqs[0]])
      const t = setTimeout(() => { audio.stop(); setPhase('guess') }, 4000)
      return () => { clearTimeout(t); audio.stop() }
    }
    // Multi: freq1 (2s) → freq2 (2s) → combined (4s) → guess
    setListenStep(0)
    audio.play([targetFreqs[0]])
    const t1 = setTimeout(() => { setListenStep(1); audio.play([targetFreqs[1]]) }, 2000)
    const t2 = setTimeout(() => { setListenStep(2); audio.play(targetFreqs)      }, 4000)
    const t3 = setTimeout(() => { audio.stop(); setPhase('guess')                }, 8000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); audio.stop() }
  }, [phase, targetFreqs])

  // Guess phase
  useEffect(() => {
    if (phase !== 'guess') return
    audio.play(freqCount === 1 ? [guessFreqs[0]] : guessFreqs)
    return () => audio.stop()
  }, [phase])

  const handleSlider = (idx: 0 | 1, v: number) => {
    const f    = sliderToFreq(v)
    const next = [guessFreqs[0], guessFreqs[1]] as [number, number]
    next[idx]  = f
    setGuessFreqs(next)
    audio.setFreqs(freqCount === 1 ? [next[0]] : next)
  }

  const submit = () => { audio.stop(); setPhase('result') }

  const playAgain = () => {
    setTargetFreqs(freqCount === 1 ? [randomFreq(), 0] as [number, number] : randomTwoFreqs())
    setGuessFreqs([220, 440])
    setPhase('listen')
  }

  const singleScore = calcScore(targetFreqs[0], guessFreqs[0])
  const { total, pairs } = freqCount === 1
    ? { total: singleScore, pairs: [[targetFreqs[0], guessFreqs[0]], [0, 0]] as const }
    : calcDualScore(targetFreqs, guessFreqs)
  // Sort pairs low→high by target freq so result always reads consistently
  const sortedPairs = freqCount === 2
    ? ([...pairs].sort((a, b) => a[0] - b[0]) as typeof pairs)
    : pairs

  return (
    <div className="game-screen">
      <button className="back-btn" onClick={onBack}>← back</button>

      {phase === 'listen' && (
        <div className="phase-listen">
          <p className="phase-label">listen carefully</p>
          {freqCount === 2 && (
            <div className="listen-steps">
              {LISTEN_STEPS.map((s, i) => (
                <span key={i} className={`listen-step${listenStep === i ? ' is-active' : ''}`}>
                  {s.label}
                </span>
              ))}
            </div>
          )}
          <div className="game-canvas-wrap">
            <FreqCanvas
              freqs={freqCount === 1 ? [targetFreqs[0]] : listenStep === 0 ? [targetFreqs[0]] : listenStep === 1 ? [targetFreqs[1]] : targetFreqs}
              isDark={isDark}
            />
          </div>
        </div>
      )}

      {phase === 'guess' && (
        <div className="phase-guess">
          <p className="phase-label">{freqCount === 1 ? 'match the frequency' : 'match both frequencies'}</p>
          <div className="game-canvas-wrap">
            <FreqCanvas freqs={freqCount === 1 ? [guessFreqs[0]] : guessFreqs} isDark={isDark} />
          </div>
          <div className="slider-section">
            {(freqCount === 1 ? [0] as const : [0, 1] as const).map(i => (
              <div key={i} className="slider-row">
                <div className="freq-display">
                  <span className="freq-hz">{guessFreqs[i]} Hz</span>
                  <span className="freq-note">{freqToNote(guessFreqs[i])}</span>
                </div>
                <input
                  type="range"
                  className="freq-slider"
                  min={0} max={1000}
                  value={freqToSlider(guessFreqs[i])}
                  onChange={e => handleSlider(i, Number(e.target.value))}
                />
              </div>
            ))}
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
            <span className="score-num">{total}%</span>
            <span className="score-label">{scoreLabel(total)}</span>
          </div>

          <div className="result-waves">
            <div className="result-row">
              <div className="result-meta">
                <span className="result-tag">original</span>
                <span className="result-freq">
                  {targetFreqs[0]} Hz · {freqToNote(targetFreqs[0])}
                  {freqCount === 2 && <>
                    <span className="result-sep">+</span>
                    {targetFreqs[1]} Hz · {freqToNote(targetFreqs[1])}
                  </>}
                </span>
              </div>
              <div className="game-canvas-wrap">
                <FreqCanvas freqs={freqCount === 1 ? [targetFreqs[0]] : targetFreqs} isDark={isDark} />
              </div>
            </div>

            <div className="result-divider" />

            <div className="result-row">
              <div className="result-meta">
                <span className="result-tag">your answer</span>
                <span className="result-freq">
                  {sortedPairs[0][1]} Hz · {freqToNote(sortedPairs[0][1])}
                  <span className={`result-score-pill ${calcScore(sortedPairs[0][0], sortedPairs[0][1]) >= 85 ? 'good' : ''}`}>
                    {calcScore(sortedPairs[0][0], sortedPairs[0][1])}%
                  </span>
                  {freqCount === 2 && <>
                    <span className="result-sep">+</span>
                    {sortedPairs[1][1]} Hz · {freqToNote(sortedPairs[1][1])}
                    <span className={`result-score-pill ${calcScore(sortedPairs[1][0], sortedPairs[1][1]) >= 85 ? 'good' : ''}`}>
                      {calcScore(sortedPairs[1][0], sortedPairs[1][1])}%
                    </span>
                  </>}
                </span>
              </div>
              <div className="game-canvas-wrap">
                <FreqCanvas freqs={freqCount === 1 ? [guessFreqs[0]] : guessFreqs} isDark={isDark} />
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
  { id: 'single', label: 'Practice', sub: 'solo signal'    },
  { id: 'world',  label: 'Daily',    sub: 'one shot a day' },
]

// ── App ───────────────────────────────────────────────────────

const PRACTICE_SUBS = [
  { count: 1 as const, label: 'Single', sub: 'one frequency',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12 Q6 4 12 12 Q18 20 22 12" />
      </svg>
    )
  },
  { count: 2 as const, label: 'Multi', sub: 'two frequencies',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9 Q5 3 9 9 Q13 15 16 9 Q19 3 22 9" />
        <path d="M2 15 Q5 9 9 15 Q13 21 16 15 Q19 9 22 15" strokeOpacity="0.5" />
      </svg>
    )
  },
]

function App() {
  const [hovered,          setHovered]          = useState<Mode | null>(null)
  const [launched,         setLaunched]         = useState<Mode | null>(null)
  const [practiceExpanded, setPracticeExpanded] = useState(false)
  const [freqCount,        setFreqCount]        = useState<1 | 2>(1)
  const [isDark,           setIsDark]           = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const handleModeClick = (id: Mode) => {
    if (id === 'single') { setPracticeExpanded(true) }
    else { setLaunched(id) }
  }

  const launchPractice = (count: 1 | 2) => {
    setFreqCount(count)
    setLaunched('single')
  }

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
        <GameScreen isDark={isDark} freqCount={freqCount} onBack={() => { setLaunched(null); setPracticeExpanded(false) }} />
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
        <div className="modes-switcher">
          <div className={`modes-track${practiceExpanded ? ' is-expanded' : ''}`}>

            {/* Panel 1 — main modes */}
            <div className="modes-panel">
              <div className="modes-panel-hd" />
              <div className="modes-grid">
                {MODE_META.map(({ id, label, sub }) => (
                  <button
                    key={id}
                    className={`mode-btn${hovered === id ? ' is-active' : ''}`}
                    onMouseEnter={() => setHovered(id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleModeClick(id)}
                    tabIndex={practiceExpanded ? -1 : 0}
                  >
                    <div className="mode-btn-icon"><ModeIcon mode={id} /></div>
                    <span className="mode-btn-label">{label}</span>
                    <span className="mode-btn-sub">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Panel 2 — practice sub-modes */}
            <div className="modes-panel">
              <div className="modes-panel-hd">
                <button
                  className="sub-back"
                  onClick={() => setPracticeExpanded(false)}
                  tabIndex={practiceExpanded ? 0 : -1}
                >← back</button>
              </div>
              <div className="modes-grid">
                {PRACTICE_SUBS.map(({ count, label, sub, icon }) => (
                  <button
                    key={count}
                    className="mode-btn"
                    onClick={() => launchPractice(count)}
                    tabIndex={practiceExpanded ? 0 : -1}
                  >
                    <div className="mode-btn-icon">{icon}</div>
                    <span className="mode-btn-label">{label}</span>
                    <span className="mode-btn-sub">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
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
