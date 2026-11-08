/**
 * Caixa preta + cinza · textos e fotos fixos do site (RF04, RF14).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, banco, logado, ultimaAuditoria } from './cliente'

let painel: Cliente
const site = new Cliente()
beforeAll(async () => {
  painel = await logado()
})

describe('RF14 · editar textos', () => {
  it('grava, o site recebe e a auditoria agrupa por seção', async () => {
    const r = await painel.put('/api/admin/textos', {
      valores: { 'hero.nome': 'Stewer\nGabriel B.', 'hero.lema': 'Novo lema', 'rodape.frase': 'Rodapé novo.' },
    })
    expect(r.status).toBe(200)
    const { textos } = (await site.get('/api/conteudo')).corpo
    expect(textos).toEqual({ 'hero.nome': 'Stewer\nGabriel B.', 'hero.lema': 'Novo lema', 'rodape.frase': 'Rodapé novo.' })
    const b = banco()
    const log = b.todos<{ alvo: string; detalhe: string }>(
      `SELECT alvo, detalhe FROM auditoria WHERE area = 'textos' ORDER BY id DESC LIMIT 2`,
    )
    b.fechar()
    expect(log.map((l) => l.alvo).sort()).toEqual(['Abertura', 'Rodapé'])
    expect(log.find((l) => l.alvo === 'Abertura')!.detalhe).toBe('Nome grande, Lema')
  })

  it('RF04 · foto de "Quem é" chega ao site já como objeto de foto', async () => {
    await painel.put('/api/admin/textos', { valores: { 'sobre.foto': '2' } })
    const { textos } = (await site.get('/api/conteudo')).corpo
    expect(textos['sobre.foto']).toEqual({ src: '/photos/Stewer2.jpg', alt: 'Stewer Gabriel no estúdio', largura: 1024, altura: 1428 })
    expect(ultimaAuditoria().detalhe).toBe('trocou foto')
  })

  it('o painel recebe o valor salvo e a url da foto escolhida', async () => {
    const r = await painel.get('/api/admin/textos')
    expect(r.corpo.valores['sobre.foto']).toBe('2')
    expect(r.corpo.fotos['sobre.foto']).toBe('/photos/Stewer2.jpg')
  })

  it('null volta ao original (a linha sai do banco)', async () => {
    await painel.put('/api/admin/textos', {
      valores: { 'hero.nome': null, 'hero.lema': null, 'rodape.frase': null, 'sobre.foto': null },
    })
    expect((await site.get('/api/conteudo')).corpo.textos).toEqual({})
    expect(ultimaAuditoria().detalhe).toMatch(/voltou ao original/)
  })

  it('normaliza: linhas vazias somem, quebra de linha em campo de uma linha vira espaço', async () => {
    await painel.put('/api/admin/textos', { valores: { 'local.endereco': '  Rua A  \r\n\r\n  Palmas ', 'hero.ctaPrimario': 'Quero\nagendar' } })
    expect((await painel.get('/api/admin/textos')).corpo.valores).toMatchObject({
      'local.endereco': 'Rua A\nPalmas',
      'hero.ctaPrimario': 'Quero agendar',
    })
    await painel.put('/api/admin/textos', { valores: { 'local.endereco': null, 'hero.ctaPrimario': null } })
  })

  it.each([
    ['chave que não existe', { 'hero.qualquer': 'x' }, /desconhecido/],
    ['chave de outro lugar', { whatsapp: '5563' }, /desconhecido/],
    ['texto acima do limite', { 'hero.ctaPrimario': 'x'.repeat(31) }, /30 caracteres/],
    ['linhas demais no nome', { 'hero.nome': 'a\nb\nc' }, /2 linhas/],
    ['foto que não existe', { 'sobre.foto': '99999' }, /não existe mais/],
    ['foto com id inválido', { 'sobre.foto': 'abc' }, /inválida/],
    ['texto que não é texto', { 'hero.frase': 42 }, /texto/],
  ])('recusa %s', async (_, valores, mensagem) => {
    const r = await painel.put('/api/admin/textos', { valores })
    expect(r.status).toBe(400)
    expect(r.corpo.erro).toMatch(mensagem)
  })

  it('RNF08 · um campo inválido no meio barra o pacote inteiro (nada é gravado pela metade)', async () => {
    const r = await painel.put('/api/admin/textos', { valores: { 'hero.lema': 'Válido', 'hero.ctaPrimario': 'x'.repeat(99) } })
    expect(r.status).toBe(400)
    expect((await painel.get('/api/admin/textos')).corpo.valores['hero.lema']).toBeUndefined()
  })
})
