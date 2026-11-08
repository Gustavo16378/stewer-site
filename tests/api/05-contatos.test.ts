/**
 * Caixa preta + cinza · contatos e mapa (RF05, RF15, RNF08).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, banco, logado, ultimaAuditoria } from './cliente'

let painel: Cliente
const site = new Cliente()
const config = async () => (await site.get('/api/conteudo')).corpo.config
let original: Record<string, string>

beforeAll(async () => {
  painel = await logado()
  original = (await painel.get('/api/admin/configuracoes')).corpo.config
})

describe('RF15 · trocar contatos', () => {
  it('WhatsApp: completa o 55 e o site usa o novo', async () => {
    expect((await painel.put('/api/admin/configuracoes', { whatsapp: '(63) 98888-7777' })).status).toBe(200)
    expect((await config()).whatsapp).toBe('5563988887777')
    expect(ultimaAuditoria()).toMatchObject({ area: 'configuracoes', alvo: 'Contatos e mapa', detalhe: 'WhatsApp' })
  })

  it('Instagram: aceita @ e link do perfil, guarda só o usuário', async () => {
    await painel.put('/api/admin/configuracoes', { instagram: 'https://www.instagram.com/stewer.teste/' })
    expect((await config()).instagram).toBe('stewer.teste')
  })

  it('mensagem do WhatsApp', async () => {
    await painel.put('/api/admin/configuracoes', { mensagem: 'Oi Stewer!\nQuero marcar um horário.' })
    expect((await config()).mensagem).toBe('Oi Stewer! Quero marcar um horário.')
  })

  it('local do mapa colado do Google Maps', async () => {
    const r = await painel.put('/api/admin/configuracoes', { coordenadas: '-10.2001, -48.3302' })
    expect(r.status).toBe(200)
    expect(await config()).toMatchObject({ latitude: '-10.2001', longitude: '-48.3302' })
    expect(ultimaAuditoria().detalhe).toBe('Local no mapa')
  })

  it('vários campos de uma vez entram juntos, e a auditoria lista todos', async () => {
    const r = await painel.put('/api/admin/configuracoes', {
      whatsapp: original.whatsapp,
      instagram: original.instagram,
      mensagem: original.mensagem,
      coordenadas: `${original.latitude}, ${original.longitude}`,
    })
    expect(r.status).toBe(200)
    expect(await config()).toEqual(original)
    expect(ultimaAuditoria().detalhe).toBe('WhatsApp, Instagram, Mensagem do WhatsApp, Local no mapa')
  })
})

describe('RNF09 · contatos inválidos', () => {
  it.each([
    [{ whatsapp: '123' }, /DDD/],
    [{ instagram: 'nome com espaço' }, /Instagram/],
    [{ mensagem: 'oi' }, /3 a 200/],
    [{ coordenadas: 'Palmas' }, /Cole as coordenadas/],
    [{ coordenadas: '40.71, -74.00' }, /fora do Brasil/],
    [{}, /Nada para salvar/],
    [{ pix: 'campo-que-nao-existe' }, /Nada para salvar/],
  ])('%o → 400', async (corpo, mensagem) => {
    const r = await painel.put('/api/admin/configuracoes', corpo)
    expect(r.status).toBe(400)
    expect(r.corpo.erro).toMatch(mensagem)
  })

  it('RNF08 · um campo inválido barra o pacote inteiro: nada é gravado pela metade', async () => {
    const r = await painel.put('/api/admin/configuracoes', { whatsapp: '(63) 97777-6666', coordenadas: 'errado' })
    expect(r.status).toBe(400)
    expect((await config()).whatsapp).toBe(original.whatsapp)
  })

  it('caixa cinza: só as cinco chaves conhecidas existem no banco', () => {
    const b = banco()
    const chaves = b.todos<{ chave: string }>('SELECT chave FROM configuracoes ORDER BY chave').map((c) => c.chave)
    b.fechar()
    expect(chaves).toEqual(['instagram', 'latitude', 'longitude', 'mensagem', 'whatsapp'])
  })
})
