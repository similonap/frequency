import type { Mode, FreqCount } from './types'

// ── Frequency range (slider bounds) ──────────────────────────

export const FREQ_MIN = 60
export const FREQ_MAX = 2440

// ── Challenge frequency range (what gets picked as the target) ─

export const CHALLENGE_FREQ_MIN = 400
export const CHALLENGE_FREQ_MAX = 1440

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
  default:     [0.24, 0,    0,    0,    0,    0,    0   ],
  single:      [0.34, 0,    0,    0,    0,    0,    0   ],
  world:       [0.11, 0.09, 0.08, 0.08, 0.07, 0.05, 0.04],
  // practice sub-mode previews
  'sub-single':  [0.44, 0,    0,    0,    0,    0,    0   ],
  'sub-multi':   [0.30, 0,    0.26, 0,    0,    0,    0   ],
  'sub-oneshot': [0.38, 0.34, 0,    0,    0,    0,    0   ],
}

export const PRESET_SPEED: Record<string, number> = {
  'sub-oneshot': 2.0,
}

// ── Theme-dependent canvas colors ─────────────────────────────

export const THEME_COLORS = {
  dark: {
    stroke: (a: number) => `rgba(0,255,136,${a})`,
    shadow: '#00ff88',
    bgStroke: 'rgba(0,255,136,0.18)',
  },
  light: {
    stroke: (a: number) => `rgba(20,20,20,${a})`,
    shadow: '#1a1a1a',
    bgStroke: 'rgba(20,20,20,0.12)',
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

export const PRACTICE_SUBS: { count: FreqCount; instant: boolean; label: string; sub: string; preset: 'sub-single' | 'sub-multi' | 'sub-oneshot' }[] = [
  { count: 1, instant: false, label: 'Single',   sub: 'one frequency',    preset: 'sub-single'  },
  { count: 2, instant: false, label: 'Multi',    sub: 'two frequencies',  preset: 'sub-multi'   },
  { count: 2, instant: true,  label: 'One-Shot', sub: 'hear both at once', preset: 'sub-oneshot' },
]
