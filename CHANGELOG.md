# Changelog

Mudanças do site, no formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [2.2.0] · 2026-11-08

### Mudado

- A abertura de marca aparece a cada carregamento (antes, uma vez por
  sessão) e ficou mais rápida: a cortina sobe em 1,5 s, contra 2,3 s.
- Movimento de rolagem mais rápido e começando mais cedo: títulos, fotos e
  números entram em menos de um segundo.

### Corrigido

- No celular, descer a página com o dedo em cima do mapa arrastava o mapa
  em vez de rolar. Agora um dedo rola a página e dois dedos mexem no mapa,
  com o aviso "Use dois dedos para mover o mapa".

## [2.1.0] · 2026-11-08

### Adicionado

- Abertura de marca na primeira visita da sessão: o S do Stewer traçado em
  dourado, o nome subindo letra por letra e a cortina revelando o site.
- Movimento de rolagem: títulos sobem linha por linha, fotos se abrem,
  números contam e a abertura tem parallax no computador. Quem pede menos
  movimento no sistema vê o site parado.
- Logo em vetor no topo e no rodapé.
- Mapa: link do Google Maps (inclusive o curto, do botão Compartilhar) e
  alfinete arrastável no painel; endereço e horário na mesma página.
- `robots.txt` e `sitemap.xml`.
- Suíte de segurança pelo OWASP Top 10 (318 testes: SQL injection, sessão,
  cabeçalhos, SSRF, upload), segurança no navegador e fiscal da CSP em todo
  E2E; `SECURITY.md`, CodeQL, Dependabot e `npm audit` na CI.
- Suíte de desempenho: orçamento de peso do build, Core Web Vitals no
  navegador com 4G lento, carga e estresse da API e Lighthouse na CI.
- Migrações `0003_sessoes` e `0004_foto_leve`.

### Mudado

- Sessões gravadas no servidor: "Sair" encerra o token de verdade, trocar a
  senha encerra as outras sessões, e senha temporária e acesso removido
  encerram todas. Quem estava logado precisa entrar de novo uma vez.
- Página abre bem mais rápido no celular (LCP de 3,2 s para ~1,7 s com 4G
  lento): conteúdo pré-carregado com o HTML, entrada sem React, primeira
  foto com prioridade, mapa e GSAP sob demanda, resto da página montado em
  fatias, fontes servidas pelo próprio site (sem Google Fonts), fotos
  recomprimidas e cache longo para os arquivos do build.
- Cabeçalhos de segurança em todas as páginas e respostas da API.

### Corrigido

- O mapa mostrava "API KEY REQUIRED": a CARTO passou a exigir chave. Agora
  o fundo cai para o OpenFreeMap e, sem ele, para o OpenStreetMap escurecido.
- Link com âncora (`#onde-atende`) abria no topo da página.
- Títulos em linhas eram lidos colados por leitor de tela e pelo Google.
- Rota de API inexistente respondia com a página do site.
- O filtro de pessoa da auditoria ignorava valor inválido.
- Contraste do "Scroll" da abertura abaixo do AA.

## [2.0.0] · 2026-11-07

### Adicionado

- Painel em `/admin` para o Stewer mudar o site sozinho, com login, na mesma
  identidade visual do site e pensado para o celular.
- Textos fixos de todas as seções editáveis, com "voltar ao original".
- Sete listas editáveis com ordem, ocultar e apagar: fotos da abertura,
  números, serviços, consultoria, ensino, fotos das aulas e portfólio.
- Biblioteca de fotos: envio com redução no navegador (até 1600px, WebP),
  descrição, download e backup de todas em .zip.
- Contatos e mapa pelo painel: WhatsApp, mensagem pronta, Instagram e
  coordenadas coladas do Google Maps, com prévia.
- Usuários com senha temporária e troca obrigatória, auditoria por dia e
  aviso de espaço do banco.
- API em Cloudflare Pages Functions com banco D1, no mesmo deploy do site e
  no plano gratuito.
- 449 testes automáticos (unitários, banco, API, E2E e acessibilidade) e CI
  no GitHub Actions.
- Documentação: requisitos, arquitetura, API, banco, testes e manual do
  painel, também em PDF.

### Mudado

- Todo o conteúdo do site passou para `src/content/site.ts`, que também é a
  reserva quando a API não responde. O visual não mudou.
- As galerias deixaram de ler `portfolio-manifest.json` e
  `instrutor-manifest.json`: as fotos vêm do banco e os vídeos continuam no
  código, intercalados.
- O endereço do rodapé passou a ser o mesmo do cartão do mapa ("Nº 15").

## [1.0.0]

- Site one page com abertura, quem é, serviços, consultoria, ensino,
  portfólio, mapa e contato.
