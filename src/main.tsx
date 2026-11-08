import './fontes'
import './index.css'
import { SLIDES } from './content/site'
import { carregarConteudo } from './lib/conteudo-remoto'

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
 */
const conteudo = carregarConteudo().finally(baixarPrimeiraFoto)
const site = import('./inicio')

void Promise.all([conteudo, site]).then(([, { montar }]) => {
  montar()
  irParaAncora()
})

function baixarPrimeiraFoto() {
  const foto = SLIDES[0]
  if (!foto) return
  const img = new Image()
  img.fetchPriority = 'high'
  img.src = foto.src
}

/**
 * Link com âncora (stewergabriel.com/#onde-atende): quando o navegador
 * procurou a seção, ela ainda não existia, porque a página monta depois da
 * API. Depois do primeiro render, vai até ela.
 */
function irParaAncora(tentativas = 30) {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id) return
  // o React monta no próximo ciclo, não na hora do render(): espera a seção
  const alvo = document.getElementById(id)
  if (alvo) alvo.scrollIntoView()
  else if (tentativas > 0) requestAnimationFrame(() => irParaAncora(tentativas - 1))
}
