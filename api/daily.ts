// Vercel serverless function — computes today's daily frequency on the server
// so all clients get the same value regardless of timezone or local clock.
import { getDailyFreq } from '../src/data/dailyFrequencies'

export function GET(): Response {
  const date = new Date().toISOString().slice(0, 10) // UTC date on the server
  const freq = getDailyFreq(date)
  return Response.json(
    { date, freq },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  )
}
