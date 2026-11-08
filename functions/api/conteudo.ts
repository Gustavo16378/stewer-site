import { conteudoPublico } from '../_lib/conteudo'
import { json, tratar } from '../_lib/http'
import type { Funcao } from '../_lib/tipos'

/**
 * GET /api/conteudo
 * Tudo que o site mostra e o painel edita, numa ida só ao banco.
 */
export const onRequestGet: Funcao = ({ env }) =>
  // no-cache (e não no-store): o navegador sempre confere com o servidor, então
  // o que é salvo no painel aparece no próximo carregamento, mas pode guardar a
  // resposta do <link rel="preload"> do index.html e usá-la no fetch do site
  tratar(async () => json(await conteudoPublico(env), 200, { 'Cache-Control': 'no-cache' }))
