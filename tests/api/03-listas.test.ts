/**
 * Caixa preta + cinza · listas do painel refletindo no site (RF01, RF02,
 * RF11, RF18, RF20, RNF05, RNF09).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { BlocoAdmin, FotoAdmin, NumeroAdmin } from '../contratos'
import { Cliente, banco, logado, ultimaAuditoria } from './cliente'

let painel: Cliente
const site = new Cliente()
const conteudo = async () => (await site.get('/api/conteudo')).corpo
const titulos = async (lista = 'servicos') => (await conteudo())[lista].map((s: { titulo: string }) => s.titulo)

beforeAll(async () => {
  painel = await logado()
})

describe('RNF10 · listas no contrato do painel', () => {
  it.each([
    ['servicos', BlocoAdmin],
    ['etapas', BlocoAdmin],
    ['topicos', BlocoAdmin],
    ['numeros', NumeroAdmin],
    ['slides', FotoAdmin],
    ['aulas', FotoAdmin],
    ['cortes', FotoAdmin],
  ] as const)('%s', async (lista, schema) => {
    const r = await painel.get(`/api/admin/${lista}`)
    expect(r.status).toBe(200)
    expect(r.corpo.itens.length).toBeGreaterThan(0)
    for (const item of r.corpo.itens) expect(() => schema.parse(item)).not.toThrow()
  })
})

describe('RF11 · serviços', () => {
  let id: number

  it('cria no fim da lista e aparece no site na hora (RF01)', async () => {
    const r = await painel.post('/api/admin/servicos', { titulo: 'Barba', texto: 'Desenho e acabamento de barba.' })
    expect(r.status).toBe(201)
    id = r.corpo.item.id
    expect(r.corpo.item).toMatchObject({ versao: 0, visivel: 1, ordem: 3 })
    expect((await titulos()).at(-1)).toBe('Barba')
  })

  it('RF18 · caixa cinza: a criação foi para a auditoria com o nome de quem fez', () => {
    expect(ultimaAuditoria()).toMatchObject({ usuario_nome: 'Stewer Teste', acao: 'criou', area: 'servicos', alvo: 'Barba' })
  })

  it('edita só o que foi mandado e sobe a versão', async () => {
    const r = await painel.put(`/api/admin/servicos/${id}`, { texto: 'Barba desenhada para o rosto.', versao: 0 })
    expect(r.status).toBe(200)
    expect(r.corpo.item).toMatchObject({ titulo: 'Barba', texto: 'Barba desenhada para o rosto.', versao: 1 })
    expect((await conteudo()).servicos.at(-1)).toEqual({ titulo: 'Barba', texto: 'Barba desenhada para o rosto.' })
    expect(ultimaAuditoria()).toMatchObject({ acao: 'editou', alvo: 'Barba', detalhe: 'Texto' })
  })

  it('PUT sem mudança de verdade não sobe a versão nem vai para a auditoria', async () => {
    const antes = ultimaAuditoria()
    const r = await painel.put(`/api/admin/servicos/${id}`, {})
    expect(r.corpo.item.versao).toBe(1)
    expect(ultimaAuditoria()).toEqual(antes)
  })

  it('RF02 · oculto sai do site, volta quando reativado', async () => {
    await painel.put(`/api/admin/servicos/${id}`, { visivel: 0 })
    expect(await titulos()).not.toContain('Barba')
    expect(ultimaAuditoria().detalhe).toBe('escondeu do site')
    await painel.put(`/api/admin/servicos/${id}`, { visivel: 1 })
    expect(await titulos()).toContain('Barba')
  })

  it('reordena e o site segue a nova ordem', async () => {
    const ids = (await painel.get('/api/admin/servicos')).corpo.itens.map((p: { id: number }) => p.id)
    expect((await painel.put('/api/admin/servicos/ordem', { ids: [...ids].reverse() })).status).toBe(200)
    expect((await titulos())[0]).toBe('Barba')
    expect(ultimaAuditoria()).toMatchObject({ acao: 'reordenou', area: 'servicos' })
    expect((await painel.put('/api/admin/servicos/ordem', { ids })).status).toBe(200)
  })

  it.each([[{ ids: 'x' }], [{ ids: [] }], [{ ids: [1, 1] }], [{ ids: [1, -2] }]])('ordem inválida %o → 400', async (corpo) => {
    expect((await painel.put('/api/admin/servicos/ordem', corpo)).status).toBe(400)
  })

  it('ordem que não bate com a lista (item a mais ou a menos) → 409, nada muda', async () => {
    const ids = (await painel.get('/api/admin/servicos')).corpo.itens.map((p: { id: number }) => p.id)
    expect((await painel.put('/api/admin/servicos/ordem', { ids: ids.slice(1) })).status).toBe(409)
    expect((await painel.put('/api/admin/servicos/ordem', { ids: [...ids, 9999] })).status).toBe(409)
    expect((await painel.get('/api/admin/servicos')).corpo.itens.map((p: { id: number }) => p.id)).toEqual(ids)
  })

  it('apaga e some do site; apagar de novo dá 404', async () => {
    expect((await painel.del(`/api/admin/servicos/${id}`)).status).toBe(200)
    expect(await titulos()).not.toContain('Barba')
    expect(ultimaAuditoria()).toMatchObject({ acao: 'apagou', alvo: 'Barba' })
    const r = await painel.del(`/api/admin/servicos/${id}`)
    expect(r.status).toBe(404)
    expect(r.corpo.erro).toBe('Esse serviço não existe mais.')
    expect((await painel.put(`/api/admin/servicos/${id}`, { titulo: 'x' })).status).toBe(404)
  })
})

describe('RF11 · consultoria, ensino e números', () => {
  it('item novo da consultoria vai para o site', async () => {
    const r = await painel.post('/api/admin/etapas', { titulo: 'Colorimetria', texto: 'As cores que valorizam a pele.' })
    expect(r.status).toBe(201)
    expect(await titulos('etapas')).toContain('Colorimetria')
    await painel.del(`/api/admin/etapas/${r.corpo.item.id}`)
  })

  it('tópico do ensino vai para o site', async () => {
    const r = await painel.post('/api/admin/topicos', { titulo: 'Atendimento', texto: 'Como receber o cliente.' })
    expect(await titulos('topicos')).toContain('Atendimento')
    await painel.del(`/api/admin/topicos/${r.corpo.item.id}`)
  })

  it('número aceita texto curto e aparece no site', async () => {
    const r = await painel.post('/api/admin/numeros', { valor: '5 mil', legenda: 'Seguidores' })
    expect(r.status).toBe(201)
    expect((await conteudo()).numeros.at(-1)).toEqual({ valor: '5 mil', legenda: 'Seguidores' })
    await painel.del(`/api/admin/numeros/${r.corpo.item.id}`)
  })

  it('RF02 · tudo oculto: a lista do site vem vazia (e o site esconde o bloco)', async () => {
    const itens = (await painel.get('/api/admin/numeros')).corpo.itens
    for (const n of itens) await painel.put(`/api/admin/numeros/${n.id}`, { visivel: 0 })
    expect((await conteudo()).numeros).toEqual([])
    for (const n of itens) await painel.put(`/api/admin/numeros/${n.id}`, { visivel: 1 })
    expect((await conteudo()).numeros).toHaveLength(itens.length)
  })
})

describe('RF20 · listas de foto', () => {
  it('escolher a foto já cria o item, com o enquadramento padrão da lista', async () => {
    const r = await painel.post('/api/admin/cortes', { foto_id: 1 })
    expect(r.status).toBe(201)
    expect(r.corpo.item).toMatchObject({ foto_id: 1, foto_posicao: '50% 50%', foto_url: '/photos/Stewer1.jpg' })
    expect((await conteudo()).cortes.at(-1)).toMatchObject({ src: '/photos/Stewer1.jpg', posicao: '50% 50%' })
    expect(ultimaAuditoria()).toMatchObject({ acao: 'criou', area: 'cortes', alvo: 'Stewer Gabriel' })
    await painel.del(`/api/admin/cortes/${r.corpo.item.id}`)
  })

  it('trocar o enquadramento chega ao site como object-position', async () => {
    const item = (await painel.get('/api/admin/slides')).corpo.itens[0]
    const r = await painel.put(`/api/admin/slides/${item.id}`, { foto_posicao: '50% 30%', versao: item.versao })
    expect(r.status).toBe(200)
    expect((await conteudo()).slides[0].posicao).toBe('50% 30%')
    expect(ultimaAuditoria().detalhe).toBe('Enquadramento da foto')
    await painel.put(`/api/admin/slides/${item.id}`, { foto_posicao: item.foto_posicao })
  })

  it('a mesma foto pode estar em duas listas', async () => {
    const r = await painel.post('/api/admin/aulas', { foto_id: 7 })
    expect(r.status).toBe(201)
    await painel.del(`/api/admin/aulas/${r.corpo.item.id}`)
  })
})

describe('RNF09 · validação na API', () => {
  it.each([
    ['servicos', 'sem título', { titulo: '', texto: 'x' }, /Título/],
    ['servicos', 'título gigante', { titulo: 'x'.repeat(41), texto: 'x' }, /40 caracteres/],
    ['etapas', 'texto que não é texto', { titulo: 'x', texto: 42 }, /texto/],
    ['numeros', 'sem legenda', { valor: '1' }, /Legenda/],
    ['cortes', 'sem foto', {}, /Escolha uma foto/],
    ['cortes', 'foto inexistente', { foto_id: 99999 }, /não existe mais/],
    ['slides', 'enquadramento malicioso', { foto_id: 1, foto_posicao: '0 0;background:url(x)' }, /Enquadramento/],
  ])('%s: %s → 400 com mensagem em português', async (lista, _, corpo, mensagem) => {
    const r = await painel.post(`/api/admin/${lista}`, corpo)
    expect(r.status).toBe(400)
    expect(r.corpo.erro).toMatch(mensagem)
  })

  it('caixa cinza: nada inválido chegou ao banco', () => {
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM servicos WHERE titulo = '' OR length(titulo) > 40`)
    const f = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM slides WHERE foto_posicao LIKE '%url%'`)
    b.fechar()
    expect([n.n, f.n]).toEqual([0, 0])
  })
})

describe('RNF05 · rotas fora da lista fechada', () => {
  it.each(['midias%3B', 'servicos%20OR%201%3D1', 'sqlite_master', 'tentativas', 'textos%20--', 'constructor'])(
    '/api/admin/%s não vira consulta (404)',
    async (nome) => {
      expect((await painel.get(`/api/admin/${nome}`)).status).toBe(404)
    },
  )

  it('id com injeção de SQL é 404, sem erro de banco', async () => {
    const r = await painel.put('/api/admin/servicos/1%20OR%201=1', { titulo: 'x' })
    expect(r.status).toBe(404)
  })

  it('caixa cinza: as tabelas continuam lá', () => {
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'`)
    b.fechar()
    expect(n.n).toBe(1)
  })
})
