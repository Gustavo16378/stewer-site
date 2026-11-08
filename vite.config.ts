import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * O site monta em duas partes (ver src/main.tsx): a entrada, pequena, e o
 * React com a página (inicio.tsx), importado sob demanda. Sem isto, o
 * navegador só descobriria a segunda parte depois de rodar a primeira.
 * Aqui o index.html já pede as duas de uma vez, em paralelo.
 */
function preCarregarInicio(): Plugin {
  return {
    name: 'pre-carregar-inicio',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle, filename }) {
        if (!bundle || !filename.endsWith('index.html')) return html
        const chunks = Object.values(bundle).filter((c) => c.type === 'chunk')
        const inicio = chunks.find((c) => c.name === 'inicio')
        if (!inicio) return html
        const arquivos = new Set<string>()
        const juntar = (arquivo: string) => {
          if (arquivos.has(arquivo)) return
          arquivos.add(arquivo)
          const c = chunks.find((x) => x.fileName === arquivo)
          c?.imports.forEach(juntar)
        }
        juntar(inicio.fileName)
        return {
          html,
          tags: [...arquivos]
            .filter((a) => !html.includes(a))
            .map((a) => ({
              tag: 'link',
              attrs: { rel: 'modulepreload', crossorigin: true, href: `/${a}` },
              injectTo: 'head' as const,
            })),
        }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), preCarregarInicio()],
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
