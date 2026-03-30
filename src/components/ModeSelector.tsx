import React from 'react'
import './ModeSelector.css'
import { MODE_META, PRACTICE_SUBS } from '../constants'
import type { Mode, FreqCount } from '../types'

// ── Practice sub-mode icons ───────────────────────────────────

const PRACTICE_ICONS: Record<FreqCount, React.ReactNode> = {
  1: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 Q6 4 12 12 Q18 20 22 12" />
    </svg>
  ),
  2: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9 Q5 3 9 9 Q13 15 16 9 Q19 3 22 9" />
      <path d="M2 15 Q5 9 9 15 Q13 21 16 15 Q19 9 22 15" strokeOpacity="0.5" />
    </svg>
  ),
}

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
  onModeClick: (mode: Mode) => void
  onPracticeBack: () => void
  onLaunchPractice: (count: FreqCount) => void
}

export default function ModeSelector({
  hovered,
  practiceExpanded,
  onHover,
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
              {PRACTICE_SUBS.map(({ count, label, sub }) => (
                <button
                  key={count}
                  className="mode-btn"
                  onClick={() => onLaunchPractice(count)}
                  tabIndex={practiceExpanded ? 0 : -1}
                >
                  <div className="mode-btn-icon">{PRACTICE_ICONS[count]}</div>
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
