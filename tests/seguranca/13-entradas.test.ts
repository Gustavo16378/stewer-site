/**
 * Segurança · entradas hostis que não são SQL (OWASP A01, A03, A04, A08, A10).
 *
 * - A10 SSRF: o link do mapa é aberto pelo servidor. Só pode ir ao Google.
 * - A03 upload: arquivo que não é foto não entra, nem disfarçado.
 * - A01 path traversal: o id da rota não vira caminho de arquivo.
 * - A08 mass assignment: campo que o painel não manda não é gravado.
 * - Header injection no nome do download.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, URL_BASE, banco, formFoto, imagem, logado } from '../api/cliente'

let painel: Cliente
beforeAll(async () => {
  painel = await logado()
})

describe('A10 · SSRF no link do mapa', () => {
  it.each([
    ['metadados da nuvem', 'http://169.254.169.254/latest/meta-data/'],
    ['localhost', 'http://localhost:8798/api/admin/usuarios'],
    ['127.0.0.1', 'https://127.0.0.1/'],
    ['IPv6 local', 'https://[::1]/'],
    ['rede interna', 'https://10.0.0.1/'],
    ['IP em decimal', 'https://2130706433/'],
    ['file://', 'file:///etc/passwd'],
    ['gopher://', 'gopher://127.0.0.1:6379/_INFO'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['javascript:', 'javascript:alert(1)'],
    ['http do Google (sem TLS)', 'http://maps.app.goo.gl/abc'],
    ['usuário@ na frente', 'https://maps.app.goo.gl@169.254.169.254/'],
    ['porta trocada', 'https://maps.app.goo.gl:8080/abc'],
    ['domínio parecido', 'https://maps.app.goo.gl.site-malicioso.com/abc'],
    ['Google no caminho', 'https://site-malicioso.com/maps.app.goo.gl/abc'],
    ['Google no parâmetro', 'https://site-malicioso.com/?u=https://maps.app.goo.gl/abc'],
    ['barra invertida', 'https://maps.app.goo.gl\\@site-malicioso.com/'],
    ['ponto no fim', 'https://site-malicioso.com./'],
  ])('%s → 400, sem abrir nada', async (_, url) => {
    const r = await painel.post('/api/admin/link-mapa', { url })
    expect(r.status, JSON.stringify(r.corpo)).toBe(400)
    expect(r.corpo).toEqual({ erro: expect.any(String) })
  })

  it('link de verdade com o ponto no texto é lido sem nenhum acesso à rede', async () => {
    const r = await painel.post('/api/admin/link-mapa', {
      url: 'https://www.google.com/maps/place/Boss+House/@-10.18,-48.33,17z/data=!3d-10.1842!4d-48.3336',
    })
    expect(r.status).toBe(200)
    expect(r.corpo).toEqual({ latitude: -10.1842, longitude: -48.3336 })
  })

  it.each([
    ['sem url', {}],
    ['url número', { url: 123 }],
    ['url objeto', { url: { href: 'https://maps.app.goo.gl/x' } }],
    ['url gigante', { url: `https://maps.app.goo.gl/${'a'.repeat(5000)}` }],
  ])('%s → 400 ou 413, nunca 500', async (_, corpo) => {
    const r = await painel.post('/api/admin/link-mapa', corpo)
    expect([400, 413]).toContain(r.status)
  })

  it('só quem está no painel usa o resolvedor (não vira proxy aberto)', async () => {
    expect((await new Cliente().post('/api/admin/link-mapa', { url: 'https://maps.app.goo.gl/x' })).status).toBe(401)
  })
})

describe('A03 · upload só de foto de verdade', () => {
  const texto = (s: string) => new TextEncoder().encode(s)

  it.each([
    ['HTML com script dizendo ser JPEG', texto('<html><script>alert(document.cookie)</script></html>'), 'image/jpeg'],
    ['SVG com script', texto('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'), 'image/svg+xml'],
    ['SVG dizendo ser PNG', texto('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'image/png'],
    ['GIF', texto('GIF89a\x01\x00\x01\x00'), 'image/gif'],
    ['executável', new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]), 'image/jpeg'],
    ['PDF', texto('%PDF-1.7\n'), 'image/png'],
    ['vazio', new Uint8Array(), 'image/jpeg'],
    ['começo de JPEG cortado', new Uint8Array([0xff, 0xd8]), 'image/jpeg'],
  ])('%s → 415 (ou 400) e nada gravado', async (_, bytes, tipo) => {
    const b = banco()
    const antes = b.um<{ n: number }>('SELECT COUNT(*) AS n FROM midias').n
    b.fechar()
    const r = await painel.post('/api/admin/midias', formFoto(bytes, tipo))
    expect([400, 415]).toContain(r.status)
    const d = banco()
    expect(d.um<{ n: number }>('SELECT COUNT(*) AS n FROM midias').n).toBe(antes)
    d.fechar()
  })

  it('poliglota (JPEG de verdade com HTML colado no fim) entra, mas sai como imagem que não executa', async () => {
    const jpeg = await imagem('jpeg')
    const html = texto('<html><script>alert(1)</script></html>')
    const poliglota = new Uint8Array([...jpeg, ...html])
    const r = await painel.post('/api/admin/midias', formFoto(poliglota, 'text/html'))
    expect(r.status).toBe(201)
    const f = await fetch(URL_BASE + r.corpo.item.url)
    expect(f.headers.get('content-type')).toBe('image/jpeg')
    expect(f.headers.get('x-content-type-options')).toBe('nosniff')
    expect(f.headers.get('content-security-policy')).toMatch(/default-src 'none'/)
    await painel.del(`/api/admin/midias/${r.corpo.item.id}`)
  })

  it('nome do download não aceita quebra de linha nem aspas (header injection)', async () => {
    const r = await painel.post(
      '/api/admin/midias',
      formFoto(await imagem('png'), 'image/png', 'foto"\r\nSet-Cookie: sg_sessao=roubado; x="'),
    )
    expect(r.status).toBe(201)
    const f = await fetch(`${URL_BASE}${r.corpo.item.url}?baixar=1`)
    const disp = f.headers.get('content-disposition') ?? ''
    expect(disp).toMatch(/^attachment; filename="[a-z0-9-]+\.png"$/)
    expect(f.headers.get('set-cookie')).toBeNull()
    await painel.del(`/api/admin/midias/${r.corpo.item.id}`)
  })
})

describe('A01 · id da rota não vira caminho', () => {
  it.each([
    '/api/midias/..%2F..%2Fwrangler.toml',
    '/api/midias/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '/api/midias/1%00.jpg',
    '/api/midias/-1',
    '/api/midias/0x1',
    '/api/midias/1e3',
    '/api/midias/99999999999999999999',
  ])('%s → 400 ou 404, sem arquivo do servidor', async (caminho) => {
    const r = await fetch(URL_BASE + caminho, { redirect: 'manual' })
    expect([400, 404]).toContain(r.status)
    const corpo = await r.text()
    expect(corpo).not.toMatch(/database_id|root:|JWT_SECRET/)
  })

  it.each(['/wrangler.toml', '/.git/config', '/functions/_lib/auth.ts', '/migrations/0001_schema.sql', '/.dev.vars', '/package.json'])(
    'arquivo do projeto %s não é servido',
    async (caminho) => {
      const r = await fetch(URL_BASE + caminho, { redirect: 'manual' })
      const corpo = await r.text()
      // o Pages devolve o index.html para rota desconhecida (SPA): nunca o arquivo
      expect(corpo).not.toMatch(/database_id|\[core\]|JWT_SECRET|CREATE TABLE|"devDependencies"|export async function/)
    },
  )
})

describe('A08 · mass assignment', () => {
  it('editar um serviço não deixa trocar id, versão nem data', async () => {
    const { itens } = (await painel.get('/api/admin/servicos')).corpo
    const alvo = itens[0]
    const r = await painel.put(`/api/admin/servicos/${alvo.id}`, {
      titulo: alvo.titulo,
      id: 999,
      versao: alvo.versao,
      atualizado_em: '1999-01-01 00:00:00',
      criado_em: '1999-01-01 00:00:00',
    })
    expect(r.status).toBe(200)
    const b = banco()
    const linha = b.um<{ id: number; atualizado_em: string }>('SELECT id, atualizado_em FROM servicos WHERE id = ?', alvo.id)
    const fantasma = b.um('SELECT id FROM servicos WHERE id = 999')
    b.fechar()
    expect(linha.id).toBe(alvo.id)
    expect(linha.atualizado_em).not.toMatch(/^1999/)
    expect(fantasma).toBeUndefined()
  })

  it('criar alguém não deixa escolher senha, hash nem pular a troca de senha', async () => {
    const r = await painel.post('/api/admin/usuarios', {
      nome: 'Atalho',
      email: 'atalho@teste.local',
      senha: 'eu-escolho-123',
      senha_hash: 'x',
      salt: 'y',
      iteracoes: 1,
      trocar_senha: 0,
      id: 1,
    })
    expect(r.status).toBe(201)
    const b = banco()
    const u = b.um<{ id: number; iteracoes: number; trocar_senha: number; senha_hash: string }>(
      `SELECT id, iteracoes, trocar_senha, senha_hash FROM usuarios WHERE email = 'atalho@teste.local'`,
    )
    b.fechar()
    expect(u.id).not.toBe(1)
    expect(u.trocar_senha).toBe(1)
    expect(u.iteracoes).toBe(100_000)
    expect(u.senha_hash).not.toBe('x')
    expect((await new Cliente().post('/api/auth/login', { email: 'atalho@teste.local', senha: 'eu-escolho-123' })).status).toBe(401)
    await painel.del(`/api/admin/usuarios/${u.id}`)
  })

  it('configuração desconhecida não é gravada', async () => {
    const r = await painel.put('/api/admin/configuracoes', { instagram: 'stewer.gabriel', JWT_SECRET: 'x', admin: 'sim' })
    expect(r.status).toBeLessThan(500)
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM configuracoes WHERE chave IN ('JWT_SECRET', 'admin')`).n
    b.fechar()
    expect(n).toBe(0)
  })

  it('texto com chave fora da lista não é gravado', async () => {
    const r = await painel.put('/api/admin/textos', { valores: { 'hero.lema': 'Arte & Precisão', 'qualquer.coisa': 'x' } })
    expect(r.status).toBe(400)
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM textos WHERE chave = 'qualquer.coisa'`).n
    b.fechar()
    expect(n).toBe(0)
  })
})
