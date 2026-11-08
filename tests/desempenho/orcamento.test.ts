/**
 * Desempenho · orçamento de peso (RNF18).
 *
 * Confere o build (dist/) e não o código: é o que o celular de quem visita
 * baixa de verdade. O site está hoje abaixo de cada teto, com folga
 * pequena de propósito: uma dependência pesada, uma foto sem compressão ou
 * um import no lugar errado reprova o teste antes de ir para o ar.
 *
 * Tamanhos em gzip, que é como a Cloudflare entrega (o Brotli é ainda menor).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

const DIST = path.resolve(__dirname, '../../dist')
const PUBLICO = path.resolve(__dirname, '../../public')
const KB = 1024

const gz = (arquivo: string) => gzipSync(readFileSync(path.join(DIST, arquivo)), { level: 9 }).length

/** o que a página pede antes de pintar: o script de entrada, os modulepreload e os CSS */
function abertura(pagina: string) {
  const html = readFileSync(path.join(DIST, pagina), 'utf8')
  const js = [...html.matchAll(/<(?:script type="module"[^>]*src|link rel="modulepreload"[^>]*href)="\/([^"]+)"/g)].map((m) => m[1])
  const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="\/([^"]+)"/g)].map((m) => m[1])
  return { html, js, css, pesoJs: js.reduce((t, a) => t + gz(a), 0), pesoCss: css.reduce((t, a) => t + gz(a), 0) }
}

const arquivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? arquivos(p) : [p]
  })

describe('RNF18 · abertura do site', () => {
  const site = abertura('index.html')

  it('JavaScript da abertura até 65 KB', () => {
    expect(site.pesoJs / KB).toBeLessThanOrEqual(65)
  })

  it('CSS da abertura até 9 KB', () => {
    expect(site.pesoCss / KB).toBeLessThanOrEqual(9)
  })

  it('HTML até 2 KB', () => {
    expect(gz('index.html') / KB).toBeLessThanOrEqual(2)
  })

  it('o mapa (Leaflet e MapLibre) e o painel não vêm na abertura', () => {
    const tudo = [...site.js, ...site.css].join(' ')
    expect(tudo).not.toMatch(/leaflet|maplibre|mapa-|admin|MapaPonto/i)
  })

  it('nenhum código do Leaflet ou do MapLibre dentro dos arquivos da abertura', () => {
    for (const a of site.js) {
      const codigo = readFileSync(path.join(DIST, a), 'utf8')
      expect(codigo, a).not.toMatch(/leaflet-container|maplibregl/)
    }
  })

  it('nenhuma folha de estilo ou fonte de outro servidor bloqueando a primeira pintura', () => {
    expect(site.html).not.toMatch(/<link[^>]+href="https?:\/\//)
    expect(site.html).not.toMatch(/<script[^>]+src="https?:\/\//)
  })

  it('cabe no primeiro pedaço de uma conexão lenta: HTML + JS + CSS até 80 KB', () => {
    expect((gz('index.html') + site.pesoJs + site.pesoCss) / KB).toBeLessThanOrEqual(80)
  })
})

describe('RNF18 · painel', () => {
  const painel = abertura('admin.html')

  it('JavaScript da abertura do painel até 72 KB', () => {
    expect(painel.pesoJs / KB).toBeLessThanOrEqual(72)
  })

  it('o minimapa do painel vem só quando a página de contatos abre', () => {
    expect(painel.js.join(' ')).not.toMatch(/leaflet|maplibre|MapaPonto/i)
  })
})

describe('RNF18 · arquivos do site', () => {
  it('o MapLibre é o único arquivo grande, e só baixa quando o mapa precisa dele', () => {
    const grandes = readdirSync(path.join(DIST, 'assets'))
      .filter((a) => /\.(m?js|css)$/.test(a))
      .filter((a) => gz(`assets/${a}`) > 60 * KB)
    expect(grandes.every((a) => /^maplibre-gl/.test(a)), grandes.join(', ')).toBe(true)
  })

  it('fontes: só woff2/woff latino, cada uma até 30 KB, e no máximo 8 no site', () => {
    const fontes = readdirSync(path.join(DIST, 'assets')).filter((a) => /\.woff2$/.test(a))
    for (const f of fontes) {
      expect(f).toMatch(/latin-\d{3}/)
      expect(statSync(path.join(DIST, 'assets', f)).size / KB, f).toBeLessThanOrEqual(30)
    }
    const css = abertura('index.html').css.map((c) => readFileSync(path.join(DIST, c), 'utf8')).join('')
    const doSite = new Set([...css.matchAll(/url\(\/assets\/([^)]+\.woff2)\)/g)].map((m) => m[1]))
    expect(doSite.size).toBeLessThanOrEqual(8)
  })

  it.each(['photos', 'portfolioImgs', 'instrutorImgs'])('fotos de public/%s até 250 KB cada', (pasta) => {
    for (const f of arquivos(path.join(PUBLICO, pasta)).filter((a) => /\.(jpe?g|png|webp)$/i.test(a))) {
      expect(statSync(f).size / KB, path.relative(PUBLICO, f)).toBeLessThanOrEqual(250)
    }
  })

  it('imagem de compartilhamento (og-image) até 200 KB', () => {
    expect(statSync(path.join(PUBLICO, 'og-image.jpg')).size / KB).toBeLessThanOrEqual(200)
  })

  it('vídeos do portfólio até 6 MB cada', () => {
    for (const f of arquivos(path.join(PUBLICO, 'videosImgs')).filter((a) => /\.(mp4|webm)$/.test(a))) {
      expect(statSync(f).size / (KB * KB), path.relative(PUBLICO, f)).toBeLessThanOrEqual(6)
    }
  })
})
