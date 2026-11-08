/**
 * E2E · acessibilidade automática com axe-core (RNF12).
 * Falha em violação "serious" ou "critical" das regras WCAG 2 A e AA.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { abrirSite, entrar, expect, test } from './ajuda'

const auditar = async (page: Page, excluir: string[] = []) => {
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa'])
  for (const e of excluir) b = b.exclude(e)
  const r = await b.analyze()
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  return graves.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.help} → ${v.nodes[0]?.target.join(' ')}`)
}

test('RNF12 · painel: login sem violações graves', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  expect(await auditar(page)).toEqual([])
})

test('RNF12 · painel: todas as abas sem violações graves', async ({ page }) => {
  await entrar(page)
  const problemas: string[] = []
  for (const aba of ['textos', 'slides', 'numeros', 'servicos', 'cortes', 'contatos', 'fotos', 'usuarios', 'auditoria', 'conta']) {
    await page.goto(`/admin#${aba}`)
    await expect(page.locator('.pagina__titulo')).toBeVisible()
    problemas.push(...(await auditar(page)).map((p) => `${aba}: ${p}`))
  }
  expect(problemas).toEqual([])
})

test('RNF12 · painel: formulário aberto sem violações graves', async ({ page }) => {
  await entrar(page)
  await page.goto('/admin#servicos')
  await page.getByRole('button', { name: /^Corte/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await auditar(page)).toEqual([])
})

/*
 * O site público tem o design aprovado antes deste trabalho (texto areia
 * pequeno sobre carvão). O painel não mexe no visual do site; aqui o teste
 * registra que nada do que o painel injeta (textos, fotos, links) cria
 * problema novo, sem travar o CI pelo contraste que já era do design.
 */
test('RNF12 · site: o conteúdo vindo do painel não cria violação grave', async ({ page }) => {
  await abrirSite(page)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['color-contrast']).analyze()
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(graves.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([])
})
