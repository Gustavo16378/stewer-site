import { CONTATO, LOCAL, RODAPE, linkInstagram, linkTelefone, linkWhatsapp, telefoneFormatado } from '../content/site'
import Linhas from './Linhas'

const nav = [
  { label: 'Quem é',      href: '#sobre' },
  { label: 'Serviços',    href: '#servicos' },
  { label: 'Consultoria', href: '#consultoria' },
  { label: 'Instrutor',   href: '#instrutor' },
  { label: 'Portfólio',   href: '#portfolio' },
  { label: 'Contato',     href: '#contato' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  const WPP = linkWhatsapp()
  const INSTA = linkInstagram()

  return (
    <footer className="bg-charcoal border-t border-wire/15">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20 lg:py-24">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="#" aria-label="Stewer Gabriel" className="group inline-flex items-center gap-2">
              <img src="./photos/logo1.png" alt="" className="h-14 w-auto object-contain" />
              <span className="font-serif text-cream text-lg tracking-wide group-hover:text-gold transition-colors">
                Stewer Gabriel
              </span>
            </a>
            <p className="mt-6 text-sand text-[13px] leading-relaxed max-w-xs">
              {RODAPE.frase}
            </p>
            <div className="mt-7 flex items-center gap-4">
              <a
                href={INSTA}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 flex items-center justify-center border border-wire/40 text-sand hover:text-carbon hover:bg-gold hover:border-gold transition-all duration-300"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </a>
              <a
                href={WPP}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 flex items-center justify-center border border-wire/40 text-sand hover:text-carbon hover:bg-gold hover:border-gold transition-all duration-300"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                  <path d="M9 10a0.5 .5 0 0 0 1 0v-1a0.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a0.5 .5 0 0 0 0 -1h-1a0.5 .5 0 0 0 0 1" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <p className="text-sand text-[10px] tracking-ultra uppercase">Navegação</p>
            <ul className="mt-6 space-y-3.5">
              {nav.map(l => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-ivory text-[14px] hover:text-gold transition-colors duration-300"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <p className="text-sand text-[10px] tracking-ultra uppercase">Contato</p>
            <ul className="mt-6 space-y-3.5">
              <li>
                <a href={linkTelefone()} className="text-ivory text-[14px] hover:text-gold transition-colors duration-300">
                  {telefoneFormatado()}
                </a>
              </li>
              <li>
                <a href={WPP} target="_blank" rel="noreferrer" className="text-ivory text-[14px] hover:text-gold transition-colors duration-300">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={INSTA} target="_blank" rel="noreferrer" className="text-ivory text-[14px] hover:text-gold transition-colors duration-300">
                  @{CONTATO.instagram}
                </a>
              </li>
              <li>
                <a href="#onde-atende" className="text-ivory text-[14px] hover:text-gold transition-colors duration-300">
                  Como chegar
                </a>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <p className="text-sand text-[10px] tracking-ultra uppercase">Atendimento</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-cream text-[14px] font-serif">{LOCAL.nome.join(' ')}</p>
                <p className="mt-1 text-sand text-[13px] leading-relaxed">
                  <Linhas linhas={LOCAL.endereco} />
                </p>
              </div>
              <div>
                <p className="text-cream text-[14px]">{LOCAL.horario.join(' · ')}</p>
                <p className="mt-1 text-sand text-[13px]">{LOCAL.atendimento.join(' ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-wire/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <p className="text-sand text-[10px] tracking-ultra uppercase">
              © {year} Stewer Gabriel — Todos os direitos reservados
            </p>
            <p className="text-sand text-[10px] tracking-ultra uppercase">
              Desenvolvido por{' '}
              <a
                href="https://gustavodev.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors duration-300"
              >
                Gustavo Dev
              </a>
            </p>
          </div>
          <a
            href="#"
            className="group inline-flex items-center gap-2 text-sand text-[10px] tracking-ultra uppercase hover:text-cream transition-colors"
          >
            Voltar ao topo
            <span className="inline-block group-hover:-translate-y-0.5 transition-transform">↑</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
