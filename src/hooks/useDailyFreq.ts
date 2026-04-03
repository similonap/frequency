import { useState, useEffect } from 'react'

interface DailyFreqResult {
  freq: number | null
  date: string | null
  loading: boolean
  error: boolean
}

export function useDailyFreq(): DailyFreqResult {
  const [state, setState] = useState<DailyFreqResult>({ freq: null, date: null, loading: true, error: false })

  useEffect(() => {
    fetch('/api/daily')
      .then(r => r.json())
      .then(({ freq, date }) => setState({ freq, date, loading: false, error: false }))
      .catch(() => setState(s => ({ ...s, loading: false, error: true })))
  }, [])

  return state
}
