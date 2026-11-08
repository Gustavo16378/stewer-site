import { sessaoDoPedido } from '../../_lib/auth'
import { erro, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * Porteiro de tudo em /api/admin.
 *
 * 1. Sem sessão válida (ou encerrada por "Sair" ou troca de senha), 401.
 * 2. Pedido que muda dados precisa vir do próprio site (Origin igual). O
 *    cookie já é SameSite=Strict; isto é a segunda tranca contra CSRF.
 */
export const onRequest: Funcao = (ctx) =>
  tratar(async () => {
    const { request, env, data } = ctx

    if (!['GET', 'HEAD'].includes(request.method)) {
      const origem = request.headers.get('Origin')
      if (origem && origem !== new URL(request.url).origin) return erro('Origem não permitida.', 403)
    }

    // token válido, sessão aberta no banco e pessoa ainda cadastrada (ver auth.ts)
    const u = await sessaoDoPedido(env, request)
    if (!u) return erro('Sessão expirada. Entre de novo.', 401)

    // senha temporária: até trocar, só a troca de senha é liberada
    const trocandoSenha = new URL(request.url).pathname === '/api/admin/senha'
    if (u.trocar_senha && !trocandoSenha) return erro('Crie uma senha nova antes de continuar.', 403)

    data.usuario = { id: u.id, nome: u.nome, email: u.email, sid: u.sid }
    return ctx.next()
  })
