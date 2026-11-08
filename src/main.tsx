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
})
