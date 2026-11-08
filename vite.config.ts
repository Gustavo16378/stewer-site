import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      // o site e o painel (/admin) saem do mesmo build, em entradas
      // separadas: quem visita o site não baixa nada do painel
      input: {
        site: 'index.html',
        admin: 'admin.html',
      },
      output: {
        // bibliotecas quase não mudam: separadas, o cache do visitante
        // sobrevive a cada publicação
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
        },
      },
    },
  },
})
