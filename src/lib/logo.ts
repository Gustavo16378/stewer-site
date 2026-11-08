/**
 * O "S" do Stewer em vetor, redesenhado do logo original com
 * os vértices alinhados: três polígonos, sem curva nenhuma.
 *
 * Só os dados, sem React: o preloader (src/preloader.ts) roda antes de o
 * React chegar e usa o mesmo desenho que o topo e o rodapé (Logo.tsx).
 */
export const LOGO_VIEWBOX = '0 0 59.5 100'

export const LOGO_PATHS = [
  // o S grande (de cima)
  'M30 1 L1 19.5 L1 43 L35.5 67.5 L35.5 72.5 L30 76 L24 72 L24 66.5 L17 62 L17 74 L30 83 L42.5 74.5 L42.5 64 L9.5 39.5 L9.5 24 L30 10.5 L50 23.5 L50 37 L58.5 37 L58.5 19.5 Z',
  // a base do hexágono
  'M58.5 46.5 L41 46.5 L50 54 L50 74.5 L30 89 L9.5 74.5 L9.5 59.5 L1 59.5 L1 79 L30 99 L58.5 79 Z',
  // o S pequeno (de dentro)
  'M30 19.5 L17 28 L17 40.5 L42.5 58.5 L42.5 53 L24 39 L24 31 L30 27 L35.5 31 L35.5 35.5 L42.5 40 L42.5 28 Z',
]
