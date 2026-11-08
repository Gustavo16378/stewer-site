/**
 * O mapa da seção "Onde atende", montado sob demanda.
 *
 * O Leaflet (uns 45 KB comprimidos, mais o CSS) só é baixado quando a
 * pessoa chega perto do mapa, no fim da página: a abertura do site carrega
 * quase metade de JavaScript a menos (RNF18, tests/desempenho).
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fundoEscuro } from './mapa'

/** escapa o nome do lugar antes de ir para o HTML do marcador do Leaflet */
const html = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

type Local = { latitude: number; longitude: number; nome: string }

/**
 * Celular e tablet: um dedo rola a página, dois dedos mexem no mapa (como
 * no Google Maps). Antes, quem descia a página com o dedo em cima do mapa
 * ficava preso arrastando o mapa.
 */
const toque = () => window.matchMedia('(pointer: coarse)').matches

/** o aviso de "dois dedos", que aparece quando alguém tenta arrastar com um */
function avisoDoisDedos(el: HTMLElement) {
  const aviso = document.createElement('div')
  aviso.className = 'mapa-aviso'
  aviso.setAttribute('aria-hidden', 'true')
  aviso.textContent = 'Use dois dedos para mover o mapa'
  el.append(aviso)
  let relogio = 0
  let inicioY = 0
  const comecou = (e: TouchEvent) => {
    inicioY = e.touches[0]?.clientY ?? 0
  }
  const moveu = (e: TouchEvent) => {
    // só quando a pessoa arrasta mesmo com um dedo (um toque parado não avisa)
    if (e.touches.length !== 1 || Math.abs((e.touches[0]?.clientY ?? 0) - inicioY) < 8) return
    aviso.classList.add('mapa-aviso--visivel')
    window.clearTimeout(relogio)
    relogio = window.setTimeout(() => aviso.classList.remove('mapa-aviso--visivel'), 1400)
  }
  el.addEventListener('touchstart', comecou, { passive: true })
  el.addEventListener('touchmove', moveu, { passive: true })
  return () => {
    window.clearTimeout(relogio)
    el.removeEventListener('touchstart', comecou)
    el.removeEventListener('touchmove', moveu)
    aviso.remove()
  }
}

/** monta o mapa no elemento e devolve a função que desmonta */
export function montarMapa(el: HTMLElement, { latitude, longitude, nome }: Local) {
  const celular = toque()
  const map = L.map(el, {
    center: [latitude, longitude],
    zoom: 15,
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: false,
    // no toque, arrastar com um dedo é rolar a página; o movimento de pinça
    // (dois dedos) aproxima e também move o mapa
    dragging: !celular,
    touchZoom: true,
  })
  const desligarAviso = celular ? avisoDoisDedos(el) : () => undefined

  // fundo escuro com reserva: CARTO → OpenFreeMap → OSM (ver lib/mapa.ts)
  const desligarFundo = fundoEscuro(map)

  // alfinete dourado em gota (a ponta é o local exato), halo pulsando e nome
  const icon = L.divIcon({
    className: 'boss-marker',
    html:
      '<span class="boss-ping"></span>' +
      '<svg class="boss-pin" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 22 12 22s12-13.5 12-22C24 5.37 18.63 0 12 0z" fill="#c4a882"/>' +
      '<circle cx="12" cy="12" r="4.5" fill="#0c0c0c"/></svg>' +
      `<span class="boss-label">${html(nome)}</span>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  })
  L.marker([latitude, longitude], { icon }).addTo(map)
  L.control.zoom({ position: 'topright' }).addTo(map)

  // entrada: voa até o ponto na primeira vez que a seção aparece
  // (respeita prefers-reduced-motion)
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let voou = false
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !voou) {
        voou = true
        if (reduzir) map.setView([latitude, longitude], 16.5)
        else map.flyTo([latitude, longitude], 16.5, { duration: 1.8, easeLinearity: 0.2 })
      }
    },
    { threshold: 0.2 },
  )
  io.observe(el)

  return () => {
    io.disconnect()
    desligarAviso()
    desligarFundo()
    map.remove()
  }
}
