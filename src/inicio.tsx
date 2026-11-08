import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

/** monta o site (o React chega aqui, separado da entrada; ver main.tsx) */
export function montar() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
