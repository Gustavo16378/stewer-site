# Como contribuir

Guia para quem for mexer no código do site e do painel do Stewer Gabriel.

## Preparar o ambiente

Node 22 ou mais (os testes de banco usam o `node:sqlite`).

```bash
npm install
cp .dev.vars.example .dev.vars   # e troque o JWT_SECRET
npm run db:local                 # banco local com o conteúdo inicial
npm run admin -- --local "Seu nome" voce@exemplo.com
npm run dev:api                  # site em http://localhost:8788 e painel em /admin
```

Só o front, sem backend: `npm run dev` (o site usa o conteúdo do código).

## Onde fica cada coisa

| pasta | o que tem |
|---|---|
| `src/components` | as seções do site, uma por arquivo |
| `src/content/site.ts` | todo o conteúdo do site, que também é a reserva quando a API cai |
| `src/lib` | a lista de textos editáveis (`textos.ts`) e a leitura da API |
| `src/admin` | o painel |
| `functions/` | a API (uma rota por arquivo) e `_lib/` com regras e infraestrutura |
| `migrations/` | o esquema do banco, em ordem |
| `scripts/` | seed, criar acesso, imagem de compartilhamento e PDFs da documentação |
| `tests/` | unitários, banco, API e E2E |
| `docs/` | requisitos, arquitetura, API, banco, testes e manual do painel |

A arquitetura e as decisões estão em [docs/arquitetura.md](docs/arquitetura.md).

## Mudanças comuns

**Texto fixo novo editável:** coloque o valor original em
`src/content/site.ts`, use no componente e acrescente o campo em
`src/lib/textos.ts`. O painel, a API e o site passam a usar sozinhos.

**Vídeo novo:** coloque o arquivo em `public/videosImgs/` (portfólio) ou
`public/instrutorVideos/` (aulas) e o caminho em `VIDEOS_PORTFOLIO` ou
`VIDEOS_AULAS` em `src/content/site.ts`.

**Lista nova:** tabela numa migration nova, a entidade em
`functions/_lib/entidades.ts`, o formulário em `src/admin/config.ts`, a
consulta em `functions/_lib/conteudo.ts` e a aplicação em
`src/lib/conteudo-remoto.ts`.

## Fluxo

1. Crie um branch a partir da `main`: `git switch -c feat/nome-da-mudanca`.
2. Faça a mudança em commits pequenos, um assunto por commit.
3. Rode os testes (abaixo) antes de abrir o pull request.
4. Abra o pull request para a `main`. O CI roda a pirâmide inteira; só junte
   com ele verde.
5. Ao entrar na `main`, o Cloudflare Pages publica sozinho.

## Commits

Padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/),
em português:

| tipo | quando | exemplo |
|---|---|---|
| `feat` | funcionalidade nova | `feat(painel): filtro por pessoa na auditoria` |
| `fix` | correção | `fix(api): foto usada nos textos não pode ser apagada` |
| `test` | testes | `test(api): concorrência com dez gravações simultâneas` |
| `docs` | documentação | `docs: manual do painel` |
| `refactor` | muda o código sem mudar o comportamento | `refactor(site): conteúdo num módulo só` |
| `style` | só visual do site ou do painel | `style(site): espaçamento do rodapé no celular` |
| `chore` | build, dependências, configuração | `chore: atualiza wrangler` |
| `ci` | pipeline | `ci: salva relatório do E2E quando falha` |

O corpo do commit explica o porquê quando ele não é óbvio. Um commit por
assunto, nunca tudo de uma vez.

## Testes

```bash
npm run build      # a API e os E2E servem o dist/
npm test           # unitários + banco + API
npm run test:e2e   # E2E e acessibilidade (uma vez: npx playwright install chromium)
```

Toda funcionalidade nova entra com teste. O nome do teste começa pelo
requisito que ele verifica (`RF11 · …`); requisito novo entra em
[docs/requisitos.md](docs/requisitos.md) e na matriz de
[docs/testes.md](docs/testes.md).

Mudou o formato de uma resposta da API? Atualize o contrato em
[`tests/contratos.ts`](tests/contratos.ts) e a [referência](docs/api.md).

Mudou o visual do site? O site com o banco precisa continuar igual ao de
antes (RNF16): compare uma captura da página inteira no computador e no
celular.

Mudou algum arquivo de `docs/`? Rode `npm run docs:pdf` e faça commit dos
PDFs de `docs/pdf/` junto, para as duas versões não divergirem.

## Banco

Mudança de esquema é sempre uma migration nova, com o próximo número
(`0003_...sql`). Migration que já foi para produção não se edita.

**Ordem do deploy: banco primeiro, código depois.** O push na `main` publica
o código na hora; se ele já consulta uma tabela ou coluna que o banco de
produção ainda não tem, a API responde 500 (o site cai no conteúdo de
reserva, mas o painel para). Por isso:

1. escreva migrations que só acrescentam (tabela nova, coluna nova com
   valor padrão), para o código antigo continuar funcionando com elas;
2. aplique em produção com `npm run db:remoto` antes do merge;
3. só então junte o código que usa o que a migration criou.

Para conferir o que falta aplicar: `npx wrangler d1 migrations list stewer-site --remote`.

Mudou o conteúdo de `src/content/site.ts` antes de existir banco em
produção? Rode `npm run seed` para regerar `0002_seed.sql`. Depois que o
banco de produção existe, o conteúdo muda pelo painel.

## O que não entra no repositório

- segredos: `.dev.vars`, tokens, senhas (o `.gitignore` já cobre);
- estado local do wrangler (`.wrangler/`), `dist/`, saídas de teste;
- prompts, rascunhos e referências soltas de design.

## Estilo de código

TypeScript estrito no site, no painel e na API (`npm run build` checa os
três). Sem ponto e vírgula, aspas simples, como o resto do projeto.
Comentários e mensagens para o usuário em português; mensagens de erro da
API sempre dizem o que fazer.
