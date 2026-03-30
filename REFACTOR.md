# FREQUENCY — Refactoring Plan

> This document is intended for an AI agent to execute. Follow each section in order.
> The goal is to decompose `src/App.tsx` (657 lines) and `src/App.css` (549 lines) into
> well-separated, single-responsibility modules while cleaning up type safety around the
> dual-score pairing logic.

---

## Current state

All application code lives in two files:

| File | Lines | Contains |
|------|-------|----------|
| `src/App.tsx` | 657 | Types, constants, 2 canvas components, 1 custom hook, 8 pure helper functions, game screen component, icon components, theme toggle, mode metadata, app root |
| `src/App.css` | 549 | Every CSS rule for every component in one flat file |
| `src/index.css` | 75 | CSS variables and base reset (fine as-is) |
| `src/main.tsx` | 10 | Entry point (fine as-is) |

**Build tooling:** Vite + React + TypeScript (strict mode enabled). No path aliases configured.

**Type safety cleanup:** The `calcDualScore` function (line 271) returns `pairs` using `as const`, producing a deeply-readonly tuple type. When this value is spread and sorted at line 363, a cast `as typeof pairs` is required to satisfy the type checker. This compiles today but the cast is fragile and masks intent. The refactor should replace the `as const` return with an explicit interface so no cast is needed.

---

## Target file structure

```
src/
├── main.tsx                          # entry point (unchanged)
├── index.css                         # variables & reset (unchanged)
├── App.tsx                           # root component only — state, routing, layout
├── App.css                           # layout-level styles only
├── types.ts                          # shared types
├── constants.ts                      # shared constants (data only, no JSX)
├── hooks/
│   └── useAudio.ts                   # Web Audio hook
├── utils/
│   ├── frequency.ts                  # freq math helpers
│   └── scoring.ts                    # score calculation
├── components/
│   ├── Header.tsx                    # site header + theme toggle
│   ├── Header.css
│   ├── OscilloscopeCanvas.tsx        # main screen waveform
│   ├── OscilloscopeCanvas.css
│   ├── FreqCanvas.tsx                # game waveform
│   ├── FreqCanvas.css
│   ├── ModeSelector.tsx              # mode buttons + practice sub-menu + sliding panels
│   ├── ModeSelector.css
│   ├── GameScreen.tsx                # listen/guess/result phases
│   └── GameScreen.css
└── assets/                           # existing assets (unchanged)
```

---

## Step-by-step instructions

### Step 1 — Create `src/types.ts`

Extract all shared types into a single file:

```ts
export type Mode = 'single' | 'world'
export type GamePhase = 'listen' | 'guess' | 'result'
export type FreqCount = 1 | 2
```

`FreqCount` does not currently exist as a named type — it is used inline as `1 | 2` in `GameScreen` (line 306) and `App` (line 547). Naming it improves readability.

All components that reference these types should import from `../types` (relative path — no path aliases are configured in this project).

### Step 2 — Create `src/constants.ts`

Move these top-level constants out of `App.tsx`. The file should contain **data only — no JSX**.

Constants to move:

- `FREQ_MIN`, `FREQ_MAX` (lines 246–247)
- `NOTE_NAMES` (line 290)
- `COMPS` (lines 9–17) — waveform component definitions
- `TARGETS` (lines 19–23) — amplitude targets per mode
- `LISTEN_STEPS` (lines 300–304) — listen phase step labels
- `MODE_META` (lines 518–521) — mode button metadata. Import `Mode` from `./types` for the type annotation.
- `PRACTICE_SUBS` — **data fields only**: `{ count, label, sub }`. The current definition (lines 525–541) includes inline SVG JSX in an `icon` field. Strip the `icon` field here. The icon rendering moves to `ModeSelector.tsx` (Step 9), where it belongs as presentation logic.
- `THEME_COLORS` — new constant consolidating glow color literals from both canvas components:

```ts
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
```

Group related constants together with section comments matching the current style (`// ── Section ──`).

**Type the `LISTEN_STEPS` array** explicitly rather than using `as const`:

```ts
export const LISTEN_STEPS: { label: string }[] = [
  { label: 'freq · 1' },
  { label: 'freq · 2' },
  { label: 'combined' },
]
```

### Step 3 — Create `src/utils/frequency.ts`

Move these pure functions (lines 249–296):

```
sliderToFreq(v: number): number
freqToSlider(f: number): number
randomFreq(): number
randomTwoFreqs(): [number, number]
freqToNote(freq: number): string
```

Each function should import `FREQ_MIN`, `FREQ_MAX`, `NOTE_NAMES` from `../constants`.

Note: `randomFreq` calls `sliderToFreq` internally. `randomTwoFreqs` calls `randomFreq`. `freqToNote` uses `NOTE_NAMES`. Keep these in the same file since they form a cohesive unit. No other dependencies.

### Step 4 — Create `src/utils/scoring.ts`

Move these pure functions (lines 265–288):

```
calcScore(target: number, guess: number): number
calcDualScore(targets: [number, number], guesses: [number, number]): DualScoreResult
scoreLabel(s: number): string
```

**Clean up the type safety issue here.** The current `calcDualScore` returns `pairs` with `as const`, creating a deeply-readonly tuple type. When the result is later spread and sorted in `GameScreen` (line 363), a cast `as typeof pairs` is needed to make the types align. Fix this by defining an explicit return type:

```ts
export interface DualScoreResult {
  total: number
  pairs: [[number, number], [number, number]]
}

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
```

Remove the `as const` assertions from both return statements. With the explicit `DualScoreResult` interface, `GameScreen` can use `[...pairs].sort((a, b) => a[0] - b[0])` without any cast.

Note: `calcScore` is used by both `calcDualScore` and directly in `GameScreen` (lines 453–454, 459–460 for per-pair score pills). Export it.

### Step 5 — Create `src/hooks/useAudio.ts`

Move the `useAudio` hook (lines 189–242) into its own file.

It depends only on React (`useCallback`, `useRef`) and the Web Audio API. No project-level imports.

The return type is `{ play: (freqs: number[]) => void; stop: () => void; setFreqs: (freqs: number[]) => void }`.

Keep the exact same implementation.

### Step 6 — Create `src/components/OscilloscopeCanvas.tsx` + `.css`

Move the `OscilloscopeCanvas` component (lines 25–112).

It imports `COMPS`, `TARGETS`, and `THEME_COLORS` from `../constants` and `Mode` from `../types`.

Props interface:
```ts
interface OscilloscopeCanvasProps {
  mode: Mode | null
  isDark: boolean
}
```

Replace inline color conditionals with `THEME_COLORS[isDark ? 'dark' : 'light']`.

Move these CSS rules into `OscilloscopeCanvas.css`:
- `.scope-section` (line 92)
- `.scope-frame` (line 100)
- `.osc-canvas` (line 106)

Import `'./OscilloscopeCanvas.css'` at the top of the component file.

### Step 7 — Create `src/components/FreqCanvas.tsx` + `.css`

Move the `FreqCanvas` component (lines 116–184).

It imports `THEME_COLORS` from `../constants`.

Props interface:
```ts
interface FreqCanvasProps {
  freqs: number[]
  isDark: boolean
}
```

Replace inline color conditionals with `THEME_COLORS[isDark ? 'dark' : 'light']`.

Move this CSS rule into `FreqCanvas.css`:
- `.freq-canvas` (line 310 of App.css)

**Do not** move `.game-canvas-wrap` here — that class is a layout wrapper used inside `GameScreen` JSX (lines 382, 394, 441, 465), not inside `FreqCanvas` itself. It belongs in `GameScreen.css` (Step 10).

Import `'./FreqCanvas.css'` at the top of the component file.

### Step 8 — Create `src/components/Header.tsx` + `.css`

The header markup is **duplicated** identically in both render paths of `App.tsx`:
- Lines 567–573 (game view)
- Lines 581–586 (start screen)

Both render:
```tsx
<header className="site-header">
  <span className="header-mark">FREQ</span>
  <div className="header-right">
    <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} />
    <span className="header-ver">v 0.1.0</span>
  </div>
</header>
```

Move the `ThemeToggle` component (lines 496–515) into this file as a non-exported helper.

Create a `Header` component:
```ts
interface HeaderProps {
  isDark: boolean
  onToggleTheme: () => void
}
```

Replace both header blocks in `App.tsx` with `<Header isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />`.

Move these CSS rules into `Header.css`:
- `.site-header` (line 17)
- `.header-mark` (line 25)
- `.header-right` (line 32)
- `.header-ver` (line 38)
- `.theme-toggle` (line 44)
- `.theme-toggle svg` (line 56)
- `.theme-toggle:hover` (line 63)
- `.theme-toggle:hover svg` (line 68)

Import `'./Header.css'` at the top of the component file.

### Step 9 — Create `src/components/ModeSelector.tsx` + `.css`

Move the mode selection UI from `App.tsx`: the sliding panels, mode buttons, practice sub-menu (lines 593–644 of the JSX), the `ModeIcon` component (lines 480–494), and the practice sub-mode icon SVGs that were stripped from `PRACTICE_SUBS` in Step 2.

This component imports `MODE_META` and `PRACTICE_SUBS` from `../constants` and `Mode` and `FreqCount` from `../types`.

Props interface:
```ts
interface ModeSelectorProps {
  hovered: Mode | null
  practiceExpanded: boolean
  onHover: (mode: Mode | null) => void
  onModeClick: (mode: Mode) => void          // App decides: 'single' expands, 'world' launches
  onPracticeBack: () => void                  // collapses practice sub-menu
  onLaunchPractice: (count: FreqCount) => void
}
```

**Icon rendering:** The `PRACTICE_SUBS` constant (from `constants.ts`) now holds only `{ count, label, sub }`. Define the icon SVGs inline in this component, keyed by `count`:

```tsx
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
```

**tabIndex handling:** The current code uses `practiceExpanded` to toggle `tabIndex` between `0` and `-1` on both panels' buttons (lines 608, 624, 633). Preserve as-is using the `practiceExpanded` prop.

Move these CSS rules into `ModeSelector.css`:
- `.modes-section` (line 114)
- `.modes-grid` (line 119)
- `.mode-btn` (line 125) and all child/state rules (`.is-active`, `-icon`, `-icon svg`, `-label`, `-sub`)
- `.modes-switcher` (line 194)
- `.modes-track` (line 199)
- `.modes-track.is-expanded` (line 205)
- `.modes-panel` (line 209)
- `.modes-panel-hd` (line 217)
- `.sub-back` (line 224)
- `.sub-back:hover` (line 232)

Also move the `.mode-btn-sub { display: none; }` rule from inside the `@media (max-width: 400px)` block (line 545) into `ModeSelector.css` inside its own `@media (max-width: 400px)` block.

Import `'./ModeSelector.css'` at the top of the component file.

### Step 10 — Create `src/components/GameScreen.tsx` + `.css`

Move the `GameScreen` component (lines 306–476), including all game phase JSX.

Imports:
- `useAudio` from `../hooks/useAudio`
- `sliderToFreq`, `freqToSlider`, `freqToNote`, `randomFreq`, `randomTwoFreqs` from `../utils/frequency`
- `calcScore`, `calcDualScore` from `../utils/scoring`
- `FREQ_MIN`, `FREQ_MAX`, `LISTEN_STEPS` from `../constants`
- `FreqCanvas` from `./FreqCanvas`
- `GamePhase`, `FreqCount` from `../types`

Props interface:
```ts
interface GameScreenProps {
  isDark: boolean
  onBack: () => void
  freqCount: FreqCount
}
```

**After the `calcDualScore` return type fix (Step 4)**, update the scoring/sorting logic at lines 357–364. Remove the `as typeof pairs` cast:

```ts
const sortedPairs = freqCount === 2
  ? [...pairs].sort((a, b) => a[0] - b[0])
  : pairs
```

Also update the single-mode fallback (line 359) to match the `DualScoreResult` shape without `as const`:

```ts
const { total, pairs } = freqCount === 1
  ? { total: singleScore, pairs: [[targetFreqs[0], guessFreqs[0]], [0, 0]] as [[number, number], [number, number]] }
  : calcDualScore(targetFreqs, guessFreqs)
```

Move all game-related CSS into `GameScreen.css`:
- `.game-screen` (line 261)
- `.back-btn` (line 247)
- `.back-btn:hover` (line 257)
- `.phase-listen, .phase-guess, .phase-result` (line 269)
- `.phase-label` (line 278)
- `.listen-steps` (line 317)
- `.listen-step` (line 325)
- `.listen-step.is-active` (line 333)
- `.game-canvas-wrap` (line 305)
- `.slider-section` (line 338)
- `.slider-row` (line 401)
- `.freq-display` (line 343)
- `.freq-hz` (line 350)
- `.freq-note` (line 358)
- `.freq-slider` (line 364) and all pseudo-element/theme rules
- `.slider-ends` (line 415)
- `.submit-btn` (line 443)
- `.submit-btn:hover` (line 457)
- `.score-block` (line 462)
- `.score-num` (line 470)
- `.score-label` (line 479)
- `.result-waves` (line 486)
- `.result-row` (line 493)
- `.result-meta` (line 500)
- `.result-tag` (line 508)
- `.result-freq` (line 515)
- `.result-divider` (line 521)
- `.result-sep` (line 424)
- `.result-score-pill` (line 429)
- `.result-score-pill.good` (line 438)

Import `'./GameScreen.css'` at the top of the component file.

### Step 11 — Reduce `src/App.tsx` to root shell

After all extractions, `App.tsx` should only contain:
1. Imports of child components (`Header`, `ModeSelector`, `OscilloscopeCanvas`, `GameScreen`)
2. Import of `Mode` and `FreqCount` from `./types`
3. State: `hovered`, `launched`, `practiceExpanded`, `freqCount`, `isDark`
4. Theme effect (line 550–552)
5. Event handlers: `handleModeClick`, `launchPractice`
6. Conditional render: game view (`launched` is truthy) vs start screen
7. Composition of extracted components

Target: ~60–80 lines.

The `App` component should look like:

```tsx
import { useState, useEffect } from 'react'
import './App.css'
import type { Mode, FreqCount } from './types'
import Header from './components/Header'
import ModeSelector from './components/ModeSelector'
import OscilloscopeCanvas from './components/OscilloscopeCanvas'
import GameScreen from './components/GameScreen'

function App() {
  const [hovered,          setHovered]          = useState<Mode | null>(null)
  const [launched,         setLaunched]         = useState<Mode | null>(null)
  const [practiceExpanded, setPracticeExpanded] = useState(false)
  const [freqCount,        setFreqCount]        = useState<FreqCount>(1)
  const [isDark,           setIsDark]           = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const handleModeClick = (id: Mode) => {
    if (id === 'single') { setPracticeExpanded(true) }
    else { setLaunched(id) }
  }

  const launchPractice = (count: FreqCount) => {
    setFreqCount(count)
    setLaunched('single')
  }

  if (launched) {
    return (
      <div className="game-view">
        <Header isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
        <GameScreen
          isDark={isDark}
          freqCount={freqCount}
          onBack={() => { setLaunched(null); setPracticeExpanded(false) }}
        />
      </div>
    )
  }

  return (
    <div className="start-screen">
      <Header isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />
      <section className="hero-section">
        <h1 className="game-title">FREQUENCY</h1>
      </section>
      <ModeSelector
        hovered={hovered}
        practiceExpanded={practiceExpanded}
        onHover={setHovered}
        onModeClick={handleModeClick}
        onPracticeBack={() => setPracticeExpanded(false)}
        onLaunchPractice={launchPractice}
      />
      <section className="scope-section">
        <div className="scope-frame">
          <OscilloscopeCanvas mode={hovered} isDark={isDark} />
        </div>
      </section>
    </div>
  )
}

export default App
```

**Note:** The `scope-section` and `scope-frame` wrapper divs stay in `App.tsx` because they are layout concerns of the start screen. The CSS for these classes lives in `OscilloscopeCanvas.css` (Step 6) since they are semantically tied to the oscilloscope display.

### Step 12 — Reduce `src/App.css` to layout-only

After all extractions, `App.css` should only contain:
- `.start-screen` (line 3)
- `.game-view` (line 236)
- `.hero-section` (line 74)
- `.game-title` (line 80)
- The `@media (max-width: 720px)` block with only `.start-screen, .game-view` padding (line 530)
- The `@media (max-width: 400px)` block with only `.start-screen, .game-view` padding (lines 539–543) — the `.mode-btn-sub` rule moves to `ModeSelector.css`

**Delete dead CSS:**
- `.countdown` rule (lines 289–298) and its `[data-theme="light"] .countdown` variant (lines 301–303) — never referenced in JSX
- `.slider-index` rule (lines 408–413) — never referenced in JSX

---

## DRY violations addressed during extraction

### 1. Header duplication (MUST FIX — Step 8)

The `<header className="site-header">` block appears identically in both the game view (line 567) and start screen (line 581) render paths. Extract to `<Header>`.

### 2. Glow color literals (SHOULD FIX — Step 2)

The theme-dependent color strings are repeated across both canvas components:
- Dark glow: `'rgba(0,255,136,...)'` and `'#00ff88'`
- Light glow: `'rgba(0,122,56,...)'` and `'#007a38'`
- OscilloscopeCanvas unique light-mode background stroke: `'rgba(0,100,50,0.20)'`

Consolidated into `THEME_COLORS` constant in `constants.ts`. Both canvas components read `THEME_COLORS[isDark ? 'dark' : 'light']` instead of inlining color conditionals.

### 3. Canvas setup boilerplate (DO NOT EXTRACT)

Both canvas components share ~10 lines of resize/DPR/animation-loop setup. However, their draw logic is fundamentally different (`OscilloscopeCanvas` has amplitude interpolation, `FreqCanvas` has frequency-dependent rendering). Extracting a `useCanvasAnimation` hook would save ~10 lines per component but add indirection that makes each canvas harder to understand in isolation. **Leave as-is.** If a third canvas component is added, revisit.

### 4. `freqCount` conditionals in GameScreen (DO NOT EXTRACT)

The listen phase uses `listenStep` to determine display, the guess phase controls slider count, and the result phase conditionally renders extra elements. The conditionals are not uniform enough to collapse into two computed arrays. **Leave as-is.**

---

## CSS distribution summary

| Target file | CSS classes |
|---|---|
| `App.css` | `.start-screen`, `.game-view`, `.hero-section`, `.game-title`, `@media` rules for `.start-screen`/`.game-view` padding |
| `Header.css` | `.site-header`, `.header-mark`, `.header-right`, `.header-ver`, `.theme-toggle`, `.theme-toggle svg`, `.theme-toggle:hover`, `.theme-toggle:hover svg` |
| `OscilloscopeCanvas.css` | `.scope-section`, `.scope-frame`, `.osc-canvas` |
| `FreqCanvas.css` | `.freq-canvas` |
| `ModeSelector.css` | `.modes-section`, `.modes-grid`, `.mode-btn` (and all child/state rules), `.modes-switcher`, `.modes-track`, `.modes-track.is-expanded`, `.modes-panel`, `.modes-panel-hd`, `.sub-back`, `.sub-back:hover`, `@media (max-width: 400px) { .mode-btn-sub }` |
| `GameScreen.css` | `.game-screen`, `.back-btn`, `.phase-*`, `.phase-label`, `.listen-steps`, `.listen-step`, `.game-canvas-wrap`, `.slider-*`, `.freq-*`, `.submit-btn`, `.score-*`, `.result-*` |
| **DELETED** | `.countdown`, `[data-theme="light"] .countdown`, `.slider-index` |

---

## Rules for the executing agent

1. **Do not change any visible behavior.** The app must look and function identically after refactoring.
2. **Do not add new dependencies.** Only move code between files and add internal project files.
3. **Do not rename CSS classes.** The existing class names are the API contract between JSX and CSS.
4. **Preserve the monospace aesthetic in comments** — use the `// ── Section ──` style.
5. **Each component CSS file should be imported** in its component via `import './Component.css'`.
6. **Run `npx tsc --noEmit` after each step** to verify no type errors were introduced.
7. **Run `npm run dev` and visually verify** the start screen, practice sub-menu slide, single-mode game flow (listen/guess/result), and multi-mode game flow all still work after each step.
8. **Clean up the `calcDualScore` type safety** as part of Step 4, not as a separate task.
9. **Delete dead CSS** (`.countdown`, `[data-theme="light"] .countdown`, `.slider-index`) as part of Step 12.
10. **Keep asset files unchanged** — `src/assets/` is not part of this refactor.
11. **Use `export default`** for component files (`Header`, `ModeSelector`, `OscilloscopeCanvas`, `FreqCanvas`, `GameScreen`) and named exports for utility/type/constant files.
12. **Use `import type`** for type-only imports where applicable.
