/**
 * Segurança · A01 Broken Access Control e A07 Identification and
 * Authentication Failures (RNF02, RNF04).
 *
 * Quem ataca aqui já sabe tudo sobre o sistema: o formato do token, o nome
 * do cookie e, no pior caso, até o JWT_SECRET (vazou de algum jeito). Mesmo
 * assim, sem uma sessão aberta no banco, não entra.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// @ts-expect-error módulo .mjs sem tipos
import { JWT_SECRET } from '../servidor-teste.mjs'
import { ADMIN, Cliente, banco, logado } from '../api/cliente'

const b64url = (b: Uint8Array | string) =>
  Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

async function forjar(cabecalho: object, carga: object, segredo: string = JWT_SECRET) {
  const dados = `${b64url(JSON.stringify(cabecalho))}.${b64url(JSON.stringify(carga))}`
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const ass = new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(dados)))
  return `${dados}.${b64url(ass)}`
}

const comCookie = (token: string) => {
  const c = new Cliente()
  c.cookie = `sg_sessao=${token}`
  return c
}

const tokenDe = (c: Cliente) => c.cookie.replace(/^sg_sessao=/, '')
const cargaDe = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
const sessoesDe = (email: string) => {
  const b = banco()
  const n = b.um<{ n: number }>(
    'SELECT COUNT(*) AS n FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE u.email = ?',
    email,
  ).n
  b.fechar()
  return n
}

let admin: { id: number }
let painel: Cliente
beforeAll(async () => {
  painel = await logado()
  admin = (await painel.get('/api/auth/eu')).corpo.usuario
})

describe('A07 · token forjado não entra', () => {
  it('controle: um token de verdade entra (os casos abaixo isolam um defeito cada)', async () => {
    expect((await comCookie(tokenDe(painel)).get('/api/admin/servicos')).status).toBe(200)
  })

  it('alg "none" sem assinatura → 401', async () => {
    const carga = cargaDe(tokenDe(painel))
    const t = `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64url(JSON.stringify(carga))}.`
    expect((await comCookie(t).get('/api/admin/servicos')).status).toBe(401)
  })

  it('carga trocada para outra pessoa (sub) com a assinatura antiga → 401', async () => {
    const [cab, , ass] = tokenDe(painel).split('.')
    const carga = { ...cargaDe(tokenDe(painel)), sub: admin.id + 1 }
    expect((await comCookie(`${cab}.${b64url(JSON.stringify(carga))}.${ass}`).get('/api/admin/servicos')).status).toBe(401)
  })

  it('assinado com outro segredo → 401', async () => {
    const t = await forjar({ alg: 'HS256' }, cargaDe(tokenDe(painel)), 'outro-segredo-qualquer-com-mais-de-32-chars')
    expect((await comCookie(t).get('/api/admin/servicos')).status).toBe(401)
  })

  it('expirado, mesmo com a sessão aberta → 401', async () => {
    const t = await forjar({ alg: 'HS256' }, { ...cargaDe(tokenDe(painel)), exp: Math.floor(Date.now() / 1000) - 1 })
    expect((await comCookie(t).get('/api/admin/servicos')).status).toBe(401)
  })

  it('com o JWT_SECRET vazado, mas sem uma sessão aberta no banco → 401', async () => {
    const t = await forjar(
      { alg: 'HS256', typ: 'JWT' },
      { sub: admin.id, nome: ADMIN.nome, email: ADMIN.email, exp: Math.floor(Date.now() / 1000) + 3600, sid: 'inventada' },
    )
    expect((await comCookie(t).get('/api/admin/servicos')).status).toBe(401)
  })

  it('com o JWT_SECRET vazado e a sessão de outra pessoa → 401 (sessão e pessoa precisam bater)', async () => {
    const outra = await painel.post('/api/admin/usuarios', { nome: 'Sessão Alheia', email: 'alheia@teste.local' })
    const c = new Cliente()
    await c.entrar('alheia@teste.local', outra.corpo.senhaTemporaria)
    const sidAlheio = cargaDe(tokenDe(c)).sid
    const t = await forjar({ alg: 'HS256' }, { ...cargaDe(tokenDe(painel)), sid: sidAlheio })
    expect((await comCookie(t).get('/api/auth/eu')).status).toBe(401)
    await painel.del(`/api/admin/usuarios/${outra.corpo.item.id}`)
  })

  it.each([
    ['cookie vazio', 'sg_sessao='],
    ['cookie duplicado com lixo antes', 'sg_sessao=lixo; sg_sessao=lixo2'],
    ['token gigante', `sg_sessao=${'a'.repeat(3000)}.${'b'.repeat(3000)}.${'c'.repeat(3000)}`],
    ['base64 inválido', 'sg_sessao=@@@.@@@.@@@'],
    ['JSON inválido dentro do token', `sg_sessao=${b64url('{')}.${b64url('{')}.${b64url('x')}`],
  ])('%s → 401, nunca 500', async (_, cookie) => {
    const c = new Cliente()
    c.cookie = cookie
    const r = await c.get('/api/admin/servicos')
    expect(r.status).toBe(401)
  })
})

describe('A07 · sessão no servidor', () => {
  it('cada login abre uma sessão própria, com id aleatório de 128 bits', async () => {
    const a = cargaDe(tokenDe(await logado())).sid
    const b = cargaDe(tokenDe(await logado())).sid
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[\w-]{22}$/)
  })

  it('caixa cinza · o login grava a sessão no banco com validade de 8 horas', async () => {
    const c = await logado()
    const b = banco()
    const s = b.um<{ horas: number }>(
      `SELECT ROUND((julianday(expira_em) - julianday(criado_em)) * 24, 2) AS horas FROM sessoes WHERE id = ?`,
      cargaDe(tokenDe(c)).sid,
    )
    b.fechar()
    expect(s.horas).toBe(8)
  })

  it('"Sair" mata o token no servidor: quem copiou o cookie antes fica de fora', async () => {
    const c = await logado()
    const copia = comCookie(tokenDe(c))
    expect((await copia.get('/api/admin/servicos')).status).toBe(200)
    await c.post('/api/auth/logout')
    expect((await copia.get('/api/admin/servicos')).status).toBe(401)
    expect((await copia.get('/api/auth/eu')).status).toBe(401)
  })

  it('"Sair" num aparelho não derruba a sessão de outro', async () => {
    const celular = await logado()
    const computador = await logado()
    await celular.post('/api/auth/logout')
    expect((await computador.get('/api/admin/servicos')).status).toBe(200)
  })

  it('caixa cinza · "Sair" apaga a linha da sessão', async () => {
    const c = await logado()
    const sid = cargaDe(tokenDe(c)).sid
    await c.post('/api/auth/logout')
    const b = banco()
    const n = b.um<{ n: number }>('SELECT COUNT(*) AS n FROM sessoes WHERE id = ?', sid).n
    b.fechar()
    expect(n).toBe(0)
  })

  it('"Sair" sem sessão (ou com token falso) só apaga o cookie', async () => {
    const r = await comCookie('lixo.lixo.lixo').post('/api/auth/logout')
    expect(r.status).toBe(200)
    expect(r.cabecalhos.get('set-cookie')).toMatch(/Max-Age=0/)
  })
})

describe('A07 · trocar a senha encerra as outras sessões', () => {
  const email = 'troca-sessao@teste.local'
  let id = 0
  let temporaria = ''

  beforeAll(async () => {
    const r = await painel.post('/api/admin/usuarios', { nome: 'Troca Sessão', email })
    id = r.corpo.item.id
    temporaria = r.corpo.senhaTemporaria
  })
  afterAll(async () => {
    await painel.del(`/api/admin/usuarios/${id}`)
  })

  it('quem troca a própria senha continua; o aparelho esquecido logado cai', async () => {
    const esquecido = new Cliente()
    await esquecido.entrar(email, temporaria)
    const agora = new Cliente()
    await agora.entrar(email, temporaria)

    expect((await agora.put('/api/admin/senha', { nova: 'senha-nova-da-troca-1' })).status).toBe(200)
    expect((await agora.get('/api/admin/servicos')).status).toBe(200)
    expect((await esquecido.get('/api/auth/eu')).status).toBe(401)
    expect(sessoesDe(email)).toBe(1)
  })

  it('senha temporária gerada por outra pessoa derruba todas as sessões da conta', async () => {
    const a = new Cliente()
    await a.entrar(email, 'senha-nova-da-troca-1')
    const b = new Cliente()
    await b.entrar(email, 'senha-nova-da-troca-1')
    expect(sessoesDe(email)).toBeGreaterThanOrEqual(2)

    expect((await painel.put(`/api/admin/usuarios/${id}`)).status).toBe(200)
    expect((await a.get('/api/auth/eu')).status).toBe(401)
    expect((await b.get('/api/auth/eu')).status).toBe(401)
    expect(sessoesDe(email)).toBe(0)
  })

  it('a sessão do admin que gerou a senha temporária não é afetada', async () => {
    expect((await painel.get('/api/admin/servicos')).status).toBe(200)
  })
})

describe('A01 · acesso removido vale na hora', () => {
  it('tirar o acesso de alguém derruba a sessão aberta dela e apaga as sessões no banco', async () => {
    const email = 'removida@teste.local'
    const r = await painel.post('/api/admin/usuarios', { nome: 'Removida', email })
    const c = new Cliente()
    await c.entrar(email, r.corpo.senhaTemporaria)
    await c.put('/api/admin/senha', { nova: 'senha-de-quem-sai-1' })
    expect((await c.get('/api/admin/servicos')).status).toBe(200)

    expect((await painel.del(`/api/admin/usuarios/${r.corpo.item.id}`)).status).toBe(200)
    expect((await c.get('/api/admin/servicos')).status).toBe(401)
    expect(sessoesDe(email)).toBe(0)
  })

  it('senha temporária só abre a troca de senha (o resto do painel fica fechado)', async () => {
    const email = 'temporaria@teste.local'
    const r = await painel.post('/api/admin/usuarios', { nome: 'Temporária', email })
    const c = new Cliente()
    await c.entrar(email, r.corpo.senhaTemporaria)
    for (const [m, caminho] of [
      ['GET', '/api/admin/servicos'],
      ['GET', '/api/admin/usuarios'],
      ['POST', '/api/admin/usuarios'],
      ['PUT', '/api/admin/textos'],
      ['GET', '/api/admin/auditoria'],
    ]) {
      expect((await c.pedir(m, caminho, m === 'GET' ? undefined : {})).status, `${m} ${caminho}`).toBe(403)
    }
    await painel.del(`/api/admin/usuarios/${r.corpo.item.id}`)
  })
})
