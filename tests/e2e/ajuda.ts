import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'
// @ts-expect-error módulo .mjs sem tipos
import { ADMIN } from '../servidor-teste.mjs'

export { ADMIN, expect }

/** estilo mínimo do OpenFreeMap: carrega na hora e não sai para a internet */
export const ESTILO_FALSO = {
  version: 8,
  sources: {},
  layers: [{ id: 'fundo', type: 'background', paint: { 'background-color': '#1b1b1b' } }],
}

/** PNG 1×1 cinza, no lugar de cada pedaço de mapa */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Os serviços de mapa nunca são chamados de verdade nos testes: ficam mais
 * rápidos, não dependem da internet e não gastam a cota de ninguém.
 * Cada teste pode trocar uma rota (as registradas depois valem primeiro).
 */
export async function mapaFalso(page: Page) {
  await page.route('**/tiles.openfreemap.org/styles/**', (r) => r.fulfill({ json: ESTILO_FALSO }))
  // ancorado no começo do endereço: só os servidores de mapa de verdade
  await page.route(/^https:\/\/(?:(?:[a-z0-9-]+\.)?basemaps\.cartocdn\.com|tile\.openstreetmap\.org|tiles\.openfreemap\.org(?!\/styles))\//, (r) =>
    r.fulfill({ body: PIXEL, contentType: 'image/png' }),
  )
}

/**
 * O `test` de todas as suítes E2E, já com o mapa falso e com o fiscal da
 * CSP (RNF03): qualquer coisa que a Content-Security-Policy de
 * public/_headers bloquear durante o teste (um script, uma fonte, um pedaço
 * de mapa) reprova o teste, para a política nunca quebrar o site em silêncio.
 */
export const test = base.extend({
  page: async ({ page }, usar) => {
    const bloqueios: string[] = []
    page.on('console', (m) => {
      if (/Content[- ]Security[- ]Policy/i.test(m.text())) bloqueios.push(m.text())
    })
    await mapaFalso(page)
    // a abertura de marca não aparece aqui: os E2E rodam com movimento
    // reduzido (playwright.config); abertura.spec e desempenho.spec a ligam
    await usar(page)
    expect(bloqueios, 'a CSP bloqueou algo durante o teste').toEqual([])
  },
})

/** entra no painel pela tela de login */
export async function entrar(page: Page, email = ADMIN.email, senha = ADMIN.senha) {
  await page.goto('/admin')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.locator('.lateral')).toBeVisible()
}

/** sessão pela API, para preparar dados sem passar pela tela */
export async function api(request: APIRequestContext) {
  const r = await request.post('/api/auth/login', { data: { email: ADMIN.email, senha: ADMIN.senha } })
  expect(r.status()).toBe(200)
  return request
}

/** abre o site e espera o conteúdo montar */
export async function abrirSite(page: Page, ancora = '') {
  await page.goto(`/${ancora}`)
  await expect(page.locator('h1')).toBeVisible()
}

/** a página não pode rolar de lado no celular */
export async function semRolagemLateral(page: Page) {
  const { largura, janela } = await page.evaluate(() => ({
    largura: document.documentElement.scrollWidth,
    janela: window.innerWidth,
  }))
  expect(largura).toBeLessThanOrEqual(janela + 1)
}
