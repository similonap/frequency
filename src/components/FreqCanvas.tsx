import { useEffect, useRef } from 'react'
import './FreqCanvas.css'
import { THEME_COLORS } from '../constants'

// ── Game: multi-frequency sine canvas ────────────────────────

interface FreqCanvasProps {
  freqs: number[]
  isDark: boolean
}

export default function FreqCanvas({ freqs, isDark }: FreqCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const timeRef   = useRef(0)
  const freqsRef  = useRef(freqs)
  const isDarkRef = useRef(isDark)

  useEffect(() => { freqsRef.current  = freqs  }, [freqs])
  useEffect(() => { isDarkRef.current = isDark  }, [isDark])

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
      const fs   = freqsRef.current
      const colors = THEME_COLORS[isDarkRef.current ? 'dark' : 'light']
      const amp  = h * 0.36

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const drawLine = (alpha: number, blur: number, tOff: number) => {
        ctx.save()
        ctx.strokeStyle = colors.stroke(alpha)
        ctx.lineWidth = 1.5
        if (blur > 0) { ctx.shadowBlur = blur; ctx.shadowColor = colors.shadow }
        ctx.beginPath()
        for (let px = 0; px <= w; px++) {
          // sum all frequencies, normalise by count
          let sum = 0
          for (const f of fs) {
            const cycles = f / 100
            sum += Math.sin((px / w) * cycles * Math.PI * 2 + (t + tOff) * 2.5)
          }
          const y = h / 2 + amp * (sum / fs.length)
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()
      }

      drawLine(0.06, 0,                           -0.12)
      drawLine(0.14, 0,                           -0.06)
      drawLine(0.50, isDarkRef.current ? 10 : 4,   0)
      drawLine(1.0,  isDarkRef.current ? 20 : 6,   0)

      timeRef.current += 0.016
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="freq-canvas" />
}
