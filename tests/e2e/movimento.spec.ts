/**
 * O movimento de rolagem (src/lib/movimento.ts), com o movimento ligado.
 * Os outros E2E rodam com movimento reduzido e olham só o resultado.
 */
import type { Page } from '@playwright/test'
import { abrirSite, expect, test } from './ajuda'

/** começa a rolar e espera o GSAP chegar (ele só é baixado quando a pessoa rola) */
async function comMovimento(page: Page, ancora = '') {
  await abrirSite(page, ancora)
  await page.waitForLoadState('load')
  if (!ancora) await page.mouse.wheel(0, 1)
  await expect(page.locator('html')).toHaveAttribute('data-movimento', 'ligado')
}

const transformDe = (page: Page, seletor: string) =>
  page.locator(seletor).first().evaluate((el) => getComputedStyle(el).transform)

/** o deslocamento vertical de um transform ("none" ou "matrix(a, b, c, d, x, y)") */
const deslocamentoY = (t: string) => (t === 'none' ? 0 : Number(t.slice(t.indexOf('(') + 1, -1).split(',')[5]))

test.describe('movimento de rolagem', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('o GSAP só é baixado quando a pessoa começa a rolar', async ({ page }) => {
    const gsap: string[] = []
    page.on('request', (r) => /\/assets\/(gsap|ScrollTrigger|SplitText)-/.test(r.url()) && gsap.push(r.url()))
    await abrirSite(page)
    await page.waitForLoadState('load')
    await page.waitForTimeout(1500)
    expect(gsap).toEqual([])

    await page.mouse.wheel(0, 1)
    await expect(page.locator('html')).toHaveAttribute('data-movimento', 'ligado')
    expect(gsap).toHaveLength(3)
  })

  test('título fora da tela sobe linha por linha quando chega', async ({ page }) => {
    await comMovimento(page)
    const titulo = page.locator('#contato h2')
    const textoOriginal = (await titulo.textContent())!.replace(/\s+/g, ' ').trim()

    // já dividido em linhas e escondido atrás da máscara
    const linhas = titulo.locator('.revelar-linha')
    await expect.poll(() => linhas.count()).toBeGreaterThan(0)
    expect(await linhas.first().evaluate((el) => getComputedStyle(el).transform)).not.toBe('none')

    await titulo.scrollIntoViewIfNeeded()
    await expect
      .poll(async () => deslocamentoY(await linhas.last().evaluate((el) => getComputedStyle(el).transform)), { timeout: 4000 })
      .toBeCloseTo(0, 0)
    // o texto continua o mesmo, inteiro, e o leitor de tela lê com espaço entre as linhas
    expect((await titulo.textContent())!.replace(/\s+/g, ' ').trim()).toBe(textoOriginal)
    await expect(titulo).toHaveAccessibleName(textoOriginal)
  })

  test('foto fora da tela se abre ao chegar e volta ao normal (o zoom do hover continua)', async ({ page }) => {
    await comMovimento(page)
    const foto = page.locator('#portfolio [data-revelar="foto"]').first()
    expect(await foto.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/inset\(100%/)

    await foto.scrollIntoViewIfNeeded()
    await expect.poll(() => foto.evaluate((el) => getComputedStyle(el).clipPath), { timeout: 4000 }).toBe('none')
    await expect.poll(() => foto.locator('img, video').first().evaluate((el) => el.style.transform), { timeout: 4000 }).toBe('')
  })

  test('números contam até o valor certo, e o leitor de tela sempre lê o valor final', async ({ page }) => {
    await comMovimento(page)
    const numero = page.locator('[data-contar]').first()
    const final = (await numero.getAttribute('data-contar'))!
    await expect(numero).not.toHaveText(final)
    await expect(page.locator('#sobre .sr-only').first()).toHaveText(final)

    await numero.scrollIntoViewIfNeeded()
    await expect(numero).toHaveText(final, { timeout: 4000 })
  })

  test('o que já estava na tela quando o GSAP chegou fica como está', async ({ page }) => {
    await comMovimento(page, '#contato')
    const titulo = page.locator('#contato h2')
    await expect(titulo).toBeInViewport()
    expect(await titulo.locator('.revelar-linha').count()).toBe(0)
  })
})

test.describe('parallax da abertura', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('no computador, a foto e o texto da abertura andam em velocidades diferentes', async ({ page }, info) => {
    test.skip(info.project.name !== 'computador', 'parallax só no computador')
    await comMovimento(page)
    expect(deslocamentoY(await transformDe(page, '[data-parallax="foto"]'))).toBeLessThan(1)
    await page.mouse.wheel(0, 400)
    await expect.poll(async () => deslocamentoY(await transformDe(page, '[data-parallax="foto"]')), { timeout: 3000 }).toBeGreaterThan(0)
    const foto = deslocamentoY(await transformDe(page, '[data-parallax="foto"]'))
    const texto = deslocamentoY(await transformDe(page, '[data-parallax="texto"]'))
    expect(foto).toBeGreaterThan(0)
    expect(texto).toBeLessThan(0)
  })

  test('no celular, nada de parallax', async ({ page }, info) => {
    test.skip(info.project.name !== 'celular', 'só no celular')
    await comMovimento(page)
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(600)
    expect(deslocamentoY(await transformDe(page, '[data-parallax="texto"]'))).toBe(0)
  })
})

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' })

  test('quem pede menos movimento não baixa o GSAP e vê tudo parado', async ({ page }) => {
    const gsap: string[] = []
    page.on('request', (r) => /\/assets\/(gsap|ScrollTrigger|SplitText)-/.test(r.url()) && gsap.push(r.url()))
    await abrirSite(page)
    await page.waitForLoadState('load')
    await page.waitForTimeout(500)
    expect(gsap).toEqual([])
    expect(await page.locator('html').getAttribute('data-movimento')).toBeNull()
    await expect(page.locator('[data-contar]').first()).toHaveText(/\d/)
    expect(await page.locator('#portfolio [data-revelar="foto"]').first().evaluate((el) => getComputedStyle(el).clipPath)).toBe('none')
  })
})
