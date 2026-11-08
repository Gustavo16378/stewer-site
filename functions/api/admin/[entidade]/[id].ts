import { registrar } from '../../../_lib/auditoria'
import { camposMudados, conferirFotos, entidade, esse, lerRegistro, limpar } from '../../../_lib/entidades'
import { ErroHttp, idDaRota, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * PUT    /api/admin/:entidade/:id   altera os campos enviados
 * DELETE /api/admin/:entidade/:id   apaga
 */
export const onRequestPut: Funcao<'entidade' | 'id'> = ({ params, env, request, data }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const id = idDaRota(params.id)

    const atual = await lerRegistro(env.DB, e, id)
    if (!atual) throw new ErroHttp(`${esse(e)} não existe mais.`, 404)

    const corpo = await lerJson<Record<string, unknown>>(request)

    /*
     * Concorrência: o painel manda a versão que tinha quando abriu o item.
     * Se alguém salvou no meio do caminho, a versão subiu e esta gravação é
     * recusada com aviso, em vez de sobrescrever a mudança da outra pessoa.
     * Sem versão no pedido (o interruptor "No site"), vale a última.
     */
    const versao = corpo.versao === undefined ? null : Number(corpo.versao)
    if (versao !== null && versao !== Number(atual.versao)) {
      const ultimo = await env.DB.prepare(
        `SELECT usuario_nome FROM auditoria WHERE area = ? AND alvo = ? AND acao = 'editou'
          ORDER BY id DESC LIMIT 1`,
      )
        .bind(e.tabela, e.nomear(atual))
        .first<{ usuario_nome: string }>()
      const quem = ultimo ? `${ultimo.usuario_nome} salvou` : 'Alguém salvou'
      throw new ErroHttp(
        `${quem} uma mudança nesse item enquanto você editava. Feche, abra de novo para ver a versão nova e refaça a sua alteração.`,
        409,
      )
    }

    const mudancas = limpar(e, corpo, true)
    await conferirFotos(env.DB, e, mudancas)

    const colunas = Object.keys(mudancas)
    if (colunas.length === 0) return json({ item: atual })

    const sql = `UPDATE ${e.tabela}
                    SET ${colunas.map((c) => `${c} = ?`).join(', ')}, atualizado_em = datetime('now'), versao = versao + 1
                  WHERE id = ? AND versao = ? RETURNING id`
    const ok = await env.DB.prepare(sql)
      .bind(...Object.values(mudancas), id, atual.versao)
      .first()
    // duas gravações no mesmo instante: a segunda encontra a versão já trocada
    if (!ok) throw new ErroHttp('Outra pessoa salvou esse item agora mesmo. Abra de novo e refaça a alteração.', 409)

    const item = await lerRegistro(env.DB, e, id)
    const mudou = camposMudados(e, atual, mudancas)
    if (mudou.length) await registrar(env, data.usuario, 'editou', e.tabela, e.nomear(item ?? atual), mudou.join(', '))
    return json({ item })
  })

export const onRequestDelete: Funcao<'entidade' | 'id'> = ({ params, env, data }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const id = idDaRota(params.id)
    const atual = await lerRegistro(env.DB, e, id)
    if (!atual) throw new ErroHttp(`${esse(e)} não existe mais.`, 404)
    await env.DB.prepare(`DELETE FROM ${e.tabela} WHERE id = ?`).bind(id).run()
    await registrar(env, data.usuario, 'apagou', e.tabela, e.nomear(atual))
    return json({ ok: true })
  })
