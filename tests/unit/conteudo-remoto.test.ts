/**
 * Caixa branca · src/lib/conteudo-remoto.ts
 * RF01, RF02, RF03, RF05 e RNF14: como o site lê a API e quando cai no
 * conteúdo de reserva.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const foto = (id: number) => ({ src: `/api/midias/${id}`, alt: `foto ${id}`, largura: 800, altura: 1000 })

const resposta = () => ({
  slides: [foto(1)],
  numeros: [{ valor: '15+', legenda: 'Anos de experiência' }],
  servicos: [{ titulo: 'Barba', texto: 'Desenho de barba.' }],
  etapas: [{ titulo: 'Etapa', texto: 't' }],
  topicos: [],
  aulas: [foto(2), foto(3)],
  cortes: [foto(4), { src: '', alt: 'quebrada', largura: 1, altura: 1 }],
  config: { whatsapp: '5563988887777', instagram: 'outro.perfil', mensagem: 'Oi!', latitude: '-15.78', longitude: '-47.93' },
  textos: { 'hero.lema': 'Lema do banco' },
})

const responder = (corpo: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))

let modulo: typeof import('../../src/lib/conteudo-remoto')
let site: typeof import('../../src/content/site')

beforeEach(async () => {
  vi.resetModules()
  modulo = await import('../../src/lib/conteudo-remoto')
  site = await import('../../src/content/site')
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('RF01 · com a API no ar', () => {
  it('troca listas, contatos, mapa e textos antes do render', async () => {
    vi.stubGlobal('fetch', responder(resposta()))
    expect(await modulo.carregarConteudo()).toBe(true)

    expect(site.SLIDES.map((f) => f.src)).toEqual(['/api/midias/1'])
    expect(site.NUMEROS).toEqual([{ valor: '15+', legenda: 'Anos de experiência' }])
    expect(site.SERVICOS.map((s) => s.titulo)).toEqual(['Barba'])
    expect(site.TOPICOS).toEqual([])
    expect(site.AULAS).toHaveLength(2)
    expect(site.CONTATO).toMatchObject({ whatsapp: '5563988887777', instagram: 'outro.perfil', mensagem: 'Oi!' })
    expect([site.LOCAL.latitude, site.LOCAL.longitude]).toEqual([-15.78, -47.93])
    expect(site.HERO.lema).toBe('Lema do banco')
  })

  it('mantém a referência das listas (os componentes importam a mesma)', async () => {
    const ref = site.SERVICOS
    vi.stubGlobal('fetch', responder(resposta()))
    await modulo.carregarConteudo()
    expect(site.SERVICOS).toBe(ref)
  })

  it('vídeos continuam os do código', async () => {
    const antes = [...site.VIDEOS_PORTFOLIO]
    vi.stubGlobal('fetch', responder(resposta()))
    await modulo.carregarConteudo()
    expect(site.VIDEOS_PORTFOLIO).toEqual(antes)
  })
})

describe('RF02 · listas vazias e fotos quebradas', () => {
  it('foto sem endereço não entra na galeria', async () => {
    vi.stubGlobal('fetch', responder(resposta()))
    await modulo.carregarConteudo()
    expect(site.CORTES.map((f) => f.src)).toEqual(['/api/midias/4'])
  })

  it('abertura sem nenhuma foto visível fica com as fotos de reserva', async () => {
    const reserva = site.SLIDES.map((f) => f.src)
    vi.stubGlobal('fetch', responder({ ...resposta(), slides: [] }))
    await modulo.carregarConteudo()
    expect(site.SLIDES.map((f) => f.src)).toEqual(reserva)
  })
})

describe('RF05 · contatos inválidos não estragam o site', () => {
  it('ignora WhatsApp curto e coordenada que não é número', async () => {
    vi.stubGlobal(
      'fetch',
      responder({ ...resposta(), config: { whatsapp: '123', latitude: 'abc', longitude: '-47' } }),
    )
    await modulo.carregarConteudo()
    expect(site.CONTATO.whatsapp).toBe('5563985116783')
    expect(site.LOCAL.latitude).toBe(-10.18256053)
  })
})

describe('RF03 / RNF14 · com a API fora', () => {
  const reserva = () => ({ servicos: site.SERVICOS.length, cortes: site.CORTES.length, whatsapp: site.CONTATO.whatsapp })

  it.each([
    ['erro 500', () => responder({ erro: 'x' }, 500)],
    ['resposta que não é JSON', () => vi.fn(async () => new Response('<html>', { status: 200 }))],
    ['JSON com outro formato', () => responder({ projetos: [] })],
    ['rede caída', () => vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')))],
  ])('%s: segue com o conteúdo do código', async (_, falha) => {
    const antes = reserva()
    vi.stubGlobal('fetch', falha())
    expect(await modulo.carregarConteudo()).toBe(false)
    expect(reserva()).toEqual(antes)
  })

  it('desiste depois de 2,5 s e sobe o site do mesmo jeito', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_: string, init: RequestInit) =>
          new Promise((_, rejeitar) => init.signal!.addEventListener('abort', () => rejeitar(new DOMException('', 'AbortError')))),
      ),
    )
    const promessa = modulo.carregarConteudo()
    await vi.advanceTimersByTimeAsync(modulo.TEMPO_MAXIMO - 1)
    let terminou = false
    promessa.then(() => (terminou = true))
    await Promise.resolve()
    expect(terminou).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(await promessa).toBe(false)
  })
})

describe('valido', () => {
  it('exige todas as listas e o objeto de config', () => {
    expect(modulo.valido(resposta())).toBe(true)
    expect(modulo.valido(null)).toBe(false)
    const { cortes: _, ...semCortes } = resposta()
    expect(modulo.valido(semCortes)).toBe(false)
    expect(modulo.valido({ ...resposta(), config: null })).toBe(false)
  })
})
