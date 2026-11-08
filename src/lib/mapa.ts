/**
 * O fundo escuro do mapa, com reserva.
 *
 * Desde 25/09/2026 a CARTO só entrega o mapa escuro (dark_all) com chave.
 * Sem ela, cada pedaço do mapa vira um aviso "API KEY REQUIRED". Para o
 * site nunca mais mostrar isso, o fundo tenta três fontes, nesta ordem:
 *
 * 1. CARTO dark_all, com a chave (o visual original do design);
 * 2. OpenFreeMap "dark", em vetor, sem chave nenhuma (quase igual);
 * 3. OpenStreetMap padrão, escurecido por filtro (não depende de WebGL).
 *
 * Sem chave configurada, começa direto na 2. A 2 só é baixada quando
 * precisa: quem vê o mapa da CARTO não carrega o MapLibre.
 *
 * Usado pelo mapa do site e pelo minimapa do painel.
 */
import L from 'leaflet'

import {
  CHAVE_CARTO,
  CREDITOS,
  ESTILO_OPENFREEMAP,
  TEMPO_ESTILO,
  falhou,
  primeiraFonte,
  proximaFonte,
  urlCarto,
  type Fonte,
} from './mapa-fontes'


type Opcoes = {
  chave?: string
  /** avisa qual fonte ficou valendo (para o crédito e para os testes) */
  aoTrocar?: (fonte: Fonte) => void
}

/**
 * Põe o fundo escuro no mapa e cuida da troca. Devolve a função que
 * desliga tudo (chamar antes de `map.remove()`).
 */
export function fundoEscuro(map: L.Map, opcoes: Opcoes = {}) {
  const chave = opcoes.chave ?? CHAVE_CARTO
  let camada: L.Layer | null = null
  let ativo = true
  let credito = ''

  const atribuicao = L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)

  function marcar(fonte: Fonte) {
    if (credito) atribuicao.removeAttribution(credito)
    credito = CREDITOS[fonte]
    atribuicao.addAttribution(credito)
    map.getContainer().dataset.fonteMapa = fonte
    opcoes.aoTrocar?.(fonte)
  }

  function trocar(atual: Fonte) {
    const proxima = proximaFonte(atual)
    if (ativo && proxima) void usar(proxima)
  }

  /** camada de imagens (CARTO ou OSM), com o contador de falhas */
  function imagens(fonte: 'carto' | 'osm') {
    const url = fonte === 'carto' ? urlCarto(chave) : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const c = L.tileLayer(url, {
      maxZoom: fonte === 'carto' ? 20 : 19,
      // o filtro escurece o OSM, que é claro (ver .mapa-osm no CSS)
      className: fonte === 'osm' ? 'mapa-osm' : '',
      ...(fonte === 'carto' ? {} : { detectRetina: false }),
    })
    let erros = 0
    let acertos = 0
    c.on('tileload', () => acertos++)
    c.on('tileerror', () => {
      erros++
      if (falhou(erros, acertos) && camada === c) trocar(fonte)
    })
    return c
  }

  async function usar(fonte: Fonte) {
    if (camada) map.removeLayer(camada)
    camada = null

    if (fonte === 'openfreemap') {
      try {
        const [{ default: maplibreGL }, { setWorkerUrl }, { default: urlWorker }] = await Promise.all([
          import('@maplibre/maplibre-gl-leaflet'),
          import('maplibre-gl'),
          // o MapLibre procura o worker ao lado do próprio arquivo, que o
          // Vite junta num pacote só: o endereço certo vem daqui
          import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ])
        if (!ativo) return
        setWorkerUrl(urlWorker)
        const c = maplibreGL({ style: ESTILO_OPENFREEMAP, attributionControl: false })
        camada = c
        c.addTo(map)
        // Estilo que não carrega (serviço fora, rede bloqueada) também troca.
        // Outros erros (um ícone ou um pedaço que faltou) não: o mapa segue.
        const gl = c.getMaplibreMap()
        const desistir = () => {
          if (camada === c) trocar('openfreemap')
        }
        const relogio = window.setTimeout(desistir, TEMPO_ESTILO)
        gl.once('load', () => window.clearTimeout(relogio))
        gl.on('error', (e: { error?: { status?: number; url?: string; message?: string } }) => {
          const url = e.error?.url ?? e.error?.message ?? ''
          if (!gl.loaded() && url.includes(ESTILO_OPENFREEMAP)) {
            window.clearTimeout(relogio)
            desistir()
          }
        })
      } catch {
        // sem WebGL o MapLibre nem nasce: vai para o OSM
        if (ativo) return usar('osm')
        return
      }
    } else {
      camada = imagens(fonte)
      camada.addTo(map)
    }
    marcar(fonte)
  }

  void usar(primeiraFonte(chave))

  return () => {
    ativo = false
    if (camada) map.removeLayer(camada)
  }
}
