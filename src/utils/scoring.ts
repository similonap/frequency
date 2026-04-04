// import { CHALLENGE_FREQ_MIN, CHALLENGE_FREQ_MAX } from '../constants'

// ── ERB-rate scale ─────────────────────────────────────────────
// ERB-rate(f) = 21.4 * log10(1 + 0.00437 * f)
// Models the cochlea's frequency resolution: auditory filters are
// wider at low frequencies, so the same Hz error is less perceptible there.

// const erbRate = (f: number): number => 21.4 * Math.log10(1 + 0.00437 * f)

// const ERB_RANGE = erbRate(CHALLENGE_FREQ_MAX) - erbRate(CHALLENGE_FREQ_MIN)

// ── Score calculation (0–10) ───────────────────────────────────
// dist = |ERB(target) - ERB(guess)| / ERB_RANGE
// sharp gaussian (peak 10) rewards near-perfect accuracy
// gentle gaussian (peak 3) prevents zeroes when close
// score = max(sharp, gentle), clamped 0–10

export const calcScore = (target: number, guess: number): number => {
//   const dist  = Math.abs(erbRate(target) - erbRate(guess)) / ERB_RANGE
//   const sharp  = 10 * Math.exp(-dist * dist * 3250)
//   const gentle = 3  * Math.exp(-dist * dist * 130)
//   return Math.max(0, Math.min(10, Math.max(sharp, gentle)))
    let score = (1 - Math.min(1, Math.abs(target - guess) / 20)) * 10;
    console.log(score);
    return score;
}

// ── Score tier (for color coding) ─────────────────────────────

export type ScoreTier = 'perfect' | 'good' | 'okay' | 'poor'

export const scoreTier = (s: number): ScoreTier => {
  if (s >= 8) return 'perfect'
  if (s >= 6) return 'good'
  if (s >= 3.5) return 'okay'
  return 'poor'
}

// ── Score label ────────────────────────────────────────────────

export const scoreLabel = (s: number): string => {
  if (s >= 9.5) return 'perfect'
  if (s >= 8)   return 'nice'
  if (s >= 6)   return 'almost'
  if (s >= 3.5) return 'off'
  return 'way off'
}

// ── Dual-frequency scoring ─────────────────────────────────────

export interface DualScoreResult {
  total: number
  pairs: [[number, number], [number, number]]
}

// Best-assignment matching: try both pairings, take higher total
export function calcDualScore(
  targets: [number, number],
  guesses: [number, number]
): DualScoreResult {
  const [t1, t2] = targets
  const [g1, g2] = guesses
  const s_straight = calcScore(t1, g1) + calcScore(t2, g2)
  const s_swapped  = calcScore(t1, g2) + calcScore(t2, g1)
  if (s_straight >= s_swapped) {
    return { total: s_straight / 2, pairs: [[t1, g1], [t2, g2]] }
  }
  return { total: s_swapped / 2, pairs: [[t1, g2], [t2, g1]] }
}
