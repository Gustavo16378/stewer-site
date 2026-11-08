/**
 * Desempenho no navegador (RNF18, RNF19): Core Web Vitals medidos de verdade.
 *
 * Mesmas condições do Lighthouse: no celular, 4G lento (150 ms de latência,
 * 1,6 Mbps) e processador 4× mais lento; no computador, cabo. Os tetos são
 * os de "bom" do Google para LCP, CLS e INP, e os do Lighthouse para FCP e TBT.
 *
 * Só no Chromium (o throttling usa o DevTools Protocol), uma vez por
 * tamanho de tela.
 */
import type { CDPSession, Page } from '@playwright/test'
import { abrirSite, entrar, expect, test } from './ajuda'

const KB = 1024

/**
 * As condições do Lighthouse: no celular, 4G lento (150 ms, 1,6 Mbps) e CPU
 * 4× mais lenta; no computador, cabo (40 ms, 10 Mbps) e CPU normal.
 */
const CONDICOES = {
  celular: { latencia: 150, mbps: 1.6, cpu: 4 },
  computador: { latencia: 40, mbps: 10, cpu: 1 },
} as const

async function celularLento(page: Page, projeto = 'celular'): Promise<CDPSession> {
  const c = CONDICOES[projeto as keyof typeof CONDICOES] ?? CONDICOES.celular
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: c.latencia,
    downloadThroughput: (c.mbps * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: c.cpu })
  return cdp
}

/**
 * Liga os observadores antes de qualquer script da página. Mede como um
 * visitante novo: com a abertura de marca (o pior caso).
 */
async function observar(page: Page) {
  await page.addInitScript(() => {
    const m = { fcp: 0, lcp: 0, cls: 0, candidatos: [] as string[], longas: [] as { inicio: number; duracao: number }[] }
    ;(window as unknown as { __medidas: typeof m }).__medidas = m
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') m.fcp = e.startTime
    }).observe({ type: 'paint', buffered: true })
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { url: string; size: number })[]) {
        m.lcp = e.startTime
        m.candidatos.push(`${Math.round(e.startTime)} ms ${e.url.replace(location.origin, '') || 'texto'} (${e.size} px²)`)
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[])
        if (!e.hadRecentInput) m.cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) m.longas.push({ inicio: e.startTime, duracao: e.duration })
    }).observe({ type: 'longtask', buffered: true })
  })
}

type Medidas = { fcp: number; lcp: number; cls: number; candidatos: string[]; longas: { inicio: number; duracao: number }[] }
const medidas = (page: Page) => page.evaluate(() => (window as unknown as { __medidas: Medidas }).__medidas)

/** Total Blocking Time: a parte acima de 50 ms de cada tarefa longa depois do FCP */
const tbt = (m: Medidas) => m.longas.filter((t) => t.inicio >= m.fcp).reduce((s, t) => s + Math.max(0, t.duracao - 50), 0)

/** bytes que vieram pela rede (comprimidos), contando o próprio HTML */
const bytesBaixados = (page: Page) =>
  page.evaluate(() =>
    [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].reduce(
      (s, e) => s + ((e as PerformanceResourceTiming).transferSize || 0),
      0,
    ),
  )

/** desce a página toda devagar, como alguém lendo, para todo layout shift aparecer */
async function rolarTudo(page: Page) {
  await page.evaluate(async () => {
    const passo = innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
  })
}

test.describe('RNF18 · Core Web Vitals do site', () => {
  // como um visitante novo de verdade: com animação e com a abertura de
  // marca (o pior caso; o resto dos E2E roda com movimento reduzido)
  test.use({ abertura: true, reducedMotion: 'no-preference' })
  test.skip(({ browserName }) => browserName !== 'chromium', 'throttling só no Chromium')
  test.describe.configure({ mode: 'serial' })

  test('abertura com a rede do Lighthouse: FCP, LCP, TBT e peso dentro do orçamento', async ({ page }, info) => {
    await observar(page)
    await celularLento(page, info.project.name)
    await abrirSite(page)
    // O LCP é da carga da página: lê depois do load, antes de a abertura
    // trocar de foto (4,5 s depois de a primeira aparecer). A troca do
    // carrossel não é carregamento, e o Chrome às vezes a conta como LCP.
    await page.waitForLoadState('load')
    await page.waitForTimeout(1000)
    const m = await medidas(page)
    const peso = await bytesBaixados(page)

    const relatorio = {
      FCP: `${Math.round(m.fcp)} ms`,
      LCP: `${Math.round(m.lcp)} ms`,
      TBT: `${Math.round(tbt(m))} ms`,
      'tarefas longas': m.longas.map((t) => `${Math.round(t.inicio)}+${Math.round(t.duracao)} ms`),
      'candidatos a LCP': m.candidatos,
      'baixado na abertura': `${Math.round(peso / KB)} KB`,
    }
    await info.attach('web-vitals', { body: JSON.stringify(relatorio, null, 2), contentType: 'application/json' })
    console.log(info.project.name, relatorio)

    expect(m.fcp, 'First Contentful Paint').toBeLessThanOrEqual(1800)
    expect(m.lcp, 'Largest Contentful Paint').toBeLessThanOrEqual(2500)
    expect(tbt(m), 'Total Blocking Time').toBeLessThanOrEqual(200)
    expect(peso / KB, 'peso da abertura').toBeLessThanOrEqual(900)
  })

  test('CLS: nada pula de lugar do topo ao rodapé', async ({ page }) => {
    await observar(page)
    await abrirSite(page)
    await rolarTudo(page)
    await page.waitForTimeout(500)
    const { cls } = await medidas(page)
    console.log('CLS', cls.toFixed(4))
    expect(cls, 'Cumulative Layout Shift').toBeLessThanOrEqual(0.1)
  })

  test('o mapa não pesa na abertura: Leaflet só baixa perto da seção', async ({ page }) => {
    const pedidos: string[] = []
    page.on('request', (r) => pedidos.push(r.url()))
    await abrirSite(page)
    await page.waitForLoadState('networkidle')
    expect(pedidos.filter((u) => /leaflet|maplibre|mapa-site/i.test(u))).toEqual([])

    await page.locator('#onde-atende').scrollIntoViewIfNeeded()
    await expect(page.locator('#onde-atende .leaflet-container')).toBeVisible()
    expect(pedidos.some((u) => /mapa-site|leaflet/i.test(u))).toBe(true)
  })

  test('nenhum pedido para fora na abertura (fontes, scripts, analytics)', async ({ page, baseURL }) => {
    const fora: string[] = []
    page.on('request', (r) => {
      if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) fora.push(r.url())
    })
    await abrirSite(page)
    await page.waitForLoadState('networkidle')
    expect(fora).toEqual([])
  })

  test('INP: abrir uma foto do portfólio responde rápido', async ({ page }, info) => {
    await abrirSite(page)
    await celularLento(page, info.project.name)
    const foto = page.locator('#portfolio [role="button"], #portfolio button').first()
    await foto.scrollIntoViewIfNeeded()
    // tempo do clique até o próximo quadro pintado, com a CPU 4× mais lenta
    const ms = await foto.evaluate(
      (el) =>
        new Promise<number>((pronto) => {
          const t0 = performance.now()
          ;(el as HTMLElement).click()
          requestAnimationFrame(() => setTimeout(() => pronto(performance.now() - t0)))
        }),
    )
    console.log('INP aproximado', Math.round(ms), 'ms')
    expect(ms, 'Interaction to Next Paint').toBeLessThanOrEqual(200)
  })
})

test.describe('RNF19 · tempo de resposta', () => {
  test('a API do conteúdo responde em até 300 ms (p95 de 20 pedidos)', async ({ request }) => {
    const tempos: number[] = []
    for (let i = 0; i < 20; i++) {
      const t0 = performance.now()
      expect((await request.get('/api/conteudo')).ok()).toBe(true)
      tempos.push(performance.now() - t0)
    }
    tempos.sort((a, b) => a - b)
    const p95 = tempos[Math.ceil(tempos.length * 0.95) - 1]
    console.log('p95 /api/conteudo', Math.round(p95), 'ms')
    expect(p95).toBeLessThanOrEqual(300)
  })

  test('o painel abre em até 3 s no 4G lento, do login aos textos prontos para editar', async ({ page }) => {
    await celularLento(page)
    const t0 = Date.now()
    await entrar(page)
    await expect(page.getByRole('heading', { name: 'Textos do site' })).toBeVisible()
    await expect(page.locator('.campo input, .campo textarea').first()).toBeEditable()
    const ms = Date.now() - t0
    console.log('painel aberto em', ms, 'ms')
    expect(ms).toBeLessThanOrEqual(3000)
  })
})
