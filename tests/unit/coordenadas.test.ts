/**
 * Caixa branca · src/lib/coordenadas.ts
 * RF15: o ponto do mapa a partir do que o Stewer colar (coordenadas ou
 * link do Google Maps), igual no painel e na API.
 */
import { describe, expect, it } from 'vitest'
import { arredondar, ehLink, ehLinkCurto, noBrasil, pontoDoTexto, textoDoPonto } from '../../src/lib/coordenadas'

const BOSS = { latitude: -10.18256053, longitude: -48.32910908 }

describe('coordenadas soltas', () => {
  it.each([
    ['-10.18256053, -48.32910908', BOSS],
    ['-10.18256053,-48.32910908', BOSS],
    ['  -10.18256053 ; -48.32910908  ', BOSS],
    ['-10,18256053; -48,32910908', BOSS],
    ['-15.7801 -47.9292', { latitude: -15.7801, longitude: -47.9292 }],
  ])('"%s"', (texto, esperado) => {
    expect(pontoDoTexto(texto)).toEqual(esperado)
  })

  it.each(['', '   ', 'Palmas', '-10.18', '10°10\'57"S 48°19\'45"W', '-10.18, -48.32, 3', '-95.1, -48.3', '-10.1, -190.2'])(
    'não acha ponto em "%s"',
    (texto) => {
      expect(pontoDoTexto(texto)).toBeNull()
    },
  )
})

describe('links do Google Maps', () => {
  it('link de lugar: usa o alfinete (!3d!4d), não o centro da tela (@)', () => {
    const url =
      'https://www.google.com/maps/place/Boss+House+Barbearia/@-10.1830,-48.3300,17z/data=!3m1!4b1!4m6!3m5!1s0x933b34:0x1!8m2!3d-10.18256053!4d-48.32910908!16s'
    expect(pontoDoTexto(url)).toEqual(BOSS)
  })

  it.each([
    ['https://www.google.com/maps/@-10.18256053,-48.32910908,17z', BOSS],
    ['https://www.google.com/maps?q=-10.18256053,-48.32910908', BOSS],
    ['https://maps.google.com/?q=-10.18256053%2C-48.32910908&z=17', BOSS],
    ['https://www.google.com/maps/search/?api=1&query=-10.18256053,-48.32910908', BOSS],
    ['https://www.google.com/maps/dir/?api=1&destination=-10.18256053,-48.32910908', BOSS],
    ['https://maps.google.com/maps?ll=-10.18256053,-48.32910908&z=16', BOSS],
    ['https://www.google.com/maps/search/-10.18256053,+-48.32910908', BOSS],
    ['https://www.google.com.br/maps/place/-10.18256053,-48.32910908', BOSS],
  ])('%s', (url, esperado) => {
    expect(pontoDoTexto(url)).toEqual(esperado)
  })

  it('link sem ponto (só nome e ftid, como alguns compartilhamentos do celular)', () => {
    expect(pontoDoTexto('https://maps.google.com?q=Boss%20House%20Barbearia&ftid=0x933b34:0x1&entry=gps')).toBeNull()
  })

  it('reconhece link curto, que precisa ser aberto pela API', () => {
    expect(ehLinkCurto('https://maps.app.goo.gl/AbC123xyz')).toBe(true)
    expect(ehLinkCurto('  https://goo.gl/maps/AbC123  ')).toBe(true)
    expect(ehLinkCurto('https://www.google.com/maps/@-10,-48,17z')).toBe(false)
    expect(ehLinkCurto('https://maps.app.goo.gl/')).toBe(false)
    expect(ehLink('http://x')).toBe(true)
    expect(ehLink('-10.1, -48.3')).toBe(false)
  })
})

describe('Brasil, arredondamento e texto', () => {
  it('confere o Brasil com folga', () => {
    expect(noBrasil(BOSS)).toBe(true)
    expect(noBrasil({ latitude: -3.85, longitude: -32.42 })).toBe(true) // Fernando de Noronha
    expect(noBrasil({ latitude: 40.71, longitude: -74.0 })).toBe(false)
    expect(noBrasil({ latitude: -48.32, longitude: -10.18 })).toBe(false) // invertido
  })

  it('arredonda o alfinete arrastado em 6 casas (uns 10 cm)', () => {
    expect(arredondar({ latitude: -10.182560534321, longitude: -48.329109081234 })).toEqual({
      latitude: -10.182561,
      longitude: -48.329109,
    })
  })

  it('o texto do ponto volta a ser lido igual (é o que o painel manda para a API)', () => {
    expect(pontoDoTexto(textoDoPonto(BOSS))).toEqual(BOSS)
  })
})
