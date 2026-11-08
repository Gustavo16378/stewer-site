import { CORTES, PORTFOLIO, VIDEOS_PORTFOLIO, linkInstagram } from '../content/site'
import { MediaGallery, juntarMidias } from './gallery'

export default function Portfolio() {
  const items = juntarMidias(CORTES, VIDEOS_PORTFOLIO)

  return (
    <section id="portfolio" className="py-32 lg:py-44 px-8 lg:px-12 bg-carbon">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-6">
          <div className="fade-up">
            <p className="text-sand text-[10px] tracking-ultra uppercase">{PORTFOLIO.rotulo}</p>
            <h2 className="mt-4 font-serif text-[clamp(2.5rem,5vw,3.5rem)] text-cream">{PORTFOLIO.titulo}</h2>
            <div className="mt-5 w-10 h-px bg-gold" />
          </div>
          <a
            href={linkInstagram()}
            target="_blank"
            rel="noreferrer"
            className="text-sand text-[10px] tracking-ultra uppercase hover:text-cream transition-colors self-start sm:self-end border-b border-wire/50 pb-1 hover:border-cream fade-up"
          >
            {PORTFOLIO.link}
          </a>
        </div>

        {/* Gallery */}
        {items.length === 0 ? (
          <p className="text-wire text-sm text-center py-20 tracking-wide">
            {PORTFOLIO.vazio}
          </p>
        ) : (
          <MediaGallery items={items} layout="grid" grid="grid grid-cols-2 lg:grid-cols-3" />
        )}

        {/* CTA */}
        <div className="mt-16 text-center fade-up">
          <a
            href={linkInstagram()}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[11px] tracking-ultra uppercase text-gold border border-gold/50 px-10 py-4 hover:bg-gold hover:text-carbon transition-all duration-300"
          >
            {PORTFOLIO.cta}
          </a>
        </div>
      </div>
    </section>
  )
}
