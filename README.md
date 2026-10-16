# Stewer Gabriel · Visagismo e Consultoria de Imagem

Site institucional one page do **Stewer Gabriel**, visagista e consultor de imagem masculina em Palmas, Tocantins. Apresenta os serviços, a consultoria, os cursos para profissionais e o portfólio de cortes, com agendamento direto pelo WhatsApp.

🔗 **[stewergabriel.com](https://stewergabriel.com)**

## Stack

| Peça | Escolha |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilo | Tailwind CSS 3 com paleta própria |
| Mapa | Leaflet |
| Imagens | Sharp, para gerar a imagem de compartilhamento |

## Seções

A página segue a ordem em que um cliente conhece o trabalho:

1. **Hero** com a foto principal e a chamada de agendamento
2. **Sobre**, com a história e a proposta do visagismo
3. **Serviços** oferecidos no estúdio
4. **Consultoria** de imagem, com as etapas do atendimento
5. **Instrutor**, com os cursos para outros profissionais
6. **Portfólio** de cortes, com fotos e vídeo
7. **Localização** com mapa interativo
8. **Contato** com WhatsApp e Instagram

## Detalhes de implementação

- **Identidade visual dark e sóbria**: fundo carvão, texto creme e dourado como acento, com Playfair Display nos títulos e Inter no corpo. As cores ficam centralizadas como tokens no `tailwind.config.js`.
- **Animações leves**: um único `IntersectionObserver` controla o fade-up de todos os elementos ao rolar a página, sem biblioteca de animação.
- **Portfólio sem código**: as fotos e vídeos são listados em `public/portfolio-manifest.json` e `public/instrutor-manifest.json`. Para adicionar um corte novo, basta colocar o arquivo na pasta e incluir o nome no manifesto.
- **Compartilhamento cuidado**: o script `generate-og-image.mjs` recorta a foto principal no tamanho certo (1200x630) e aplica um gradiente escuro, gerando a prévia que aparece no WhatsApp e nas redes sociais.
- **SEO local**: título, descrição e tags Open Graph voltados para busca em Palmas.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # checa os tipos e gera o dist/
npm run preview    # serve o build localmente
```

Para regenerar a imagem de compartilhamento depois de trocar a foto principal:

```bash
npm run og:image
```

## Estrutura

```
src/
├── components/   uma seção por arquivo, na ordem da página
├── App.tsx       monta as seções e liga as animações de scroll
└── index.css

public/
├── photos/                  fotos do hero e da seção sobre
├── portifolioImgs/          cortes do portfólio
├── instrutorImgs/           fotos dos cursos
├── portfolio-manifest.json
├── instrutor-manifest.json
└── og-image.jpg

scripts/
└── generate-og-image.mjs
```

## Autor

Desenvolvido por [Gustavo Barbosa Lima](https://gustavodev.dev).
