/**
 * Segurança · A03 Injection: SQL injection (RNF05).
 *
 * Cada entrada que chega ao banco recebe a bateria de payloads de
 * payloads.ts. A API pode recusar (400/401/404) ou guardar o texto como
 * texto, mas nunca pode: responder 500, devolver dado que não pediu, ou
 * mudar o banco. No fim, a caixa cinza confere o banco inteiro.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Cliente, banco, logado } from '../api/cliente'
import { SQL, VAZAMENTO } from './payloads'

let painel: Cliente
let alvo: { id: number; email: string }
let antes: { tabelas: string[]; usuarios: number; servicos: number; textos: number }

const retrato = () => {
  const b = banco()
  const r = {
    tabelas: b.todos<{ name: string }>(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`).map((t) => t.name),
    usuarios: b.um<{ n: number }>('SELECT COUNT(*) AS n FROM usuarios').n,
    servicos: b.um<{ n: number }>('SELECT COUNT(*) AS n FROM servicos').n,
    textos: b.um<{ n: number }>('SELECT COUNT(*) AS n FROM textos').n,
  }
  b.fechar()
  return r
}

/**
 * Nunca 500, nunca dado de banco na resposta. O próprio payload pode voltar
 * (foi guardado como texto): ele é tirado antes de procurar vazamento.
 */
const seguro = (r: { status: number; corpo: unknown }, payload = '') => {
  expect(r.status, JSON.stringify(r.corpo)).toBeLessThan(500)
  let texto = JSON.stringify(r.corpo ?? '')
  for (const p of [payload, payload.slice(0, 40), payload.slice(0, 60)].filter(Boolean)) {
    texto = texto.split(JSON.stringify(p).slice(1, -1)).join('')
  }
  expect(texto).not.toMatch(VAZAMENTO)
}

beforeAll(async () => {
  painel = await logado()
  antes = retrato()
  // a bateria de senhas trava o login depois de 5 erros: usa uma conta só
  // para isso, e não a do painel
  const r = await painel.post('/api/admin/usuarios', { nome: 'Alvo SQL', email: 'alvo-sql@teste.local' })
  alvo = { id: r.corpo.item.id, email: 'alvo-sql@teste.local' }
})

afterAll(async () => {
  await painel.del(`/api/admin/usuarios/${alvo.id}`)
})

describe('login', () => {
  it.each(SQL)('e-mail %s → 400/401, nunca entra', async (p) => {
    const c = new Cliente(`10.9.${SQL.indexOf(p)}.1`)
    const r = await c.post('/api/auth/login', { email: p, senha: 'qualquer-coisa-123' })
    seguro(r, p)
    expect([400, 401]).toContain(r.status)
    expect(c.cookie).toBe('')
  })

  it.each(SQL)('senha %s com e-mail certo → 401 (ou 429 depois da trava), nunca entra', async (p) => {
    const c = new Cliente(`10.8.${SQL.indexOf(p)}.1`)
    const r = await c.post('/api/auth/login', { email: alvo.email, senha: p })
    seguro(r, p)
    expect([401, 429]).toContain(r.status)
    expect(c.cookie).toBe('')
  })
})

describe('rotas: nome da lista e id', () => {
  it.each(SQL)('lista %s → 404', async (p) => {
    const r = await painel.get(`/api/admin/${encodeURIComponent(p)}`)
    seguro(r, p)
    expect(r.status).toBe(404)
  })

  it.each(SQL)('id %s → 404 no PUT e no DELETE', async (p) => {
    const put = await painel.put(`/api/admin/servicos/${encodeURIComponent(p)}`, { titulo: 'x' })
    const del = await painel.del(`/api/admin/servicos/${encodeURIComponent(p)}`)
    seguro(put, p)
    seguro(del, p)
    expect([put.status, del.status]).toEqual([404, 404])
  })

  it.each(SQL)('foto %s → 404', async (p) => {
    const r = await painel.get(`/api/midias/${encodeURIComponent(p)}`)
    seguro(r, p)
    expect(r.status).toBe(404)
  })
})

describe('campos de texto: guardados como texto, sem executar', () => {
  const criados: number[] = []
  afterAll(async () => {
    for (const id of criados) await painel.del(`/api/admin/servicos/${id}`)
  })

  it.each(SQL)('serviço com título %s', async (p) => {
    // a API tira espaço das pontas: o título cortado em 40 pode terminar em espaço
    const titulo = p.slice(0, 40).trim()
    const r = await painel.post('/api/admin/servicos', { titulo, texto: p })
    seguro(r, p)
    expect(r.status).toBe(201)
    criados.push(r.corpo.item.id)
    // o que voltou é exatamente o que foi mandado: o banco tratou como dado
    expect(r.corpo.item).toMatchObject({ titulo, texto: p })
  })

  it('caixa cinza: os textos estão no banco, literais', () => {
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM servicos WHERE texto LIKE '%DROP TABLE%'`).n
    b.fechar()
    expect(n).toBeGreaterThan(0)
  })

  it.each(SQL)('texto do site %s', async (p) => {
    const r = await painel.put('/api/admin/textos', { valores: { 'rodape.frase': p } })
    seguro(r, p)
    expect(r.status).toBe(200)
    expect((await painel.get('/api/admin/textos')).corpo.valores['rodape.frase']).toBe(p)
  })

  it('chave de texto com SQL → 400 (lista fechada)', async () => {
    for (const p of SQL) {
      const r = await painel.put('/api/admin/textos', { valores: { [p]: 'x' } })
      seguro(r, p)
      expect(r.status).toBe(400)
    }
    await painel.put('/api/admin/textos', { valores: { 'rodape.frase': null } })
  })

  it.each(SQL)('mensagem do WhatsApp %s', async (p) => {
    const r = await painel.put('/api/admin/configuracoes', { mensagem: p.length >= 3 ? p : `${p}...` })
    seguro(r, p)
    expect(r.status).toBe(200)
  })

  it.each(SQL)('Instagram e coordenadas %s → 400', async (p) => {
    const a = await painel.put('/api/admin/configuracoes', { instagram: p })
    const b = await painel.put('/api/admin/configuracoes', { coordenadas: p })
    seguro(a, p)
    seguro(b, p)
    expect([a.status, b.status]).toEqual([400, 400])
  })

  afterAll(async () => {
    await painel.put('/api/admin/configuracoes', { mensagem: 'Olá Stewer, gostaria de agendar uma consultoria.' })
  })
})

describe('filtros e outros parâmetros', () => {
  it.each(SQL)('auditoria com período %s → 400', async (p) => {
    const r = await painel.get(`/api/admin/auditoria?de=${encodeURIComponent(p)}&ate=2030-01-01 00:00:00`)
    seguro(r, p)
    expect(r.status).toBe(400)
  })

  it.each(SQL)('auditoria com usuário %s → 400 (não vira consulta nem erro)', async (p) => {
    const r = await painel.get(`/api/admin/auditoria?de=2020-01-01 00:00:00&ate=2030-01-01 00:00:00&usuario=${encodeURIComponent(p)}`)
    seguro(r, p)
    expect(r.status).toBe(400)
  })

  it.each(SQL)('nome de usuário novo %s: guardado como texto', async (p) => {
    const email = `sql${SQL.indexOf(p)}@teste.local`
    const r = await painel.post('/api/admin/usuarios', { nome: p.slice(0, 60), email })
    seguro(r, p)
    expect(r.status).toBe(201)
    await painel.del(`/api/admin/usuarios/${r.corpo.item.id}`)
  })

  it.each(SQL)('e-mail de usuário novo %s → 400', async (p) => {
    const r = await painel.post('/api/admin/usuarios', { nome: 'Teste', email: p })
    seguro(r, p)
    expect(r.status).toBe(400)
  })

  it.each(SQL)('link do mapa %s → 400', async (p) => {
    const r = await painel.post('/api/admin/link-mapa', { url: p })
    seguro(r, p)
    expect(r.status).toBe(400)
  })

  it('ordem com SQL no lugar dos ids → 400', async () => {
    const r = await painel.put('/api/admin/servicos/ordem', { ids: [`1; DROP TABLE servicos`, 2] })
    seguro(r)
    expect(r.status).toBe(400)
  })
})

describe('caixa cinza: o banco depois de tudo', () => {
  it('nenhuma tabela sumiu, nenhum usuário a mais, serviços e textos como antes', () => {
    const depois = retrato()
    expect(depois.tabelas).toEqual(antes.tabelas)
    // + a conta-alvo da bateria de senhas, apagada no fim do arquivo
    expect(depois.usuarios).toBe(antes.usuarios + 1)
    expect(depois.servicos).toBe(antes.servicos)
    expect(depois.textos).toBe(antes.textos)
  })

  it('o banco continua íntegro', () => {
    const b = banco()
    const r = b.um<{ integrity_check: string }>('PRAGMA integrity_check')
    b.fechar()
    expect(r.integrity_check).toBe('ok')
  })
})
