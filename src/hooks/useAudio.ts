import { useCallback, useRef } from 'react'

// ── Web Audio (multi-oscillator) ──────────────────────────────

export function useAudio(): {
  play: (freqs: number[]) => void
  stop: () => void
  setFreqs: (freqs: number[]) => void
  cleanup: () => void
} {
  const ctxRef   = useRef<AudioContext | null>(null)
  const oscsRef  = useRef<OscillatorNode[]>([])
  const gainsRef = useRef<GainNode[]>([])

  const ensure = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }

  const stopAll = useCallback(() => {
    if (!ctxRef.current) return
    const ctx = ctxRef.current
    gainsRef.current.forEach((gain, i) => {
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08)
      const osc = oscsRef.current[i]
      setTimeout(() => { try { osc.stop(); osc.disconnect() } catch {} }, 120)
    })
    oscsRef.current  = []
    gainsRef.current = []
  }, [])

  const play = useCallback((freqs: number[]) => {
    const ctx = ensure()
    // if already playing the right number, just tune them
    if (oscsRef.current.length === freqs.length) {
      freqs.forEach((f, i) => { oscsRef.current[i].frequency.value = f })
      return
    }
    stopAll()
    const vol = 0.18 / freqs.length  // keep loudness constant
    freqs.forEach(f => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.06)
      osc.start()
      oscsRef.current.push(osc)
      gainsRef.current.push(gain)
    })
  }, [stopAll])

  const setFreqs = useCallback((freqs: number[]) => {
    freqs.forEach((f, i) => {
      if (oscsRef.current[i]) oscsRef.current[i].frequency.value = f
    })
  }, [])

  const cleanup = useCallback(() => {
    stopAll()
    if (ctxRef.current) {
      ctxRef.current.close()
      ctxRef.current = null
    }
  }, [stopAll])

  return { play, stop: stopAll, setFreqs, cleanup }
}
