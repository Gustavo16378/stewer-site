import { SERVICOS, SERVICOS_SECAO } from '../content/site'

export default function Services() {
  // seção sem nenhum serviço visível sai da página
  if (SERVICOS.length === 0) return null

  return (
    <section id="servicos" className="py-32 lg:py-44 px-8 lg:px-12 bg-charcoal">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-20 fade-up">
          <p className="text-sand text-[10px] tracking-ultra uppercase">{SERVICOS_SECAO.rotulo}</p>
          <h2 data-revelar="linhas" className="mt-4 font-serif text-[clamp(2.5rem,5vw,3.5rem)] text-cream">{SERVICOS_SECAO.titulo}</h2>
          <div className="mt-5 w-10 h-px bg-gold" />
        </div>

        {/* Cards grid */}
        <div className={`grid grid-cols-1 ${SERVICOS.length === 2 ? 'md:grid-cols-2' : SERVICOS.length === 1 ? '' : 'md:grid-cols-3'} divide-y md:divide-y-0 md:divide-x divide-wire/30 border border-wire/30`}>
          {SERVICOS.map((s, i) => (
            <div
              key={i}
              className={`p-10 lg:p-14 flex flex-col fade-up`}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <span className="font-serif text-5xl text-gold/30 leading-none select-none">
                {String(i + 1).padStart(2, '0')}
              </span>

              <h3 className="mt-6 font-serif text-2xl text-cream">{s.titulo}</h3>

              <div className="mt-4 w-7 h-px bg-wire" />

              <p className="mt-6 text-ivory text-sm leading-relaxed flex-1">{s.texto}</p>

              <a
                href="#contato"
                className="mt-10 inline-flex items-center gap-3 text-sand text-[10px] tracking-ultra uppercase hover:text-cream transition-colors duration-300 group w-fit"
              >
                {SERVICOS_SECAO.botao}
                <span className="block w-5 h-px bg-sand group-hover:bg-cream group-hover:w-8 transition-all duration-300" />
              </a>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-16 text-center text-sand text-xs tracking-[0.1em] fade-up">
          {SERVICOS_SECAO.nota}
        </p>
      </div>
    </section>
  )
}
