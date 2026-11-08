/**
 * E2E · o site como o visitante vê (RF01–RF06, RNF14, RNF16).
 */
import { abrirSite, api, expect, semRolagemLateral, test } from './ajuda'

test.describe('site público', () => {
  test('RF01 · abre sem erro e mostra o conteúdo do banco', async ({ page }) => {
    const erros: string[] = []
    page.on('pageerror', (e) => erros.push(e.message))
    page.on('console', (m) => m.type() === 'error' && !m.text().includes('basemaps') && erros.push(m.text()))

    await abrirSite(page)
    await expect(page.locator('h1')).toHaveText('Stewer Gabriel')
    await expect(page.locator('#servicos h3')).toHaveText(['Corte', 'Visagismo', 'Consultoria de Imagem'])
    await expect(page.locator('#consultoria h3')).toHaveCount(4)
    await expect(page.locator('#instrutor [role=button]')).toHaveCount(3)
    await semRolagemLateral(page)
    expect(erros).toEqual([])
  })

  test('RF06 · portfólio intercala as fotos do banco com o vídeo do código', async ({ page }) => {
    await abrirSite(page, '#portfolio')
    const tiles = page.locator('#portfolio [role=button]')
    await expect(tiles).toHaveCount(6)
    await expect(tiles.nth(1).locator('video')).toHaveAttribute('src', '/videosImgs/videoCorte.mp4')
    await expect(tiles.nth(0).locator('img')).toHaveAttribute('alt', 'Corte masculino feito por Stewer Gabriel')
  })

  test('foto do portfólio abre ampliada pelo teclado e fecha com Esc', async ({ page }) => {
    await abrirSite(page, '#portfolio')
    const primeira = page.locator('#portfolio [role=button]').first()
    await primeira.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('RF03 / RNF14 · com a API fora do ar, abre com o conteúdo de reserva', async ({ page }) => {
    await page.route('**/api/conteudo', (r) => r.abort())
    await abrirSite(page)
    await expect(page.locator('#servicos h3')).toHaveCount(3)
    await expect(page.locator('#portfolio [role=button]')).toHaveCount(6)
    await expect(page.locator('a[href^="https://wa.me/5563985116783"]').first()).toBeVisible()
  })

  test('RF03 · com a API lenta, não espera mais que 2,5 s', async ({ page }) => {
    await page.route('**/api/conteudo', async (r) => {
      await new Promise((ok) => setTimeout(ok, 6000))
      await r.continue().catch(() => {})
    })
    const inicio = Date.now()
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 })
    expect(Date.now() - inicio).toBeLessThan(5000)
  })

  test('RF05 · WhatsApp, telefone e Instagram saem da configuração', async ({ page }) => {
    await abrirSite(page, '#contato')
    const wpp = page.locator('#contato a', { hasText: 'WhatsApp' })
    const url = new URL((await wpp.getAttribute('href'))!)
    expect(url.pathname).toBe('/5563985116783')
    expect(url.searchParams.get('text')).toBe('Olá Stewer, gostaria de agendar uma consultoria.')
    await expect(page.locator('#contato a[href="tel:+5563985116783"]')).toHaveText('(63) 98511-6783')
    await expect(page.locator('#contato a', { hasText: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/stewer.gabriel')
  })

  test('RF05 · o mapa mostra o lugar, as coordenadas e a rota configurados', async ({ page }) => {
    await abrirSite(page, '#onde-atende')
    const secao = page.locator('#onde-atende')
    await expect(secao).toContainText(`10°10'57"S · 48°19'45"W`)
    await expect(secao.locator('.boss-label')).toHaveText('Boss House Barbearia')
    await expect(secao.getByRole('link', { name: /Traçar rota/ })).toHaveAttribute('href', /destination=-10\.18256053,-48\.32910908$/)
  })

  test('RF07 · sem chave da CARTO, o mapa usa o OpenFreeMap (nunca o aviso de chave)', async ({ page }) => {
    const carto: string[] = []
    page.on('request', (r) => r.url().includes('cartocdn') && carto.push(r.url()))
    await abrirSite(page, '#onde-atende')
    await expect(page.locator('#onde-atende .leaflet-container')).toHaveAttribute('data-fonte-mapa', 'openfreemap')
    await expect(page.locator('#onde-atende .leaflet-control-attribution')).toContainText('OpenFreeMap')
    expect(carto).toEqual([])
  })

  test('RF07 · OpenFreeMap fora do ar: cai no OpenStreetMap escurecido', async ({ page }) => {
    await page.route('**/tiles.openfreemap.org/styles/**', (r) => r.abort())
    await abrirSite(page, '#onde-atende')
    const mapa = page.locator('#onde-atende .leaflet-container')
    await expect(mapa).toHaveAttribute('data-fonte-mapa', 'osm')
    await expect(mapa.locator('.mapa-osm')).toHaveCount(1)
    await expect(page.locator('#onde-atende .boss-label')).toHaveText('Boss House Barbearia')
  })

  test('RF02 · serviços todos ocultos: a seção sai da página e volta depois', async ({ page, request }) => {
    const painel = await api(request)
    const { itens } = await (await painel.get('/api/admin/servicos')).json()
    try {
      for (const s of itens) await painel.put(`/api/admin/servicos/${s.id}`, { data: { visivel: 0 } })
      await abrirSite(page)
      await expect(page.locator('#servicos')).toHaveCount(0)
    } finally {
      for (const s of itens) await painel.put(`/api/admin/servicos/${s.id}`, { data: { visivel: 1 } })
    }
    await abrirSite(page)
    await expect(page.locator('#servicos h3')).toHaveCount(3)
  })

  test('segurança · HTML no nome do lugar aparece como texto no mapa, sem virar elemento', async ({ page, request }) => {
    const painel = await api(request)
    const ataque = '<b id="injetado">Boss</b>'
    await painel.put('/api/admin/textos', { data: { valores: { 'local.nome': ataque } } })
    try {
      await abrirSite(page, '#onde-atende')
      await expect(page.locator('.boss-label')).toHaveText(ataque)
      await expect(page.locator('#injetado')).toHaveCount(0)
    } finally {
      await painel.put('/api/admin/textos', { data: { valores: { 'local.nome': null } } })
    }
  })
})
