/**
 * Caixa branca · functions/_lib/config.ts
 * RF15: WhatsApp, Instagram, mensagem e local do mapa, do jeito que o
 * Stewer digita ou cola.
 */
import { describe, expect, it } from 'vitest'
import { lerCoordenadas, normalizarInstagram, normalizarMensagem, normalizarWhatsapp } from '../../functions/_lib/config'

describe('WhatsApp', () => {
  it.each([
    ['(63) 98511-6783', '5563985116783'],
    ['63985116783', '5563985116783'],
    ['+55 63 98511-6783', '5563985116783'],
    ['(63) 3215-1234', '556332151234'], // fixo, 8 dígitos
  ])('"%s" vira "%s"', (entrada, esperado) => {
    expect(normalizarWhatsapp(entrada)).toBe(esperado)
  })

  it.each(['', '985116783', '123', 'telefone', '5563985116783999'])('recusa "%s"', (ruim) => {
    expect(() => normalizarWhatsapp(ruim)).toThrow('DDD')
  })
})

describe('Instagram', () => {
  it.each([
    ['stewer.gabriel', 'stewer.gabriel'],
    ['@stewer.gabriel', 'stewer.gabriel'],
    ['  @stewer.gabriel  ', 'stewer.gabriel'],
    ['https://www.instagram.com/stewer.gabriel/', 'stewer.gabriel'],
    ['https://instagram.com/stewer.gabriel?igsh=abc', 'stewer.gabriel'],
  ])('"%s" vira "%s"', (entrada, esperado) => {
    expect(normalizarInstagram(entrada)).toBe(esperado)
  })

  it.each(['', '@', 'nome com espaço', 'a'.repeat(31), 'javascript:alert(1)', '<script>', 'a/../../x', 'https://instagram.com/a/b'])('recusa "%s"', (ruim) => {
    expect(() => normalizarInstagram(ruim)).toThrow('Instagram')
  })
})

describe('mensagem do WhatsApp', () => {
  it('junta espaços e quebras de linha', () => {
    expect(normalizarMensagem('  Olá   Stewer,\n quero agendar. ')).toBe('Olá Stewer, quero agendar.')
  })
  it('entre 3 e 200 caracteres', () => {
    expect(() => normalizarMensagem('oi')).toThrow('3 a 200')
    expect(() => normalizarMensagem('x'.repeat(201))).toThrow('3 a 200')
    expect(normalizarMensagem('x'.repeat(200))).toHaveLength(200)
  })
})

describe('coordenadas do mapa', () => {
  it.each([
    ['-10.18256053, -48.32910908', '-10.18256053', '-48.32910908'],
    ['-10.18256053,-48.32910908', '-10.18256053', '-48.32910908'],
    ['-10,18256; -48,32910', '-10.18256', '-48.3291'],
    ['-15.7801 -47.9292', '-15.7801', '-47.9292'], // Brasília, separado por espaço
  ])('lê "%s"', (entrada, lat, lng) => {
    expect(lerCoordenadas(entrada)).toEqual({ latitude: lat, longitude: lng })
  })

  it.each(['', 'Palmas', '-10.18', '10°10\'57"S 48°19\'45"W', '-10.18, -48.32, 3'])('recusa formato "%s"', (ruim) => {
    expect(() => lerCoordenadas(ruim)).toThrow('Cole as coordenadas')
  })

  it('aceita o link do Google Maps que já traz o ponto', () => {
    expect(lerCoordenadas('https://www.google.com/maps/place/Boss/@-10.2,-48.3,17z/data=!3d-10.18256053!4d-48.32910908')).toEqual({
      latitude: '-10.18256053',
      longitude: '-48.32910908',
    })
  })

  it('link curto: explica que precisa ser colado no painel, que abre ele', () => {
    expect(() => lerCoordenadas('https://maps.app.goo.gl/AbC123')).toThrow('link curto')
  })

  it.each(['48.3291, -10.1825', '-10.18, 48.32', '40.7128, -74.0060'])('recusa ponto fora do Brasil "%s"', (fora) => {
    expect(() => lerCoordenadas(fora)).toThrow('fora do Brasil')
  })
})
