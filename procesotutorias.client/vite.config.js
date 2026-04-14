import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
      host: true,
      port: 5173,
        allowedHosts: [
            'autarkically-monosepalous-jarod.ngrok-free.dev'
        ],
        proxy: {
            //'/WeatherForecast': 'http://localhost:5016'
            '/api': {
                target: 'http://localhost:5016',
                changeOrigin: true
            }
        }
    }
})