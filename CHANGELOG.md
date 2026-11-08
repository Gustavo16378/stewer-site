# Changelog

Mudanças do site, no formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

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
