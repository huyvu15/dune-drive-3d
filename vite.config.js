import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    strictPort: true,
    allowedHosts: [
      'all',
      '.ngrok-free.app',
      '26e1-14-232-211-68.ngrok-free.app'
    ],
    // HMR configuration for ngrok
    hmr: {
      clientPort: 443
    }
  }
})
