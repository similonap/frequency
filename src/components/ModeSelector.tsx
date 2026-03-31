import React from 'react'
import './ModeSelector.css'
import { MODE_META, PRACTICE_SUBS } from '../constants'
import type { Mode, OscPreset, FreqCount } from '../types'

// ── Practice sub-mode icons ───────────────────────────────────

const PRACTICE_ICONS: React.ReactNode[] = [
  // Single
  (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 Q5 6 9 12 Q13 18 16 12 Q19 6 22 12" />
    </svg>
  ),
  // Multi (step by step)
  (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9 Q5 3 9 9 Q13 15 16 9 Q19 3 22 9" />
      <path d="M2 15 Q5 9 9 15 Q13 21 16 15 Q19 9 22 15" strokeOpacity="0.5" />
    </svg>
  ),
  // One-Shot (beat frequency — amplitude envelope of two freqs summed)
  (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 Q4 4 6 12 Q8 20 10 12 Q11 9 12 12 Q13 15 14 12 Q16 4 18 12 Q20 20 22 12" />
    </svg>
  ),
]

// ── Mode icon (per-mode SVG) ──────────────────────────────────

function ModeIcon({ mode }: { mode: Mode }) {
  if (mode === 'single') return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a14 14 0 0 1 3.5 9A14 14 0 0 1 12 21a14 14 0 0 1-3.5-9A14 14 0 0 1 12 3z" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}

// ── Mode selector ─────────────────────────────────────────────

interface ModeSelectorProps {
  hovered: Mode | null
  practiceExpanded: boolean
  onHover: (mode: Mode | null) => void
  onSubHover: (preset: OscPreset | null) => void
  onModeClick: (mode: Mode) => void
  onPracticeBack: () => void
  onLaunchPractice: (count: FreqCount, instant: boolean) => void
}

export default function ModeSelector({
  hovered,
  practiceExpanded,
  onHover,
  onSubHover,
  onModeClick,
  onPracticeBack,
  onLaunchPractice,
}: ModeSelectorProps) {
  return (
    <section className="modes-section">
      <div className="modes-switcher">
        <div className={`modes-track${practiceExpanded ? ' is-expanded' : ''}`}>

          {/* Panel 1 — main modes */}
          <div className="modes-panel">
            <div className="modes-panel-hd" />
            <div className="modes-grid">
              {MODE_META.map(({ id, label, sub }) => (
                <button
                  key={id}
                  className={`mode-btn${hovered === id ? ' is-active' : ''}`}
                  onMouseEnter={() => onHover(id)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onModeClick(id)}
                  tabIndex={practiceExpanded ? -1 : 0}
                >
                  <div className="mode-btn-icon"><ModeIcon mode={id} /></div>
                  <span className="mode-btn-label">{label}</span>
                  <span className="mode-btn-sub">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Panel 2 — practice sub-modes */}
          <div className="modes-panel">
            <div className="modes-panel-hd">
              <button
                className="sub-back"
                onClick={onPracticeBack}
                tabIndex={practiceExpanded ? 0 : -1}
              >← back</button>
            </div>
            <div className="modes-grid">
              {PRACTICE_SUBS.map(({ count, instant, label, sub, preset }, i) => (
                <button
                  key={`${count}-${instant}`}
                  className="mode-btn"
                  onClick={() => onLaunchPractice(count, instant)}
                  onMouseEnter={() => onSubHover(preset)}
                  onMouseLeave={() => onSubHover(null)}
                  tabIndex={practiceExpanded ? 0 : -1}
                >
                  <div className="mode-btn-icon">{PRACTICE_ICONS[i]}</div>
                  <span className="mode-btn-label">{label}</span>
                  <span className="mode-btn-sub">{sub}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
