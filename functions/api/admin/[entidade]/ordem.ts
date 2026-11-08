import { registrar } from '../../../_lib/auditoria'
import { entidade } from '../../../_lib/entidades'
import { ErroHttp, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * PUT /api/admin/:entidade/ordem  { ids: [3, 1, 2] }
 * Grava a nova ordem de uma vez só, numa transação.
 *
 * A lista precisa ter exatamente os itens que existem: se alguém criou ou
 * apagou um item enquanto a outra pessoa arrastava, a ordem é recusada em
 * vez de deixar dois itens com a mesma posição.
 */
export const onRequestPut: Funcao<'entidade'> = ({ params, env, request, data }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const { ids } = await lerJson<{ ids?: unknown }>(request)
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => Number.isInteger(id) && id > 0)) {
      throw new ErroHttp('Ordem inválida.')
    }
    if (new Set(ids).size !== ids.length) throw new ErroHttp('Ordem com itens repetidos.')

    const { results } = await env.DB.prepare(`SELECT id FROM ${e.tabela}`).all<{ id: number }>()
    const existentes = new Set(results.map((r) => r.id))
    if (existentes.size !== ids.length || !ids.every((id: number) => existentes.has(id))) {
      throw new ErroHttp('A lista mudou enquanto você organizava. Recarregue a página e tente de novo.', 409)
    }

    await env.DB.batch(ids.map((id, i) => env.DB.prepare(`UPDATE ${e.tabela} SET ordem = ? WHERE id = ?`).bind(i, id)))
    await registrar(env, data.usuario, 'reordenou', e.tabela)
    return json({ ok: true })
  })
