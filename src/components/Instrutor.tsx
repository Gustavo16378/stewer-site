import { AULAS, ENSINO, TOPICOS, VIDEOS_AULAS } from '../content/site'
import { MediaGallery, juntarMidias } from './gallery'
import Linhas from './Linhas'

export default function Instrutor() {
  const items = juntarMidias(AULAS, VIDEOS_AULAS)

  return (
    <section id="instrutor" className="py-24 sm:py-32 lg:py-44 px-6 sm:px-8 lg:px-12 bg-charcoal">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-28 lg:items-end mb-14 sm:mb-20">
          <div>
            <p className="text-sand text-[10px] tracking-ultra uppercase fade-up">{ENSINO.rotulo}</p>
            <h2 className="mt-4 font-serif text-[clamp(2.25rem,7vw,3.75rem)] text-cream leading-[1.1] fade-up fade-up-d1">
              <Linhas linhas={ENSINO.titulo} quebraClasse="hidden sm:block" />
            </h2>
            <div className="mt-6 w-10 h-px bg-gold fade-up fade-up-d2" />
          </div>
          <p className="text-ivory text-[15px] leading-relaxed fade-up fade-up-d2">
            {ENSINO.intro}
          </p>
        </div>

        {/* O que se aprende — sem numeração, acento dourado à esquerda */}
        {TOPICOS.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-9 mb-16 sm:mb-20">
          {TOPICOS.map((t, i) => (
            <div
              key={i}
              className="border-l border-gold/40 pl-5 fade-up"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <h3 className="font-serif text-lg text-cream">{t.titulo}</h3>
              <p className="mt-2 text-ivory text-sm leading-relaxed">{t.texto}</p>
            </div>
          ))}
        </div>
        )}

        {/* Galeria */}
        {items.length > 0 && (
          <div className="mb-14 sm:mb-16 fade-up">
            <p className="text-sand text-[10px] tracking-ultra uppercase mb-6 sm:mb-8">{ENSINO.galeria}</p>
            <MediaGallery items={items} layout="grid" />
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 fade-up">
          <a
            href="#contato"
            className="self-start text-[11px] tracking-ultra uppercase text-gold border border-gold/60 px-10 py-4 hover:bg-gold hover:text-carbon transition-all duration-300"
          >
            {ENSINO.cta}
          </a>
          <p className="text-sand text-xs tracking-[0.08em] max-w-xs leading-relaxed">
            {ENSINO.nota}
          </p>
        </div>

      </div>
    </section>
  )
}
