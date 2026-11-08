/**
 * A abertura de marca (src/preloader.ts): o S traçado, o nome, a cortina.
 *
 * Aqui o movimento fica ligado (os outros E2E rodam com movimento reduzido).
 */
import { abrirSite, expect, test } from './ajuda'

test.describe('abertura de marca', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('o S é traçado, o nome aparece e a cortina sobe sozinha', async ({ page }) => {
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

  test('aparece de novo a cada carregamento, inclusive ao recarregar', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 7000 })
    await page.reload()
    await expect(page.locator('[data-preloader]')).toBeVisible()
    await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 7000 })
  })

  test('é rápida: a cortina começa a subir em até 2 s quando o site já está pronto', async ({ page }) => {
    await page.goto('/')
    const t0 = Date.now()
    await expect(page.locator('[data-preloader]')).toHaveClass(/pl-saindo/, { timeout: 4000 })
    expect(Date.now() - t0).toBeLessThan(2000)
  })

  test('a cortina não sobe antes de o site estar pronto (API lenta)', async ({ page }) => {
    await page.route('**/api/conteudo', async (r) => {
      await new Promise((ok) => setTimeout(ok, 3000))
      await r.continue()
    })
    await page.goto('/')
    const cortina = page.locator('[data-preloader]')
    await expect(cortina).toBeVisible()
    // o desenho acaba em 1,5 s, mas a API só responde depois de 3 s
    await page.waitForTimeout(2200)
    await expect(cortina).not.toHaveClass(/pl-saindo/)
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
    // anotado dentro da página, no instante exato em que o site começa a
    // entrar: olhar de fora chegaria tarde numa máquina lenta (a janela é 0,3 s)
    await page.addInitScript(() => {
      const w = window as unknown as { __entrada?: { cortinaNaTela: boolean } }
      let abriu = false
      // o <html> ainda não existe quando este script roda: observa o documento
      new MutationObserver((_, obs) => {
        const raiz = document.documentElement
        if (!raiz) return
        if (raiz.classList.contains('sg-abrindo')) abriu = true
        else if (abriu) {
          w.__entrada = { cortinaNaTela: !!document.querySelector('[data-preloader].pl-saindo') }
          obs.disconnect()
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] })
    })
    await page.goto('/')
    const entrada = await page.waitForFunction(() => (window as unknown as { __entrada?: object }).__entrada, null, {
      timeout: 7000,
    })
    // a cortina ainda está subindo quando o site começa a entrar
    expect(await entrada.jsonValue()).toEqual({ cortinaNaTela: true })
  })
})

test.describe('abertura de marca · movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' })

  test('quem pede menos movimento nunca vê a abertura', async ({ page }) => {
    await abrirSite(page)
    await expect(page.locator('[data-preloader]')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.classList.contains('sg-abrindo'))).toBe(false)
  })
})
