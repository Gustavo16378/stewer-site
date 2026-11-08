/**
 * Segurança · A05 Security Misconfiguration (RNF03, RNF06).
 *
 * Os cabeçalhos que mandam o navegador se defender: CSP, nosniff, proibir
 * o site dentro de iframe (clickjacking), HSTS. As páginas recebem os de
 * public/_headers; a API recebe os de functions/_lib/http.ts.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, URL_BASE, formFoto, imagem, logado } from '../api/cliente'

const cabecalhos = async (caminho: string, init: RequestInit = {}) =>
  (await fetch(URL_BASE + caminho, { redirect: 'manual', ...init })).headers

/** a CSP em pedaços: { 'script-src': ["'self'"], ... } */
const diretivas = (csp: string) =>
  Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0])
      .map(([nome, ...valores]) => [nome, valores]),
  ) as Record<string, string[]>

let painel: Cliente
beforeAll(async () => {
  painel = await logado()
})

describe('páginas (public/_headers)', () => {
  it.each(['/', '/admin', '/admin.html', '/robots.txt'])('%s tem os cabeçalhos de proteção', async (caminho) => {
    const h = await cabecalhos(caminho)
    expect(h.get('x-content-type-options')).toBe('nosniff')
    expect(h.get('x-frame-options')).toBe('DENY')
    expect(h.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(h.get('strict-transport-security')).toMatch(/max-age=\d{8,}/)
    expect(h.get('cross-origin-opener-policy')).toBe('same-origin')
    expect(h.get('permissions-policy')).toMatch(/camera=\(\)/)
    expect(h.get('content-security-policy')).toBeTruthy()
  })

  describe('Content-Security-Policy', () => {
    let csp: Record<string, string[]>
    beforeAll(async () => {
      csp = diretivas((await cabecalhos('/')).get('content-security-policy') ?? '')
    })

    it('script só do próprio site: nada de inline, eval ou CDN', () => {
      expect(csp['script-src']).toEqual(["'self'"])
    })

    it('sem plugin (object), sem <base> trocado, sem formulário para fora', () => {
      expect(csp['object-src']).toEqual(["'none'"])
      expect(csp['base-uri']).toEqual(["'self'"])
      expect(csp['form-action']).toEqual(["'self'"])
    })

    it('ninguém põe o site num iframe (clickjacking)', () => {
      expect(csp['frame-ancestors']).toEqual(["'none'"])
    })

    it('o padrão é fechado e nenhuma diretiva libera qualquer origem (*)', () => {
      expect(csp['default-src']).toEqual(["'self'"])
      for (const [nome, valores] of Object.entries(csp)) {
        expect(valores, nome).not.toContain('*')
        expect(valores, nome).not.toContain('http:')
        expect(valores, nome).not.toContain("'unsafe-eval'")
      }
    })

    it('fora do script e do estilo, só as origens que o mapa e as fontes usam', () => {
      const permitidas = new Set([
        "'self'",
        'data:',
        'blob:',
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://basemaps.cartocdn.com',
        'https://*.basemaps.cartocdn.com',
        'https://tile.openstreetmap.org',
        'https://tiles.openfreemap.org',
        "'none'",
      ])
      for (const valores of Object.values(csp)) for (const v of valores) expect(permitidas).toContain(v)
    })

    it("'unsafe-inline' só no estilo (o Leaflet e o React põem style= nos elementos)", () => {
      for (const [nome, valores] of Object.entries(csp)) {
        if (nome !== 'style-src') expect(valores, nome).not.toContain("'unsafe-inline'")
      }
    })
  })

  it('o build não tem <script> inline, que a CSP bloquearia', () => {
    for (const pagina of ['index.html', 'admin.html']) {
      const html = readFileSync(path.resolve(__dirname, '../../dist', pagina), 'utf8')
      const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
      expect(scripts.length, pagina).toBeGreaterThan(0)
      for (const [, atributos, corpo] of scripts) {
        // JSON-LD não executa: a CSP não se aplica a ele
        if (/type="application\/ld\+json"/.test(atributos)) continue
        expect(atributos, pagina).toMatch(/\bsrc="\//)
        expect(corpo.trim(), pagina).toBe('')
      }
      expect(html, pagina).not.toMatch(/\son[a-z]+="/i)
    }
  })

  it('o painel não aparece no Google e não fica em cache', async () => {
    for (const caminho of ['/admin', '/admin.html']) {
      const h = await cabecalhos(caminho)
      expect(h.get('x-robots-tag')).toMatch(/noindex/)
      expect(h.get('cache-control')).toMatch(/no-store/)
    }
  })

  it('o site público pode ser indexado', async () => {
    expect((await cabecalhos('/')).get('x-robots-tag')).toBeNull()
  })
})

describe('API (functions/_lib/http.ts)', () => {
  const conferir = (h: Headers) => {
    expect(h.get('x-content-type-options')).toBe('nosniff')
    expect(h.get('x-frame-options')).toBe('DENY')
    const csp = diretivas(h.get('content-security-policy') ?? '')
    // JSON não executa nada: a política mais fechada que existe
    expect(csp['default-src']).toEqual(["'none'"])
    expect(csp['frame-ancestors']).toEqual(["'none'"])
  }

  it.each([
    ['conteúdo público', () => new Cliente().get('/api/conteudo')],
    ['erro 401', () => new Cliente().get('/api/admin/servicos')],
    ['erro 400', () => new Cliente().post('/api/auth/login', {})],
    ['erro 404', () => painel.put('/api/admin/servicos/999999', { titulo: 'x' })],
    ['rota que não existe', () => new Cliente().get('/api/qualquer/coisa')],
    ['resposta do painel', () => painel.get('/api/admin/servicos')],
  ])('%s', async (_, pedido) => {
    const r = await pedido()
    conferir(r.cabecalhos)
    expect(r.cabecalhos.get('content-type')).toMatch(/^application\/json/)
  })

  it.each([
    ['GET', '/api/nao-existe', 404],
    ['GET', '/api/admin/servicos/1', 404],
    ['GET', '/api/midias', 404],
    ['POST', '/api/conteudo', 405],
    ['DELETE', '/api/auth/login', 405],
  ])('%s %s → %i em JSON, nunca a página do site', async (metodo, caminho, status) => {
    const r = await painel.pedir(metodo, caminho)
    expect(r.status).toBe(status)
    expect(r.cabecalhos.get('content-type')).toMatch(/^application\/json/)
    expect(r.corpo).toEqual({ erro: expect.any(String) })
  })

  it('o painel nunca fica em cache (nem no navegador, nem num proxy no meio)', async () => {
    const r = await painel.get('/api/admin/servicos')
    expect(r.cabecalhos.get('cache-control')).toMatch(/no-store/)
  })

  it('foto enviada: tipo real, nosniff e CSP fechada (um arquivo malicioso não roda)', async () => {
    const enviada = (await painel.post('/api/admin/midias', formFoto(await imagem('png'), 'image/png'))).corpo.item
    const r = await fetch(URL_BASE + enviada.url)
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toMatch(/^image\/(jpeg|png|webp)$/)
    conferir(r.headers)
    await painel.del(`/api/admin/midias/${enviada.id}`)
  })

  it('nenhuma resposta diz qual servidor ou versão roda por trás', async () => {
    for (const h of [await cabecalhos('/api/conteudo'), await cabecalhos('/')]) {
      expect(h.get('x-powered-by')).toBeNull()
      expect(h.get('server') ?? '').not.toMatch(/\d+\.\d+/)
    }
  })

  it('CORS: a API não libera leitura para outros sites', async () => {
    const h = await cabecalhos('/api/conteudo', { headers: { Origin: 'https://site-malicioso.com' } })
    expect(h.get('access-control-allow-origin')).toBeNull()
    expect(h.get('access-control-allow-credentials')).toBeNull()
  })
})
