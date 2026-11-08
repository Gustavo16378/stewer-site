/**
 * Acha o ponto do mapa no que o Stewer colar: as coordenadas que o Google
 * Maps mostra ou um link do Google Maps. Usado pelo painel (prévia na hora)
 * e pela API (validação de verdade), por isso não depende de navegador.
 *
 * Link curto (maps.app.goo.gl) não traz o ponto no texto: quem abre é a API
 * (functions/api/admin/link-mapa.ts), seguindo o redirecionamento do Google.
 */

export type Ponto = { latitude: number; longitude: number }

const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`

/**
 * Formatos, do mais preciso para o menos. A ordem importa: num link de
 * lugar, `!3d…!4d…` é o alfinete e `@…` é só o centro da tela.
 */
const PADROES: RegExp[] = [
  // alfinete do lugar, dentro do data= dos links /maps/place/…
  new RegExp(String.raw`!3d${NUM}!4d${NUM}`),
  // ?q=, ?query=, ?ll=, ?destination=, ?center= (vírgula crua ou %2C)
  new RegExp(String.raw`[?&](?:q|query|ll|sll|destination|daddr|center)=${NUM}(?:,|%2C)\+?${NUM}`, 'i'),
  // /maps/search/-10.18,+-48.32 e /maps/dir//-10.18,-48.32
  new RegExp(String.raw`/maps/(?:search|dir|place)/(?:[^/]*/)*?${NUM}(?:,|%2C)(?:\+|%20)?${NUM}`, 'i'),
  // centro do mapa: /@-10.18,-48.32,17z
  new RegExp(String.raw`@${NUM},${NUM}(?:,|$)`),
]

/** "-10.18256, -48.32910", "-10,18256; -48,32910" ou "-15.78 -47.93" */
const SOLTAS = /^\s*(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/

const valido = (p: Ponto) =>
  Number.isFinite(p.latitude) &&
  Number.isFinite(p.longitude) &&
  Math.abs(p.latitude) <= 90 &&
  Math.abs(p.longitude) <= 180

/** o ponto que está no texto, ou null se não achar nenhum */
export function pontoDoTexto(texto: string): Ponto | null {
  const t = String(texto ?? '').trim()
  if (!t) return null

  const soltas = SOLTAS.exec(t)
  if (soltas) {
    const p = { latitude: Number(soltas[1].replace(',', '.')), longitude: Number(soltas[2].replace(',', '.')) }
    return valido(p) ? p : null
  }

  for (const padrao of PADROES) {
    const m = padrao.exec(t)
    if (!m) continue
    const p = { latitude: Number(m[1]), longitude: Number(m[2]) }
    if (valido(p)) return p
  }
  return null
}

/** maps.app.goo.gl/… e goo.gl/maps/…: precisam ser abertos para achar o ponto */
export const ehLinkCurto = (texto: string) =>
  /^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\/\S+$/i.test(String(texto ?? '').trim())

/** parece um link (de qualquer lugar)? */
export const ehLink = (texto: string) => /^https?:\/\//i.test(String(texto ?? '').trim())

/** o Brasil, com folga: barra coordenada trocada ou com o sinal errado */
export const noBrasil = (p: Ponto) => p.latitude >= -34 && p.latitude <= 6 && p.longitude >= -74 && p.longitude <= -28

/** 6 casas decimais = uns 10 cm: mais que isso é ruído */
export const arredondar = (p: Ponto): Ponto => ({
  latitude: Math.round(p.latitude * 1e6) / 1e6,
  longitude: Math.round(p.longitude * 1e6) / 1e6,
})

export const textoDoPonto = (p: Ponto) => `${p.latitude}, ${p.longitude}`
