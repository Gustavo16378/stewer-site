# Requisitos · Stewer Gabriel

Site institucional do Stewer Gabriel (visagista e consultor de imagem
masculina em Palmas, TO) e o painel em `/admin` para ele mudar o conteúdo
sozinho, sem depender de quem programou.

Cada requisito tem um identificador. Os testes citam esse identificador no
nome (`RF11 · …`), e a [matriz de rastreabilidade](testes.md#rastreabilidade)
liga um ao outro.

## Atores

| ator | quem é | o que faz |
|---|---|---|
| Visitante | qualquer pessoa na internet | vê o trabalho, chama no WhatsApp, abre a rota no mapa |
| Stewer | quem tem login no painel (ele e quem ele der acesso) | mantém textos, fotos, listas, contatos e mapa; dá e tira acesso |
| Mantenedor | quem cuida do código (hoje, o Gustavo, pelo GitHub) | publica, aplica migrations, cria o primeiro acesso, troca vídeos |

## Restrições

| id | restrição |
|---|---|
| RE01 | Custo zero de operação: só o domínio é pago. |
| RE02 | Hospedagem no Cloudflare (Pages, Functions e D1 no plano gratuito), no mesmo projeto do site. |
| RE03 | O design aprovado não muda: o site lido do banco fica igual ao que já estava no ar. |
| RE04 | O Stewer não é técnico: tudo pelo painel, em português, também pelo celular. |
| RE05 | Vídeos ficam no código: não cabem numa linha do D1 e um serviço de arquivos (R2) exigiria cartão na conta. |

## Requisitos funcionais

### Site público

| id | requisito |
|---|---|
| RF01 | O site mostra as fotos da abertura, os números, os serviços, os itens da consultoria, os tópicos do ensino, as fotos das aulas e o portfólio vindos do banco, na ordem do painel. |
| RF02 | Item oculto no painel não aparece. Seção de serviços sem nenhum item visível sai da página; números, consultoria, tópicos e galeria das aulas escondem só o bloco; portfólio vazio mostra o aviso; abertura sem foto visível mantém as fotos de reserva. |
| RF03 | Se a API falhar ou demorar mais de 2,5 s, o site abre com o conteúdo de reserva do código. |
| RF04 | Textos e fotos fixos de cada seção (abertura, quem é, serviços, consultoria, ensino, portfólio, onde atende, contato, rodapé) vêm do banco quando foram trocados no painel. |
| RF05 | WhatsApp (botões e telefone), mensagem pronta, Instagram e o local do mapa (marcador, coordenadas, rota e Google Maps) são os configurados no painel. |
| RF06 | Os vídeos do portfólio e das aulas continuam no código e aparecem intercalados com as fotos do banco. |

### Painel

| id | requisito |
|---|---|
| RF10 | Só entra no painel quem tem login; a sessão expira em 8 horas. |
| RF11 | O Stewer cria, edita, apaga, oculta e reordena as sete listas: fotos da abertura, números, serviços, consultoria, ensino, fotos das aulas e portfólio. |
| RF12 | O Stewer envia fotos, corrige a descrição, apaga as que não estão em uso e baixa uma ou todas (.zip). |
| RF13 | Fotos enviadas são reduzidas (até 1600px) e convertidas para WebP no navegador, antes de subir. |
| RF14 | O Stewer edita os textos e fotos fixos de cada seção e pode voltar qualquer campo ao original. |
| RF15 | O Stewer troca WhatsApp, mensagem pronta, Instagram e o local do mapa (colando as coordenadas do Google Maps, com prévia), e a própria senha. |
| RF16 | Quem tem acesso dá e tira acesso de outra pessoa e gera senha temporária para quem esqueceu. |
| RF17 | Quem entra com senha temporária é obrigado a criar uma senha própria antes de usar o painel. |
| RF18 | Toda alteração e todo login ficam registrados (quem, o quê, quando) e são consultáveis por dia e pessoa. |
| RF19 | O painel mostra o espaço usado do banco e avisa a partir de 70%. |
| RF20 | Nas listas de foto, escolher ou enviar a foto já cria o item no fim da lista, com o enquadramento padrão. |

## Requisitos não funcionais

| id | categoria | requisito |
|---|---|---|
| RNF01 | Segurança | Senhas guardadas só como hash PBKDF2-SHA256 com salt por usuário. |
| RNF02 | Segurança | Sessão em cookie `HttpOnly`, `SameSite=Strict` (e `Secure` em HTTPS), assinada (JWT HS256). |
| RNF03 | Segurança | Pedido que altera dados vindo de outra origem é recusado (CSRF). |
| RNF04 | Segurança | Login trava 15 minutos depois de 5 senhas erradas; a mensagem não revela se o e-mail existe. |
| RNF05 | Segurança | Nenhum nome de tabela ou coluna vem do pedido; valores sempre por bind (sem SQL injection). |
| RNF06 | Segurança | Upload aceita só JPG, PNG e WebP conferidos pelos bytes, até 1,5 MB. |
| RNF07 | Integridade | Duas pessoas editando o mesmo item: quem salva por cima recebe aviso, nada é sobrescrito em silêncio. |
| RNF08 | Integridade | Mudanças de vários registros (reordenar, contatos, textos de uma seção) são gravadas juntas ou nenhuma. |
| RNF09 | Integridade | Foto em uso não pode ser apagada; dados inválidos são recusados com mensagem em português. |
| RNF10 | Contrato | As respostas da API seguem o formato que o site e o painel esperam (schemas em `tests/contratos.ts`). |
| RNF11 | Usabilidade | Painel em português, utilizável no celular (390px) e no computador. |
| RNF12 | Acessibilidade | Painel sem violações graves (axe, WCAG 2 A/AA); o conteúdo que o painel coloca no site não cria violação nova. |
| RNF13 | Capacidade | Cabe no plano gratuito do D1 (500 MB): fotos reduzidas, tentativas de login limpas sozinhas, auditoria guardada por um ano. |
| RNF14 | Disponibilidade | O site público nunca fica em branco por causa do backend (ver RF03). |
| RNF15 | Manutenção | Esquema do banco versionado em migrations; cada parte testada automaticamente no CI. |
| RNF16 | Fidelidade | O site montado com o conteúdo do banco é visualmente igual ao site anterior ao painel. |

## Fora do escopo

- Upload de vídeo pelo painel (ver RE05). Para trocar um vídeo, o arquivo vai
  para `public/videosImgs/` (portfólio) ou `public/instrutorVideos/` (aulas) e
  o caminho entra em `VIDEOS_PORTFOLIO` ou `VIDEOS_AULAS` em
  `src/content/site.ts`.
- Agendamento online: fica no app de agenda, que é outro projeto.
- Trocar cores, fontes e layout: o painel muda o conteúdo, não o design.
