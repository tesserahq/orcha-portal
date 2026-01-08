import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import { flatRoutes } from 'remix-flat-routes'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './app'),
      'react-router-dom/server': 'react-router',
    },
  },
  plugins: [reactRouter(), tsconfigPaths()],
})
