/**
 * O "S" do Stewer em vetor, redesenhado do logo original com
 * os vértices alinhados: três polígonos, sem curva nenhuma.
 *
 * Vetor e não PNG: fica nítido em qualquer tela, pesa menos de 1 KB e o
 * preloader consegue desenhar o contorno traço a traço (src/preloader.ts).
 */
import type React from 'react'
import { LOGO_PATHS, LOGO_VIEWBOX } from '../lib/logo'

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
