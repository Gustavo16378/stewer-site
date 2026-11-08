/**
 * Gera migrations/0002_seed.sql a partir do conteúdo de src/content/site.ts.
 *
 * O site nasceu com o conteúdo no código. Este script copia esse conteúdo
 * para o banco uma única vez, para o painel começar com tudo que já está no
 * ar, e não com um site vazio.
 *
 * Uso: npx tsx scripts/gerar-seed.ts
 */
import { writeFileSync } from 'node:fs'
import {
  AULAS,
  CONTATO,
  CORTES,
  ETAPAS,
  LOCAL,
  NUMEROS,
  SERVICOS,
  SLIDES,
  SOBRE,
  TOPICOS,
  type Foto,
} from '../src/content/site'

const q = (v: unknown) =>
  v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`

const linhas: string[] = [
  '-- Stewer Gabriel · conteúdo inicial, gerado por scripts/gerar-seed.ts',
  '-- Não editar à mão: rodar o script de novo.',
  '',
]

// fotos: id fixo na ordem em que aparecem, para os outros inserts apontarem
const idDaFoto = new Map<string, number>()
function registrarFoto(f: Foto) {
  if (idDaFoto.has(f.src)) return idDaFoto.get(f.src)!
  const id = idDaFoto.size + 1
  idDaFoto.set(f.src, id)
  const tipo = f.src.endsWith('.png') ? 'image/png' : 'image/jpeg'
  linhas.push(
    `INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (${id}, ${q(f.src)}, ${q(tipo)}, ${q(f.alt)}, ${f.largura}, ${f.altura});`,
  )
  return id
}
;[...SLIDES, SOBRE.foto, ...AULAS, ...CORTES].forEach(registrarFoto)
linhas.push('')

const fotos = (tabela: string, lista: Foto[], padrao: string) =>
  lista.forEach((f, i) =>
    linhas.push(
      `INSERT INTO ${tabela} (foto_id, foto_posicao, ordem) VALUES (${idDaFoto.get(f.src)}, ${q(f.posicao ?? padrao)}, ${i});`,
    ),
  )

const blocos = (tabela: string, lista: { titulo: string; texto: string }[]) =>
  lista.forEach((b, i) =>
    linhas.push(`INSERT INTO ${tabela} (titulo, texto, ordem) VALUES (${q(b.titulo)}, ${q(b.texto)}, ${i});`),
  )

fotos('slides', SLIDES, '50% 0%')
fotos('aulas', AULAS, '50% 50%')
fotos('cortes', CORTES, '50% 50%')
linhas.push('')

NUMEROS.forEach((n, i) =>
  linhas.push(`INSERT INTO numeros (valor, legenda, ordem) VALUES (${q(n.valor)}, ${q(n.legenda)}, ${i});`),
)
blocos('servicos', SERVICOS)
blocos('etapas', ETAPAS)
blocos('topicos', TOPICOS)
linhas.push('')

const config: Record<string, string | number> = {
  whatsapp: CONTATO.whatsapp,
  instagram: CONTATO.instagram,
  mensagem: CONTATO.mensagem,
  latitude: LOCAL.latitude,
  longitude: LOCAL.longitude,
}
for (const [chave, valor] of Object.entries(config)) {
  linhas.push(`INSERT INTO configuracoes (chave, valor) VALUES (${q(chave)}, ${q(String(valor))});`)
}

writeFileSync(new URL('../migrations/0002_seed.sql', import.meta.url), linhas.join('\n') + '\n')
console.log('migrations/0002_seed.sql gerado.')
