import { defineConfig } from 'vitest/config'
import PorNome from './tests/api/sequenciador.ts'

/**
 * Quatro suítes, rodadas por `npm test` (ver docs/testes.md):
 * - unit:       caixa branca das bibliotecas (auth, validação, textos, zip…)
 * - db:         esquema, constraints e migrations num SQLite em memória
 * - api:        caixa preta e cinza contra a API real (wrangler + D1 isolado),
 *               mais a suíte de segurança (tests/seguranca, OWASP Top 10)
 * - desempenho: orçamento de peso do build (dist/)
 */
export default defineConfig({
  test: {
    // o sequenciador é global no Vitest; só a suíte de API depende da ordem
    sequence: { sequencer: PorNome },
    coverage: {
      provider: 'v8',
      include: ['functions/_lib/**', 'src/lib/textos.ts', 'src/lib/conteudo-remoto.ts', 'src/content/site.ts', 'src/admin/zip.ts'],
      reporter: ['text', 'html'],
    },
    projects: [
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'db', include: ['tests/db/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'desempenho', include: ['tests/desempenho/**/*.test.ts'], environment: 'node' } },
      {
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts', 'tests/seguranca/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['tests/api/setup.ts'],
          // um banco só para a rodada: os arquivos rodam em sequência
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 90_000,
        },
      },
    ],
  },
})
