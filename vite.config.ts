import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// QR Studio — static client-side app. No backend; everything runs in the browser.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
