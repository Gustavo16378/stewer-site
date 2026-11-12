import { AGENDA_URL, CONTATO_SECAO, linkInstagram, linkTelefone, linkWhatsapp, telefoneFormatado } from '../content/site'
import Linhas from './Linhas'

export default function Contact() {
  return (
    <section id="contato" className="py-32 lg:py-44 px-8 lg:px-12 bg-carbon">
      <div className="max-w-3xl mx-auto text-center">

        <p className="text-sand text-[10px] tracking-ultra uppercase fade-up">{CONTATO_SECAO.rotulo}</p>

        <h2 data-revelar="linhas" className="mt-4 font-serif text-[clamp(3rem,8vw,6rem)] text-cream leading-tight">
          <Linhas linhas={CONTATO_SECAO.titulo} />
        </h2>

        <div className="mt-6 w-10 h-px bg-gold mx-auto fade-up fade-up-d2" />

        <p className="mt-8 text-ivory text-lg leading-relaxed max-w-sm mx-auto font-light fade-up fade-up-d2">
          {CONTATO_SECAO.frase}
        </p>

        {/* CTA buttons */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 fade-up fade-up-d3">
          <a
            href={AGENDA_URL}
            className="w-full sm:w-auto px-12 py-4 bg-gold text-carbon text-[11px] tracking-ultra uppercase font-medium hover:bg-cream transition-colors duration-300 text-center"
          >
            Agendar horário
          </a>
          <a
            href={linkWhatsapp()}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-12 py-4 border border-wire/50 text-sand text-[11px] tracking-ultra uppercase hover:border-cream hover:text-cream transition-all duration-300 text-center"
          >
            WhatsApp
          </a>
          <a
            href={linkInstagram()}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-12 py-4 border border-wire/50 text-sand text-[11px] tracking-ultra uppercase hover:border-cream hover:text-cream transition-all duration-300 text-center"
          >
            Instagram
          </a>
        </div>

        {/* Phone */}
        <div className="mt-10 flex items-center justify-center gap-3 fade-up fade-up-d4">
          <span className="text-sand text-[10px] tracking-ultra uppercase">Telefone</span>
          <span className="w-4 h-px bg-wire" />
          <a
            href={linkTelefone()}
            className="inline-block py-2 -my-2 text-sand text-[10px] tracking-ultra uppercase hover:text-cream transition-colors"
          >
            {telefoneFormatado()}
          </a>
        </div>
      </div>
    </section>
  )
}
