import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getDaily } from './api/daily';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-daily',
      configureServer(server) {
        server.middlewares.use('/api/daily', (_req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(getDaily()))
        })
      },
    },
  ],
})
