import { startTransition, useEffect, useState } from 'react'
import Nav         from './components/Nav'
import Hero        from './components/Hero'
import About       from './components/About'
import Services    from './components/Services'
import Consultoria from './components/Consultoria'
import Instrutor   from './components/Instrutor'
import Portfolio   from './components/Portfolio'
import Location    from './components/Location'
import Contact     from './components/Contact'
import Footer      from './components/Footer'

export default function App() {
  /*
   * Desempenho (RNF18): a abertura (topo) monta na hora; o resto da página
   * monta logo depois, numa transição, que o React faz em fatias de poucos
   * milissegundos. Montar tudo de uma vez travava o processador por ~200 ms
   * num celular lento, justo enquanto a abertura de marca desenhava o S.
   */
  const [resto, setResto] = useState(false)
  useEffect(() => startTransition(() => setResto(true)), [])

  /* Fade-up on scroll — drives all .fade-up elements (de novo quando o resto monta) */
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px 12% 0px' },
    )

    document.querySelectorAll('.fade-up').forEach(el => io.observe(el))

    return () => io.disconnect()
  }, [resto])

  return (
    <div className="font-sans bg-carbon text-cream antialiased">
      <Nav />
      <Hero />
      {resto && (
        <>
          <About />
          <Services />
          <Consultoria />
          <Instrutor />
          <Portfolio />
          <Location />
          <Contact />
          <Footer />
        </>
      )}
    </div>
  )
}
