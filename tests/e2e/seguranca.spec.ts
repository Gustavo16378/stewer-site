/**
 * Segurança no navegador de verdade (RNF02, RNF03).
 *
 * Os testes de API conferem que os cabeçalhos estão lá; estes conferem que
 * o navegador obedece: script injetado não roda, o site não abre dentro de
 * iframe de outro site e o JavaScript da página não enxerga a sessão.
 */
import { test as base } from '@playwright/test'
import { ADMIN, abrirSite, entrar, expect, mapaFalso, test } from './ajuda'

/** sem o fiscal da CSP: aqui a violação é provocada de propósito */
const provocar = base.extend({
  page: async ({ page }, usar) => {
    await mapaFalso(page)
    await usar(page)
  },
})

provocar('RNF03 · script injetado na página não roda (CSP sem inline)', async ({ page }) => {
  const bloqueios: string[] = []
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) bloqueios.push(m.text())
  })
  await abrirSite(page)
  const rodou = await page.evaluate(async () => {
    const s = document.createElement('script')
    s.textContent = 'window.__injetado = true'
    document.body.append(s)
    const img = document.createElement('img')
    img.setAttribute('onerror', 'window.__injetado = true')
    img.src = 'data:,'
    document.body.append(img)
    await new Promise((r) => setTimeout(r, 300))
    return (window as unknown as { __injetado?: boolean }).__injetado === true
  })
  expect(rodou).toBe(false)
  expect(bloqueios.length).toBeGreaterThan(0)
})

provocar('RNF03 · script de outro site não carrega (CSP script-src self)', async ({ page }) => {
  await page.route('https://cdn-malicioso.example/**', (r) => r.fulfill({ body: 'window.__externo = true', contentType: 'text/javascript' }))
  await abrirSite(page)
  const rodou = await page.evaluate(async () => {
    const s = document.createElement('script')
    s.src = 'https://cdn-malicioso.example/x.js'
    document.head.append(s)
    await new Promise((r) => setTimeout(r, 500))
    return (window as unknown as { __externo?: boolean }).__externo === true
  })
  expect(rodou).toBe(false)
})

provocar('RNF03 · o site não abre dentro de iframe de outro site (clickjacking)', async ({ page, baseURL }) => {
  await page.route('https://site-malicioso.example/', (r) =>
    r.fulfill({ contentType: 'text/html', body: `<iframe id="alvo" src="${baseURL}/admin" width="800" height="600"></iframe>` }),
  )
  await page.goto('https://site-malicioso.example/')
  await page.waitForTimeout(1000)
  const dentro = page.frames().find((f) => f !== page.mainFrame())
  // o navegador recusa e deixa o quadro numa página de erro, sem o painel
  const temPainel = dentro ? await dentro.locator('text=Entrar').count().catch(() => 0) : 0
  expect(temPainel).toBe(0)
})

test('RNF02 · o JavaScript da página não enxerga o cookie de sessão (HttpOnly)', async ({ page, context }) => {
  await entrar(page)
  const cookies = await context.cookies()
  expect(cookies.find((c) => c.name === 'sg_sessao')).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/api' })
  expect(await page.evaluate(() => document.cookie)).not.toContain('sg_sessao')
})

test('RNF02 · depois de "Sair", o cookie antigo não abre mais o painel', async ({ page, context, request }) => {
  await entrar(page)
  const antigo = (await context.cookies()).find((c) => c.name === 'sg_sessao')!.value
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByLabel('E-mail')).toBeVisible()

  const r = await request.get('/api/admin/servicos', { headers: { Cookie: `sg_sessao=${antigo}` } })
  expect(r.status()).toBe(401)
})

test('XSS armazenado · texto com HTML vindo do painel aparece como texto no site', async ({ page, request }) => {
  const ataque = '<img src=x onerror="window.__xss=1">Arte'
  await request.post('/api/auth/login', { data: { email: ADMIN.email, senha: ADMIN.senha } })
  await request.put('/api/admin/textos', { data: { valores: { 'hero.lema': ataque } } })
  try {
    await abrirSite(page)
    await expect(page.getByText(ataque)).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  } finally {
    await request.put('/api/admin/textos', { data: { valores: { 'hero.lema': null } } })
  }
})
