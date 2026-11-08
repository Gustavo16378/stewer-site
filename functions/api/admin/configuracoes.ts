import { registrar } from '../../_lib/auditoria'
import { lerCoordenadas, normalizarInstagram, normalizarMensagem, normalizarWhatsapp } from '../../_lib/config'
import { ErroHttp, json, lerJson, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * GET /api/admin/configuracoes
 * PUT /api/admin/configuracoes  { whatsapp?, instagram?, mensagem?, coordenadas? }
 *
 * Só grava o que veio no pedido. Tudo junto ou nada (batch), para o mapa
 * nunca ficar com a latitude nova e a longitude velha.
 */
export const onRequestGet: Funcao = ({ env }) =>
  tratar(async () => {
    const { results } = await env.DB.prepare('SELECT chave, valor FROM configuracoes').all<{ chave: string; valor: string }>()
    return json({ config: Object.fromEntries(results.map((c) => [c.chave, c.valor])) })
  })

export const onRequestPut: Funcao = ({ env, request, data }) =>
  tratar(async () => {
    const d = await lerJson<Record<string, unknown>>(request, 2048)
    const valores: Record<string, string> = {}
    const mudou: string[] = []

    if ('whatsapp' in d) {
      valores.whatsapp = normalizarWhatsapp(d.whatsapp)
      mudou.push('WhatsApp')
    }
    if ('instagram' in d) {
      valores.instagram = normalizarInstagram(d.instagram)
      mudou.push('Instagram')
    }
    if ('mensagem' in d) {
      valores.mensagem = normalizarMensagem(d.mensagem)
      mudou.push('Mensagem do WhatsApp')
    }
    if ('coordenadas' in d) {
      Object.assign(valores, lerCoordenadas(d.coordenadas))
      mudou.push('Local no mapa')
    }
    if (!mudou.length) throw new ErroHttp('Nada para salvar.')

    await env.DB.batch(
      Object.entries(valores).map(([chave, valor]) =>
        env.DB.prepare(
          'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
        ).bind(chave, valor),
      ),
    )
    await registrar(env, data.usuario, 'editou', 'configuracoes', 'Contatos e mapa', mudou.join(', '))
    return json({ ok: true, config: valores })
  })
