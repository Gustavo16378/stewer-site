import { useState, useEffect } from 'react'
import Linhas from './Linhas'
import { HERO, SLIDES, type Foto } from '../content/site'

// As fotos e os textos da abertura vêm do painel (aba "Fotos da abertura" e
// "Textos do site"); o que está em content/site.ts é a reserva.

function Slide({ foto, active }: { foto: Foto; active: boolean }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <img
        src={foto.src}
        alt=""
        className="w-full h-full object-cover object-top"
        style={{ objectPosition: foto.posicao ?? '50% 0%' }}
        draggable={false}
      />
    </div>
  )
}

export default function Hero() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (SLIDES.length < 2) return
    const id = setInterval(() => setActive(i => (i + 1) % SLIDES.length), 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative bg-carbon overflow-hidden md:min-h-screen">

      {/* ━━━ MOBILE: foto no topo (em fluxo) ━━━ */}
      <div className="md:hidden relative w-full" style={{ aspectRatio: '3/4' }}>
        {SLIDES.map((foto, i) => (
          <Slide key={foto.src} foto={foto} active={i === active} />
        ))}

        {/* Dissolve na base */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '55%',
            background:
              'linear-gradient(to top, #0c0c0c 0%, rgba(12,12,12,0.7) 40%, transparent 100%)',
          }}
        />

        {/* Dots */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 ${SLIDES.length < 2 ? 'hidden' : ''}`}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                i === active ? 'w-8 bg-gold' : 'w-2.5 bg-wire'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ━━━ DESKTOP: foto absoluta no lado direito, sem borda ━━━ */}
      <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[54%]">
        {SLIDES.map((foto, i) => (
          <Slide key={foto.src} foto={foto} active={i === active} />
        ))}

        {/* Dissolve esquerda — principal */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, #0c0c0c 0%, rgba(12,12,12,0.88) 18%, rgba(12,12,12,0.55) 35%, rgba(12,12,12,0.1) 55%, transparent 75%)',
          }}
        />
        {/* Dissolve topo */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: '35%',
            background:
              'linear-gradient(to bottom, #0c0c0c 0%, rgba(12,12,12,0.5) 40%, transparent 100%)',
          }}
        />
        {/* Dissolve base */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '35%',
            background:
              'linear-gradient(to top, #0c0c0c 0%, rgba(12,12,12,0.5) 40%, transparent 100%)',
          }}
        />
        {/* Dissolve borda direita (suave) */}
        <div
          className="absolute inset-y-0 right-0 w-24 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, rgba(12,12,12,0.35) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* ━━━ CONTEÚDO ━━━ */}
      <div className="relative z-10 md:min-h-screen flex flex-col max-w-7xl mx-auto w-full px-8 lg:px-12">

        {/* Espaço da nav — apenas desktop */}
        <div className="hidden md:block h-28 shrink-0" />

        {/* Texto */}
        <div className="flex-1 flex items-center py-10 md:py-0">
          <div className="max-w-xl">
            <p className="text-sand text-[10px] tracking-ultra uppercase mb-6 fade-up">
              {HERO.local}
            </p>

            <h1 className="font-serif text-[clamp(3.5rem,10vw,8rem)] leading-[0.88] text-cream tracking-tight fade-up fade-up-d1">
              <Linhas linhas={HERO.nome} />
            </h1>

            <div className="mt-8 flex items-center gap-4 fade-up fade-up-d2">
              <span className="w-10 h-px bg-gold" />
              <span className="text-gold text-[10px] tracking-ultra uppercase">
                {HERO.lema}
              </span>
            </div>

            <p className="mt-8 text-ivory text-lg leading-relaxed font-light italic max-w-sm fade-up fade-up-d3">
              {HERO.frase}
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-4 fade-up fade-up-d4">
              <a
                href="#contato"
                className="text-[11px] tracking-ultra uppercase text-gold border border-gold/60 px-8 py-3.5 hover:bg-gold hover:text-carbon transition-all duration-300"
              >
                {HERO.ctaPrimario}
              </a>
              <a
                href="#portfolio"
                className="text-[11px] tracking-ultra uppercase text-sand hover:text-cream transition-colors duration-300"
              >
                {HERO.ctaSecundario}
              </a>
            </div>
          </div>
        </div>

        {/* Desktop — rodapé: scroll + dots */}
        <div className="hidden md:flex pb-10 items-end justify-between">
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-14 bg-gradient-to-b from-transparent to-wire" />
            <span className="text-wire text-[10px] tracking-ultra uppercase">Scroll</span>
          </div>

          <div className={`flex gap-2 items-center ${SLIDES.length < 2 ? 'invisible' : ''}`}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-0.5 rounded-full transition-all duration-500 ${
                  i === active ? 'w-8 bg-gold' : 'w-2.5 bg-wire hover:bg-sand'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile — espaço base */}
        <div className="md:hidden pb-10" />
      </div>
    </section>
  )
}
