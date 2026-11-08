import { erro } from '../_lib/http'
import type { Funcao } from '../_lib/tipos'

/**
 * Qualquer /api/… que nenhuma rota atende.
 *
 * Sem isto, o Pages cairia no index.html do site e responderia 200 com uma
 * página, o que confunde cliente e scanner ("existe algo aqui?"). As rotas
 * de verdade são mais específicas e sempre ganham desta.
 */
export const onRequest: Funcao = ({ request }) =>
  ['GET', 'HEAD'].includes(request.method) ? erro('Endereço não encontrado.', 404) : erro('Método não permitido.', 405)
