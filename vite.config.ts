import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif|avif)$/i
const VIDEO_EXTS = /\.(mp4|webm|mov)$/i

/** Each gallery gets its own manifest, auto-built from its media folders. */
const MANIFESTS = [
  { imgDir: 'public/portfolioImgs', vidDir: 'public/videosImgs',    out: 'public/portfolio-manifest.json' },
  { imgDir: 'public/instrutorImgs',  vidDir: 'public/instrutorVideos', out: 'public/instrutor-manifest.json' },
]

function mediaManifestPlugin() {
  // Files/folders starting with "_" are kept in the project but hidden from
  // the site (e.g. `_instrucao.jpeg` stays on disk but never enters a gallery).
  function readDir(dir: string, re: RegExp) {
    const abs = path.resolve(__dirname, dir)
    return fs.existsSync(abs)
      ? fs.readdirSync(abs).filter(f => re.test(f) && !f.startsWith('_'))
      : []
  }

  function generate() {
    for (const m of MANIFESTS) {
      const images = readDir(m.imgDir, IMAGE_EXTS)
      const videos = readDir(m.vidDir, VIDEO_EXTS)
      fs.writeFileSync(path.resolve(__dirname, m.out), JSON.stringify({ images, videos }))
    }
  }

  return {
    name: 'media-manifest',
    buildStart: generate,
    configureServer(server: any) {
      generate()
      server.watcher.on('add', generate)
      server.watcher.on('unlink', generate)
    },
  }
}

export default defineConfig({
  plugins: [react(), mediaManifestPlugin()],
})
