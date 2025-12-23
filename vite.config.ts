import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Lab0/',
  plugins: [
    react({
      babel: {
        plugins: []
      }
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    allowedHosts: [
      '.loca.lt',
      'localhost',
      '127.0.0.1'
    ],
    host: true,
    port: 5173
  }
})