import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/fishPond/',
  plugins: [react()],
  build: {
    target: 'esnext',
    sourcemap: true,
  },
})
