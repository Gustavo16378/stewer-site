/**
 * Caixa branca · functions/_lib/entidades.ts
 * RF11 (listas), RNF05 (lista fechada de tabelas) e RNF09 (validação).
 */
import { describe, expect, it } from 'vitest'
import {
  CONTAR_USOS,
  ENTIDADES,
  TABELAS_COM_FOTO,
  camposMudados,
  entidade,
  esse,
  limpar,
  selecionar,
} from '../../functions/_lib/entidades'

const LISTAS = ['slides', 'numeros', 'servicos', 'etapas', 'topicos', 'aulas', 'cortes']

describe('RNF05 · só listas conhecidas', () => {
  it.each(LISTAS)('aceita %s', (nome) => {
    expect(entidade(nome).tabela).toBe(nome)
  })

  it.each(['usuarios', 'midias', 'textos', 'servicos; DROP TABLE usuarios', '../usuarios', 'toString', '__proto__', '', undefined])(
    'recusa "%s" com 404',
    (nome) => {
      expect(() => entidade(nome)).toThrow(expect.objectContaining({ status: 404 }))
    },
  )

  it('aceita o parâmetro em lista (como o Pages entrega rotas com [...])', () => {
    expect(entidade(['cortes']).tabela).toBe('cortes')
  })

  it('nenhuma coluna sai do pedido: só as declaradas passam', () => {
    const r = limpar(ENTIDADES.servicos, { titulo: 'Corte', texto: 'x', id: 99, ordem: 5, 'titulo; --': 'x', versao: 3 })
    expect(Object.keys(r).sort()).toEqual(['texto', 'titulo'])
  })

  it('as tabelas com foto são exatamente as listas de foto', () => {
    expect(TABELAS_COM_FOTO.sort()).toEqual(['aulas', 'cortes', 'slides'])
  })

  it('o SQL montado só usa nomes da lista fechada', () => {
    for (const e of Object.values(ENTIDADES)) {
      expect(selecionar(e)).toContain(`FROM ${e.tabela} `)
      expect(selecionar(e, 'id = ?')).toMatch(/WHERE (t\.)?id = \?/)
    }
    const usos = CONTAR_USOS('?1')
    for (const t of TABELAS_COM_FOTO) expect(usos).toContain(`FROM ${t} WHERE foto_id = ?1`)
    expect(usos).toContain('FROM textos')
  })
})

describe('RNF09 · validação dos campos', () => {
  it('título e texto são obrigatórios no cadastro', () => {
    expect(() => limpar(ENTIDADES.servicos, { texto: 'x' })).toThrow('Preencha o campo "Título".')
    expect(() => limpar(ENTIDADES.servicos, { titulo: 'x' })).toThrow('Preencha o campo "Texto".')
    expect(() => limpar(ENTIDADES.servicos, { titulo: '   ', texto: 'x' })).toThrow('Preencha o campo "Título".')
  })

  it('no PUT (parcial) aceita mandar só um campo', () => {
    expect(limpar(ENTIDADES.servicos, { texto: 'Novo texto' }, true)).toEqual({ texto: 'Novo texto' })
  })

  it('respeita o limite de caracteres de cada lista', () => {
    expect(() => limpar(ENTIDADES.servicos, { titulo: 'x'.repeat(41), texto: 'y' })).toThrow('passa de 40')
    expect(() => limpar(ENTIDADES.topicos, { titulo: 't', texto: 'y'.repeat(201) })).toThrow('passa de 200')
    expect(() => limpar(ENTIDADES.numeros, { valor: '12345678901', legenda: 'x' })).toThrow('passa de 10')
    expect(limpar(ENTIDADES.servicos, { titulo: 'x'.repeat(40), texto: 'y'.repeat(300) })).toBeTruthy()
  })

  it('tira espaços das pontas e junta quebras de linha (card é uma linha só)', () => {
    expect(limpar(ENTIDADES.etapas, { titulo: '  Estilo  ', texto: 'linha um\r\n  linha dois ' })).toEqual({
      titulo: 'Estilo',
      texto: 'linha um linha dois',
    })
  })

  it('texto precisa ser texto', () => {
    expect(() => limpar(ENTIDADES.servicos, { titulo: 42, texto: 'x' })).toThrow('precisa ser texto')
  })

  it('número aceita texto curto como +800 ou 10+', () => {
    expect(limpar(ENTIDADES.numeros, { valor: '+800', legenda: 'Clientes por ano' })).toEqual({
      valor: '+800',
      legenda: 'Clientes por ano',
    })
  })

  describe('listas de foto', () => {
    const e = ENTIDADES.cortes

    it('foto é obrigatória e precisa ser um id inteiro positivo', () => {
      expect(() => limpar(e, {})).toThrow('Escolha uma foto.')
      expect(() => limpar(e, { foto_id: '' })).toThrow('Escolha uma foto.')
      for (const ruim of [0, -1, 1.5, 'abc', '1 OR 1=1']) expect(() => limpar(e, { foto_id: ruim })).toThrow('Foto inválida.')
      expect(limpar(e, { foto_id: '7' })).toEqual({ foto_id: 7 })
    })

    it('enquadramento no formato do object-position, entre 0% e 100%', () => {
      expect(limpar(e, { foto_id: 1, foto_posicao: '50% 30%' }).foto_posicao).toBe('50% 30%')
      expect(limpar(e, { foto_id: 1, foto_posicao: '' }).foto_posicao).toBe('50% 50%')
      for (const ruim of ['50% 101%', 'center', '50%', '50% 30%; color:red', 'url(x)']) {
        expect(() => limpar(e, { foto_id: 1, foto_posicao: ruim }), ruim).toThrow('Enquadramento')
      }
    })

    it('o nome do item na auditoria é a descrição da foto', () => {
      expect(e.nomear({ foto_alt: 'Degradê com risca', foto_id: 3 })).toBe('Degradê com risca')
      expect(e.nomear({ foto_id: 3 })).toBe('foto 3')
    })
  })

  it('visível vira 0 ou 1', () => {
    const v = (x: unknown) => limpar(ENTIDADES.servicos, { visivel: x }, true).visivel
    expect([v(true), v(1), v('1'), v(false), v(0), v('0'), v(null), v('sim')]).toEqual([1, 1, 1, 0, 0, 0, 0, 0])
  })
})

describe('RF18 · o que mudou, em português', () => {
  it('lista os rótulos dos campos que mudaram', () => {
    const e = ENTIDADES.servicos
    expect(camposMudados(e, { titulo: 'Corte', texto: 'a' }, { titulo: 'Corte', texto: 'b' })).toEqual(['Texto'])
    expect(camposMudados(e, { visivel: 1 }, { visivel: 0 })).toEqual(['escondeu do site'])
    expect(camposMudados(e, { visivel: 0 }, { visivel: 1 })).toEqual(['mostrou no site'])
    expect(camposMudados(ENTIDADES.cortes, { foto_posicao: '50% 50%' }, { foto_posicao: '50% 20%' })).toEqual([
      'Enquadramento da foto',
    ])
  })

  it('mensagens concordam com o gênero da lista', () => {
    expect(esse(ENTIDADES.servicos)).toBe('Esse serviço')
    expect(esse(ENTIDADES.cortes)).toBe('Essa foto do portfólio')
  })
})
