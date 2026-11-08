/**
 * Caixa branca · src/lib/movimento.ts: o número que a contagem usa.
 * O Stewer escreve o valor livre no painel ("+800", "10+", "1.500"); a
 * contagem tem de terminar exatamente no que ele escreveu.
 */
import { describe, expect, it } from 'vitest'
import { formatarComo, numeroDe } from '../../src/lib/movimento'

describe('numeroDe', () => {
  it.each([
    ['+800', 800, '800'],
    ['10+', 10, '10'],
    ['98%', 98, '98'],
    ['1.500 clientes', 1500, '1.500'],
    ['Mais de 12 anos', 12, '12'],
  ])('"%s" → %i', (texto, inteiro, trecho) => {
    expect(numeroDe(texto)).toEqual({ inteiro, trecho })
  })

  it.each(['', 'muitos', '+', '—'])('"%s" não tem número: não conta', (texto) => {
    expect(numeroDe(texto)).toBeNull()
  })
})

describe('formatarComo', () => {
  it('mantém o ponto de milhar se o original tinha', () => {
    expect(formatarComo('1.500', 1500)).toBe('1.500')
    expect(formatarComo('1.500', 730)).toBe('730')
  })

  it('sem ponto no original, sem ponto na contagem', () => {
    expect(formatarComo('800', 800)).toBe('800')
    expect(formatarComo('2000', 2000)).toBe('2000')
  })

  it('o último quadro da contagem é igual ao texto original', () => {
    for (const valor of ['+800', '10+', '1.500 clientes', '98%']) {
      const n = numeroDe(valor)!
      expect(valor.replace(n.trecho, formatarComo(n.trecho, n.inteiro))).toBe(valor)
    }
  })
})
