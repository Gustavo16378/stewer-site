/**
 * As regras de escolha do fundo do mapa, sem Leaflet, para serem testadas
 * sem navegador. Quem aplica é lib/mapa.ts.
 */

/**
 * Chave pública da CARTO (carto.com/basemaps/apikey). Fica no código de
 * propósito: o navegador manda ela em todo pedido de mapa, então não é
 * segredo. O que protege é a trava por domínio cadastrada na CARTO.
 */
export const CHAVE_CARTO = ''

export const ESTILO_OPENFREEMAP = 'https://tiles.openfreemap.org/styles/dark'

/** quanto esperar o estilo do OpenFreeMap antes de ir para o OSM */
export const TEMPO_ESTILO = 8000

export type Fonte = 'carto' | 'openfreemap' | 'osm'

export const CREDITOS: Record<Fonte, string> = {
  carto: 'Mapa © OpenStreetMap · © CARTO',
  openfreemap: 'Mapa © OpenStreetMap · OpenMapTiles · OpenFreeMap',
  osm: 'Mapa © OpenStreetMap',
}

/** a fonte por onde começar */
export const primeiraFonte = (chave: string): Fonte => (chave.trim() ? 'carto' : 'openfreemap')

/** para onde ir quando a fonte atual falha; null quando não sobra nenhuma */
export const proximaFonte = (atual: Fonte): Fonte | null =>
  atual === 'carto' ? 'openfreemap' : atual === 'openfreemap' ? 'osm' : null

/**
 * A camada de imagens falhou de vez? Alguns pedaços podem falhar numa rede
 * ruim; a troca acontece quando nenhum carregou e já são 2 erros, ou quando
 * os erros passam dos acertos (chave bloqueada, limite do mês estourado).
 */
export const falhou = (erros: number, acertos: number) => (acertos === 0 ? erros >= 2 : erros >= 4 && erros > acertos)

export const urlCarto = (chave: string) =>
  `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(chave.trim())}`
