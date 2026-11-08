import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { carregarConteudo } from './lib/conteudo-remoto'

/*
 * O conteúdo editável chega da API antes do primeiro render (no máximo
 * 2,5 s). Sem resposta, o site sobe com o conteúdo do código.
 * Ver lib/conteudo-remoto.ts.
 */
carregarConteudo().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  irParaAncora()
})

/**
 * Link com âncora (stewergabriel.com/#onde-atende): quando o navegador
 * procurou a seção, ela ainda não existia, porque a página monta depois da
 * API. Depois do primeiro render, vai até ela.
 */
function irParaAncora(tentativas = 30) {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id) return
  // o React monta no próximo ciclo, não na hora do render(): espera a seção
  const alvo = document.getElementById(id)
  if (alvo) alvo.scrollIntoView()
  else if (tentativas > 0) requestAnimationFrame(() => irParaAncora(tentativas - 1))
}
