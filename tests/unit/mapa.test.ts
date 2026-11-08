/**
 * Caixa branca · src/lib/mapa-fontes.ts
 * RF07: o fundo do mapa nunca fica quebrado (CARTO → OpenFreeMap → OSM).
 */
import { describe, expect, it } from 'vitest'
import { CREDITOS, falhou, primeiraFonte, proximaFonte, urlCarto } from '../../src/lib/mapa-fontes'

describe('RF07 · escolha da fonte', () => {
  it('sem chave começa no OpenFreeMap: nunca pede a CARTO sem chave (era isso que mostrava "API KEY REQUIRED")', () => {
    expect(primeiraFonte('')).toBe('openfreemap')
    expect(primeiraFonte('   ')).toBe('openfreemap')
    expect(primeiraFonte('abc123')).toBe('carto')
  })

  it('a ordem da reserva termina no OSM', () => {
    expect(proximaFonte('carto')).toBe('openfreemap')
    expect(proximaFonte('openfreemap')).toBe('osm')
    expect(proximaFonte('osm')).toBeNull()
  })

  it('cada fonte tem crédito do OpenStreetMap (exigência das três)', () => {
    for (const c of Object.values(CREDITOS)) expect(c).toContain('OpenStreetMap')
    expect(CREDITOS.carto).toContain('CARTO')
    expect(CREDITOS.openfreemap).toContain('OpenFreeMap')
  })

  it('a chave vai como parâmetro key, sem espaços e codificada', () => {
    expect(urlCarto(' ab+c/d ')).toBe('https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=ab%2Bc%2Fd')
  })
})

describe('RF07 · quando desistir das imagens', () => {
  it.each([
    [1, 0, false], // um pedaço falhou antes de qualquer acerto: espera mais um
    [2, 0, true], // dois sem nenhum acerto: chave bloqueada ou serviço fora
    [3, 20, false], // rede ruim: alguns pedaços falham, o mapa aparece
    [4, 3, true], // erros passaram dos acertos: limite estourado no meio da visita
    [10, 30, false],
  ])('%i erros e %i acertos → troca: %s', (erros, acertos, esperado) => {
    expect(falhou(erros, acertos)).toBe(esperado)
  })
})
