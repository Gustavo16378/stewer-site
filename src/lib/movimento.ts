/**
 * O movimento de rolagem do site, com GSAP (ScrollTrigger e SplitText).
 *
 * Quatro efeitos, cada um ligado por um atributo no HTML:
 *
 * - data-revelar="linhas"  título que sobe linha por linha, de trás de uma
 *                          máscara (as linhas de verdade, do jeito que o
 *                          texto quebrou naquela tela);
 * - data-revelar="foto"    foto que se abre de baixo para cima, com um
 *                          leve zoom saindo; as de uma mesma fileira entram
 *                          em sequência;
 * - data-contar            número que conta até o valor ("+800", "10+");
 * - data-parallax          a foto e o texto da abertura andam em
 *                          velocidades diferentes ao rolar (só no computador).
 *
 * Desempenho (RNF18): o GSAP só é baixado quando a pessoa começa a rolar
 * (ou usa o teclado): antes disso nada abaixo da dobra aparece, então não
 * há o que animar, e a abertura do site não paga o custo de baixar e rodar
 * o GSAP (no celular lento, eram uns 250 ms de processador travado). A
 * preparação é feita em pedaços, devolvendo a vez ao navegador entre eles.
 * O que já está na tela nessa hora fica como está: nada some para depois
 * aparecer de novo.
 *
 * Acessibilidade: quem pede menos movimento (prefers-reduced-motion) não
 * baixa nada disto, e o site é o mesmo, parado. Sem JavaScript, idem.
 */

/** devolve a vez ao navegador (a rolagem continua lisa enquanto o movimento se prepara) */
const pausa = () =>
  new Promise<void>((r) => {
    const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
    if (s?.yield) void s.yield().then(r)
    else setTimeout(r, 0)
  })

/** já está na tela (ou quase)? então não anima: já foi visto */
const jaVisto = (el: Element) => el.getBoundingClientRect().top < window.innerHeight * 0.92

/** "+800" → 800; "1.500+" → 1500 (o ponto é de milhar) */
export function numeroDe(texto: string): { inteiro: number; trecho: string } | null {
  const m = /\d[\d.]*/.exec(texto)
  if (!m) return null
  const inteiro = Number(m[0].replace(/\./g, ''))
  return Number.isFinite(inteiro) ? { inteiro, trecho: m[0] } : null
}

/** escreve o número no mesmo formato do original (com ponto de milhar se ele tinha) */
export function formatarComo(trecho: string, n: number) {
  return trecho.includes('.') ? n.toLocaleString('pt-BR') : String(n)
}

export async function ligarMovimento() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/SplitText'),
  ])
  gsap.registerPlugin(ScrollTrigger, SplitText)
  await pausa()

  // ── títulos, linha por linha ────────────────────────────────────────────
  for (const titulo of document.querySelectorAll<HTMLElement>('[data-revelar="linhas"]')) {
    if (jaVisto(titulo)) continue
    await pausa()
    SplitText.create(titulo, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'revelar-linha',
      // refaz as linhas se a tela mudar de tamanho ou a fonte chegar depois
      autoSplit: true,
      onSplit: (s) =>
        gsap.from(s.lines, {
          yPercent: 110,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: titulo, start: 'top 94%', once: true },
        }),
    })
  }

  // ── fotos que se abrem ──────────────────────────────────────────────────
  await pausa()
  const fotos = [...document.querySelectorAll<HTMLElement>('[data-revelar="foto"]')].filter((f) => !jaVisto(f))
  const miolo = (f: HTMLElement) => (f.matches('img, video') ? f : f.querySelector<HTMLElement>('img, video'))
  gsap.set(fotos, { clipPath: 'inset(100% 0% 0% 0%)' })
  gsap.set(fotos.map(miolo).filter(Boolean), { scale: 1.18, transformOrigin: '50% 60%' })
  ScrollTrigger.batch(fotos, {
    start: 'top 96%',
    once: true,
    onEnter: (lote) => {
      const els = lote as HTMLElement[]
      gsap.to(els, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.75,
        ease: 'expo.out',
        stagger: 0.07,
        // devolve o elemento como era: o zoom de hover das fotos volta a valer
        clearProps: 'clipPath',
      })
      gsap.to(els.map(miolo).filter(Boolean), {
        scale: 1,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.07,
        clearProps: 'transform,transformOrigin',
      })
    },
  })

  // ── números que contam ──────────────────────────────────────────────────
  await pausa()
  for (const el of document.querySelectorAll<HTMLElement>('[data-contar]')) {
    const final = el.dataset.contar ?? ''
    const n = numeroDe(final)
    if (!n || jaVisto(el)) continue
    // a largura final fica reservada: o número crescendo não empurra nada (CLS)
    el.style.minWidth = `${el.offsetWidth}px`
    el.style.display = 'inline-block'
    const estado = { v: 0 }
    const escrever = () => (el.textContent = final.replace(n.trecho, formatarComo(n.trecho, Math.round(estado.v))))
    escrever()
    gsap.to(estado, {
      v: n.inteiro,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: escrever,
      onComplete: () => {
        el.textContent = final
      },
      scrollTrigger: { trigger: el, start: 'top 96%', once: true },
    })
  }

  // ── parallax da abertura (computador) ───────────────────────────────────
  const mm = gsap.matchMedia()
  mm.add('(min-width: 768px)', () => {
    const abertura = document.querySelector('[data-parallax-area]')
    if (!abertura) return
    const rolar = { trigger: abertura, start: 'top top', end: 'bottom top', scrub: 0.6 }
    gsap.to('[data-parallax="foto"]', { yPercent: 9, ease: 'none', scrollTrigger: rolar })
    gsap.to('[data-parallax="texto"]', { y: -70, ease: 'none', scrollTrigger: rolar })
  })

  document.documentElement.dataset.movimento = 'ligado'
}

/**
 * Liga o movimento no primeiro sinal de que a pessoa vai descer a página:
 * rolar (inclusive o pulo de um link com âncora), roda do mouse, toque,
 * teclado. Quem pede menos movimento não baixa nada.
 */
export function ligarMovimentoQuandoRolar() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const sinais = ['scroll', 'wheel', 'touchmove', 'keydown', 'pointerdown'] as const
  const ir = () => {
    for (const s of sinais) window.removeEventListener(s, ir)
    void ligarMovimento().catch(() => undefined)
  }
  for (const s of sinais) window.addEventListener(s, ir, { passive: true })
  // a página já veio rolada (voltar no navegador, âncora): liga agora
  if (window.scrollY > 0) ir()
}
