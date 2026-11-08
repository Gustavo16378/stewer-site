/**
 * Caixa branca · src/content/site.ts
 * RF05: links e textos derivados dos contatos (WhatsApp, telefone,
 * Instagram, rota e coordenadas do mapa).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => vi.resetModules())
const carregar = () => import('../../src/content/site')

describe('telefone', () => {
  it('formata celular e fixo, com ou sem 55', async () => {
    const { telefoneFormatado } = await carregar()
    expect(telefoneFormatado('5563985116783')).toBe('(63) 98511-6783')
    expect(telefoneFormatado('63985116783')).toBe('(63) 98511-6783')
    expect(telefoneFormatado('556332151234')).toBe('(63) 3215-1234')
  })

  it('o link de ligar usa o número com +55', async () => {
    const { linkTelefone } = await carregar()
    expect(linkTelefone()).toBe('tel:+5563985116783')
  })
})

describe('links', () => {
  it('WhatsApp leva a mensagem pronta, codificada', async () => {
    const { linkWhatsapp, CONTATO } = await carregar()
    CONTATO.mensagem = 'Olá Stewer, quero agendar & saber o preço?'
    const url = new URL(linkWhatsapp())
    expect(url.origin + url.pathname).toBe('https://wa.me/5563985116783')
    expect(url.searchParams.get('text')).toBe('Olá Stewer, quero agendar & saber o preço?')
    expect(linkWhatsapp('')).toBe('https://wa.me/5563985116783')
  })

  it('Instagram e mapa seguem o que está configurado', async () => {
    const s = await carregar()
    s.CONTATO.instagram = 'outro.perfil'
    s.LOCAL.latitude = -15.78
    s.LOCAL.longitude = -47.93
    expect(s.linkInstagram()).toBe('https://www.instagram.com/outro.perfil')
    expect(s.linkRota()).toBe('https://www.google.com/maps/dir/?api=1&destination=-15.78,-47.93')
    expect(decodeURIComponent(s.linkMapa())).toContain('Boss House Barbearia, Palmas - TO')
  })
})

describe('coordenadas em graus, minutos e segundos', () => {
  it('bate com o que o site original mostrava', async () => {
    const { grausMinutos } = await carregar()
    expect(grausMinutos(-10.18256053, 'lat')).toBe(`10°10'57"S`)
    expect(grausMinutos(-48.32910908, 'lng')).toBe(`48°19'45"W`)
  })

  it('hemisfério norte e leste', async () => {
    const { grausMinutos } = await carregar()
    expect(grausMinutos(2.5, 'lat')).toBe(`2°30'0"N`)
    expect(grausMinutos(30.25, 'lng')).toBe(`30°15'0"E`)
  })

  it('arredonda sem gerar 60 segundos', async () => {
    const { grausMinutos } = await carregar()
    expect(grausMinutos(-10.9999999, 'lat')).toBe(`11°0'0"S`)
  })
})
