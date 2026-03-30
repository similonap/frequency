import { useState, useEffect } from 'react'
import './App.css'
import type { Mode, FreqCount } from './types'
import Header from './components/Header'
import ModeSelector from './components/ModeSelector'
import OscilloscopeCanvas from './components/OscilloscopeCanvas'
import GameScreen from './components/GameScreen'

// ── App ───────────────────────────────────────────────────────

function App() {
  const [hovered,          setHovered]          = useState<Mode | null>(null)
  const [launched,         setLaunched]         = useState<Mode | null>(null)
  const [practiceExpanded, setPracticeExpanded] = useState(false)
  const [freqCount,        setFreqCount]        = useState<FreqCount>(1)
  const [isDark,           setIsDark]           = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const handleModeClick = (id: Mode) => {
    if (id === 'single') { setPracticeExpanded(true) }
    else { setLaunched(id) }
  }

  const launchPractice = (count: FreqCount) => {
    setFreqCount(count)
    setLaunched('single')
  }

  if (launched) {
    return (
      <div className="game-view">
        <Header isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
        <GameScreen
          key={`${launched}-${freqCount}`}
          isDark={isDark}
          freqCount={freqCount}
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
        onModeClick={handleModeClick}
        onPracticeBack={() => setPracticeExpanded(false)}
        onLaunchPractice={launchPractice}
      />
      <section className="scope-section">
        <div className="scope-frame">
          <OscilloscopeCanvas mode={hovered} isDark={isDark} />
        </div>
      </section>
    </div>
  )
}

export default App
