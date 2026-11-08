import { useEffect, useRef } from 'react'
import {
  LOCAL,
  ONDE,
  grausMinutos,
  linkMapa,
  linkRota,
  linkTelefone,
  telefoneFormatado,
} from '../content/site'
import Linhas from './Linhas'

/** o mapa começa a baixar quando a seção está a esta distância da tela */
const ANTECEDENCIA = '600px'

export default function Location() {
  const mapEl = useRef<HTMLDivElement>(null)
  // o local e o nome vêm do painel (aba "Contatos e mapa" e "Textos do site")
  const LAT = LOCAL.latitude
  const LNG = LOCAL.longitude
  const nome = LOCAL.nome.join(' ')
  const COORDS = `${grausMinutos(LAT, 'lat')} · ${grausMinutos(LNG, 'lng')}`

  useEffect(() => {
    const el = mapEl.current
    if (!el) return

    // o Leaflet só vem quando a pessoa chega perto do mapa (ver lib/mapa-site.ts)
    let desmontar: (() => void) | undefined
    let vivo = true
    const perto = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        perto.disconnect()
        void import('../lib/mapa-site').then(({ montarMapa }) => {
          if (vivo) desmontar = montarMapa(el, { latitude: LAT, longitude: LNG, nome })
        })
      },
      { rootMargin: ANTECEDENCIA },
    )
    perto.observe(el)

    return () => {
      vivo = false
      perto.disconnect()
      desmontar?.()
    }
  }, [LAT, LNG, nome])

  return (
    <section id="onde-atende" className="relative bg-carbon">
      {/* Section label — top left over the map */}
      <div className="absolute top-8 left-6 lg:left-12 z-[20] flex items-center gap-4">
        <span className="w-8 h-px bg-gold" />
        <p className="text-sand text-[10px] tracking-ultra uppercase">{ONDE.rotulo}</p>
      </div>

      {/* Coordinates — top right */}
      <p className="absolute top-8 right-20 lg:right-24 z-[20] hidden sm:block text-sand text-[10px] tracking-[0.2em] uppercase">
        {COORDS}
      </p>

      {/* Map — relative z-0 creates a stacking context so Leaflet's internal
          panes/controls stay below the overlay card (which sits at z-20). */}
      <div
        ref={mapEl}
        className="relative z-0 h-[58vh] min-h-[440px] sm:h-[82vh] sm:min-h-[600px] w-full"
        aria-label={`Mapa — ${nome}`}
      />

      {/* Info card — flows BELOW the map on mobile (never covers the pin),
          overlays bottom-left from sm up. */}
      <div className="relative m-4 sm:m-0 sm:absolute sm:bottom-12 sm:left-12 sm:right-auto z-[20] w-auto sm:w-[26rem] border border-wire/40 bg-carbon sm:bg-carbon/90 sm:backdrop-blur-md p-8 sm:p-10">
        <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.08] text-cream">
          <Linhas linhas={LOCAL.nome} />
        </h2>

        <p className="mt-4 text-ivory text-[13px] leading-relaxed">
          <Linhas linhas={LOCAL.endereco} />
        </p>

        <div className="my-6 w-full h-px bg-wire/40" />

        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-sand text-[10px] tracking-ultra uppercase">Horário</p>
            <p className="mt-2 text-cream text-[13px] leading-snug"><Linhas linhas={LOCAL.horario} /></p>
          </div>
          <div>
            <p className="text-sand text-[10px] tracking-ultra uppercase">Atendimento</p>
            <p className="mt-2 text-cream text-[13px] leading-snug"><Linhas linhas={LOCAL.atendimento} /></p>
          </div>
        </div>

        <div className="my-6 w-full h-px bg-wire/40" />

        <a
          href={linkTelefone()}
          className="inline-block py-1 -my-1 text-cream text-[15px] tracking-wide hover:text-gold transition-colors"
        >
          {telefoneFormatado()}
        </a>

        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <a
            href={linkRota()}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 text-carbon text-[10px] tracking-ultra uppercase bg-gold px-6 py-3.5 hover:bg-cream transition-colors duration-300"
          >
            {ONDE.rota} <span className="text-xs">↗</span>
          </a>
          <a
            href={linkMapa()}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center text-gold text-[10px] tracking-ultra uppercase border border-gold/60 px-6 py-3.5 hover:bg-gold hover:text-carbon transition-all duration-300"
          >
            {ONDE.mapa}
          </a>
        </div>
      </div>
    </section>
  )
}
