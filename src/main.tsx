import './fontes'
import './index.css'
import { SLIDES } from './content/site'
import { carregarConteudo } from './lib/conteudo-remoto'
import { abrirPreloader } from './preloader'

/*
 * A entrada do site é pequena de propósito e não depende do React (RNF18).
 *
 * Ela roda assim que chega, e em paralelo:
 * 1. pega o conteúdo editável (o pedido já saiu com o HTML, pelo
 *    <link rel="preload"> do index.html); sem resposta em 2,5 s, o site sobe
 *    com o conteúdo do código (ver lib/conteudo-remoto.ts);
 * 2. assim que sabe qual é a primeira foto da abertura, começa a baixá-la,
 *    com prioridade: é a maior coisa da tela no celular (o LCP);
 * 3. enquanto isso o React e o resto do site vão chegando (inicio.tsx).
 *
 * Antes, a foto só começava a vir depois de o React baixar e montar a tela.
 *
 * Na primeira visita da sessão, a abertura de marca (preloader.ts) cobre
 * essa espera com o S sendo desenhado, e sobe quando o site montou.
 */
const fecharPreloader = abrirPreloader()
const conteudo = carregarConteudo().finally(baixarPrimeiraFoto)
const site = import('./inicio')

// a ordem importa: montar, esperar a página existir, ir até a âncora do
// link e só então armar o movimento (que olha o que já está na tela)
const montado = Promise.all([conteudo, site]).then(async ([, inicio]) => {
  inicio.montar()
  await paginaMontada()
  irParaAncora()
  inicio.ligarMovimentoQuandoRolar()
})
fecharPreloader?.(montado)

function baixarPrimeiraFoto() {
  const foto = SLIDES[0]
  if (!foto) return
  const img = new Image()
  img.fetchPriority = 'high'
  img.src = foto.src
}

/**
 * Espera a página existir: o React monta no ciclo seguinte ao render(), e o
 * fim da página (abaixo da abertura) vem logo depois, em fatias (App.tsx).
 * Com âncora no link, espera a seção dela; sem âncora, o rodapé.
 */
function paginaMontada() {
  const alvo = decodeURIComponent(location.hash.slice(1))
  return new Promise<void>((pronto) => {
    let quadros = 0
    const olhar = () => {
      const achou = alvo ? document.getElementById(alvo) : document.querySelector('#root footer')
      if (achou || ++quadros > 180) pronto()
      else requestAnimationFrame(olhar)
    }
    olhar()
  })
}

/**
 * Link com âncora (stewergabriel.com/#onde-atende): quando o navegador
 * procurou a seção, ela ainda não existia, porque a página monta depois da
 * API. Depois que ela montou, vai até ela.
 */
function irParaAncora() {
  const id = decodeURIComponent(location.hash.slice(1))
  // direto, sem a rolagem suave do CSS: quem chega pelo link já quer estar lá
  if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
}
