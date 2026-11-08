/**
 * Gera os PDFs da documentação em docs/pdf/, com a identidade do site
 * (carvão, creme e dourado, Playfair Display e Inter).
 *
 * - um PDF por documento de docs/ (requisitos, arquitetura, banco, API,
 *   testes e manual do painel), com capa própria;
 * - documentacao-completa.pdf, com capa, sumário e todos os capítulos.
 *
 * O Markdown vira HTML (marked), os diagramas Mermaid são desenhados no
 * navegador e o Chromium do Playwright imprime em A4. Links relativos para
 * arquivos do repositório viram links do GitHub, para funcionarem no PDF.
 *
 * Uso: npm run docs:pdf
 * Para usar um Chrome já instalado: CHROME_PATH=/caminho/do/chrome npm run docs:pdf
 */
import { mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { marked } from 'marked'
import { PDFDocument } from 'pdf-lib'
import { chromium } from 'playwright'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pacote = JSON.parse(readFileSync(path.join(raiz, 'package.json'), 'utf8'))
const REPO = 'https://github.com/Gustavo16378/stewer-site/blob/main'
const saida = path.join(raiz, 'docs', 'pdf')

const DOCUMENTOS = [
  { arquivo: 'requisitos.md', titulo: 'Requisitos', resumo: 'Atores, restrições, requisitos funcionais e não funcionais.' },
  { arquivo: 'arquitetura.md', titulo: 'Arquitetura', resumo: 'Camadas, fluxos, fotos, edição simultânea, segurança e decisões técnicas.' },
  { arquivo: 'banco.md', titulo: 'Modelo do banco', resumo: 'Diagrama entidade-relacionamento, tabelas, regras e migrations.' },
  { arquivo: 'api.md', titulo: 'Referência da API', resumo: 'Rotas, formatos de pedido e resposta, erros e sessão.' },
  { arquivo: 'testes.md', titulo: 'Plano e relatório de testes', resumo: 'Estratégia em caixa branca, cinza e preta, rastreabilidade e achados.' },
  { arquivo: 'manual-do-painel.md', titulo: 'Manual do painel', resumo: 'Como o Stewer usa o painel, em linguagem simples.' },
]

const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const fonte = (pacoteFonte, nome) => pathToFileURL(path.join(raiz, 'node_modules/@fontsource', pacoteFonte, 'files', nome)).href
const logo = pathToFileURL(path.join(raiz, 'public/photos/logo-recortado.png')).href

const FONTES = `
@font-face { font-family: Playfair; src: url(${fonte('playfair-display', 'playfair-display-latin-400-normal.woff2')}); font-weight: 400; }
@font-face { font-family: Playfair; src: url(${fonte('playfair-display', 'playfair-display-latin-400-italic.woff2')}); font-weight: 400; font-style: italic; }
@font-face { font-family: Inter; src: url(${fonte('inter', 'inter-latin-400-normal.woff2')}); font-weight: 400; }
@font-face { font-family: Inter; src: url(${fonte('inter', 'inter-latin-500-normal.woff2')}); font-weight: 500; }
`

/** link relativo de docs/x.md vira link do GitHub; âncoras e links absolutos ficam */
function ajustarLinks(html, deArquivo) {
  return html.replace(/href="([^"#][^"]*)"/g, (tudo, href) => {
    if (/^(https?:|mailto:)/.test(href)) return tudo
    const alvo = path.posix.normalize(path.posix.join('docs', path.posix.dirname(deArquivo), href))
    return `href="${REPO}/${alvo}"`
  })
}

const idDe = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function markdownParaHtml(md, arquivo, prefixo = '') {
  const renderizador = new marked.Renderer()
  renderizador.code = ({ text, lang }) =>
    lang === 'mermaid'
      ? `<div class="diagrama"><pre class="mermaid">${text}</pre></div>`
      : `<pre class="codigo"><code>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`
  renderizador.heading = function ({ tokens, depth }) {
    const texto = this.parser.parseInline(tokens)
    return `<h${depth} id="${prefixo}${idDe(texto)}">${texto}</h${depth}>`
  }
  // o h1 do arquivo vira o título do capítulo, desenhado à parte
  const semTitulo = md.replace(/^# .+\n/, '')
  const html = marked.parse(semTitulo, { renderer: renderizador, gfm: true })
  // título nunca fica sozinho no pé da página: vai junto com o bloco seguinte
  const junto = html.replace(
    /(<h[23][^>]*>[\s\S]*?<\/h[23]>)\s*(<div class="diagrama">[\s\S]*?<\/pre><\/div>|<table>[\s\S]*?<\/table>|<p>[\s\S]*?<\/p>|<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>|<pre class="codigo">[\s\S]*?<\/pre>)/g,
    '<div class="junto">$1$2</div>',
  )
  return ajustarLinks(junto, arquivo)
}

const CSS = `${FONTES}
:root { --carvao: #0c0c0c; --grafite: #1c1c1c; --ouro: #b0905f; --ouro-claro: #c4a882; --creme: #f6f2ec; --tinta: #1a1816; --cinza: #5f5850; --linha: #e4ddd3; }
@page { size: A4; margin: 22mm 18mm 20mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: Inter, Helvetica, Arial, sans-serif; font-size: 9.6pt; line-height: 1.6; color: var(--tinta); }
h1, h2, h3 { font-family: Playfair, Georgia, serif; font-weight: 400; color: var(--carvao); break-after: avoid; }
h2 { font-size: 17pt; margin: 26pt 0 8pt; padding-top: 8pt; border-top: 1px solid var(--linha); }
h2::after { content: ''; display: block; width: 28pt; height: 1px; margin-top: 6pt; background: var(--ouro); }
h3 { font-size: 12.5pt; margin: 18pt 0 6pt; }
p, li { orphans: 3; widows: 3; }
a { color: #7d6238; text-decoration: none; border-bottom: 1px solid rgba(176,144,95,.45); }
strong { font-weight: 500; color: var(--carvao); }
code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 8.4pt; background: #f1ece4; padding: 1px 4px; }
pre.codigo { background: #f8f5f0; border: 1px solid var(--linha); border-left: 2px solid var(--ouro); padding: 9pt 11pt; white-space: pre-wrap; word-break: break-word; break-inside: avoid; }
pre.codigo code { background: none; padding: 0; font-size: 8.2pt; line-height: 1.5; }
table { width: 100%; border-collapse: collapse; margin: 10pt 0 14pt; font-size: 8.4pt; break-inside: auto; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th { text-align: left; font-weight: 500; font-size: 7.4pt; letter-spacing: .12em; text-transform: uppercase; color: var(--carvao); background: #f3eee7; border-bottom: 1px solid var(--ouro); padding: 6pt 6pt; }
td { border-bottom: 1px solid var(--linha); padding: 5pt 6pt; vertical-align: top; overflow-wrap: break-word; }
th:first-child, td:first-child { min-width: 46pt; }
td code { overflow-wrap: anywhere; }
td code, th code { white-space: normal; }
blockquote { margin: 10pt 0; padding: 6pt 12pt; border-left: 2px solid var(--ouro); background: #f8f5f0; color: var(--cinza); }
hr { border: 0; border-top: 1px solid var(--linha); margin: 18pt 0; }
.diagrama { margin: 12pt 0 16pt; padding: 12pt; border: 1px solid var(--linha); background: #fcfaf7; text-align: center; break-inside: avoid; }
.diagrama svg { max-width: 100%; height: auto; }
.junto { break-inside: avoid; }

.capitulo { break-before: page; }
.capitulo:first-of-type { break-before: auto; }
.abertura { margin: 0 0 18pt; padding-bottom: 12pt; border-bottom: 1px solid var(--carvao); }
.abertura .rotulo { font-size: 7.4pt; letter-spacing: .3em; text-transform: uppercase; color: var(--ouro); }
.abertura h1 { font-size: 28pt; line-height: 1.1; margin: 6pt 0 6pt; border: 0; }
.abertura p { margin: 0; color: var(--cinza); }

.sumario { break-after: page; }
.sumario h1 { font-size: 26pt; margin: 0 0 18pt; }
.sumario ol { list-style: none; padding: 0; margin: 0; counter-reset: cap; }
.sumario li { counter-increment: cap; padding: 10pt 0; border-bottom: 1px solid var(--linha); display: grid; grid-template-columns: 34pt 1fr; }
.sumario li::before { content: counter(cap, decimal-leading-zero); font-family: Playfair, serif; font-size: 15pt; color: var(--ouro); }
.sumario a { border: 0; font-family: Playfair, serif; font-size: 14pt; color: var(--carvao); }
.sumario small { grid-column: 2; color: var(--cinza); font-size: 9pt; }
`

const CSS_CAPA = `${FONTES}
@page { size: A4; margin: 0; }
html, body { margin: 0; height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: #0c0c0c; color: #f0ebe4; font-family: Inter, Helvetica, Arial, sans-serif; }
.capa { position: relative; box-sizing: border-box; height: 296mm; padding: 26mm 22mm; display: flex; flex-direction: column; overflow: hidden; }
.marca { display: flex; align-items: center; gap: 14px; font-family: Playfair, Georgia, serif; font-size: 15pt; }
.marca img { height: 38px; width: auto; }
.meio { margin-top: auto; margin-bottom: auto; position: relative; }
.rotulo { font-size: 8.5pt; letter-spacing: .3em; text-transform: uppercase; color: #8a8178; }
.traco { width: 40px; height: 1px; background: #c4a882; margin: 16pt 0 0; }
h1 { font-family: Playfair, Georgia, serif; font-weight: 400; font-size: 50pt; line-height: .98; margin: 12pt 0 0; max-width: 13ch; letter-spacing: -.01em; }
h1 em { color: #c4a882; }
.resumo { font-size: 11.5pt; line-height: 1.6; color: #c8c3bc; max-width: 46ch; margin: 18pt 0 0; font-style: italic; font-family: Playfair, Georgia, serif; }
.rodape { position: relative; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.5pt; color: #8a8178; border-top: 1px solid #2a2a2a; padding-top: 12pt; letter-spacing: .02em; }
.rodape strong { color: #f0ebe4; font-weight: 500; }
`

function capaHtml(titulo, resumo) {
  // a palavra final do título em itálico dourado
  const partes = titulo.split(' ')
  const ultima = partes.pop()
  const tituloHtml = partes.length ? `${partes.join(' ')} <em>${ultima}</em>` : `<em>${ultima}</em>`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS_CAPA}</style></head><body>
  <section class="capa">
    <div class="marca"><img src="${logo}" alt=""><span>Stewer Gabriel</span></div>
    <div class="meio">
      <div class="rotulo">Documentação do sistema</div>
      <h1>${tituloHtml}</h1>
      <div class="traco"></div>
      <p class="resumo">${resumo}</p>
    </div>
    <div class="rodape">
      <div><strong>Site e painel de stewergabriel.com</strong><br>Visagismo e consultoria de imagem · Palmas, Tocantins · Desenvolvido por Gustavo Dev</div>
      <div style="text-align:right">Versão ${pacote.version}<br>${hoje}</div>
    </div>
  </section></body></html>`
}

function corpoHtml(capitulos, comSumario) {
  const sumario = comSumario
    ? `<section class="sumario"><h1>Sumário</h1><ol>${capitulos
        .map((c) => `<li><a href="#cap-${c.id}">${c.titulo}</a><small>${c.resumo}</small></li>`)
        .join('')}</ol></section>`
    : ''
  const corpo = capitulos
    .map(
      (c, i) => `<section class="capitulo">
        <header class="abertura" id="cap-${c.id}">
          <div class="rotulo">${comSumario ? `Capítulo ${String(i + 1).padStart(2, '0')}` : 'Stewer Gabriel'}</div>
          <h1>${c.titulo}</h1><p>${c.resumo}</p>
        </header>${c.html}</section>`,
    )
    .join('')
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${sumario}${corpo}</body></html>`
}

const rodape = (titulo) => `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7.5pt;color:#8a8178;padding:0 18mm;display:flex;justify-content:space-between">
  <span>Stewer Gabriel · ${titulo}</span><span>versão ${pacote.version} · página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`

async function imprimir(navegador, html, pasta, nome, opcoes) {
  const arquivo = path.join(pasta, `${nome}.html`)
  writeFileSync(arquivo, html)
  const pagina = await navegador.newPage()
  await pagina.goto(pathToFileURL(arquivo).href, { waitUntil: 'load' })
  if (html.includes('class="mermaid"')) {
    await pagina.addScriptTag({ path: path.join(raiz, 'node_modules/mermaid/dist/mermaid.min.js') })
    await pagina.evaluate(async () => {
      // cores do site nos diagramas
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
        themeVariables: {
          primaryColor: '#f3eee7',
          primaryBorderColor: '#b0905f',
          primaryTextColor: '#0c0c0c',
          lineColor: '#3a3a3a',
          secondaryColor: '#f6f2ec',
          tertiaryColor: '#fcfaf7',
          clusterBkg: '#f8f5f0',
          clusterBorder: '#d8cfc2',
          noteBkgColor: '#f8f5f0',
          noteBorderColor: '#c4a882',
          actorBkg: '#f3eee7',
          actorBorder: '#b0905f',
          fontSize: '13px',
        },
      })
      await window.mermaid.run({ querySelector: '.mermaid' })
    })
  }
  await pagina.evaluate(() => document.fonts.ready)
  const pdf = await pagina.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, ...opcoes })
  await pagina.close()
  return pdf
}

/** capa (sem rodapé) + conteúdo (com rodapé e número de página) num PDF só */
async function juntar(capa, conteudo, titulo) {
  const final = await PDFDocument.create()
  for (const bytes of [capa, conteudo]) {
    const doc = await PDFDocument.load(bytes)
    for (const p of await final.copyPages(doc, doc.getPageIndices())) final.addPage(p)
  }
  final.setTitle(`Stewer Gabriel · ${titulo}`)
  final.setAuthor('Gustavo Barbosa Lima · Gustavo Dev')
  final.setSubject('Documentação do site e do painel de stewergabriel.com')
  final.setCreator('scripts/gerar-pdfs.mjs')
  final.setLanguage('pt-BR')
  return final.save()
}

mkdirSync(saida, { recursive: true })
const temporaria = mkdtempSync(path.join(tmpdir(), 'sg-pdf-'))
const navegador = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})

try {
  const capitulos = DOCUMENTOS.map((d) => ({
    ...d,
    id: idDe(d.titulo),
    html: markdownParaHtml(readFileSync(path.join(raiz, 'docs', d.arquivo), 'utf8'), d.arquivo, `${idDe(d.titulo)}-`),
  }))

  for (const c of capitulos) {
    const nome = c.arquivo.replace(/\.md$/, '')
    const capa = await imprimir(navegador, capaHtml(c.titulo, c.resumo), temporaria, `${nome}-capa`, {})
    const conteudo = await imprimir(navegador, corpoHtml([c], false), temporaria, nome, {
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: rodape(c.titulo),
    })
    writeFileSync(path.join(saida, `${nome}.pdf`), await juntar(capa, conteudo, c.titulo))
    console.log(`docs/pdf/${nome}.pdf`)
  }

  const titulo = 'Documentação completa'
  const capa = await imprimir(
    navegador,
    capaHtml(titulo, 'Requisitos, arquitetura, banco de dados, API, testes e manual do painel do site do Stewer Gabriel.'),
    temporaria,
    'completa-capa',
    {},
  )
  const conteudo = await imprimir(navegador, corpoHtml(capitulos, true), temporaria, 'completa', {
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: rodape(titulo),
  })
  writeFileSync(path.join(saida, 'documentacao-completa.pdf'), await juntar(capa, conteudo, titulo))
  console.log('docs/pdf/documentacao-completa.pdf')
} finally {
  await navegador.close()
  rmSync(temporaria, { recursive: true, force: true })
}
