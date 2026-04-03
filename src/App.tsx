import { useState, useEffect } from 'react'
import './App.css'
import type { Mode, OscPreset, FreqCount } from './types'
import Header from './components/Header'
import ModeSelector from './components/ModeSelector'
import OscilloscopeCanvas from './components/OscilloscopeCanvas'
import GameScreen from './components/GameScreen'
import { useDailyFreq } from './hooks/useDailyFreq'

// ── App ───────────────────────────────────────────────────────

function App() {
  const [hovered,    setHovered]    = useState<Mode | null>(null)
  const [hoveredSub, setHoveredSub] = useState<OscPreset | null>(null)
  const [expanded,   setExpanded]   = useState<null | 'practice' | 'daily'>(null)
  const [launched,   setLaunched]   = useState<Mode | null>(null)
  const [freqCount,  setFreqCount]  = useState<FreqCount>(1)
  const [oneshot,    setOneShot]    = useState(false)
  const [isDark,     setIsDark]     = useState(true)
  const daily = useDailyFreq()

  const oscPreset: OscPreset | null = expanded ? hoveredSub : hovered

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const handleModeClick = (id: Mode) => {
    if (id === 'single') setExpanded('practice')
    else setExpanded('daily')
  }

  const launchPractice = (count: FreqCount, inst: boolean) => {
    setFreqCount(count)
    setOneShot(inst)
    setLaunched('single')
  }

  const launchDaily = (count: FreqCount, inst: boolean) => {
    setFreqCount(count)
    setOneShot(inst)
    setLaunched('world')
  }

  const dailyFreqs: [number, number] | null =
    launched === 'world' && daily.single != null && daily.multi != null
      ? (freqCount === 1 ? [daily.single, 0] : (oneshot ? daily.multi : daily.oneshot))
      : null


  if (launched) {
    return (
      <div className="game-view">
        <Header isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
        <GameScreen
          key={`${launched}-${freqCount}-${oneshot}`}
          isDark={isDark}
          freqCount={freqCount}
          oneshot={oneshot}
          dailyFreqs={dailyFreqs}
          onBack={() => { setLaunched(null); setExpanded(null) }}
        />
      </div>
    )
  }

  return (
    <div className="start-screen">
      <Header isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
      <section className="hero-section">
        <h1 className="game-title">FREQUENCY</h1>
      </section>
      <ModeSelector
        hovered={hovered}
        expanded={expanded}
        onHover={setHovered}
        onSubHover={setHoveredSub}
        onModeClick={handleModeClick}
        onBack={() => setExpanded(null)}
        onLaunchPractice={launchPractice}
        onLaunchDaily={launchDaily}
      />
      <section className="scope-section">
        <div className="scope-frame">
          <OscilloscopeCanvas preset={oscPreset} isDark={isDark} />
        </div>
      </section>
    </div>
  )
}

export default App
