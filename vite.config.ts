import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './app'),
      'react-router-dom/server': 'react-router',
    },
    dedupe: ['react', 'react-dom', '@auth0/auth0-react'],
  },
  plugins: [reactRouter(), tsconfigPaths(), tailwindcss()],
})
