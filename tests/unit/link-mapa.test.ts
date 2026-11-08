/**
 * Caixa branca · functions/api/admin/link-mapa.ts
 * RF15 (link do Google Maps) e RNF17 (a rota não vira porta de SSRF).
 * O fetch é de mentira: nenhum teste sai para a internet.
 */
import { describe, expect, it, vi } from 'vitest'
import { resolverLink } from '../../functions/api/admin/link-mapa'

const redireciona = (para: string) => new Response(null, { status: 302, headers: { location: para } })
const longo =
  'https://www.google.com/maps/place/Boss+House/@-10.18,-48.33,17z/data=!3m1!4b1!4m6!3m5!8m2!3d-10.18256053!4d-48.32910908'

describe('RF15 · link curto', () => {
  it('segue o redirecionamento e acha o alfinete', async () => {
    const buscar = vi.fn(async () => redireciona(longo))
    expect(await resolverLink('https://maps.app.goo.gl/AbC123', buscar)).toEqual({
      latitude: -10.18256053,
      longitude: -48.32910908,
    })
    expect(buscar).toHaveBeenCalledTimes(1)
    expect(buscar.mock.calls[0][1]).toMatchObject({ redirect: 'manual' })
  })

  it('passa pela tela de consentimento do Google (parâmetro continue)', async () => {
    const buscar = vi.fn(async () =>
      redireciona(`https://consent.google.com/m?continue=${encodeURIComponent(longo)}&gl=BR`),
    )
    expect(await resolverLink('https://maps.app.goo.gl/AbC123', buscar)).toMatchObject({ latitude: -10.18256053 })
  })

  it('acha o ponto dentro da página quando não há redirecionamento', async () => {
    const html = '<html><head><meta content="https://maps.google.com/maps/api/staticmap?center=-10.1825%2C-48.3291&zoom=16"></head>'
    const buscar = vi.fn(async () => new Response(html, { status: 200 }))
    expect(await resolverLink('https://maps.app.goo.gl/AbC123', buscar)).toEqual({ latitude: -10.1825, longitude: -48.3291 })
  })

  it('link longo com ponto nem sai para a internet', async () => {
    const buscar = vi.fn()
    await resolverLink(longo, buscar)
    expect(buscar).not.toHaveBeenCalled()
  })

  it('link que não leva a ponto nenhum: mensagem que diz o que fazer', async () => {
    const buscar = vi.fn(async () => redireciona('https://maps.google.com/?q=Boss%20House&ftid=0x1:0x2'))
    await expect(resolverLink('https://maps.app.goo.gl/AbC123', buscar)).rejects.toThrow(/arraste o alfinete/)
  })
})

describe('RNF17 · sem SSRF', () => {
  it.each([
    'http://maps.app.goo.gl/AbC', // sem https
    'https://evil.example.com/maps/lugar',
    'https://maps.app.goo.gl.evil.com/AbC',
    'https://user:senha@maps.app.goo.gl/AbC',
    'https://maps.app.goo.gl:8443/AbC',
    'https://169.254.169.254/latest/meta-data',
    'https://localhost/admin',
    'file:///etc/passwd',
  ])('recusa %s sem buscar nada', async (url) => {
    const buscar = vi.fn()
    await expect(resolverLink(url, buscar)).rejects.toMatchObject({ status: 400 })
    expect(buscar).not.toHaveBeenCalled()
  })

  it('link de outro site que já traz números: só lê o texto, não busca nada', async () => {
    const buscar = vi.fn()
    expect(await resolverLink('https://evil.example.com/maps/@-10.1,-48.3,17z', buscar)).toEqual({
      latitude: -10.1,
      longitude: -48.3,
    })
    expect(buscar).not.toHaveBeenCalled()
  })

  it('redirecionamento para fora do Google é barrado no salto seguinte', async () => {
    const buscar = vi.fn(async () => redireciona('https://169.254.169.254/latest/meta-data'))
    await expect(resolverLink('https://maps.app.goo.gl/AbC123', buscar)).rejects.toMatchObject({ status: 400 })
    expect(buscar).toHaveBeenCalledTimes(1)
  })

  it('para depois de 6 saltos (laço de redirecionamento)', async () => {
    const buscar = vi.fn(async () => redireciona('https://maps.app.goo.gl/de-novo'))
    await expect(resolverLink('https://maps.app.goo.gl/AbC123', buscar)).rejects.toThrow(/não trouxe o ponto/)
    expect(buscar).toHaveBeenCalledTimes(6)
  })
})
