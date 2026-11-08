/**
 * Monta o conteúdo público do site a partir do banco, já no formato que os
 * componentes do front usam (o mesmo de src/content/site.ts).
 */
import { CAMPO_POR_CHAVE } from '../../src/lib/textos'
import { ENTIDADES, TABELAS_COM_FOTO } from './entidades'
import type { Env } from './tipos'

type LinhaFoto = {
  foto_id: number | null
  foto_caminho: string | null
  foto_alt: string | null
  foto_largura: number | null
  foto_altura: number | null
}

/** foto estática aponta para o arquivo; foto enviada pelo painel é servida pela API */
export function urlDaFoto(id: number, caminho: string | null) {
  return caminho ?? `/api/midias/${id}`
}

function foto(l: LinhaFoto, posicao?: string | null) {
  if (l.foto_id == null) return null
  return {
    src: urlDaFoto(l.foto_id, l.foto_caminho),
    alt: l.foto_alt ?? '',
    largura: l.foto_largura ?? 1,
    altura: l.foto_altura ?? 1,
    ...(posicao ? { posicao } : {}),
  }
}

const COLUNAS_FOTO = `
  f.id AS foto_id, f.caminho AS foto_caminho, f.alt AS foto_alt,
  f.largura AS foto_largura, f.altura AS foto_altura`

/** SELECT de uma lista: só o visível, na ordem do painel, com a foto já junto */
function consulta(env: Env, tabela: string) {
  const comFoto = TABELAS_COM_FOTO.includes(tabela)
  return env.DB.prepare(
    comFoto
      ? `SELECT t.foto_posicao, ${COLUNAS_FOTO} FROM ${tabela} t JOIN midias f ON f.id = t.foto_id
          WHERE t.visivel = 1 ORDER BY t.ordem, t.id`
      : `SELECT * FROM ${tabela} WHERE visivel = 1 ORDER BY ordem, id`,
  )
}

export async function conteudoPublico(env: Env) {
  const [slides, numeros, servicos, etapas, topicos, aulas, cortes, config, textos] = await env.DB.batch([
    consulta(env, ENTIDADES.slides.tabela),
    consulta(env, ENTIDADES.numeros.tabela),
    consulta(env, ENTIDADES.servicos.tabela),
    consulta(env, ENTIDADES.etapas.tabela),
    consulta(env, ENTIDADES.topicos.tabela),
    consulta(env, ENTIDADES.aulas.tabela),
    consulta(env, ENTIDADES.cortes.tabela),
    env.DB.prepare('SELECT chave, valor FROM configuracoes'),
    env.DB.prepare(
      `SELECT t.chave, t.valor, ${COLUNAS_FOTO}
         FROM textos t LEFT JOIN midias f ON f.id = CAST(t.valor AS INTEGER)`,
    ),
  ])

  type L = Record<string, any> & LinhaFoto
  const fotos = (r: D1Result) => (r.results as L[]).map((l) => foto(l, l.foto_posicao)!)
  const blocos = (r: D1Result) => (r.results as L[]).map((b) => ({ titulo: b.titulo as string, texto: b.texto as string }))

  return {
    slides: fotos(slides),
    numeros: (numeros.results as L[]).map((n) => ({ valor: n.valor as string, legenda: n.legenda as string })),
    servicos: blocos(servicos),
    etapas: blocos(etapas),
    topicos: blocos(topicos),
    aulas: fotos(aulas),
    cortes: fotos(cortes),
    config: Object.fromEntries((config.results as { chave: string; valor: string }[]).map((c) => [c.chave, c.valor])),
    // campo de foto sai já como objeto Foto; texto sai como texto
    textos: Object.fromEntries(
      (textos.results as (LinhaFoto & { chave: string; valor: string })[])
        .filter((t) => CAMPO_POR_CHAVE.has(t.chave))
        .map((t) => [t.chave, CAMPO_POR_CHAVE.get(t.chave)!.tipo === 'foto' ? foto(t) : t.valor])
        .filter(([, v]) => v !== null),
    ),
  }
}
