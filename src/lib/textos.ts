/**
 * Os textos e fotos fixos do site que o Stewer pode trocar pela aba
 * "Textos do site" do painel.
 *
 * Cada campo tem uma chave estável, gravada na tabela `textos`. `ler` devolve
 * o valor atual (o do código, até alguém mudar) e `gravar` aplica o valor
 * salvo no banco antes do primeiro render. Campo sem linha no banco fica com
 * o texto original do design.
 *
 * Esta lista é a única fonte: o painel monta o formulário com ela, a API usa
 * as chaves e os limites para validar, e o site aplica com `gravar`.
 *
 * O que é lista (serviços, etapas, fotos…) e os contatos não estão aqui:
 * têm aba própria no painel.
 */
import {
  CONSULTORIA,
  CONTATO_SECAO,
  ENSINO,
  HERO,
  LOCAL,
  ONDE,
  PORTFOLIO,
  RODAPE,
  SERVICOS_SECAO,
  SOBRE,
  type Foto,
} from '../content/site'

export type TipoTexto = 'texto' | 'area' | 'linhas' | 'foto'

export type CampoTexto = {
  chave: string
  secao: string
  rotulo: string
  tipo: TipoTexto
  /** caracteres; em `linhas`, o total */
  max: number
  dica?: string
  /** em `linhas`, quantas linhas no máximo */
  linhas?: number
  /** editado em outra página do painel, e não em "Textos do site" */
  pagina?: 'contatos'
  ler: () => string | Foto
  gravar: (v: string | Foto) => void
}

const lista = (v: string | Foto) =>
  String(v)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

type Alvo = Record<string, unknown>

/** campo de texto simples ligado a uma propriedade de um objeto do site */
function campo(
  chave: string,
  secao: string,
  rotulo: string,
  tipo: 'texto' | 'area',
  max: number,
  alvo: Alvo,
  prop: string,
  dica?: string,
): CampoTexto {
  return {
    chave,
    secao,
    rotulo,
    tipo,
    max,
    dica,
    ler: () => String(alvo[prop]),
    gravar: (v) => (alvo[prop] = String(v)),
  }
}

/** campo com uma linha por linha do design (título quebrado, endereço…) */
function linhas(
  chave: string,
  secao: string,
  rotulo: string,
  max: number,
  quantas: number,
  alvo: Alvo,
  prop: string,
  dica = 'Uma linha por linha, como aparece no site.',
): CampoTexto {
  return {
    chave,
    secao,
    rotulo,
    tipo: 'linhas',
    max,
    linhas: quantas,
    dica,
    ler: () => (alvo[prop] as string[]).join('\n'),
    gravar: (v) => {
      const novas = lista(v)
      if (novas.length) alvo[prop] = novas
    },
  }
}

const S = {
  hero: 'Abertura',
  sobre: 'Quem é',
  servicos: 'Serviços',
  consultoria: 'Consultoria',
  ensino: 'Ensino',
  portfolio: 'Portfólio',
  onde: 'Onde atende',
  endereco: 'Endereço',
  contato: 'Contato',
  rodape: 'Rodapé',
}

export const CAMPOS_TEXTO: CampoTexto[] = [
  // ------------------------------------------------------------- abertura
  campo('hero.local', S.hero, 'Linha de cima', 'texto', 70, HERO, 'local', 'A frase pequena acima do nome.'),
  linhas('hero.nome', S.hero, 'Nome grande', 40, 2, HERO, 'nome'),
  campo('hero.lema', S.hero, 'Lema', 'texto', 50, HERO, 'lema', 'Ao lado do traço dourado.'),
  campo('hero.frase', S.hero, 'Frase', 'area', 180, HERO, 'frase', 'Em itálico, abaixo do lema.'),
  campo('hero.ctaPrimario', S.hero, 'Botão principal', 'texto', 30, HERO, 'ctaPrimario', 'Leva para "Contato".'),
  campo('hero.ctaSecundario', S.hero, 'Botão secundário', 'texto', 30, HERO, 'ctaSecundario', 'Leva para "Portfólio".'),

  // ---------------------------------------------------------------- quem é
  campo('sobre.rotulo', S.sobre, 'Rótulo', 'texto', 30, SOBRE, 'rotulo'),
  linhas('sobre.titulo', S.sobre, 'Título', 60, 2, SOBRE, 'titulo'),
  campo('sobre.paragrafo1', S.sobre, 'Primeiro parágrafo', 'area', 500, SOBRE, 'paragrafo1'),
  campo('sobre.paragrafo2', S.sobre, 'Segundo parágrafo', 'area', 500, SOBRE, 'paragrafo2'),
  campo('sobre.citacao', S.sobre, 'Citação', 'area', 200, SOBRE, 'citacao', 'A frase em destaque com o traço dourado.'),
  {
    chave: 'sobre.foto',
    secao: S.sobre,
    rotulo: 'Foto',
    tipo: 'foto',
    max: 0,
    dica: 'Prefira uma foto em pé (retrato).',
    ler: () => SOBRE.foto,
    gravar: (v) => {
      if (typeof v === 'object') SOBRE.foto = v
    },
  },
  linhas('sobre.legenda', S.sobre, 'Legenda da foto', 60, 2, SOBRE, 'legenda', 'Duas linhas: a de cima em dourado.'),

  // -------------------------------------------------------------- serviços
  campo('servicos.rotulo', S.servicos, 'Rótulo', 'texto', 30, SERVICOS_SECAO, 'rotulo'),
  campo('servicos.titulo', S.servicos, 'Título', 'texto', 40, SERVICOS_SECAO, 'titulo'),
  campo('servicos.botao', S.servicos, 'Link de cada card', 'texto', 30, SERVICOS_SECAO, 'botao'),
  campo('servicos.nota', S.servicos, 'Nota no fim da seção', 'texto', 100, SERVICOS_SECAO, 'nota'),

  // ----------------------------------------------------------- consultoria
  campo('consultoria.rotulo', S.consultoria, 'Rótulo', 'texto', 30, CONSULTORIA, 'rotulo'),
  linhas('consultoria.titulo', S.consultoria, 'Título', 60, 2, CONSULTORIA, 'titulo', 'Duas linhas no computador; no celular o texto corre junto.'),
  campo('consultoria.intro', S.consultoria, 'Texto de abertura', 'area', 400, CONSULTORIA, 'intro'),
  campo('consultoria.cta', S.consultoria, 'Botão', 'texto', 30, CONSULTORIA, 'cta'),
  campo('consultoria.nota', S.consultoria, 'Nota ao lado do botão', 'texto', 120, CONSULTORIA, 'nota'),

  // ---------------------------------------------------------------- ensino
  campo('ensino.rotulo', S.ensino, 'Rótulo', 'texto', 30, ENSINO, 'rotulo'),
  linhas('ensino.titulo', S.ensino, 'Título', 60, 2, ENSINO, 'titulo', 'Duas linhas no computador; no celular o texto corre junto.'),
  campo('ensino.intro', S.ensino, 'Texto de abertura', 'area', 400, ENSINO, 'intro'),
  campo('ensino.galeria', S.ensino, 'Título da galeria', 'texto', 40, ENSINO, 'galeria'),
  campo('ensino.cta', S.ensino, 'Botão', 'texto', 30, ENSINO, 'cta'),
  campo('ensino.nota', S.ensino, 'Nota ao lado do botão', 'texto', 120, ENSINO, 'nota'),

  // ------------------------------------------------------------- portfólio
  campo('portfolio.rotulo', S.portfolio, 'Rótulo', 'texto', 30, PORTFOLIO, 'rotulo'),
  campo('portfolio.titulo', S.portfolio, 'Título', 'texto', 40, PORTFOLIO, 'titulo'),
  campo('portfolio.link', S.portfolio, 'Link do Instagram (topo)', 'texto', 30, PORTFOLIO, 'link'),
  campo('portfolio.cta', S.portfolio, 'Botão do fim', 'texto', 30, PORTFOLIO, 'cta'),
  campo('portfolio.vazio', S.portfolio, 'Aviso sem fotos', 'texto', 80, PORTFOLIO, 'vazio', 'Aparece se nenhuma foto estiver no site.'),

  // ----------------------------------------------------------- onde atende
  campo('onde.rotulo', S.onde, 'Rótulo sobre o mapa', 'texto', 40, ONDE, 'rotulo'),
  campo('onde.rota', S.onde, 'Botão da rota', 'texto', 30, ONDE, 'rota'),
  campo('onde.mapa', S.onde, 'Botão do Google Maps', 'texto', 30, ONDE, 'mapa'),

  // ------------------------------------------- endereço (aba Contatos e mapa)
  { ...linhas('local.nome', S.endereco, 'Nome do lugar', 40, 2, LOCAL, 'nome'), pagina: 'contatos' },
  { ...linhas('local.endereco', S.endereco, 'Endereço', 100, 2, LOCAL, 'endereco'), pagina: 'contatos' },
  { ...linhas('local.horario', S.endereco, 'Horário', 40, 2, LOCAL, 'horario', 'Duas linhas, por exemplo: Seg — Sáb / 9h às 19h.'), pagina: 'contatos' },
  { ...linhas('local.atendimento', S.endereco, 'Atendimento', 40, 2, LOCAL, 'atendimento'), pagina: 'contatos' },

  // --------------------------------------------------------------- contato
  campo('contato.rotulo', S.contato, 'Rótulo', 'texto', 30, CONTATO_SECAO, 'rotulo'),
  linhas('contato.titulo', S.contato, 'Título', 40, 2, CONTATO_SECAO, 'titulo'),
  campo('contato.frase', S.contato, 'Frase', 'area', 160, CONTATO_SECAO, 'frase'),

  // ---------------------------------------------------------------- rodapé
  campo('rodape.frase', S.rodape, 'Frase', 'area', 160, RODAPE, 'frase', 'Abaixo do logo.'),
]

export const CAMPO_POR_CHAVE = new Map(CAMPOS_TEXTO.map((c) => [c.chave, c]))

/** aplica os textos que vieram da API; fotos já chegam resolvidas em objeto */
export function aplicarTextos(valores: Record<string, unknown>) {
  for (const [chave, valor] of Object.entries(valores)) {
    const c = CAMPO_POR_CHAVE.get(chave)
    if (!c) continue
    if (c.tipo === 'foto') {
      if (valor && typeof valor === 'object') c.gravar(valor as Foto)
    } else if (typeof valor === 'string' && valor.trim()) {
      c.gravar(valor)
    }
  }
}
