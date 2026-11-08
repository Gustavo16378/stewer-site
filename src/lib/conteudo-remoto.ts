/**
 * Conteúdo editável vindo da API (o painel em /admin grava no banco).
 *
 * Como funciona:
 * 1. main.tsx chama `carregarConteudo()` antes do primeiro render.
 * 2. Se a API responde a tempo, as listas e os objetos de src/content/site.ts
 *    são trocados no lugar.
 * 3. Se a API demora, cai ou devolve algo estranho, nada muda: o site sobe
 *    com o conteúdo do código. O site nunca fica em branco por causa do
 *    backend.
 *
 * Trocar antes do render, e não depois com estado, é de propósito: o mapa e
 * as animações de entrada leem o conteúdo uma vez, na montagem.
 */
import {
  AULAS,
  CONTATO,
  CORTES,
  ETAPAS,
  LOCAL,
  NUMEROS,
  SERVICOS,
  SLIDES,
  TOPICOS,
  type Bloco,
  type Foto,
  type Numero,
} from '../content/site'
import { aplicarTextos } from './textos'

export type Remoto = {
  slides: Foto[]
  numeros: Numero[]
  servicos: Bloco[]
  etapas: Bloco[]
  topicos: Bloco[]
  aulas: Foto[]
  cortes: Foto[]
  config: Record<string, string>
  /** textos e fotos fixos trocados no painel (ver lib/textos.ts) */
  textos?: Record<string, unknown>
}

export const TEMPO_MAXIMO = 2500

/** troca o conteúdo de um array sem trocar a referência que os componentes importaram */
function trocar<T>(lista: T[], novos: T[]) {
  lista.splice(0, lista.length, ...novos)
}

const ehLista = (v: unknown) => Array.isArray(v)

export function valido(d: unknown): d is Remoto {
  if (!d || typeof d !== 'object') return false
  const r = d as Remoto
  return (
    ['slides', 'numeros', 'servicos', 'etapas', 'topicos', 'aulas', 'cortes'].every((k) => ehLista((r as never)[k])) &&
    !!r.config &&
    typeof r.config === 'object'
  )
}

const fotoValida = (f: unknown): f is Foto =>
  !!f && typeof f === 'object' && typeof (f as Foto).src === 'string' && (f as Foto).src.length > 0

export function aplicar(r: Remoto) {
  // a abertura precisa de pelo menos uma foto: lista vazia mantém a de reserva
  const slides = r.slides.filter(fotoValida)
  if (slides.length) trocar(SLIDES, slides)

  trocar(NUMEROS, r.numeros)
  trocar(SERVICOS, r.servicos)
  trocar(ETAPAS, r.etapas)
  trocar(TOPICOS, r.topicos)
  trocar(AULAS, r.aulas.filter(fotoValida))
  trocar(CORTES, r.cortes.filter(fotoValida))

  const c = r.config
  const whatsapp = c.whatsapp?.replace(/\D/g, '')
  if (whatsapp && whatsapp.length >= 12) CONTATO.whatsapp = whatsapp
  if (c.instagram) CONTATO.instagram = c.instagram
  if (c.mensagem) CONTATO.mensagem = c.mensagem
  const lat = Number(c.latitude)
  const lng = Number(c.longitude)
  if (c.latitude && c.longitude && Number.isFinite(lat) && Number.isFinite(lng)) {
    LOCAL.latitude = lat
    LOCAL.longitude = lng
  }

  if (r.textos && typeof r.textos === 'object') aplicarTextos(r.textos)
}

export async function carregarConteudo() {
  const controle = new AbortController()
  const relogio = setTimeout(() => controle.abort(), TEMPO_MAXIMO)

  try {
    const resposta = await fetch('/api/conteudo', { signal: controle.signal })
    if (!resposta.ok) return false
    const dados: unknown = await resposta.json()
    if (!valido(dados)) return false
    aplicar(dados)
    return true
  } catch {
    // sem API (vite dev puro, rede ruim, backend fora): segue com o conteúdo do código
    return false
  } finally {
    clearTimeout(relogio)
  }
}
