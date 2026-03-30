import type { Mode, FreqCount } from './types'

// ── Frequency range ───────────────────────────────────────────

export const FREQ_MIN = 110
export const FREQ_MAX = 880

// ── Oscilloscope waveform components ─────────────────────────

export const COMPS = [
  { freq: 2.0,  phase: 0.0, speed: 0.90 },
  { freq: 3.7,  phase: 0.8, speed: 1.30 },
  { freq: 5.9,  phase: 1.6, speed: 0.75 },
  { freq: 9.3,  phase: 2.4, speed: 1.50 },
  { freq: 14.8, phase: 0.3, speed: 1.10 },
  { freq: 23.1, phase: 1.1, speed: 1.80 },
  { freq: 37.4, phase: 2.0, speed: 0.60 },
]

export const TARGETS: Record<string, number[]> = {
  default: [0.24, 0,    0,    0,    0,    0,    0   ],
  single:  [0.34, 0,    0,    0,    0,    0,    0   ],
  world:   [0.11, 0.09, 0.08, 0.08, 0.07, 0.05, 0.04],
}

// ── Theme-dependent canvas colors ─────────────────────────────

export const THEME_COLORS = {
  dark: {
    stroke: (a: number) => `rgba(0,255,136,${a})`,
    shadow: '#00ff88',
    bgStroke: 'rgba(0,255,136,0.18)',
  },
  light: {
    stroke: (a: number) => `rgba(0,122,56,${a})`,
    shadow: '#007a38',
    bgStroke: 'rgba(0,100,50,0.20)',
  },
} as const

// ── Note names ────────────────────────────────────────────────

export const NOTE_NAMES = ['A','A♯','B','C','C♯','D','D♯','E','F','F♯','G','G♯']

// ── Listen phase step labels ──────────────────────────────────

export const LISTEN_STEPS: { label: string }[] = [
  { label: 'freq · 1' },
  { label: 'freq · 2' },
  { label: 'combined' },
]

// ── Mode metadata ─────────────────────────────────────────────

export const MODE_META: { id: Mode; label: string; sub: string }[] = [
  { id: 'single', label: 'Practice', sub: 'solo signal'    },
  { id: 'world',  label: 'Daily',    sub: 'one shot a day' },
]

// ── Practice sub-mode data (icons rendered in ModeSelector) ──

export const PRACTICE_SUBS: { count: FreqCount; label: string; sub: string }[] = [
  { count: 1, label: 'Single', sub: 'one frequency'  },
  { count: 2, label: 'Multi',  sub: 'two frequencies' },
]
