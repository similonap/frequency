import { useEffect, useState } from 'react'
import './GameScreen.css'
import { useAudio } from '../hooks/useAudio'
import { sliderToFreq, freqToSlider, freqToNote, randomFreq, randomTwoFreqs } from '../utils/frequency'
import { calcScore, calcDualScore, scoreLabel } from '../utils/scoring'
import { FREQ_MIN, FREQ_MAX, LISTEN_STEPS } from '../constants'
import FreqCanvas from './FreqCanvas'
import type { GamePhase, FreqCount } from '../types'

// ── Game Screen ───────────────────────────────────────────────

interface GameScreenProps {
  isDark: boolean
  onBack: () => void
  freqCount: FreqCount
}

export default function GameScreen({ isDark, onBack, freqCount }: GameScreenProps) {
  const [phase,        setPhase]       = useState<GamePhase>('listen')
  const [targetFreqs,  setTargetFreqs] = useState<[number, number]>(() =>
    freqCount === 1 ? [randomFreq(), 0] as [number, number] : randomTwoFreqs()
  )
  const [guessFreqs,   setGuessFreqs]  = useState<[number, number]>([220, 440])
  const [listenStep,   setListenStep]  = useState<0 | 1 | 2>(0)
  const audio = useAudio()

  useEffect(() => () => { audio.cleanup() }, [audio.cleanup])

  // Listen phase
  useEffect(() => {
    if (phase !== 'listen') return
    if (freqCount === 1) {
      audio.play([targetFreqs[0]])
      const t = setTimeout(() => { audio.stop(); setPhase('guess') }, 4000)
      return () => { clearTimeout(t); audio.stop() }
    }
    // Multi: freq1 (2s) → freq2 (2s) → combined (4s) → guess
    setListenStep(2);
    audio.play(targetFreqs);
    // const t1 = setTimeout(() => { setListenStep(1); audio.play([targetFreqs[1]]) }, 1000)
    // const t2 = setTimeout(() => { setListenStep(2); audio.play(targetFreqs)      }, 2000)
    // const t3 = setTimeout(() => { audio.stop(); setPhase('guess')                }, 4000)

    const t3 = setTimeout(() => { audio.stop(); setPhase('guess')                }, 5000);

    return () => { clearTimeout(t3); audio.stop() }

    // return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); audio.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- audio methods are stable useCallback refs; freqCount is fixed for component lifetime
  }, [phase, targetFreqs])

  // Guess phase
  useEffect(() => {
    if (phase !== 'guess') return
    audio.play(freqCount === 1 ? [guessFreqs[0]] : guessFreqs)
    return () => audio.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- audio.play is stable; guessFreqs must NOT trigger re-play (slider uses audio.setFreqs directly)
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
    ? { total: singleScore, pairs: [[targetFreqs[0], guessFreqs[0]], [0, 0]] as [[number, number], [number, number]] }
    : calcDualScore(targetFreqs, guessFreqs)
  // Sort pairs low→high by target freq so result always reads consistently
  const sortedPairs = freqCount === 2
    ? [...pairs].sort((a, b) => a[0] - b[0])
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
