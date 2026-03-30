import './Header.css'

// ── Theme toggle (internal helper) ───────────────────────────

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2"  x2="12" y2="5"  /><line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2"  y1="12" x2="5"  y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
          <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      )}
    </button>
  )
}

// ── Site header ───────────────────────────────────────────────

interface HeaderProps {
  isDark: boolean
  onToggleTheme: () => void
}

export default function Header({ isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="site-header">
      <span className="header-mark">FREQ</span>
      <div className="header-right">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        <span className="header-ver">v 0.1.0</span>
      </div>
    </header>
  )
}
