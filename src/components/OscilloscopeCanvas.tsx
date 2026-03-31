import { useEffect, useRef } from 'react'
import './OscilloscopeCanvas.css'
import { COMPS, TARGETS, THEME_COLORS, PRESET_SPEED } from '../constants'
import type { OscPreset } from '../types'

// ── Main screen oscilloscope ───────────────────────────────────

interface OscilloscopeCanvasProps {
  preset: OscPreset | null
  isDark: boolean
}

export default function OscilloscopeCanvas({ preset, isDark }: OscilloscopeCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const animRef    = useRef<number>(0)
  const timeRef    = useRef(0)
  const presetRef  = useRef(preset)
  const isDarkRef  = useRef(isDark)
  const ampsRef    = useRef([0.24, 0, 0, 0, 0, 0, 0])

  useEffect(() => { presetRef.current  = preset  }, [preset])
  useEffect(() => { isDarkRef.current  = isDark  }, [isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr  = window.devicePixelRatio || 1
      canvas.width  = rect.width  * dpr
      canvas.height = rect.height * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const ctx  = canvas.getContext('2d')
      if (!ctx) return
      const dpr  = window.devicePixelRatio || 1
      const w    = canvas.width  / dpr
      const h    = canvas.height / dpr
      const t    = timeRef.current
      const amps = ampsRef.current
      const colors = THEME_COLORS[isDarkRef.current ? 'dark' : 'light']

      const tgt = TARGETS[presetRef.current ?? 'default']
      for (let i = 0; i < amps.length; i++) amps[i] += (tgt[i] - amps[i]) * 0.05

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      for (let i = 1; i < COMPS.length; i++) {
        if (amps[i] < 0.01) continue
        const { freq, phase, speed } = COMPS[i]
        ctx.save()
        ctx.strokeStyle = colors.bgStroke
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          const y = h / 2 + amps[i] * (h / 2) * Math.sin((px / w) * freq * Math.PI * 2 + phase + t * speed)
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()
      }

      const drawComposite = (alpha: number, blur: number, tOff: number) => {
        ctx.save()
        ctx.strokeStyle = colors.stroke(alpha)
        ctx.lineWidth = 1.5
        if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = colors.shadow }
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          let y = 0
          for (let i = 0; i < COMPS.length; i++) {
            if (amps[i] < 0.001) continue
            const { freq, phase, speed } = COMPS[i]
            y += amps[i] * Math.sin((px / w) * freq * Math.PI * 2 + phase + (t + tOff) * speed)
          }
          const fy = h / 2 + y * (h / 2)
          px === 0 ? ctx.moveTo(px, fy) : ctx.lineTo(px, fy)
        }
        ctx.stroke()
        ctx.restore()
      }

      drawComposite(0.06, 0,                            -0.12)
      drawComposite(0.14, 0,                            -0.06)
      drawComposite(0.50, isDarkRef.current ? 10 : 4,    0)
      drawComposite(1.0,  isDarkRef.current ? 22 : 8,    0)

      timeRef.current += 0.016 * (PRESET_SPEED[presetRef.current ?? ''] ?? 1)
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="osc-canvas" />
}
