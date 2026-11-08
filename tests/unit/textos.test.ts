/**
 * Caixa branca · src/lib/textos.ts
 * RF04 e RF14: a lista única de textos editáveis.
 * Os objetos do site são módulos com estado; cada teste importa do zero.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => vi.resetModules())

const carregar = async () => {
  const textos = await import('../../src/lib/textos')
  const site = await import('../../src/content/site')
  return { ...textos, site }
}

describe('lista de campos', () => {
  it('chaves únicas e estáveis', async () => {
    const { CAMPOS_TEXTO } = await carregar()
    const chaves = CAMPOS_TEXTO.map((c) => c.chave)
    expect(new Set(chaves).size).toBe(chaves.length)
    for (const c of chaves) expect(c).toMatch(/^[a-zA-Z]+(\.[a-zA-Z0-9]+)+$/)
  })

  it('cobre todas as seções do site', async () => {
    const { CAMPOS_TEXTO } = await carregar()
    expect([...new Set(CAMPOS_TEXTO.map((c) => c.secao))]).toEqual([
      'Abertura',
      'Quem é',
      'Serviços',
      'Consultoria',
      'Ensino',
      'Portfólio',
      'Onde atende',
      'Contato',
      'Rodapé',
    ])
  })

  it('o texto original de todo campo cabe no limite do próprio campo', async () => {
    const { CAMPOS_TEXTO } = await carregar()
    for (const c of CAMPOS_TEXTO.filter((c) => c.tipo !== 'foto')) {
      const v = c.ler() as string
      expect(v.length, c.chave).toBeLessThanOrEqual(c.max)
      if (c.tipo === 'linhas' && c.linhas) expect(v.split('\n').length, c.chave).toBeLessThanOrEqual(c.linhas)
    }
  })

  it('campo de foto termina em .foto (a API usa isso para saber se a foto está em uso)', async () => {
    const { CAMPOS_TEXTO } = await carregar()
    for (const c of CAMPOS_TEXTO) expect(c.tipo === 'foto', c.chave).toBe(c.chave.endsWith('.foto'))
  })
})

describe('aplicarTextos', () => {
  it('troca o nome grande da abertura, linha a linha', async () => {
    const { aplicarTextos, site } = await carregar()
    aplicarTextos({ 'hero.nome': 'Stewer\n  Gabriel Barbosa  \n\n' })
    expect(site.HERO.nome).toEqual(['Stewer', 'Gabriel Barbosa'])
  })

  it('troca textos simples de várias seções', async () => {
    const { aplicarTextos, site } = await carregar()
    aplicarTextos({ 'hero.lema': 'Estilo com propósito', 'servicos.nota': 'Só com hora marcada', 'rodape.frase': 'Nova frase' })
    expect(site.HERO.lema).toBe('Estilo com propósito')
    expect(site.SERVICOS_SECAO.nota).toBe('Só com hora marcada')
    expect(site.RODAPE.frase).toBe('Nova frase')
  })

  it('troca o endereço e o horário do mapa', async () => {
    const { aplicarTextos, site } = await carregar()
    aplicarTextos({ 'local.nome': 'Estúdio\nStewer', 'local.horario': 'Ter — Sáb\n10h às 20h' })
    expect(site.LOCAL.nome).toEqual(['Estúdio', 'Stewer'])
    expect(site.LOCAL.horario).toEqual(['Ter — Sáb', '10h às 20h'])
  })

  it('troca a foto de "Quem é"', async () => {
    const { aplicarTextos, site } = await carregar()
    const nova = { src: '/api/midias/9', alt: 'Stewer no estúdio', largura: 800, altura: 1000 }
    aplicarTextos({ 'sobre.foto': nova })
    expect(site.SOBRE.foto).toEqual(nova)
  })

  it('ignora chave desconhecida, valor vazio e tipo errado', async () => {
    const { aplicarTextos, site } = await carregar()
    const antes = structuredClone({ hero: site.HERO, sobre: site.SOBRE })
    aplicarTextos({
      'hero.inexistente': 'x',
      'hero.lema': '   ',
      'hero.frase': 42,
      'sobre.foto': 'não é objeto',
      'hero.nome': '\n\n',
      __proto__: 'x',
    } as Record<string, unknown>)
    expect({ hero: site.HERO, sobre: site.SOBRE }).toEqual(antes)
  })
})
