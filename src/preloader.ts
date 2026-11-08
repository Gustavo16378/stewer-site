/**
 * A abertura de marca: o S do Stewer traçado em dourado, preenchido, o nome
 * subindo letra por letra embaixo, e a cortina que sobe revelando o site.
 *
 * Por que sem React e sem GSAP: isto aparece enquanto o conteúdo e o React
 * ainda estão chegando, então precisa ser leve e rodar já na entrada
 * (main.tsx). O traço é stroke-dashoffset em CSS (preloader.css); aqui só se
 * monta o HTML e se decide quando sair.
 *
 * - aparece a cada carregamento (inclusive ao recarregar);
 * - quem pede menos movimento (prefers-reduced-motion) não vê;
 * - nunca segura o site: sai assim que a animação mínima terminou e a
 *   página montou, e em 6 s sai de qualquer jeito.
 */
import { LOGO_PATHS, LOGO_VIEWBOX } from './lib/logo'
import './preloader.css'

const NOME = 'Stewer Gabriel'
const FRASE = 'Visagista · Consultor de imagem'

/** o desenho completo, antes de a cortina poder subir */
const TEMPO_MINIMO = 1500
/** se o site não montar, a cortina sobe mesmo assim */
const TEMPO_MAXIMO = 6000
/** a cortina sobe em 0,75 s; o site começa a entrar 0,3 s antes do fim */
const CORTINA = 750
const SOBREPOSICAO = 300

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** as letras do nome, cada uma numa caixa para subir de baixo */
function letras(texto: string) {
  return [...texto]
    .map((c, i) =>
      c === ' '
        ? '<span class="pl-espaco"> </span>'
        : `<span class="pl-letra" style="--i:${i}"><span>${c}</span></span>`,
    )
    .join('')
}

/**
 * Mostra a abertura, se for o caso. Devolve a função que fecha a cortina
 * quando o site estiver pronto (ou null, se não mostrou nada).
 */
export function abrirPreloader(): ((sitePronto: Promise<unknown>) => void) | null {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  const raiz = document.documentElement
  raiz.classList.add('sg-abrindo')

  const el = document.createElement('div')
  el.className = 'preloader'
  el.setAttribute('aria-hidden', 'true')
  el.dataset.preloader = ''
  el.innerHTML = `
    <svg class="pl-logo" viewBox="${LOGO_VIEWBOX}">
      ${LOGO_PATHS.map((d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`).join('')}
    </svg>
    <p class="pl-nome">${letras(NOME)}</p>
    <p class="pl-frase">${FRASE}</p>`
  document.body.append(el)

  // o nome sobe quando o S já está quase todo traçado, e só com a fonte
  // certa, para não trocar de letra no meio (se a fonte demorar, vai assim mesmo)
  const fonte = document.fonts?.load('400 1em "Playfair Display"').catch(() => undefined) ?? Promise.resolve()
  void Promise.all([esperar(650), Promise.race([fonte, esperar(1100)])]).then(() =>
    el.classList.add('pl-nome-pronto'),
  )

  const inicio = performance.now()

  return (sitePronto) => {
    const desenhoFeito = esperar(Math.max(0, TEMPO_MINIMO - (performance.now() - inicio)))
    // site que falhou ao montar também conta como "pronto": a cortina sobe
    // e mostra o que houver, em vez de ficar de pé para sempre
    const montou = sitePronto.catch(() => undefined)
    void Promise.race([Promise.all([desenhoFeito, montou]), esperar(TEMPO_MAXIMO)]).then(async () => {
      el.classList.add('pl-saindo')
      await esperar(CORTINA - SOBREPOSICAO)
      // o site começa a entrar com a cortina ainda subindo: sem buraco entre os dois
      raiz.classList.remove('sg-abrindo')
      await esperar(SOBREPOSICAO)
      el.remove()
    })
  }
}
