/**
 * O "S" do Stewer em vetor, redesenhado do logo original (logo1.jpeg) com
 * os vértices alinhados: três polígonos, sem curva nenhuma.
 *
 * Vetor e não PNG: fica nítido em qualquer tela, pesa menos de 1 KB e o
 * preloader consegue desenhar o contorno traço a traço (Preloader.tsx).
 */
import type React from 'react'

export const LOGO_VIEWBOX = '0 0 59.5 100'

export const LOGO_PATHS = [
  // o S grande (de cima)
  'M30 1 L1 19.5 L1 43 L35.5 67.5 L35.5 72.5 L30 76 L24 72 L24 66.5 L17 62 L17 74 L30 83 L42.5 74.5 L42.5 64 L9.5 39.5 L9.5 24 L30 10.5 L50 23.5 L50 37 L58.5 37 L58.5 19.5 Z',
  // a base do hexágono
  'M58.5 46.5 L41 46.5 L50 54 L50 74.5 L30 89 L9.5 74.5 L9.5 59.5 L1 59.5 L1 79 L30 99 L58.5 79 Z',
  // o S pequeno (de dentro)
  'M30 19.5 L17 28 L17 40.5 L42.5 58.5 L42.5 53 L24 39 L24 31 L30 27 L35.5 31 L35.5 35.5 L42.5 40 L42.5 28 Z',
]

/** o logo cheio, na cor do original (quase branco) */
export function Logo({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} style={style} fill="#f3f3f3" aria-hidden="true" focusable="false">
      {LOGO_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/**
 * O logo no mesmo espaço que o PNG antigo ocupava no topo e no rodapé. O
 * PNG tinha muita margem transparente (357×698, com o S em 99×168 no meio):
 * a caixa e o tamanho do S continuam iguais, para nada sair do lugar.
 */
export function LogoNaCaixa({ altura }: { altura: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ height: altura, width: (altura * 357) / 698 }}
    >
      <Logo className="w-auto" style={{ height: (altura * 168) / 698 }} />
    </span>
  )
}
