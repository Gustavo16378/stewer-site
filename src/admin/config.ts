/**
 * O que cada lista do painel mostra e quais campos o formulário tem.
 * Os nomes dos campos são as colunas do banco (functions/_lib/entidades.ts);
 * a validação de verdade é a do servidor, aqui é só a forma do formulário.
 */

export type CampoForm =
  | { nome: string; tipo: 'texto'; rotulo: string; dica?: string; max: number; obrigatorio?: boolean }
  | { nome: string; tipo: 'area'; rotulo: string; dica?: string; max: number; obrigatorio?: boolean }
  | { nome: string; tipo: 'foto'; rotulo: string; obrigatorio?: boolean; posicao?: string }
  | { nome: string; tipo: 'bool'; rotulo: string; dica?: string }

export type Grupo = { titulo?: string; dica?: string; campos: CampoForm[]; lado?: boolean }

export type Rota = 'slides' | 'numeros' | 'servicos' | 'etapas' | 'topicos' | 'aulas' | 'cortes'

export type ConfigEntidade = {
  rota: Rota
  titulo: string
  singular: string
  /** "Novo serviço" / "Nova foto" */
  novo: string
  /** feminino, para "Foto criada" / "Serviço criado" */
  feminino?: boolean
  descricao: string
  /** onde isso aparece no site, para o Stewer se localizar */
  secao: string
  /**
   * lista que é só de fotos: "+ Nova foto" abre direto a escolha de foto e
   * já cria o item, sem formulário no meio
   */
  soFoto?: boolean
  rotuloItem: (r: Record<string, unknown>) => string
  detalheItem: (r: Record<string, unknown>) => string
  grupos: Grupo[]
  vazio: Record<string, unknown>
}

const visivel: CampoForm = {
  nome: 'visivel',
  tipo: 'bool',
  rotulo: 'Mostrar no site',
  dica: 'Desmarque para esconder sem apagar.',
}

const recortar = (s: unknown, n = 90) => {
  const t = String(s ?? '')
  return t.length > n ? `${t.slice(0, n).trimEnd()}…` : t
}

/** lista de fotos: abertura, aulas e portfólio */
function deFotos(
  rota: Rota,
  titulo: string,
  descricao: string,
  secao: string,
  posicaoPadrao: string,
  dica: string,
): ConfigEntidade {
  return {
    rota,
    titulo,
    singular: 'foto',
    novo: 'Nova foto',
    feminino: true,
    descricao,
    secao,
    soFoto: true,
    rotuloItem: (r) => String(r.foto_alt ?? 'Foto'),
    detalheItem: () => `${dica} · toque para trocar a foto ou o enquadramento`,
    vazio: { visivel: 1, foto_posicao: posicaoPadrao },
    grupos: [
      {
        campos: [
          { nome: 'foto_id', tipo: 'foto', rotulo: 'Foto', obrigatorio: true, posicao: 'foto_posicao' },
          visivel,
        ],
      },
    ],
  }
}

/** lista de título + texto: serviços, consultoria e ensino */
function deBlocos(
  rota: Rota,
  titulo: string,
  singular: string,
  novo: string,
  descricao: string,
  secao: string,
  maxTitulo: number,
  maxTexto: number,
  exemplo: string,
): ConfigEntidade {
  return {
    rota,
    titulo,
    singular,
    novo,
    descricao,
    secao,
    rotuloItem: (r) => String(r.titulo ?? ''),
    detalheItem: (r) => recortar(r.texto),
    vazio: { visivel: 1 },
    grupos: [
      {
        campos: [
          { nome: 'titulo', tipo: 'texto', rotulo: 'Título', dica: exemplo, max: maxTitulo, obrigatorio: true },
          { nome: 'texto', tipo: 'area', rotulo: 'Texto', max: maxTexto, obrigatorio: true },
          visivel,
        ],
      },
    ],
  }
}

export const ENTIDADES: ConfigEntidade[] = [
  deFotos(
    'slides',
    'Fotos da abertura',
    'As fotos que se revezam no topo do site, ao lado do seu nome. A ordem aqui é a ordem em que aparecem.',
    '#',
    '50% 0%',
    'Abertura do site',
  ),
  {
    rota: 'numeros',
    titulo: 'Números',
    singular: 'número',
    novo: 'Novo número',
    descricao: 'Os números em destaque na seção "Quem é", como +800 clientes por ano.',
    secao: '#sobre',
    rotuloItem: (r) => String(r.valor ?? ''),
    detalheItem: (r) => String(r.legenda ?? ''),
    vazio: { visivel: 1 },
    grupos: [
      {
        lado: true,
        campos: [
          { nome: 'valor', tipo: 'texto', rotulo: 'Número', dica: 'Ex.: +800 ou 10+', max: 10, obrigatorio: true },
          { nome: 'legenda', tipo: 'texto', rotulo: 'Legenda', dica: 'Ex.: Anos de experiência', max: 40, obrigatorio: true },
        ],
      },
      { campos: [visivel] },
    ],
  },
  deBlocos(
    'servicos',
    'Serviços',
    'serviço',
    'Novo serviço',
    'Os cards da seção "Serviços". O número de cada card (01, 02…) segue a ordem daqui.',
    '#servicos',
    40,
    300,
    'Ex.: Visagismo',
  ),
  deBlocos(
    'etapas',
    'Consultoria',
    'item da consultoria',
    'Novo item',
    'O que entra na Consultoria de Imagem: cada item vira uma linha, com o título à esquerda e o texto à direita.',
    '#consultoria',
    50,
    300,
    'Ex.: Estilo & Guarda-roupa',
  ),
  deBlocos(
    'topicos',
    'Ensino',
    'tópico',
    'Novo tópico',
    'O que se aprende nas aulas e mentorias, na seção "Ensino".',
    '#instrutor',
    50,
    200,
    'Ex.: Técnicas de Corte',
  ),
  deFotos(
    'aulas',
    'Fotos das aulas',
    'A galeria "Bastidores das aulas", na seção "Ensino". Vídeos das aulas continuam sendo colocados pelo código.',
    '#instrutor',
    '50% 50%',
    'Bastidores das aulas',
  ),
  deFotos(
    'cortes',
    'Portfólio',
    'As fotos de cortes da seção "Portfólio". O vídeo do portfólio continua sendo colocado pelo código e aparece intercalado com as fotos.',
    '#portfolio',
    '50% 50%',
    'Portfólio',
  ),
]
