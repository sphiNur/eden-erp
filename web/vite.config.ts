import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: true,
        proxy: {
            '/api': {
                target: process.env.PROXY_TARGET || 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
})
