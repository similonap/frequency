import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getDailyFreq } from './src/data/dailyFrequencies'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-daily',
      configureServer(server) {
        server.middlewares.use('/api/daily', (_req, res) => {
          const date = new Date().toISOString().slice(0, 10)
          const freq = getDailyFreq(date)
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ date, freq }))
        })
      },
    },
  ],
})
