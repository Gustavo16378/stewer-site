import { registrar } from '../../../_lib/auditoria'
import { conferirFotos, entidade, lerRegistro, limpar, selecionar } from '../../../_lib/entidades'
import { json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * GET  /api/admin/:entidade   lista tudo, inclusive o que está oculto
 * POST /api/admin/:entidade   cria no fim da lista
 *
 * :entidade é uma das listas de _lib/entidades (slides, numeros, servicos,
 * etapas, topicos, aulas, cortes).
 */
export const onRequestGet: Funcao<'entidade'> = ({ params, env }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const { results } = await env.DB.prepare(selecionar(e)).all()
    return json({ itens: results })
  })

export const onRequestPost: Funcao<'entidade'> = ({ params, env, request, data }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const dados = limpar(e, await lerJson(request))
    await conferirFotos(env.DB, e, dados)

    const colunas = Object.keys(dados)
    const sql = `INSERT INTO ${e.tabela} (${colunas.join(', ')}, ordem)
                 VALUES (${colunas.map(() => '?').join(', ')},
                         (SELECT COALESCE(MAX(ordem), -1) + 1 FROM ${e.tabela}))
                 RETURNING id`
    const novo = await env.DB.prepare(sql).bind(...Object.values(dados)).first<{ id: number }>()
    const item = await lerRegistro(env.DB, e, novo!.id)
    await registrar(env, data.usuario, 'criou', e.tabela, e.nomear(item ?? dados))
    return json({ item }, 201)
  })
