import { FREQ_MIN, FREQ_MAX, CHALLENGE_FREQ_MIN, CHALLENGE_FREQ_MAX, NOTE_NAMES } from '../constants'

// ── Frequency / slider conversion ─────────────────────────────

const SLIDER_STEPS = 10000

export const sliderToFreq = (v: number): number =>
  Math.round(FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, v / SLIDER_STEPS))

export const freqToSlider = (f: number): number =>
  Math.round(SLIDER_STEPS * Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN))

// ── Random frequency generation ───────────────────────────────

export const randomFreq = (): number => {
  const t = Math.random()
  const f = Math.round(CHALLENGE_FREQ_MIN * Math.pow(CHALLENGE_FREQ_MAX / CHALLENGE_FREQ_MIN, t))
  return Math.round(f / 5) * 5
}

export const randomTwoFreqs = (): [number, number] => {
  let f1 = randomFreq(), f2 = randomFreq()
  // ensure at least 4 semitones apart to be clearly distinguishable
  while (Math.abs(1200 * Math.log2(f2 / f1)) < 400) f2 = randomFreq()
  return f1 < f2 ? [f1, f2] : [f2, f1]
}

// ── Note name lookup ──────────────────────────────────────────

export const freqToNote = (freq: number): string => {
  const semis  = Math.round(12 * Math.log2(freq / 440))
  const idx    = ((semis % 12) + 12) % 12
  const octave = 4 + Math.floor((semis + 9) / 12)
  return `${NOTE_NAMES[idx]}${octave}`
}
