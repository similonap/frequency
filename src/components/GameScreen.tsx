import { useEffect, useState } from 'react'
import './GameScreen.css'
import { useAudio } from '../hooks/useAudio'
import { sliderToFreq, freqToSlider, freqToNote, randomFreq, randomTwoFreqs } from '../utils/frequency'
import { calcScore, calcDualScore, scoreLabel, scoreTier } from '../utils/scoring'
import { FREQ_MIN, FREQ_MAX, LISTEN_STEPS } from '../constants'
import FreqCanvas from './FreqCanvas'
import type { GamePhase, FreqCount } from '../types'

// ── Game Screen ───────────────────────────────────────────────

interface DailyBundle {
  single: number
  multi:  [number, number]
  oneshot: [number, number]
}

interface GameScreenProps {
  isDark: boolean
  onBack: () => void
  freqCount: FreqCount
  oneshot?: boolean
  daily?: DailyBundle | null
}

function pickDailyFreqs(daily: DailyBundle | null | undefined, freqCount: FreqCount, oneshot: boolean): [number, number] | null {
  if (!daily) return null
  if (freqCount === 1) return [daily.single, 0]
  return oneshot ? daily.oneshot : daily.multi
}

export default function GameScreen({ isDark, onBack, freqCount, oneshot = false, daily = null }: GameScreenProps) {
  const dailyFreqs = pickDailyFreqs(daily, freqCount, oneshot)
  const [phase,        setPhase]       = useState<GamePhase>('listen')
  const [targetFreqs,  setTargetFreqs] = useState<[number, number]>(() =>
    dailyFreqs != null ? dailyFreqs
    : freqCount === 1  ? [randomFreq(), 0] as [number, number]
    : randomTwoFreqs()
  )
  const [guessFreqs,   setGuessFreqs]  = useState<[number, number]>([FREQ_MIN, FREQ_MIN])
  const [listenStep,   setListenStep]  = useState<0 | 1 | 2>(0)
  const [streak,       setStreak]      = useState(0)
  const [brokenStreak, setBrokenStreak] = useState(0)
  const [copied,       setCopied]       = useState(false)
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
    if (oneshot) {
      // Multi Instant: play both together immediately, then guess
      setListenStep(2)
      audio.play(targetFreqs)
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

  const submit = () => {
    audio.stop()
    if (!daily) {
      const submitTotal = freqCount === 1
        ? calcScore(targetFreqs[0], guessFreqs[0])
        : calcDualScore(targetFreqs, guessFreqs).total
      if (submitTotal >= 9.5) {
        setStreak(s => s + 1)
        setBrokenStreak(0)
      } else {
        setBrokenStreak(streak)
        setStreak(0)
      }
    }
    setPhase('result')
  }

  const handleCopy = () => {
    const text = `× ${brokenStreak} streak on FREQUENCY — a frequency matching game. Can you beat it?`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const playAgain = () => {
    setBrokenStreak(0)
    setTargetFreqs(
      dailyFreqs != null ? dailyFreqs
      : freqCount === 1  ? [randomFreq(), 0] as [number, number]
      : randomTwoFreqs()
    )
    setGuessFreqs([FREQ_MIN, FREQ_MIN])
    setPhase('listen')
  }

  const singleScore = calcScore(targetFreqs[0], guessFreqs[0])
  const { total, pairs } = freqCount === 1
    ? { total: singleScore, pairs: [[targetFreqs[0], guessFreqs[0]], [0, 0]] as [[number, number], [number, number]] }
    : calcDualScore(targetFreqs, guessFreqs)
  // Sort pairs low→high by target freq so result always reads consistently
  const sortedPairs = freqCount === 2
    ? [...pairs].sort((a, b) => a[0] - b[0])
    : pairs

  return (
    <div className="game-screen">
      <button className="back-btn" onClick={onBack}>← back</button>

      {(phase === 'listen' || phase === 'guess') && (
        <div className={phase === 'listen' ? 'phase-listen' : 'phase-guess'}>
          <p className="phase-label">
            {phase === 'listen' ? 'listen carefully' : freqCount === 1 ? 'match the frequency' : 'match both frequencies'}
          </p>
          {phase === 'listen' && freqCount === 2 && !oneshot && (
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
              freqs={phase === 'listen'
                ? (freqCount === 1 ? [targetFreqs[0]] : listenStep === 0 ? [targetFreqs[0]] : listenStep === 1 ? [targetFreqs[1]] : targetFreqs)
                : (freqCount === 1 ? [guessFreqs[0]] : guessFreqs)}
              isDark={isDark}
            />
          </div>
          <div style={phase === 'listen' ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}>
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
                    min={0} max={10000}
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
        </div>
      )}

      {phase === 'result' && (
        <div className="phase-result">
          <div className="score-block">
            <span className={`score-num score-tier-${scoreTier(total)}`}>{total.toFixed(1)}</span>
            <span className={`score-label score-tier-${scoreTier(total)}`}>{scoreLabel(total)}</span>
            {!daily && streak > 0 && (
              <span className="streak-counter">
                <span className="streak-word">streak</span> × {streak}
              </span>
            )}
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
                  <span className={`result-score-pill score-tier-${scoreTier(calcScore(sortedPairs[0][0], sortedPairs[0][1]))}`}>
                    {calcScore(sortedPairs[0][0], sortedPairs[0][1]).toFixed(1)}
                  </span>
                  {freqCount === 2 && <>
                    <span className="result-sep">+</span>
                    {sortedPairs[1][1]} Hz · {freqToNote(sortedPairs[1][1])}
                    <span className={`result-score-pill score-tier-${scoreTier(calcScore(sortedPairs[1][0], sortedPairs[1][1]))}`}>
                      {calcScore(sortedPairs[1][0], sortedPairs[1][1]).toFixed(1)}
                    </span>
                  </>}
                </span>
              </div>
              <div className="game-canvas-wrap">
                <FreqCanvas freqs={freqCount === 1 ? [guessFreqs[0]] : guessFreqs} isDark={isDark} />
              </div>
            </div>
          </div>

          <div className="result-actions">
            {!daily && total >= 9.5
              ? <button className="submit-btn streak-btn" onClick={playAgain}>continue streak →</button>
              : <button className="submit-btn" onClick={playAgain}>play again →</button>
            }
            {!daily && (streak > 0 || brokenStreak > 0) && (
              <button className="streak-share-btn" onClick={handleCopy}>
                {copied ? 'copied!' : `share × ${streak > 0 ? streak : brokenStreak}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
