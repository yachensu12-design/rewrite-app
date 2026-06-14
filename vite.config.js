import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https: true, // 本地测试 Web Push 需要 HTTPS
    host: true   // 允许局域网访问
  }
})
