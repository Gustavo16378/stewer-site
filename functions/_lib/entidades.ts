/**
 * As listas que o Stewer edita no painel: fotos da abertura, números,
 * serviços, etapas da consultoria, tópicos do ensino, fotos das aulas e
 * portfólio. Todas têm o mesmo ciclo (listar, criar, editar, apagar,
 * reordenar), então a regra de cada campo mora aqui e as rotas de
 * /api/admin/[entidade] são uma só.
 *
 * Nenhum nome de tabela ou coluna vem do usuário: tudo sai desta lista
 * fechada, e os valores vão sempre por bind.
 */
import { ErroHttp } from './http'

type Campo =
  | { tipo: 'texto'; obrigatorio?: boolean; max: number; rotulo: string }
  | { tipo: 'bool'; rotulo: string }
  | { tipo: 'foto'; obrigatorio?: boolean; rotulo: string }
  | { tipo: 'posicao'; rotulo: string }

export type Entidade = {
  tabela: string
  nome: string
  /** "o"/"a", para mensagens como "Esse serviço não existe mais" */
  genero: 'o' | 'a'
  campos: Record<string, Campo>
  /** como o registro aparece na auditoria */
  nomear: (r: Record<string, unknown>) => string
}

const visivel: Campo = { tipo: 'bool', rotulo: 'Visível no site' }
const posicao: Campo = { tipo: 'posicao', rotulo: 'Enquadramento da foto' }

/** lista de foto (abertura, aulas, portfólio): o nome vem da descrição da foto */
const deFotos = (tabela: string, nome: string): Entidade => ({
  tabela,
  nome,
  genero: 'a',
  nomear: (r) => String(r.foto_alt ?? `foto ${r.foto_id ?? ''}`).trim(),
  campos: {
    foto_id: { tipo: 'foto', obrigatorio: true, rotulo: 'Foto' },
    foto_posicao: posicao,
    visivel,
  },
})

/** lista de título + texto (serviços, etapas, tópicos) */
const deBlocos = (tabela: string, nome: string, genero: 'o' | 'a', maxTitulo: number, maxTexto: number): Entidade => ({
  tabela,
  nome,
  genero,
  nomear: (r) => String(r.titulo ?? ''),
  campos: {
    titulo: { tipo: 'texto', obrigatorio: true, max: maxTitulo, rotulo: 'Título' },
    texto: { tipo: 'texto', obrigatorio: true, max: maxTexto, rotulo: 'Texto' },
    visivel,
  },
})

export const ENTIDADES: Record<string, Entidade> = {
  slides: deFotos('slides', 'foto da abertura'),
  numeros: {
    tabela: 'numeros',
    nome: 'número',
    genero: 'o',
    nomear: (r) => `${r.valor ?? ''} ${r.legenda ?? ''}`.trim(),
    campos: {
      valor: { tipo: 'texto', obrigatorio: true, max: 10, rotulo: 'Número' },
      legenda: { tipo: 'texto', obrigatorio: true, max: 40, rotulo: 'Legenda' },
      visivel,
    },
  },
  servicos: deBlocos('servicos', 'serviço', 'o', 40, 300),
  etapas: deBlocos('etapas', 'item da consultoria', 'o', 50, 300),
  topicos: deBlocos('topicos', 'tópico do ensino', 'o', 50, 200),
  aulas: deFotos('aulas', 'foto das aulas'),
  cortes: deFotos('cortes', 'foto do portfólio'),
}

/** "Esse serviço" / "Essa foto do portfólio" */
export const esse = (e: Entidade) => `${e.genero === 'a' ? 'Essa' : 'Esse'} ${e.nome}`

export function entidade(nome: string | string[] | undefined): Entidade {
  const chave = Array.isArray(nome) ? nome[0] : nome
  const e = chave && Object.hasOwn(ENTIDADES, chave) ? ENTIDADES[chave] : undefined
  if (!e) throw new ErroHttp('Recurso não encontrado.', 404)
  return e
}

/** enquadramento da foto, no formato do object-position: "50% 30%" */
const POSICAO = /^\d{1,3}% \d{1,3}%$/

/**
 * Confere e normaliza o que veio do painel.
 * `parcial` (no PUT) aceita mandar só alguns campos.
 */
export function limpar(e: Entidade, bruto: Record<string, unknown>, parcial = false) {
  const saida: Record<string, string | number | null> = {}

  for (const [coluna, campo] of Object.entries(e.campos)) {
    if (!(coluna in bruto)) {
      if (parcial) continue
      if ('obrigatorio' in campo && campo.obrigatorio) {
        throw new ErroHttp(campo.tipo === 'foto' ? `Escolha uma foto.` : `Preencha o campo "${campo.rotulo}".`)
      }
      continue
    }

    let v = bruto[coluna]
    if (typeof v === 'string') v = v.trim()
    const vazio = v === null || v === undefined || v === ''

    switch (campo.tipo) {
      case 'texto':
        if (vazio) {
          if (campo.obrigatorio) throw new ErroHttp(`Preencha o campo "${campo.rotulo}".`)
          saida[coluna] = ''
          break
        }
        if (typeof v !== 'string') throw new ErroHttp(`"${campo.rotulo}" precisa ser texto.`)
        if (v.length > campo.max) throw new ErroHttp(`"${campo.rotulo}" passa de ${campo.max} caracteres.`)
        // card e título são uma linha só no site
        saida[coluna] = v.replace(/\s*\r?\n\s*/g, ' ')
        break

      case 'foto': {
        if (vazio) {
          if (campo.obrigatorio) throw new ErroHttp('Escolha uma foto.')
          saida[coluna] = null
          break
        }
        const n = Number(v)
        if (!Number.isInteger(n) || n <= 0) throw new ErroHttp('Foto inválida.')
        saida[coluna] = n
        break
      }

      case 'posicao': {
        const p = vazio ? '50% 50%' : String(v)
        if (!POSICAO.test(p) || p.split(' ').some((x) => parseInt(x) > 100)) {
          throw new ErroHttp('Enquadramento da foto inválido.')
        }
        saida[coluna] = p
        break
      }

      case 'bool':
        saida[coluna] = v === true || v === 1 || v === '1' ? 1 : 0
        break
    }
  }

  return saida
}

/** Garante que as fotos citadas existem, com uma mensagem clara em vez de erro de chave estrangeira. */
export async function conferirFotos(db: D1Database, e: Entidade, dados: Record<string, unknown>) {
  for (const [coluna, campo] of Object.entries(e.campos)) {
    if (campo.tipo !== 'foto' || dados[coluna] == null) continue
    const achou = await db.prepare('SELECT 1 FROM midias WHERE id = ?').bind(dados[coluna]).first()
    if (!achou) throw new ErroHttp('A foto escolhida não existe mais.')
  }
}

/** rótulos, em português, dos campos que mudaram entre dois estados do registro */
export function camposMudados(e: Entidade, antes: Record<string, unknown>, mudancas: Record<string, unknown>) {
  const rotulos: string[] = []
  for (const [coluna, valor] of Object.entries(mudancas)) {
    const campo = e.campos[coluna]
    if (!campo || (antes[coluna] ?? null) === (valor ?? null)) continue
    if (coluna === 'visivel') rotulos.push(valor ? 'mostrou no site' : 'escondeu do site')
    else rotulos.push(campo.rotulo)
  }
  return rotulos
}

/** tabelas com foto: usadas para saber se uma foto está em uso antes de apagar */
export const TABELAS_COM_FOTO = Object.values(ENTIDADES)
  .filter((e) => 'foto_id' in e.campos)
  .map((e) => e.tabela)

/**
 * SELECT de um ou de todos os registros, como o painel vê: com o endereço e
 * a descrição da foto quando a lista é de fotos (a descrição é o "nome" do
 * item na auditoria).
 */
export function selecionar(e: Entidade, onde = '') {
  return 'foto_id' in e.campos
    ? `SELECT t.*, COALESCE(f.caminho, '/api/midias/' || f.id) AS foto_url, f.alt AS foto_alt
         FROM ${e.tabela} t LEFT JOIN midias f ON f.id = t.foto_id ${onde ? `WHERE t.${onde}` : ''}
        ORDER BY t.ordem, t.id`
    : `SELECT * FROM ${e.tabela} ${onde ? `WHERE ${onde}` : ''} ORDER BY ordem, id`
}

export function lerRegistro(db: D1Database, e: Entidade, id: number) {
  return db.prepare(selecionar(e, 'id = ?')).bind(id).first<Record<string, unknown>>()
}

/** em quantos lugares do site a foto aparece (listas e textos fixos) */
export const CONTAR_USOS = (id: string) =>
  [
    ...TABELAS_COM_FOTO.map((t) => `(SELECT COUNT(*) FROM ${t} WHERE foto_id = ${id})`),
    `(SELECT COUNT(*) FROM textos WHERE chave LIKE '%.foto' AND CAST(valor AS INTEGER) = ${id})`,
  ].join(' + ')
