import { cookieApagado, encerrarSessao, sessaoDoPedido } from '../../_lib/auth'
import { json, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * POST /api/auth/logout
 * Apaga o cookie e encerra a sessão no servidor: mesmo que alguém tenha
 * copiado o token antes, ele deixa de valer agora. As outras sessões da
 * pessoa (outro aparelho) continuam.
 */
export const onRequestPost: Funcao = ({ request, env }) =>
  tratar(async () => {
    const s = await sessaoDoPedido(env, request)
    if (s) await encerrarSessao(env, s.sid).run()
    return json({ ok: true }, 200, { 'Set-Cookie': cookieApagado(request) })
  })
