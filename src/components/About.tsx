import { Fragment } from 'react'
import { NUMEROS, SOBRE } from '../content/site'
import Linhas from './Linhas'

export default function About() {
  return (
    <section id="sobre" className="py-32 lg:py-44 px-8 lg:px-12 bg-carbon">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center">

          {/* Photo column */}
          <div className="relative fade-up">
            <img
              data-revelar="foto"
              src={SOBRE.foto.src}
              alt={SOBRE.foto.alt}
              width={SOBRE.foto.largura}
              height={SOBRE.foto.altura}
              className="aspect-[3/4] w-full object-cover object-top"
              style={{ objectPosition: SOBRE.foto.posicao ?? '50% 0%' }}
            />

            {/* Decorative frame offset */}
            <div className="absolute -bottom-5 -right-5 w-28 h-28 border border-gold/20 pointer-events-none" />
            <div className="absolute -top-5 -left-5 w-14 h-14 border border-wire/40 pointer-events-none" />

            {/* Caption tag */}
            <div className="absolute bottom-8 left-0 -translate-x-0 bg-carbon/90 backdrop-blur-sm px-5 py-3 border-l-2 border-gold">
              <p className="text-gold text-[10px] tracking-ultra uppercase">{SOBRE.legenda[0]}</p>
              {SOBRE.legenda[1] && <p className="text-cream text-xs mt-0.5">{SOBRE.legenda[1]}</p>}
            </div>
          </div>

          {/* Text column */}
          <div>
            <p className="text-sand text-[10px] tracking-ultra uppercase fade-up">{SOBRE.rotulo}</p>

            <h2 data-revelar="linhas" className="mt-4 font-serif text-[clamp(2.5rem,5vw,3.5rem)] text-cream leading-tight">
              <Linhas linhas={SOBRE.titulo} />
            </h2>

            <div className="mt-6 w-10 h-px bg-gold fade-up fade-up-d2" />

            <p className="mt-8 text-ivory leading-relaxed text-[15px] fade-up fade-up-d2">
              {SOBRE.paragrafo1}
            </p>

            <p className="mt-5 text-ivory leading-relaxed text-[15px] fade-up fade-up-d3">
              {SOBRE.paragrafo2}
            </p>

            <blockquote className="mt-10 border-l-2 border-gold pl-6 fade-up fade-up-d4">
              <p className="font-serif text-xl text-cream italic leading-relaxed">
                {SOBRE.citacao}
              </p>
            </blockquote>

            {NUMEROS.length > 0 && (
              <div className="mt-12 flex items-center gap-8 fade-up fade-up-d4">
                {NUMEROS.map((n, i) => (
                  <Fragment key={i}>
                    {i > 0 && <div className="w-px h-10 bg-wire" />}
                    <div>
                      <p className="font-serif text-3xl text-cream">
                        {/* conta até o valor ao aparecer (lib/movimento.ts); o leitor de tela lê o valor certo */}
                        <span aria-hidden="true" data-contar={n.valor}>{n.valor}</span>
                        <span className="sr-only">{n.valor}</span>
                      </p>
                      <p className="text-sand text-[10px] tracking-ultra uppercase mt-1">{n.legenda}</p>
                    </div>
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
