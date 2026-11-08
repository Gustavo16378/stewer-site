/**
 * Caixa cinza · duas pessoas no painel ao mesmo tempo (RNF07, RNF08).
 * Ex.: o Stewer no celular e o Gustavo no computador.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, banco, logado } from './cliente'

let celular: Cliente
let computador: Cliente

beforeAll(async () => {
  celular = await logado()
  computador = await logado()
})

const abrir = async (c: Cliente, lista: string, id: number) =>
  (await c.get(`/api/admin/${lista}`)).corpo.itens.find((p: { id: number }) => p.id === id)

describe('RNF07 · mesmo item', () => {
  it('quem salva com a versão velha recebe 409 dizendo quem salvou antes, e nada é sobrescrito', async () => {
    const aberto = await abrir(celular, 'servicos', 2)
    const r1 = await celular.put('/api/admin/servicos/2', { texto: 'Texto do celular.', versao: aberto.versao })
    expect(r1.status).toBe(200)
    const r2 = await computador.put('/api/admin/servicos/2', { titulo: 'Título do computador', versao: aberto.versao })
    expect(r2.status).toBe(409)
    expect(r2.corpo.erro).toMatch(/Stewer Teste salvou uma mudança/)
    const agora = await abrir(celular, 'servicos', 2)
    expect(agora).toMatchObject({ texto: 'Texto do celular.', titulo: 'Visagismo' })
  })

  it('reabrindo (versão nova), a segunda pessoa salva normalmente', async () => {
    const aberto = await abrir(computador, 'servicos', 2)
    expect((await computador.put('/api/admin/servicos/2', { titulo: 'Visagismo', versao: aberto.versao })).status).toBe(200)
  })

  it('dez gravações simultâneas com a mesma versão: exatamente uma vence', async () => {
    const { versao } = await abrir(celular, 'etapas', 1)
    const tentativas = await Promise.all(
      Array.from({ length: 10 }, (_, i) => (i % 2 ? celular : computador).put('/api/admin/etapas/1', { texto: `Corrida ${i}`, versao })),
    )
    const ok = tentativas.filter((t) => t.status === 200)
    expect(ok).toHaveLength(1)
    expect(tentativas.filter((t) => t.status === 409)).toHaveLength(9)
    const b = banco()
    const p = b.um<{ versao: number; texto: string }>('SELECT versao, texto FROM etapas WHERE id = 1')
    b.fechar()
    expect(p.versao).toBe(versao + 1)
    expect(p.texto).toBe(ok[0].corpo.item.texto)
  })
})

describe('RNF07 · itens diferentes ao mesmo tempo', () => {
  it('as duas gravações entram', async () => {
    const [a, b] = await Promise.all([abrir(celular, 'topicos', 1), abrir(computador, 'topicos', 2)])
    const [r1, r2] = await Promise.all([
      celular.put('/api/admin/topicos/1', { texto: 'Do celular.', versao: a.versao }),
      computador.put('/api/admin/topicos/2', { texto: 'Do computador.', versao: b.versao }),
    ])
    expect([r1.status, r2.status]).toEqual([200, 200])
    expect((await abrir(celular, 'topicos', 1)).texto).toBe('Do celular.')
    expect((await abrir(celular, 'topicos', 2)).texto).toBe('Do computador.')
  })

  it('textos: campos diferentes da mesma seção, salvos ao mesmo tempo, ficam os dois', async () => {
    await Promise.all([
      celular.put('/api/admin/textos', { valores: { 'contato.frase': 'Frase do celular' } }),
      computador.put('/api/admin/textos', { valores: { 'contato.rotulo': 'Fale comigo' } }),
    ])
    const v = (await celular.get('/api/admin/textos')).corpo.valores
    expect(v).toMatchObject({ 'contato.frase': 'Frase do celular', 'contato.rotulo': 'Fale comigo' })
    await celular.put('/api/admin/textos', { valores: { 'contato.frase': null, 'contato.rotulo': null } })
  })

  it('o interruptor "No site" não exige versão (vale o último), e devolve a versão nova', async () => {
    const antes = await abrir(celular, 'cortes', 1)
    const r = await celular.put('/api/admin/cortes/1', { visivel: 0 })
    expect(r.corpo.item.versao).toBe(antes.versao + 1)
    await celular.put('/api/admin/cortes/1', { visivel: 1 })
  })
})
