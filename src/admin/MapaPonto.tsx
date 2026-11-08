/**
 * Minimapa do painel: mostra o ponto que vai para o site e deixa acertar
 * arrastando o alfinete ou tocando no lugar. Usa o mesmo fundo escuro do
 * site (lib/mapa.ts), com a mesma reserva quando a CARTO não responde.
 *
 * Carregado sob demanda (React.lazy): o Leaflet só chega ao painel quando
 * alguém abre "Contatos e mapa".
 */
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { arredondar, type Ponto } from '../lib/coordenadas'
import { fundoEscuro } from '../lib/mapa'

const ALFINETE = L.divIcon({
  className: 'alfinete',
  html:
    '<svg viewBox="0 0 24 34" width="30" height="42" aria-hidden="true">' +
    '<path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 22 12 22s12-13.5 12-22C24 5.37 18.63 0 12 0z" fill="#c4a882"/>' +
    '<circle cx="12" cy="12" r="4.5" fill="#0c0c0c"/></svg>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
})

type Props = { ponto: Ponto; aoMudar: (p: Ponto) => void }

export default function MapaPonto({ ponto, aoMudar }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const alfinete = useRef<L.Marker | null>(null)
  const aviso = useRef(aoMudar)
  aviso.current = aoMudar

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { center: [ponto.latitude, ponto.longitude], zoom: 17, attributionControl: false })
    const desligar = fundoEscuro(m)
    const marcador = L.marker([ponto.latitude, ponto.longitude], {
      icon: ALFINETE,
      draggable: true,
      keyboard: true,
      title: 'Ponto do site. Arraste para acertar.',
      alt: 'Ponto do site',
    }).addTo(m)

    const mover = (ll: L.LatLng) => aviso.current(arredondar({ latitude: ll.lat, longitude: ll.lng }))
    marcador.on('dragend', () => mover(marcador.getLatLng()))
    m.on('click', (e: L.LeafletMouseEvent) => {
      marcador.setLatLng(e.latlng)
      mover(e.latlng)
    })

    mapa.current = m
    alfinete.current = marcador
    return () => {
      desligar()
      m.remove()
    }
    // o mapa nasce uma vez; as mudanças de ponto entram pelo efeito abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ponto que veio de fora (link colado, desfazer): leva o mapa até ele
  useEffect(() => {
    const m = mapa.current
    const marcador = alfinete.current
    if (!m || !marcador) return
    const atual = marcador.getLatLng()
    if (Math.abs(atual.lat - ponto.latitude) < 1e-7 && Math.abs(atual.lng - ponto.longitude) < 1e-7) return
    marcador.setLatLng([ponto.latitude, ponto.longitude])
    m.setView([ponto.latitude, ponto.longitude], Math.max(m.getZoom(), 16))
  }, [ponto.latitude, ponto.longitude])

  return <div ref={el} className="mapa-ponto" role="application" aria-label="Mapa para acertar o ponto do site" />
}
