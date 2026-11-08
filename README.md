# Stewer Gabriel · Visagismo e Consultoria de Imagem

Site institucional one page do **Stewer Gabriel**, visagista e consultor de imagem masculina em Palmas, Tocantins, com um **painel próprio em `/admin`** para ele mudar textos, fotos, listas, contatos e o mapa sozinho, pelo celular, sem mexer no código.

🔗 **[stewergabriel.com](https://stewergabriel.com)**

[![testes](https://github.com/Gustavo16378/stewer-site/actions/workflows/testes.yml/badge.svg)](https://github.com/Gustavo16378/stewer-site/actions/workflows/testes.yml)
[![lighthouse](https://github.com/Gustavo16378/stewer-site/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/Gustavo16378/stewer-site/actions/workflows/lighthouse.yml)
[![codeql](https://github.com/Gustavo16378/stewer-site/actions/workflows/codeql.yml/badge.svg)](https://github.com/Gustavo16378/stewer-site/actions/workflows/codeql.yml)

| Lighthouse | desempenho | acessibilidade | boas práticas | SEO |
|---|:---:|:---:|:---:|:---:|
| computador | 98 | 100 | 100 | 100 |
| celular (4G lento) | 95 | 100 | 100 | 100 |

## Stack

| Peça | Escolha |
|---|---|
| Site e painel | React 18 + TypeScript, Vite, Tailwind CSS no site |
| API | Cloudflare Pages Functions (TypeScript), no mesmo deploy do site |
| Banco | Cloudflare D1 (SQLite), com migrations versionadas |
| Mapa | Leaflet, fundo escuro da CARTO com reserva no OpenFreeMap (MapLibre) e no OpenStreetMap |
| Movimento | CSS na abertura de marca, GSAP (ScrollTrigger e SplitText) na rolagem |
| Testes | Vitest, Playwright, axe-core, autocannon, Lighthouse CI, Zod para os contratos |
| CI | GitHub Actions, CodeQL, Dependabot |

Tudo roda no plano gratuito da Cloudflare: o único custo é o domínio.

## Seções do site

1. **Abertura** com as fotos que se revezam e a chamada de agendamento
2. **Quem é**, com a história, a citação e os números
3. **Serviços** em cards numerados
4. **Consultoria** de imagem, item por item
5. **Ensino**, com o que se aprende e os bastidores das aulas
6. **Portfólio** de cortes, com fotos e vídeo
7. **Onde atende**, com mapa interativo e rota
8. **Contato** com WhatsApp e Instagram

Todo o texto, as fotos e os contatos dessas seções vêm do painel.

## O painel

Login com e-mail e senha, e uma aba para cada parte do site:

- **Textos do site:** todo texto fixo de cada seção, com "voltar ao original"
- **Listas:** fotos da abertura, números, serviços, consultoria, ensino, fotos das aulas e portfólio, com setas para ordenar, chave para esconder sem apagar e edição num painel lateral
- **Fotos:** envio com redução no navegador (até 1600px, WebP), descrição, download e backup de todas em .zip
- **Contatos e mapa:** WhatsApp, mensagem pronta, Instagram e coordenadas coladas direto do Google Maps, com prévia
- **Usuários e auditoria:** acesso com senha temporária e troca obrigatória, e o registro de quem mudou o quê

O painel tem a mesma identidade do site (carvão, creme e dourado, Playfair Display e Inter). O [manual do painel](docs/manual-do-painel.md) explica cada parte em linguagem simples.

## Detalhes de implementação

- **O site não muda de cara com o banco.** O conteúdo inteiro mora em [`src/content/site.ts`](src/content/site.ts). Antes do primeiro render, o site busca `/api/conteudo` (até 2,5 s) e troca o conteúdo no lugar. Comparando capturas da página inteira, o site com o banco é igual ao de antes, pixel a pixel.
- **O backend nunca derruba o site.** Se a API cair ou demorar, o site abre com o conteúdo do código, que funciona como reserva.
- **Uma lista só para os textos editáveis.** [`src/lib/textos.ts`](src/lib/textos.ts) define chave, seção, limite e tipo de cada campo. O painel monta o formulário com ela, a API valida com ela e o site aplica com ela.
- **Uma rota para as sete listas.** As regras de cada lista ficam em [`functions/_lib/entidades.ts`](functions/_lib/entidades.ts); nenhum nome de tabela ou coluna vem do pedido.
- **Fotos sem serviço pago.** A foto é reduzida no navegador e guardada no próprio D1, servida com cache de um ano. As fotos originais continuam em `public/`. Vídeos ficam no código.
- **Duas pessoas editando ao mesmo tempo.** Cada item tem versão; quem salva por cima de uma mudança mais nova recebe um aviso com o nome de quem salvou, em vez de apagar o trabalho do outro.
- **Segurança.** Senha com PBKDF2, sessão em cookie `HttpOnly` e `SameSite=Strict` gravada no servidor ("Sair" vale de verdade), trava depois de 5 senhas erradas, CSRF, CSP sem script inline e upload conferido pelos bytes do arquivo.
- **Mapa configurável e que nunca quebra.** O Stewer cola o link do Google Maps (até o curto, que o servidor abre com proteção contra SSRF) ou arrasta o alfinete. O fundo escuro tenta CARTO, OpenFreeMap e OpenStreetMap, nessa ordem.
- **Abertura de marca e movimento.** O S do logo é traçado em dourado em CSS puro, antes de o React chegar, cobrindo a espera pelo conteúdo em vez de somar a ela. O movimento de rolagem usa GSAP, baixado só quando a pessoa começa a rolar. Quem pede menos movimento vê o site parado.
- **Rápido no celular.** O conteúdo sai junto com o HTML (preload), a entrada não tem React, a primeira foto vai com prioridade, o mapa e o GSAP vêm sob demanda e as fontes são servidas pelo próprio site. LCP de ~1,7 s num 4G lento, TBT de ~70 ms e CLS zero, medidos a cada push.
- **Segurança testada como ataque.** 318 testes pelo OWASP Top 10, inclusive com o `JWT_SECRET` vazado: sem uma sessão aberta no banco, ninguém entra. Resumo em [`SECURITY.md`](SECURITY.md).

## Testes

952 testes automáticos, mais carga e Lighthouse, rodando a cada push no GitHub Actions:

| suíte | técnica | testes |
|---|---|---|
| Unitários | caixa branca | 233 |
| Banco (migrations do zero) | caixa branca | 53 |
| API real com wrangler e D1 isolado | caixa preta e cinza | 210 |
| Segurança (OWASP Top 10) | caixa preta e cinza | 318 |
| Orçamento de peso do build | caixa branca | 16 |
| E2E no computador e no celular: fluxos, acessibilidade (axe), segurança no navegador, Core Web Vitals, abertura e movimento | caixa preta | 122 |
| Carga e estresse (autocannon, até 100 conexões) | caixa preta | 7 cenários |
| Lighthouse CI (celular e computador) | caixa preta | 2 telas |

Cada teste aponta o requisito que cobre. O [plano de testes](docs/testes.md) tem a matriz de rastreabilidade e os problemas encontrados, todos corrigidos.

## Como rodar

```bash
npm install
cp .dev.vars.example .dev.vars   # e troque o JWT_SECRET
npm run db:local                 # banco local com o conteúdo do site
npm run admin -- --local "Seu nome" voce@exemplo.com
npm run dev:api                  # site em http://localhost:8788, painel em /admin
```

Só o site, sem backend: `npm run dev` (usa o conteúdo do código).

```bash
npm run build            # checa os tipos do site, do painel e da API e gera o dist/
npm test                 # unitários, banco, API, segurança e orçamento de peso
npm run test:e2e         # navegador (uma vez: npx playwright install chromium)
npm run test:seguranca   # só a segurança (API e navegador)
npm run test:desempenho  # orçamento de peso e Core Web Vitals
npm run test:carga       # carga e estresse da API
npm run auditoria        # dependências (npm audit)
npm run og:image   # regenera a imagem de compartilhamento depois de trocar a foto principal
npm run docs:pdf   # gera os PDFs da documentação
```

## Publicar o backend pela primeira vez

Uma vez só, na pasta do projeto:

1. `npx wrangler login`
2. `npx wrangler d1 create stewer-site` e copie o `database_id` para o [`wrangler.toml`](wrangler.toml). O `name` do `wrangler.toml` já é o do projeto no Cloudflare Pages (`stewer-gabriel`).
3. `npm run db:remoto` para criar as tabelas com o conteúdo atual do site.
4. Gere o segredo das sessões com `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` e cadastre no painel da Cloudflare em Workers & Pages → projeto → Settings → Variables and Secrets, com o nome `JWT_SECRET`, tipo Secret.
5. `npm run admin -- --remote "Stewer Gabriel" email-do-stewer@exemplo.com` (a senha é pedida no terminal).
6. Commit do `wrangler.toml` e push na `main`.

## Estrutura

```
src/
├── components/    uma seção do site por arquivo
├── content/       todo o conteúdo do site (e a reserva)
├── lib/           textos editáveis, leitura da API, mapa, movimento, logo
├── admin/         o painel
├── main.tsx       entrada do site (sem React): abertura, conteúdo, primeira foto
├── inicio.tsx     o React e a página
└── preloader.*    a abertura de marca
functions/
├── _lib/          sessão, validação, listas, contatos, conteúdo
└── api/           uma rota por arquivo
migrations/        esquema e conteúdo inicial do banco
tests/             unit, db, api, seguranca, desempenho, carga, lighthouse, e2e
docs/              requisitos, arquitetura, API, banco, testes, manual (e PDFs)
```

## Documentação

- [Requisitos](docs/requisitos.md)
- [Arquitetura](docs/arquitetura.md)
- [Modelo do banco](docs/banco.md)
- [Referência da API](docs/api.md)
- [Plano e relatório de testes](docs/testes.md)
- [Manual do painel](docs/manual-do-painel.md)
- [Segurança](SECURITY.md)
- [Como contribuir](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

---

Desenvolvido por [Gustavo Dev](https://gustavodev.dev).
