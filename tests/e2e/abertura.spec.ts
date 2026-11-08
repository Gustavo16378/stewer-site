/**
 * A abertura de marca (src/preloader.ts): o S traçado, o nome, a cortina.
 *
 * Aqui o movimento fica ligado (os outros E2E rodam com movimento reduzido).
 */
import { abrirSite, expect, test } from './ajuda'

test.describe('abertura de marca', () => {
  test.use({ abertura: true, reducedMotion: 'no-preference' })

  test('visitante novo: o S é traçado, o nome aparece e a cortina sobe sozinha', async ({ page }) => {
    await page.goto('/')
    const cortina = page.locator('[data-preloader]')
    await expect(cortina).toBeVisible()
    await expect(cortina).toHaveAttribute('aria-hidden', 'true')
    await expect(cortina.locator('path')).toHaveCount(3)
    await expect(cortina).toContainText('Stewer Gabriel')

    // enquanto ela está de pé, a página não rola por trás
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden')

    await expect(cortina).toHaveCount(0, { timeout: 7000 })
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.classList.contains('sg-abrindo'))).toBe(false)
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden')
  })

  test('uma vez por sessão: recarregar não mostra de novo', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 7000 })
    await page.reload()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-preloader]')).toHaveCount(0)
  })

  test('a cortina não sobe antes de o site estar pronto (API lenta)', async ({ page }) => {
    await page.route('**/api/conteudo', async (r) => {
      await new Promise((ok) => setTimeout(ok, 2000))
      await r.continue()
    })
    await page.goto('/')
    const cortina = page.locator('[data-preloader]')
    await expect(cortina).toBeVisible()
    // o desenho acaba em 2,3 s, mas a API só responde com 2 s + o que já levou
    await page.waitForTimeout(2400)
    await expect(cortina).toBeVisible()
    await expect(cortina).toHaveCount(0, { timeout: 7000 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('nunca prende o site: com o site quebrado, a cortina sobe em até 6 s', async ({ page }) => {
    await page.route(/\/assets\/inicio-.*\.js$/, (r) => r.abort())
    await page.goto('/')
    await expect(page.locator('[data-preloader]')).toBeVisible()
    await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 8000 })
  })

  test('o texto da abertura entra junto com a cortina subindo, sem buraco preto entre os dois', async ({ page }) => {
    await page.goto('/')
    const cortina = page.locator('[data-preloader]')
    await expect(cortina).toHaveClass(/pl-saindo/, { timeout: 7000 })
    // a cortina ainda está na tela e o site já começou a entrar
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('sg-abrindo'))).toBe(false)
    expect(await cortina.count()).toBe(1)
  })
})

test.describe('abertura de marca · movimento reduzido', () => {
  test.use({ abertura: true, reducedMotion: 'reduce' })

  test('quem pede menos movimento nunca vê a abertura', async ({ page }) => {
    await abrirSite(page)
    await expect(page.locator('[data-preloader]')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.classList.contains('sg-abrindo'))).toBe(false)
  })
})
