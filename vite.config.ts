import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { azureChatPlugin } from './server/azureChat.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), azureChatPlugin()],
})
