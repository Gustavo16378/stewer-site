import { ehLink, noBrasil, pontoDoTexto, type Ponto } from '../../../src/lib/coordenadas'
import { ErroHttp, json, lerJson, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * POST /api/admin/link-mapa  { url }  →  { latitude, longitude }
 *
 * O link que o Google Maps dá em "Compartilhar" é curto (maps.app.goo.gl)
 * e não traz o ponto: ele só redireciona para o link longo, que traz. O
 * navegador do painel não consegue seguir esse redirecionamento (o Google
 * não libera CORS), então a API segue por ele.
 *
 * Segurança: só segue endereços https do próprio Google, no máximo 6
 * saltos e 5 segundos cada, e nunca devolve o conteúdo da página, só o
 * ponto. Assim a rota não serve para a API buscar qualquer coisa na
 * internet a pedido de quem está no painel.
 */
const HOSTS = /^(?:maps\.app\.goo\.gl|goo\.gl|(?:www\.|maps\.)?google\.com(?:\.br)?|consent\.google\.com)$/i
const SALTOS = 6
const TEMPO = 5000
/** só o começo da página: o ponto, quando vem no HTML, está no <head> */
const LIMITE_HTML = 300_000

const NAO_ACHOU =
  'Esse link não trouxe o ponto exato. Abra o link no navegador, espere o mapa carregar e copie o endereço da barra; ou arraste o alfinete no mapa abaixo.'

function conferir(url: string) {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    throw new ErroHttp('Isso não parece um link.')
  }
  if (u.protocol !== 'https:' || !HOSTS.test(u.hostname) || u.username || u.password || u.port) {
    throw new ErroHttp('Cole um link do Google Maps (maps.app.goo.gl ou google.com/maps).')
  }
  return u
}

const decodificar = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

async function lerInicio(r: Response) {
  if (!r.body) return ''
  const leitor = r.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0
  while (total < LIMITE_HTML) {
    const { done, value } = await leitor.read()
    if (done) break
    partes.push(value)
    total += value.byteLength
  }
  await leitor.cancel().catch(() => {})
  return new TextDecoder().decode(await new Blob(partes).arrayBuffer())
}

export async function resolverLink(inicial: string, buscar: typeof fetch = fetch): Promise<Ponto> {
  let url = inicial.trim()
  for (let salto = 0; salto <= SALTOS; salto++) {
    const ponto = pontoDoTexto(decodificar(url))
    if (ponto) return ponto

    const u = conferir(url)
    // tela de consentimento de cookies: o destino vem no parâmetro continue
    const continuar = u.hostname.startsWith('consent.') ? u.searchParams.get('continue') : null
    if (continuar) {
      url = continuar
      continue
    }
    if (salto === SALTOS) break

    const r = await buscar(u.href, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TEMPO),
      headers: { 'user-agent': 'Mozilla/5.0 (stewergabriel.com; painel)', 'accept-language': 'pt-BR' },
    })
    const destino = r.headers.get('location')
    if (r.status >= 300 && r.status < 400 && destino) {
      url = new URL(destino, u).href
      continue
    }
    if (r.ok) {
      // sem redirecionamento: às vezes o ponto vem dentro da página
      const ponto = pontoDoTexto(await lerInicio(r))
      if (ponto) return ponto
    }
    break
  }
  throw new ErroHttp(NAO_ACHOU)
}

export const onRequestPost: Funcao = ({ request }) =>
  tratar(async () => {
    const { url } = await lerJson<{ url?: unknown }>(request, 2048)
    if (typeof url !== 'string' || !ehLink(url)) throw new ErroHttp('Cole um link do Google Maps.')
    let ponto: Ponto
    try {
      ponto = await resolverLink(url)
    } catch (e) {
      if (e instanceof ErroHttp) throw e
      // tempo esgotado, Google fora do ar
      throw new ErroHttp('Não consegui abrir esse link agora. Tente de novo ou arraste o alfinete no mapa.', 502)
    }
    if (!noBrasil(ponto)) throw new ErroHttp('Esse lugar fica fora do Brasil. Confira se copiou o link certo.')
    return json(ponto)
  })
