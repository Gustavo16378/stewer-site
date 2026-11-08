/**
 * Contatos e mapa do site (tabela `configuracoes`): o que o Stewer troca na
 * aba "Contatos e mapa". Cada chave tem a sua regra; a validação mora aqui
 * para ser testada sem subir servidor.
 */
import { ehLinkCurto, noBrasil, pontoDoTexto } from '../../src/lib/coordenadas'
import { ErroHttp } from './http'

export type Config = {
  whatsapp: string
  instagram: string
  mensagem: string
  latitude: string
  longitude: string
}

export const CHAVES_CONFIG = ['whatsapp', 'instagram', 'mensagem', 'latitude', 'longitude'] as const

export const ROTULOS_CONFIG: Record<keyof Config, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  mensagem: 'Mensagem do WhatsApp',
  latitude: 'Local no mapa',
  longitude: 'Local no mapa',
}

/** "(63) 98511-6783", "63985116783" ou "+55 63 98511-6783" → "5563985116783" */
export function normalizarWhatsapp(bruto: unknown) {
  let n = String(bruto ?? '').replace(/\D/g, '')
  if (n.length === 10 || n.length === 11) n = `55${n}` // sem o 55, coloca
  if (n.length < 12 || n.length > 13) throw new ErroHttp('WhatsApp precisa ter DDD e número, por exemplo (63) 99999-9999.')
  return n
}

/** "@stewer.gabriel", "instagram.com/stewer.gabriel/" ou "stewer.gabriel" → "stewer.gabriel" */
export function normalizarInstagram(bruto: unknown) {
  let s = String(bruto ?? '').trim()
  // link do perfil: fica só o primeiro pedaço do caminho ("/stewer.gabriel/?igsh=…")
  const link = /^https?:\/\/(www\.)?instagram\.com\/([^/?#]+)\/?([?#].*)?$/i.exec(s)
  if (link) s = link[2]
  s = s.replace(/^@/, '')
  // regra do próprio Instagram: letras, números, ponto e sublinhado, até 30
  if (!/^[A-Za-z0-9._]{1,30}$/.test(s)) throw new ErroHttp('Confira o Instagram: só o nome de usuário, como @stewer.gabriel.')
  return s
}

export function normalizarMensagem(bruto: unknown) {
  const s = String(bruto ?? '').replace(/\s+/g, ' ').trim()
  if (s.length < 3 || s.length > 200) throw new ErroHttp('A mensagem do WhatsApp precisa ter de 3 a 200 caracteres.')
  return s
}

/**
 * O ponto do mapa, do jeito que o Stewer colar: as coordenadas que o Google
 * Maps mostra ("-10.18256, -48.32910", também com vírgula decimal) ou um
 * link do Google Maps que já traga o ponto. Link curto (maps.app.goo.gl)
 * passa antes por /api/admin/link-mapa. Confere que o ponto é no Brasil,
 * para um número trocado não jogar o mapa no meio do oceano.
 */
export function lerCoordenadas(bruto: unknown) {
  const texto = String(bruto ?? '').trim()
  const ponto = pontoDoTexto(texto)
  if (!ponto) {
    throw new ErroHttp(
      ehLinkCurto(texto)
        ? 'Esse link curto precisa ser aberto antes. Cole ele no campo do painel, que ele acha o ponto sozinho.'
        : 'Cole as coordenadas como o Google Maps mostra (por exemplo: -10.18256, -48.32910) ou o link do lugar.',
    )
  }
  if (!noBrasil(ponto)) throw new ErroHttp('Essas coordenadas ficam fora do Brasil. Confira se copiou o ponto certo.')
  return { latitude: String(ponto.latitude), longitude: String(ponto.longitude) }
}
