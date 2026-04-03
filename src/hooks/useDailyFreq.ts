import { useState, useEffect } from 'react'

export interface DailyData {
  single: number | null
  multi: [number, number] | null
  oneshot: [number, number] | null
  date: string | null
  loading: boolean
  error: boolean
}

export function useDailyFreq(): DailyData {
  const [state, setState] = useState<DailyData>({
    single: null, multi: null, oneshot: null, date: null, loading: true, error: false,
  })

  useEffect(() => {
    fetch('/api/daily')
      .then(r => r.json())
      .then(({ single, multi, oneshot, date }) =>
        setState({ single, multi, date, oneshot, loading: false, error: false })
      )
      .catch(() => setState(s => ({ ...s, loading: false, error: true })))
  }, [])

  return state
}
