import { useState, useEffect, useRef } from 'react'
import { LogoNaCaixa } from './Logo'

const links = [
  { label: 'Quem é',      href: '#sobre' },
  { label: 'Serviços',    href: '#servicos' },
  { label: 'Consultoria', href: '#consultoria' },
  { label: 'Instrutor',   href: '#instrutor' },
  { label: 'Portfólio',   href: '#portfolio' },
]

function useScrollDirection() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 80) { setHidden(false); lastY.current = y; return }
      setHidden(y > lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return hidden
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const hidden = useScrollDirection()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-[transform,background-color,backdrop-filter,border-color] duration-500 ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        } ${
          scrolled
            ? 'bg-carbon/95 backdrop-blur-md border-white/[0.06]'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-4 flex items-center justify-between">

          {/* Logo */}
          <a href="#" aria-label="Stewer Gabriel" className="group flex items-center gap-2">
            <LogoNaCaixa altura={64} />
            <span className="font-serif text-cream text-lg leading-tight tracking-wide group-hover:text-gold transition-colors duration-300">
              Stewer Gabriel
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-10">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="text-sand text-[11px] tracking-ultra uppercase hover:text-cream transition-colors duration-300"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contato"
              className="text-[11px] tracking-ultra uppercase text-gold border border-gold/50 px-5 py-2 hover:bg-gold hover:text-carbon transition-all duration-300"
            >
              Agende
            </a>
          </nav>

          {/* Hamburger — stays above drawer via z-[65] */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-1 relative z-[65]"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <span className={`block w-6 h-px bg-cream transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-6 h-px bg-cream transition-all duration-300 ${menuOpen ? 'opacity-0 w-0' : ''}`} />
            <span className={`block w-6 h-px bg-cream transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`md:hidden fixed inset-0 z-[55] bg-carbon/70 backdrop-blur-sm transition-opacity duration-500 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[68%] max-w-xs z-[60] bg-carbon border-l border-wire/20 shadow-2xl transition-transform duration-500 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-8 px-8 pt-28">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className="text-sand text-xs tracking-ultra uppercase hover:text-cream transition-colors duration-300"
            >
              {l.label}
            </a>
          ))}

          <div className="w-8 h-px bg-wire/40 mt-2" />

          <a
            href="#contato"
            onClick={close}
            className="text-gold text-xs tracking-ultra uppercase hover:text-cream transition-colors duration-300"
          >
            Agendar consultoria
          </a>
        </nav>
      </div>
    </>
  )
}
