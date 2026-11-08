/**
 * E2E · o painel como o Stewer usa (RF10–RF20, RNF07, RNF11).
 */
import { ADMIN, abrirSite, api, entrar, expect, semRolagemLateral, test } from './ajuda'

const ABAS = ['textos', 'slides', 'numeros', 'servicos', 'etapas', 'topicos', 'aulas', 'cortes', 'contatos', 'fotos', 'usuarios', 'auditoria', 'conta']

test.describe('painel', () => {
  test('RF10 · senha errada mostra o erro; a certa entra em "Textos do site"', async ({ page }) => {
    await page.goto('/admin')
    await page.getByLabel('E-mail').fill(ADMIN.email)
    await page.getByLabel('Senha').fill('senha-errada-123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
    await entrar(page)
    await expect(page.getByRole('heading', { name: 'Textos do site' })).toBeVisible()
    await semRolagemLateral(page)
  })

  test('RF11 · editar o texto de um serviço muda o card no site', async ({ page }, info) => {
    const texto = `Texto novo do visagismo (${info.project.name}).`
    await entrar(page)
    await page.goto('/admin#servicos')
    await page.getByRole('button', { name: /^Visagismo/ }).click()
    await page.getByLabel('Texto').fill(texto)
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Alterações salvas.')).toBeVisible()

    await abrirSite(page, '#servicos')
    await expect(page.locator('#servicos')).toContainText(texto)
  })

  test('RF11 · reordenar com as setas muda a numeração dos cards no site', async ({ page, request }) => {
    await entrar(page)
    await page.goto('/admin#servicos')
    await page.getByRole('button', { name: 'Descer Corte' }).click()
    await expect(page.locator('.linha__texto strong').first()).toHaveText('Visagismo')
    await abrirSite(page, '#servicos')
    await expect(page.locator('#servicos h3').first()).toHaveText('Visagismo')
    // volta a ordem original pela API, para o próximo projeto do Playwright
    const painel = await api(request)
    const { itens } = await (await painel.get('/api/admin/servicos')).json()
    const ids = itens.map((i: { id: number }) => i.id).sort((a: number, b: number) => a - b)
    await painel.put('/api/admin/servicos/ordem', { data: { ids } })
  })

  test('RF14 · trocar o lema da abertura e voltar ao original', async ({ page }) => {
    await entrar(page)
    await page.getByRole('textbox', { name: /^Lema/ }).fill('Estilo com propósito')
    await page.getByRole('button', { name: /Salvar abertura/ }).click()
    await expect(page.getByText(/Abertura: salvo/)).toBeVisible()

    await abrirSite(page)
    await expect(page.getByText('Estilo com propósito')).toBeVisible()

    await page.goto('/admin#textos')
    await page.locator('.campo', { has: page.locator('[id="texto-hero.lema"]') }).getByRole('button', { name: 'voltar ao original' }).click()
    await page.getByRole('button', { name: /Salvar abertura/ }).click()
    await expect(page.getByText(/Abertura: salvo/)).toBeVisible()
    await abrirSite(page)
    await expect(page.getByText('Masculinidade com propósito')).toBeVisible()
  })

  test('RF12 + RF13 · enviar foto pela tela: reduz, pede descrição e entra na biblioteca', async ({ page }) => {
    const sharp = (await import('sharp')).default
    const grande = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#c4a882' } }).jpeg().toBuffer()
    await entrar(page)
    await page.goto('/admin#fotos')
    await page.locator('.soltar input[type=file]').setInputFiles({ name: 'celular.jpg', mimeType: 'image/jpeg', buffer: grande })
    await page.getByLabel('Descreva a foto').fill('Foto enviada pelo E2E')
    await page.getByRole('button', { name: 'Enviar foto' }).click()
    await expect(page.getByText('Foto enviada.')).toBeVisible()
    await page.getByRole('button', { name: 'Foto enviada pelo E2E' }).first().click()
    await expect(page.locator('.detalhe-foto')).toContainText('1600 × 1067px')
  })

  test('RF20 · "+ Nova foto" no portfólio: sobe a foto e ela já entra no site', async ({ page, request }, info) => {
    const sharp = (await import('sharp')).default
    const foto = await sharp({ create: { width: 900, height: 1200, channels: 3, background: '#333' } }).jpeg().toBuffer()
    const descricao = `Corte novo do E2E ${info.project.name}`
    await entrar(page)
    await page.goto('/admin#cortes')
    await page.getByRole('button', { name: '+ Nova foto' }).click()
    const modal = page.getByRole('dialog', { name: 'Escolher foto' })
    await modal.locator('.soltar input[type=file]').setInputFiles({ name: 'corte.jpg', mimeType: 'image/jpeg', buffer: foto })
    await modal.getByLabel('Descreva a foto').fill(descricao)
    await modal.getByRole('button', { name: 'Enviar foto' }).click()
    await expect(page.getByText(/Foto adicionada no fim da lista/)).toBeVisible()
    await expect(page.locator('.linha__texto strong').last()).toHaveText(descricao)

    await abrirSite(page, '#portfolio')
    await expect(page.getByRole('button', { name: `Ampliar foto: ${descricao}` })).toBeVisible()

    // limpa: tira do portfólio
    const painel = await api(request)
    const { itens } = await (await painel.get('/api/admin/cortes')).json()
    const criado = itens.find((i: { foto_alt: string }) => i.foto_alt === descricao)
    await painel.delete(`/api/admin/cortes/${criado.id}`)
  })

  test('RF15 · trocar o Instagram muda os links do site', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#contatos')
    const insta = page.getByRole('textbox', { name: /^Instagram/ })
    await expect(insta).toHaveValue('@stewer.gabriel')
    await insta.fill('https://www.instagram.com/stewer.teste/')
    await page.getByRole('button', { name: 'Salvar contatos' }).click()
    await expect(page.getByText('Contatos salvos.')).toBeVisible()

    await abrirSite(page, '#contato')
    await expect(page.locator('#contato a', { hasText: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/stewer.teste')

    await page.goto('/admin#contatos')
    await page.getByRole('textbox', { name: /^Instagram/ }).fill('@stewer.gabriel')
    await page.getByRole('button', { name: 'Salvar contatos' }).click()
    await expect(page.getByText('Contatos salvos.')).toBeVisible()
  })

  test('RF15 · erro de validação aparece em português', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#contatos')
    await page.getByRole('textbox', { name: /^WhatsApp/ }).fill('123')
    await page.getByRole('button', { name: 'Salvar contatos' }).click()
    await expect(page.getByRole('alert')).toContainText('DDD')
  })

  test('RF15 · colar o link do Google Maps move o alfinete e muda o mapa do site', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#contatos')
    const cartao = page.locator('.cartao', { hasText: 'Local no mapa' })
    await expect(cartao.locator('.mapa-ponto .leaflet-marker-icon')).toBeVisible()

    await cartao.getByLabel('Link do Google Maps ou coordenadas').fill(
      'https://www.google.com/maps/place/Pal%C3%A1cio/@-10.18,-48.33,17z/data=!4m6!3m5!8m2!3d-10.184296!4d-48.333588',
    )
    await cartao.getByRole('button', { name: 'Achar no mapa' }).click()
    await expect(cartao.locator('.previa-ponto')).toContainText(`Ponto novo, ainda não salvo: 10°11'3"S · 48°20'1"W`)

    // link de outro país: avisa e não mexe no ponto
    await cartao.getByLabel('Link do Google Maps ou coordenadas').fill('https://www.google.com/maps/@40.7128,-74.006,15z')
    await cartao.getByRole('button', { name: 'Achar no mapa' }).click()
    await expect(cartao.getByRole('alert')).toContainText('fora do Brasil')

    await cartao.getByRole('button', { name: 'Salvar local' }).click()
    await expect(page.getByText('Local salvo.')).toBeVisible()
    await abrirSite(page, '#onde-atende')
    await expect(page.locator('#onde-atende')).toContainText(`10°11'3"S · 48°20'1"W`)

    // volta o ponto original
    await page.goto('/admin#contatos')
    const de_novo = page.locator('.cartao', { hasText: 'Local no mapa' })
    await de_novo.getByLabel('Link do Google Maps ou coordenadas').fill('-10.18256053, -48.32910908')
    await de_novo.getByRole('button', { name: 'Achar no mapa' }).click()
    await de_novo.getByRole('button', { name: 'Salvar local' }).click()
    await expect(page.getByText('Local salvo.')).toBeVisible()
  })

  test('RF15 · tocar no mapa move o alfinete; "Desfazer" volta ao salvo', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#contatos')
    const cartao = page.locator('.cartao', { hasText: 'Local no mapa' })
    const mapa = cartao.locator('.mapa-ponto')
    await expect(mapa.locator('.leaflet-marker-icon')).toBeVisible()
    const caixa = (await mapa.boundingBox())!
    await mapa.click({ position: { x: caixa.width * 0.2, y: caixa.height * 0.2 } })
    await expect(cartao.locator('.previa-ponto')).toContainText('Ponto novo, ainda não salvo')
    await cartao.getByRole('button', { name: 'Desfazer' }).click()
    await expect(cartao.locator('.previa-ponto')).toContainText(`No site agora: 10°10'57"S · 48°19'45"W`)
  })

  test('RF15 · endereço e horário na mesma página, indo para o site', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#contatos')
    await page.getByLabel('Horário').fill('Ter — Sáb\n10h às 20h')
    await page.getByRole('button', { name: 'Salvar endereço' }).click()
    await expect(page.getByText(/Endereço: salvo/)).toBeVisible()
    await abrirSite(page, '#onde-atende')
    await expect(page.locator('#onde-atende')).toContainText('10h às 20h')

    await page.goto('/admin#contatos')
    await page.locator('.campo', { has: page.locator('[id="texto-local.horario"]') }).getByRole('button', { name: 'voltar ao original' }).click()
    await page.getByRole('button', { name: 'Salvar endereço' }).click()
    await expect(page.getByText(/Endereço: salvo/)).toBeVisible()
  })

  test('RNF07 · duas pessoas no mesmo serviço: a segunda recebe aviso, nada se perde', async ({ browser }) => {
    const a = await (await browser.newContext()).newPage()
    const b = await (await browser.newContext()).newPage()
    await entrar(a)
    await entrar(b)
    for (const p of [a, b]) {
      await p.goto('/admin#servicos')
      await p.getByRole('button', { name: /^Consultoria de Imagem/ }).click()
    }
    const rodada = Date.now()
    await a.getByLabel('Texto').fill(`Texto da pessoa A ${rodada}`)
    await a.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(a.getByText('Alterações salvas.')).toBeVisible()

    await b.getByLabel('Texto').fill(`Texto da pessoa B ${rodada}`)
    await b.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(b.getByRole('alert')).toContainText('enquanto você editava')
  })

  test('RF16 + RF17 · dar acesso, entrar com a temporária e ser obrigado a trocar', async ({ page, browser }) => {
    await entrar(page)
    await page.goto('/admin#usuarios')
    const email = `novo${Date.now()}@teste.local`
    await page.getByLabel('Nome').fill('Pessoa Nova')
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: 'Criar acesso' }).click()
    const temp = (await page.locator('.senha-temporaria').innerText()).trim()
    expect(temp).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)

    const nova = await (await browser.newContext()).newPage()
    await nova.goto('/admin')
    await nova.getByLabel('E-mail').fill(email)
    await nova.getByLabel('Senha').fill(temp)
    await nova.getByRole('button', { name: 'Entrar' }).click()
    await expect(nova.getByRole('heading', { name: 'Senha nova' })).toBeVisible()
    await nova.getByLabel(/^Senha nova/).fill('minha-senha-propria')
    await nova.getByLabel('Repita a senha nova').fill('minha-senha-propria')
    await nova.getByRole('button', { name: 'Salvar e entrar' }).click()
    await expect(nova.getByRole('heading', { name: 'Textos do site' })).toBeVisible()
  })

  test('RF18 · a auditoria do dia mostra o que foi feito e por quem', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#auditoria')
    await expect(page.locator('.registro').first()).toBeVisible()
    await expect(page.locator('.auditoria')).toContainText('Stewer entrou no painel')
    await expect(page.locator('.auditoria')).toContainText('editou o serviço Visagismo')
  })

  test('RF19 · "Minha conta" mostra o espaço do banco', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#conta')
    await expect(page.getByRole('heading', { name: 'Espaço do banco' })).toBeVisible()
    await expect(page.locator('.cartao', { hasText: 'Espaço do banco' })).toContainText('500 MB')
  })

  test('RNF11 · todas as abas abrem sem rolagem lateral e sem erro', async ({ page }) => {
    const erros: string[] = []
    page.on('pageerror', (e) => erros.push(e.message))
    await entrar(page)
    for (const aba of ABAS) {
      await page.goto(`/admin#${aba}`)
      await expect(page.locator('.pagina__titulo')).toBeVisible()
      await semRolagemLateral(page)
    }
    expect(erros).toEqual([])
  })

  test('sair encerra a sessão', async ({ page }) => {
    await entrar(page)
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })
})
