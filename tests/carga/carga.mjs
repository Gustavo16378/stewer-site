/**
 * Desempenho · carga e estresse da API (RNF19).
 *
 * Sobe o mesmo servidor dos testes de API (wrangler, runtime da Cloudflare,
 * D1 isolado) e dispara pedidos com o autocannon:
 *
 * - carga:     o uso esperado, com folga; latência p95 e vazão com teto;
 * - estresse:  conexões subindo até 100; o que se cobra é estabilidade,
 *              nenhum erro 5xx nem conexão perdida;
 * - força bruta no login: 200 tentativas na mesma conta; a trava responde
 *              429 rápido e a API continua de pé.
 *
 * O servidor de teste é um processo só na máquina da CI: os números são
 * piores que os da Cloudflare de verdade. Servem para pegar regressão
 * (uma consulta sem índice, um laço a mais), não para prometer latência.
 *
 *   npm run build && npm run test:carga
 *
 * Gera tests/relatorio-carga/relatorio.md (e o resumo do job na CI).
 */
import autocannon from 'autocannon'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ADMIN, subir } from '../servidor-teste.mjs'

const PORTA = 8797
const DURACAO = Number(process.env.CARGA_SEGUNDOS ?? 8)

const rodar = (opcoes) =>
  new Promise((ok, falha) => {
    // com `amount` (um número fixo de pedidos), sem duração
    const o = opcoes.amount ? opcoes : { duration: DURACAO, ...opcoes }
    const i = autocannon(o, (e, r) => (e ? falha(e) : ok(r)))
    autocannon.track(i, { renderProgressBar: false, renderResultsTable: false, renderLatencyTable: false })
  })

const servidor = await subir(PORTA)
const url = servidor.url
const linhas = []
const falhas = []

/** confere um resultado e guarda a linha do relatório */
function conferir(nome, r, { p95, vazao, permitir = [] }) {
  const erros5xx = Object.entries(r.statusCodeStats ?? {})
    .filter(([s]) => Number(s) >= 500)
    .reduce((t, [, v]) => t + v.count, 0)
  const fora = Object.entries(r.statusCodeStats ?? {})
    .filter(([s]) => !(Number(s) >= 200 && Number(s) < 400) && !permitir.includes(Number(s)))
    .reduce((t, [, v]) => t + v.count, 0)
  const p95Real = r.latency.p97_5 ?? r.latency.p99 // autocannon não tem p95: o p97,5 é mais rigoroso
  const problemas = []
  if (r.errors || r.timeouts) problemas.push(`${r.errors} erros de conexão, ${r.timeouts} timeouts`)
  if (erros5xx) problemas.push(`${erros5xx} respostas 5xx`)
  if (fora) problemas.push(`${fora} respostas fora do esperado`)
  if (p95 && p95Real > p95) problemas.push(`p97,5 ${p95Real} ms > ${p95} ms`)
  if (vazao && r.requests.average < vazao) problemas.push(`${Math.round(r.requests.average)} pedidos/s < ${vazao}`)

  linhas.push(
    `| ${nome} | ${r.connections} | ${r.requests.total} | ${Math.round(r.requests.average)} | ${r.latency.p50} | ${p95Real} | ${r.latency.max} | ${erros5xx} | ${problemas.length ? '❌ ' + problemas.join('; ') : '✅'} |`,
  )
  if (problemas.length) falhas.push(`${nome}: ${problemas.join('; ')}`)
  console.log(`${problemas.length ? '✘' : '✓'} ${nome} · ${r.connections} conexões · ${Math.round(r.requests.average)}/s · p50 ${r.latency.p50} ms · p97,5 ${p95Real} ms${problemas.length ? ' · ' + problemas.join('; ') : ''}`)
}

try {
  const login = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN.email, senha: ADMIN.senha }),
  })
  const cookie = login.headers.get('set-cookie').split(';')[0]

  // aquece o runtime (a primeira chamada compila a Function)
  await rodar({ url: `${url}/api/conteudo`, connections: 2, duration: 2 })

  // ---------------------------------------------------------------- carga
  conferir('carga · conteúdo do site (GET /api/conteudo)', await rodar({ url: `${url}/api/conteudo`, connections: 10 }), {
    p95: 250,
    vazao: 50,
  })
  conferir('carga · página inicial (GET /)', await rodar({ url: `${url}/`, connections: 10 }), { p95: 150, vazao: 100 })
  conferir(
    'carga · painel (GET /api/admin/servicos)',
    await rodar({ url: `${url}/api/admin/servicos`, connections: 5, headers: { cookie } }),
    { p95: 300, vazao: 25 },
  )

  // ------------------------------------------------------------- estresse
  for (const conexoes of [25, 50, 100]) {
    conferir(
      `estresse · conteúdo com ${conexoes} conexões`,
      await rodar({ url: `${url}/api/conteudo`, connections: conexoes, duration: Math.max(4, DURACAO / 2) }),
      {},
    )
  }

  // ------------------------------------------------- força bruta no login
  conferir(
    'força bruta · 200 senhas erradas na mesma conta',
    await rodar({
      url: `${url}/api/auth/login`,
      method: 'POST',
      connections: 10,
      amount: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'forca-bruta@teste.local', senha: 'chute-errado' }),
    }),
    { permitir: [401, 429] },
  )
  const depois = await fetch(`${url}/api/conteudo`)
  if (!depois.ok) falhas.push(`a API não respondeu depois da força bruta (${depois.status})`)
} finally {
  servidor.parar()
}

const relatorio = [
  '## Carga e estresse da API',
  '',
  `${DURACAO} s por cenário, servidor de teste local (wrangler + D1). Latências em ms.`,
  '',
  '| cenário | conexões | pedidos | por segundo | p50 | p97,5 | máx | 5xx | resultado |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---|',
  ...linhas,
  '',
].join('\n')

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'relatorio-carga')
mkdirSync(pasta, { recursive: true })
writeFileSync(path.join(pasta, 'relatorio.md'), relatorio)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, relatorio)

if (falhas.length) {
  console.error(`\n${falhas.length} cenário(s) fora do esperado:\n- ${falhas.join('\n- ')}`)
  process.exit(1)
}
console.log('\ncarga e estresse dentro do esperado')
