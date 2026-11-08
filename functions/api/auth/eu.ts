import { sessaoDoPedido } from '../../_lib/auth'
import { erro, json, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/** GET /api/auth/eu — quem está logado, ou 401. O painel usa ao abrir. */
export const onRequestGet: Funcao = ({ request, env }) =>
  tratar(async () => {
    const u = await sessaoDoPedido(env, request)
    if (!u) return erro('Sessão expirada. Entre de novo.', 401)
    return json({ usuario: { id: u.id, nome: u.nome, email: u.email, trocarSenha: u.trocar_senha === 1 } })
  })
