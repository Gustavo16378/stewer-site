/**
 * Banco · migrations/*.sql aplicadas do zero num SQLite em memória.
 * O D1 é SQLite; aqui conferimos o que o próprio banco garante, mesmo se a
 * API tivesse um bug: tipos, CHECKs, chaves únicas e estrangeiras.
 * RNF07, RNF08, RNF09, RNF13, RNF15.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { beforeEach, describe, expect, it } from 'vitest'
import * as site from '../../src/content/site'

const pasta = path.resolve(__dirname, '../../migrations')
const migrations = readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()

let db: DatabaseSync

function novoBanco(ate = migrations.length) {
  const d = new DatabaseSync(':memory:')
  d.exec('PRAGMA foreign_keys = ON')
  for (const m of migrations.slice(0, ate)) d.exec(readFileSync(path.join(pasta, m), 'utf8'))
  return d
}

const um = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).get(...p) as Record<string, unknown>
const todos = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).all(...p) as Record<string, unknown>[]
const executar = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).run(...p)

const LISTAS = ['slides', 'numeros', 'servicos', 'etapas', 'topicos', 'aulas', 'cortes']
const DE_FOTO = ['slides', 'aulas', 'cortes']

beforeEach(() => {
  db = novoBanco()
})

describe('RNF15 · migrations', () => {
  it('estão numeradas em sequência, sem buraco nem repetição', () => {
    const numeros = migrations.map((m) => Number(m.slice(0, 4)))
    expect(numeros).toEqual(numeros.map((_, i) => i + 1))
  })

  it('aplicam do zero sem erro, uma por vez', () => {
    for (let i = 1; i <= migrations.length; i++) expect(() => novoBanco(i)).not.toThrow()
  })

  it('criam todas as tabelas esperadas', () => {
    const tabelas = todos(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).map((t) => t.name)
    expect(tabelas.sort()).toEqual(
      [...LISTAS, 'auditoria', 'configuracoes', 'midias', 'sessoes', 'tentativas', 'textos', 'usuarios'].sort(),
    )
  })

  it('o banco passa no integrity_check e no foreign_key_check', () => {
    expect(um('PRAGMA integrity_check').integrity_check).toBe('ok')
    expect(todos('PRAGMA foreign_key_check')).toEqual([])
  })
})

describe('seed: o painel começa com o que já está no ar', () => {
  it('cada lista tem o mesmo conteúdo, na mesma ordem, que o código (scripts/gerar-seed.ts)', () => {
    const blocos = (t: string) => todos(`SELECT titulo, texto FROM ${t} ORDER BY ordem`)
    expect(blocos('servicos')).toEqual(site.SERVICOS.map((b) => ({ ...b })))
    expect(blocos('etapas')).toEqual(site.ETAPAS.map((b) => ({ ...b })))
    expect(blocos('topicos')).toEqual(site.TOPICOS.map((b) => ({ ...b })))
    expect(todos('SELECT valor, legenda FROM numeros ORDER BY ordem')).toEqual(site.NUMEROS.map((n) => ({ ...n })))

    const fotos = (t: string) =>
      todos(`SELECT m.caminho FROM ${t} t JOIN midias m ON m.id = t.foto_id ORDER BY t.ordem`).map((r) => r.caminho)
    expect(fotos('slides')).toEqual(site.SLIDES.map((f) => f.src))
    expect(fotos('aulas')).toEqual(site.AULAS.map((f) => f.src))
    expect(fotos('cortes')).toEqual(site.CORTES.map((f) => f.src))
  })

  it('contatos e mapa são os do site', () => {
    const c = Object.fromEntries(todos('SELECT chave, valor FROM configuracoes').map((r) => [r.chave, r.valor]))
    expect(c).toEqual({
      whatsapp: site.CONTATO.whatsapp,
      instagram: site.CONTATO.instagram,
      mensagem: site.CONTATO.mensagem,
      latitude: String(site.LOCAL.latitude),
      longitude: String(site.LOCAL.longitude),
    })
  })

  it('toda foto do seed é um arquivo de public/ que existe de verdade', () => {
    for (const { caminho } of todos('SELECT caminho FROM midias')) {
      expect(() => readFileSync(path.resolve(__dirname, '../../public', String(caminho).slice(1))), String(caminho)).not.toThrow()
    }
  })

  it('tudo começa visível, e nenhum texto fixo foi trocado ainda', () => {
    for (const t of LISTAS) expect(um(`SELECT COUNT(*) AS n FROM ${t} WHERE visivel = 0`).n, t).toBe(0)
    expect(um('SELECT COUNT(*) AS n FROM textos').n).toBe(0)
  })

  it('não vem nenhum usuário: login só é criado pelo script, com senha fora do Git', () => {
    expect(um('SELECT COUNT(*) AS n FROM usuarios').n).toBe(0)
  })
})

describe('RNF09 · o banco recusa dado inválido mesmo sem a API', () => {
  it.each(LISTAS)('%s: visível só 0 ou 1', (t) => {
    expect(() => executar(`UPDATE ${t} SET visivel = 2 WHERE id = 1`)).toThrow(/CHECK/)
  })

  it('foto sem arquivo e sem bytes', () => {
    expect(() => executar(`INSERT INTO midias (alt, largura, altura) VALUES ('x', 10, 10)`)).toThrow(/CHECK/)
  })

  it('foto com dimensão zero', () => {
    expect(() => executar(`INSERT INTO midias (caminho, alt, largura, altura) VALUES ('/a.jpg', 'x', 0, 10)`)).toThrow(/CHECK/)
  })

  it.each(DE_FOTO)('%s: item sem foto', (t) => {
    expect(() => executar(`INSERT INTO ${t} (foto_id) VALUES (NULL)`)).toThrow(/NOT NULL/)
  })

  it('serviço sem título', () => {
    expect(() => executar(`INSERT INTO servicos (texto) VALUES ('x')`)).toThrow(/NOT NULL/)
  })

  it('ação de auditoria fora da lista', () => {
    expect(() => executar(`INSERT INTO auditoria (usuario_nome, acao, area) VALUES ('A', 'hackeou', 'x')`)).toThrow(/CHECK/)
  })

  it('trocar_senha só 0 ou 1', () => {
    expect(() =>
      executar(`INSERT INTO usuarios (nome, email, senha_hash, salt, iteracoes, trocar_senha) VALUES ('A','a@b.c','h','s',1,5)`),
    ).toThrow(/CHECK/)
  })

  it('e-mail repetido, sem diferenciar maiúsculas', () => {
    const ins = `INSERT INTO usuarios (nome, email, senha_hash, salt, iteracoes) VALUES ('A', ?, 'h', 's', 1)`
    executar(ins, 'stewer@exemplo.com')
    expect(() => executar(ins, 'STEWER@exemplo.com')).toThrow(/UNIQUE/)
  })

  it('chave de texto e de configuração repetida', () => {
    executar(`INSERT INTO textos (chave, valor) VALUES ('hero.lema', 'a')`)
    expect(() => executar(`INSERT INTO textos (chave, valor) VALUES ('hero.lema', 'b')`)).toThrow(/UNIQUE|PRIMARY/)
    expect(() => executar(`INSERT INTO configuracoes (chave, valor) VALUES ('whatsapp', 'b')`)).toThrow(/UNIQUE|PRIMARY/)
  })
})

describe('RNF09 · chaves estrangeiras', () => {
  it.each(DE_FOTO)('foto usada em %s não pode ser apagada (RESTRICT)', (t) => {
    const { foto_id } = um(`SELECT foto_id FROM ${t} LIMIT 1`)
    expect(() => executar('DELETE FROM midias WHERE id = ?', foto_id as number)).toThrow(/FOREIGN KEY/)
  })

  it.each(DE_FOTO)('%s não pode apontar para foto inexistente', (t) => {
    expect(() => executar(`UPDATE ${t} SET foto_id = 9999 WHERE id = 1`)).toThrow(/FOREIGN KEY/)
  })

  it('RNF02 · tirar o acesso de alguém apaga as sessões dela junto (CASCADE)', () => {
    executar(`INSERT INTO usuarios (nome, email, senha_hash, salt, iteracoes) VALUES ('A', 'sai@b.c', 'h', 's', 1)`)
    const { id } = um(`SELECT id FROM usuarios WHERE email = 'sai@b.c'`)
    executar(`INSERT INTO sessoes (id, usuario_id, expira_em) VALUES ('s1', ?, datetime('now', '+1 hour'))`, id as number)
    executar('DELETE FROM usuarios WHERE id = ?', id as number)
    expect(um('SELECT COUNT(*) AS n FROM sessoes').n).toBe(0)
  })

  it('RNF02 · sessão de pessoa que não existe é recusada', () => {
    expect(() => executar(`INSERT INTO sessoes (id, usuario_id, expira_em) VALUES ('s2', 9999, '2099-01-01')`)).toThrow(/FOREIGN KEY/)
  })

  it('foto que nenhuma lista usa pode ser apagada', () => {
    const { id } = um(`SELECT id FROM midias WHERE caminho = '/photos/Stewer3.jpeg'`)
    expect(() => executar('DELETE FROM midias WHERE id = ?', id as number)).not.toThrow()
  })
})

describe('RNF07 · versão para edição simultânea', () => {
  it.each(LISTAS)('%s começa na versão 0', (t) => {
    expect(um(`SELECT MIN(versao) AS a, MAX(versao) AS b FROM ${t}`)).toEqual({ a: 0, b: 0 })
  })

  it('UPDATE com a versão antiga não altera nada (é o que a API usa)', () => {
    executar('UPDATE servicos SET titulo = ?, versao = versao + 1 WHERE id = 1 AND versao = 0', 'Primeira')
    const r = executar('UPDATE servicos SET titulo = ?, versao = versao + 1 WHERE id = 1 AND versao = 0', 'Segunda')
    expect(r.changes).toBe(0)
    expect(um('SELECT titulo, versao FROM servicos WHERE id = 1')).toEqual({ titulo: 'Primeira', versao: 1 })
  })
})

describe('RNF13 · índices para as consultas do dia a dia', () => {
  it.each([['auditoria', 'criado_em'], ['tentativas', 'chave'], ...LISTAS.map((t) => [t, 'ordem'])])(
    '%s tem índice em %s',
    (tabela, coluna) => {
      const indices = todos(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ?`, tabela)
      const colunas = indices.flatMap((i) => todos(`PRAGMA index_info(${i.name})`).map((c) => c.name))
      expect(colunas).toContain(coluna)
    },
  )

  it('a consulta da auditoria por dia usa o índice', () => {
    const plano = JSON.stringify(
      todos(`EXPLAIN QUERY PLAN SELECT * FROM auditoria WHERE criado_em >= ? AND criado_em < ? ORDER BY id DESC`, 'a', 'b'),
    )
    expect(plano).toMatch(/idx_auditoria_criado|USING INDEX|PRIMARY KEY/)
  })
})
