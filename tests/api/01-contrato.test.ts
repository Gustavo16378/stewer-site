/**
 * Caixa preta · contrato público (RNF10) e conteúdo inicial (RF01, RF05).
 * Só olha a resposta HTTP, como o navegador do visitante.
 */
import { describe, expect, it } from 'vitest'
import { ConteudoPublico, Erro } from '../contratos'
import { Cliente } from './cliente'

const visitante = new Cliente()

describe('RNF10 · GET /api/conteudo', () => {
  it('responde 200 em JSON, sem cache, dentro do contrato', async () => {
    const r = await visitante.get('/api/conteudo')
    expect(r.status).toBe(200)
    expect(r.cabecalhos.get('content-type')).toContain('application/json')
    // no-cache: sempre confere com o servidor (o que o painel salva aparece no
    // próximo carregamento), mas deixa o preload do index.html ser reaproveitado
    expect(r.cabecalhos.get('cache-control')).toBe('no-cache')
    expect(() => ConteudoPublico.parse(r.corpo)).not.toThrow()
  })

  it('RF01 · traz o conteúdo do seed: o mesmo que o site já mostrava', async () => {
    const { corpo } = await visitante.get('/api/conteudo')
    expect(corpo.slides).toHaveLength(2)
    expect(corpo.numeros.map((n: { valor: string }) => n.valor)).toEqual(['+800', '10+'])
    expect(corpo.servicos.map((s: { titulo: string }) => s.titulo)).toEqual(['Corte', 'Visagismo', 'Consultoria de Imagem'])
    expect(corpo.etapas).toHaveLength(4)
    expect(corpo.topicos).toHaveLength(4)
    expect(corpo.aulas).toHaveLength(3)
    expect(corpo.cortes).toHaveLength(5)
    expect(corpo.textos).toEqual({})
  })

  it('RF05 · contatos e mapa do Stewer', async () => {
    const { config } = (await visitante.get('/api/conteudo')).corpo
    expect(config).toMatchObject({ whatsapp: '5563985116783', instagram: 'stewer.gabriel' })
    expect(Number(config.latitude)).toBeCloseTo(-10.18256, 4)
  })

  it('não expõe nada interno (ids, ordem, versão, bytes de foto)', async () => {
    const texto = JSON.stringify((await visitante.get('/api/conteudo')).corpo)
    for (const proibido of ['"id"', '"ordem"', '"versao"', '"dados"', 'senha', '"visivel"', '"foto_id"']) {
      expect(texto).not.toContain(proibido)
    }
  })
})

describe('RNF10 · formato único de erro', () => {
  it.each([
    ['GET', '/api/admin/servicos', 401],
    ['GET', '/api/admin/qualquercoisa', 401],
    ['POST', '/api/auth/login', 415],
    ['GET', '/api/midias/999999', 404],
    ['GET', '/api/midias/abc', 404],
  ])('%s %s → %i com { erro }', async (metodo, caminho, status) => {
    const r = await visitante.pedir(metodo, caminho, undefined, metodo === 'POST' ? { 'Content-Type': 'text/plain' } : {})
    expect(r.status).toBe(status)
    expect(() => Erro.parse(r.corpo)).not.toThrow()
  })
})

describe('fotos públicas', () => {
  it('foto do site original redireciona para o arquivo estático', async () => {
    const r = await visitante.get('/api/midias/1')
    expect(r.status).toBe(302)
    expect(r.cabecalhos.get('location')).toMatch(/\/photos\/Stewer1\.jpg$/)
  })
})
