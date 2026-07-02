import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// QR Studio — static client-side app. No backend; everything runs in the browser.
// Deployed to GitHub Pages at pfirst.github.io/qr-generator/, so assets must resolve
// under the /qr-generator/ subpath.
export default defineConfig({
  base: '/qr-generator/',
  plugins: [react(), tailwindcss()],
})
