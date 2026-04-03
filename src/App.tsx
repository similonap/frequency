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
  const [hovered,          setHovered]          = useState<Mode | null>(null)
  const [hoveredSub,       setHoveredSub]       = useState<OscPreset | null>(null)
  const [launched,         setLaunched]         = useState<Mode | null>(null)
  const [practiceExpanded, setPracticeExpanded] = useState(false)
  const [freqCount,        setFreqCount]        = useState<FreqCount>(1)
  const [instant,          setInstant]          = useState(false)
  const [isDark,           setIsDark]           = useState(true)
  const daily = useDailyFreq()

  const oscPreset: OscPreset | null = practiceExpanded ? hoveredSub : hovered

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const handleModeClick = (id: Mode) => {
    if (id === 'single') { setPracticeExpanded(true) }
    else { setLaunched(id) }
  }

  const launchPractice = (count: FreqCount, inst: boolean) => {
    setFreqCount(count)
    setInstant(inst)
    setLaunched('single')
  }

  if (launched) {
    return (
      <div className="game-view">
        <Header isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
        <GameScreen
          key={`${launched}-${freqCount}-${instant}`}
          isDark={isDark}
          freqCount={freqCount}
          instant={instant}
          dailyFreq={launched === 'world' ? daily.freq : null}
          onBack={() => { setLaunched(null); setPracticeExpanded(false) }}
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
        practiceExpanded={practiceExpanded}
        onHover={setHovered}
        onSubHover={setHoveredSub}
        onModeClick={handleModeClick}
        onPracticeBack={() => setPracticeExpanded(false)}
        onLaunchPractice={launchPractice}
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
