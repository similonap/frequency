// ── Score calculation ─────────────────────────────────────────

export const calcScore = (target: number, guess: number): number => {
  const cents = Math.abs(1200 * Math.log2(guess / target))
  return Math.max(0, Math.round(100 - cents / 12))
}

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
    return { total: Math.round(s_straight / 2), pairs: [[t1, g1], [t2, g2]] }
  }
  return { total: Math.round(s_swapped / 2), pairs: [[t1, g2], [t2, g1]] }
}

export const scoreLabel = (s: number): string => {
  if (s >= 98) return 'perfect'
  if (s >= 85) return 'close'
  if (s >= 65) return 'almost'
  if (s >= 40) return 'off'
  return 'way off'
}
