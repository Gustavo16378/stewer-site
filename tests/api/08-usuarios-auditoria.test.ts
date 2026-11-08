/**
 * Caixa preta + cinza · acessos, senha temporária, auditoria e espaço
 * (RF15, RF16, RF17, RF18, RF19).
 */
import { describe, expect, it } from 'vitest'
import { Espaco, PessoaDoPainel, RegistroAuditoria } from '../contratos'
import { ADMIN, Cliente, banco, logado } from './cliente'

const agoraUtc = (deslocamentoMin = 0) =>
  new Date(Date.now() + deslocamentoMin * 60_000).toISOString().slice(0, 19).replace('T', ' ')

describe('RF16 · dar acesso', () => {
  let senhaTemp: string
  let idGustavo: number
  const gustavo = new Cliente('10.2.0.1')

  it('cria a pessoa com senha temporária no formato combinado', async () => {
    const painel = await logado()
    const r = await painel.post('/api/admin/usuarios', { nome: 'Gustavo Dev', email: 'Gustavo@Teste.Local' })
    expect(r.status).toBe(201)
    senhaTemp = r.corpo.senhaTemporaria
    idGustavo = r.corpo.item.id
    expect(senhaTemp).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)
    expect(r.corpo.item.email).toBe('gustavo@teste.local')
  })

  it('caixa cinza: a temporária também é só hash, e a pessoa fica marcada para trocar', () => {
    const b = banco()
    const u = b.um<{ senha_hash: string; trocar_senha: number }>('SELECT senha_hash, trocar_senha FROM usuarios WHERE id = ?', idGustavo)
    b.fechar()
    expect(u.senha_hash).not.toContain(senhaTemp)
    expect(u.trocar_senha).toBe(1)
  })

  it('e-mail repetido → 409; dados inválidos → 400', async () => {
    const painel = await logado()
    expect((await painel.post('/api/admin/usuarios', { nome: 'Outra', email: 'gustavo@teste.local' })).status).toBe(409)
    expect((await painel.post('/api/admin/usuarios', { nome: 'X', email: 'sem-arroba' })).status).toBe(400)
  })

  it('RF17 · com a temporária, entra mas só consegue trocar a senha', async () => {
    const r = await gustavo.entrar('gustavo@teste.local', senhaTemp)
    expect(r.corpo.usuario.trocarSenha).toBe(true)
    expect((await gustavo.get('/api/admin/servicos')).status).toBe(403)
    expect((await gustavo.get('/api/auth/eu')).corpo.usuario.trocarSenha).toBe(true)
  })

  it('RF17 · senha curta é recusada; a troca não pede a temporária de novo', async () => {
    expect((await gustavo.put('/api/admin/senha', { nova: 'curta' })).status).toBe(400)
    expect((await gustavo.put('/api/admin/senha', { nova: 'senha-do-gustavo-123' })).status).toBe(200)
    expect((await gustavo.get('/api/admin/servicos')).status).toBe(200)
  })

  it('RF15 · depois disso, trocar a senha exige a atual', async () => {
    expect((await gustavo.put('/api/admin/senha', { atual: 'errada', nova: 'outra-senha-123' })).status).toBe(401)
    expect((await gustavo.put('/api/admin/senha', { atual: 'senha-do-gustavo-123', nova: 'outra-senha-123' })).status).toBe(200)
    await expect(new Cliente().entrar('gustavo@teste.local', 'outra-senha-123')).resolves.toBeTruthy()
  })

  it('RF16 · "esqueceu a senha": a antiga para de valer e a sessão aberta trava até trocar', async () => {
    const painel = await logado()
    const r = await painel.put(`/api/admin/usuarios/${idGustavo}`)
    expect(r.status).toBe(200)
    expect((await new Cliente().post('/api/auth/login', { email: 'gustavo@teste.local', senha: 'outra-senha-123' })).status).toBe(401)
    expect((await gustavo.get('/api/admin/servicos')).status).toBe(403)
    await expect(new Cliente().entrar('gustavo@teste.local', r.corpo.senhaTemporaria)).resolves.toBeTruthy()
  })

  it('RF16 · tirar acesso derruba a sessão na hora', async () => {
    const painel = await logado()
    const outra = await painel.post('/api/admin/usuarios', { nome: 'Sai Hoje', email: 'sai@teste.local' })
    const c = new Cliente('10.2.0.2')
    await c.entrar('sai@teste.local', outra.corpo.senhaTemporaria)
    await c.put('/api/admin/senha', { nova: 'senha-de-quem-sai' })
    expect((await c.get('/api/admin/servicos')).status).toBe(200)
    expect((await painel.del(`/api/admin/usuarios/${outra.corpo.item.id}`)).status).toBe(200)
    expect((await c.get('/api/admin/servicos')).status).toBe(401)
  })

  it('ninguém tira o próprio acesso', async () => {
    const painel = await logado()
    const eu = (await painel.get('/api/auth/eu')).corpo.usuario
    const r = await painel.del(`/api/admin/usuarios/${eu.id}`)
    expect(r.status).toBe(400)
    expect(r.corpo.erro).toMatch(/próprio acesso/)
  })

  it('a lista de pessoas segue o contrato e mostra o último acesso', async () => {
    const painel = await logado()
    const { itens } = (await painel.get('/api/admin/usuarios')).corpo
    for (const p of itens) expect(() => PessoaDoPainel.parse(p)).not.toThrow()
    expect(itens.find((p: { email: string }) => p.email === ADMIN.email).ultimo_acesso).not.toBeNull()
  })
})

describe('RF18 · auditoria', () => {
  it('lista o período no contrato, do mais novo para o mais velho', async () => {
    const painel = await logado()
    const r = await painel.get(`/api/admin/auditoria?de=${encodeURIComponent(agoraUtc(-60))}&ate=${encodeURIComponent(agoraUtc(5))}`)
    expect(r.status).toBe(200)
    expect(r.corpo.itens.length).toBeGreaterThan(10)
    for (const i of r.corpo.itens) expect(() => RegistroAuditoria.parse(i)).not.toThrow()
    const ids = r.corpo.itens.map((i: { id: number }) => i.id)
    expect(ids).toEqual([...ids].sort((a, b) => b - a))
  })

  it('registra logins, ações do dia e o nome de quem fez', async () => {
    const painel = await logado()
    const { itens } = (
      await painel.get(`/api/admin/auditoria?de=${encodeURIComponent(agoraUtc(-60))}&ate=${encodeURIComponent(agoraUtc(5))}`)
    ).corpo
    const acoes = new Set(itens.map((i: { acao: string }) => i.acao))
    for (const a of ['entrou', 'criou', 'editou', 'apagou', 'reordenou', 'enviou', 'trocou']) expect(acoes).toContain(a)
    expect(itens.some((i: { usuario_nome: string }) => i.usuario_nome === 'Gustavo Dev')).toBe(true)
  })

  it('dia sem nada → lista vazia', async () => {
    const painel = await logado()
    const r = await painel.get('/api/admin/auditoria?de=2020-01-01 00:00:00&ate=2020-01-02 00:00:00')
    expect(r.corpo.itens).toEqual([])
  })

  it.each(['', '?de=ontem&ate=hoje', "?de=2026-01-01 00:00:00' OR '1'='1&ate=2027-01-01 00:00:00"])(
    'período inválido %s → 400',
    async (q) => {
      const painel = await logado()
      expect((await painel.get(`/api/admin/auditoria${q}`)).status).toBe(400)
    },
  )

  it('RNF13 · caixa cinza: tentativas com mais de um dia são limpas no login', async () => {
    const b = banco()
    const velhas = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM tentativas WHERE criado_em < datetime('now', '-1 day')`)
    b.fechar()
    expect(velhas.n).toBe(0)
  })
})

describe('RF19 · espaço do banco', () => {
  it('informa o uso dentro do contrato e bem abaixo do limite', async () => {
    const painel = await logado()
    const r = await painel.get('/api/admin/espaco')
    expect(() => Espaco.parse(r.corpo)).not.toThrow()
    expect(r.corpo.usado).toBeGreaterThan(0)
    expect(r.corpo.porcentagem).toBeLessThan(5)
  })
})
