# Plano e relatório de testes · Stewer Gabriel

Como o sistema é verificado, o que cada suíte cobre e como cada requisito de
[requisitos.md](requisitos.md) é testado.

## Resumo

| suíte | técnica | o que roda | testes |
|---|---|---|---|
| Unitários | caixa branca | bibliotecas da API e do site, isoladas | 143 |
| Banco | caixa branca | migrations aplicadas do zero num SQLite em memória | 51 |
| API | caixa preta e caixa cinza | a API real (wrangler, runtime da Cloudflare) com um D1 isolado | 201 |
| E2E | caixa preta | site e painel num navegador, no computador (1440px) e no celular (390px) | 46 |
| Acessibilidade | caixa preta | axe-core, regras WCAG 2 A e AA | 8 |
| **Total** | | | **449** |

Os E2E e os de acessibilidade rodam duas vezes cada, uma no computador e uma
no celular: são 27 cenários.

Cobertura de linhas dos unitários: 90% nas bibliotecas (`functions/_lib`,
`src/lib`, `src/content/site.ts`, zip do painel). O que fica de fora do
unitário (`conteudo.ts` e `auditoria.ts`) depende do banco e é coberto pela
suíte de API.

## As três técnicas

**Caixa branca** conhece o código e testa os caminhos de dentro: cada ramo
da validação, o hash de senha, a assinatura do token, a leitura das
coordenadas, a troca do conteúdo de reserva, o formato binário do zip. Fica
em `tests/unit/` e `tests/db/`.

**Caixa preta** só conhece a interface: manda um pedido HTTP ou clica na
tela e confere a resposta, sem saber como foi feito. É a maior parte de
`tests/api/` e todo o `tests/e2e/`. Os contratos em
[`tests/contratos.ts`](../tests/contratos.ts) (schemas Zod) definem o que a
API promete ao site e ao painel.

**Caixa cinza** faz o pedido pela interface, como a preta, mas depois abre
o banco do servidor de teste (só leitura) e confere o que foi gravado: que a
senha virou hash, que a auditoria registrou quem fez, que a versão subiu,
que o dado inválido não chegou ao banco. Os testes marcados "caixa cinza" em
`tests/api/` fazem isso pela função `banco()` de
[`tests/api/cliente.ts`](../tests/api/cliente.ts).

## Ambiente

Nenhum teste toca o banco de desenvolvimento nem o de produção.
[`tests/servidor-teste.mjs`](../tests/servidor-teste.mjs) cria, a cada
rodada, uma pasta temporária, aplica todas as migrations, cria um usuário de
teste e sobe o `wrangler pages dev` apontado para ela. Os testes de API e os
E2E usam esse servidor; ao terminar, a pasta é apagada.

Os arquivos da suíte de API contam uma história em ordem (01-contrato até
09-seguranca) sobre um banco só, por isso rodam em sequência, pelo nome.
Os E2E que mudam conteúdo devolvem tudo como estava, porque o computador e o
celular rodam sobre o mesmo banco.

## Como rodar

```bash
npm run build      # a API e os E2E servem o dist/
npm test           # unitários + banco + API
npm run test:e2e   # E2E e acessibilidade (baixe o navegador uma vez: npx playwright install chromium)
npm run test:tudo  # tudo, na ordem
npm run test:cobertura
```

No GitHub, o workflow [`testes.yml`](../.github/workflows/testes.yml) roda a
pirâmide inteira a cada push e pull request na `main`, e guarda o relatório
do E2E quando algo falha.

## O que cada suíte cobre

### Unitários (`tests/unit/`)

| arquivo | testes | o que confere |
|---|---|---|
| `auth.test.ts` | 19 | hash PBKDF2 com salt, compatível com o script de criar acesso; JWT assinado, adulterado, vencido; cookie seguro |
| `http.test.ts` | 18 | leitura do corpo com limite e tipo; formato único de erro; erro inesperado sem detalhe |
| `entidades.test.ts` | 32 | lista fechada de tabelas (inclusive `__proto__` e `toString`); limites; enquadramento da foto; o que mudou, em português |
| `config.test.ts` | 36 | WhatsApp, Instagram, mensagem e coordenadas no formato que o Stewer digita ou cola; ponto fora do Brasil |
| `site.test.ts` | 7 | telefone formatado, links de WhatsApp, Instagram e rota; graus, minutos e segundos iguais aos do site original |
| `textos.test.ts` | 9 | chaves únicas; todas as seções; texto original cabe no limite; aplicar ignora chave e tipo errados |
| `conteudo-remoto.test.ts` | 12 | troca antes do render, mesma referência das listas, vídeos intactos, foto quebrada fora, abertura sem foto, API fora ou lenta |
| `utilitarios.test.ts` | 10 | zip do backup lido byte a byte e conferido com o CRC do zlib; nomes de arquivo; senha temporária |

### Banco (`tests/db/`)

`schema.test.ts` (51): migrations em sequência e aplicáveis uma a uma;
todas as tabelas; o seed igual ao conteúdo do código, item a item e na
mesma ordem; toda foto do seed existe em `public/`; CHECK, NOT NULL, UNIQUE
e FOREIGN KEY de cada lista; versão para edição simultânea; índices e o
plano da consulta da auditoria.

### API (`tests/api/`)

| arquivo | testes | o que confere |
|---|---|---|
| `01-contrato` | 10 | `/api/conteudo` no contrato, sem nada interno; formato único de erro; foto original redireciona |
| `02-autenticacao` | 63 | login, trava, hash no banco, sessão, logout, e as 50 rotas do painel exigindo login |
| `03-listas` | 42 | as sete listas no contrato; criar, editar, ocultar, reordenar, apagar refletindo no site; ordem incompleta; validação; lista fechada |
| `04-fotos` | 18 | tipos aceitos pelos bytes; arquivo disfarçado, SVG e grande demais recusados; download; foto em uso protegida (lista e texto) |
| `05-contatos` | 14 | WhatsApp, Instagram, mensagem e mapa chegando ao site; inválidos; pacote inteiro ou nada |
| `06-textos` | 13 | gravar, foto de seção, voltar ao original, normalização, limites, pacote inteiro ou nada |
| `07-concorrencia` | 6 | versão velha recusada com o nome de quem salvou; dez gravações ao mesmo tempo, uma vence |
| `08-usuarios-auditoria` | 18 | dar acesso, senha temporária, troca obrigatória, tirar acesso, auditoria, espaço do banco |
| `09-seguranca` | 17 | CSRF, XSS guardado como texto, Instagram malicioso, corpo grande, tipo errado, prototype pollution, erro sem vazar detalhe |

### E2E e acessibilidade (`tests/e2e/`)

| arquivo | cenários | o que confere |
|---|---|---|
| `site.spec.ts` | 9 | site abre sem erro com o banco; portfólio intercala vídeo; foto ampliada pelo teclado; API fora e lenta; links de contato; mapa; seção some sem itens; HTML no nome do lugar não vira elemento |
| `painel.spec.ts` | 14 | login; editar serviço e ver no site; reordenar com as setas; texto e voltar ao original; enviar foto (reduzida para 1600px); nova foto no portfólio; contatos e prévia do mapa; erro em português; duas pessoas no mesmo item; acesso com senha temporária; auditoria; espaço; todas as abas sem rolagem lateral; sair |
| `acessibilidade.spec.ts` | 4 | login, todas as abas e o formulário aberto sem violação grave; o que o painel coloca no site sem violação nova |

## Rastreabilidade

| requisito | testado em |
|---|---|
| RF01 | `conteudo-remoto` · `01-contrato` · `03-listas` · `site.spec` |
| RF02 | `conteudo-remoto` · `03-listas` (ocultar, tudo oculto) · `site.spec` (seção some) |
| RF03 | `conteudo-remoto` (falhas e 2,5 s) · `site.spec` (API fora e lenta) |
| RF04 | `textos` · `06-textos` · `painel.spec` |
| RF05 | `site` · `conteudo-remoto` · `05-contatos` · `site.spec` (links e mapa) |
| RF06 | `conteudo-remoto` (vídeos intactos) · `site.spec` (vídeo intercalado) |
| RF10 | `02-autenticacao` · `painel.spec` |
| RF11 | `entidades` · `03-listas` · `painel.spec` |
| RF12 | `utilitarios` (zip) · `04-fotos` · `painel.spec` |
| RF13 | `painel.spec` (3000px vira 1600px) |
| RF14 | `textos` · `06-textos` · `painel.spec` |
| RF15 | `config` · `05-contatos` · `08-usuarios-auditoria` (senha) · `painel.spec` |
| RF16 | `utilitarios` (senha temporária) · `08-usuarios-auditoria` · `painel.spec` |
| RF17 | `08-usuarios-auditoria` · `painel.spec` |
| RF18 | `entidades` (o que mudou) · todas as suítes de API (`ultimaAuditoria`) · `painel.spec` |
| RF19 | `08-usuarios-auditoria` · `painel.spec` |
| RF20 | `03-listas` · `painel.spec` |
| RNF01 | `auth` · `02-autenticacao` (caixa cinza) · `08-usuarios-auditoria` |
| RNF02 | `auth` · `02-autenticacao` |
| RNF03 | `09-seguranca` |
| RNF04 | `02-autenticacao` |
| RNF05 | `entidades` · `03-listas` · `09-seguranca` |
| RNF06 | `04-fotos` |
| RNF07 | `schema` · `07-concorrencia` · `painel.spec` |
| RNF08 | `05-contatos` · `06-textos` · `03-listas` (ordem) |
| RNF09 | `entidades` · `config` · `schema` · `03-listas` · `04-fotos` |
| RNF10 | `contratos.ts` em todas as suítes de API · `http` |
| RNF11 | `painel.spec` (todas as abas no celular e no computador) |
| RNF12 | `acessibilidade.spec` |
| RNF13 | `schema` (índices) · `08-usuarios-auditoria` (limpeza e espaço) |
| RNF14 | `conteudo-remoto` · `site.spec` |
| RNF15 | `schema` · workflow do CI |
| RNF16 | `schema` (seed igual ao código) · `site` (coordenadas iguais) · comparação de capturas (abaixo) |

## Achados

O que os testes encontraram durante o desenvolvimento e já foi corrigido:

| achado | como apareceu | correção |
|---|---|---|
| Instagram `a/../../x` era aceito e gravado como `a`, sem avisar | `09-seguranca` | só limpa o resto do texto quando é o link do perfil; qualquer outra barra é recusada |
| Títulos dos grupos da lateral do painel com contraste abaixo do AA | `acessibilidade.spec` | cor trocada pelo tom "areia" do painel |
| Os números de "Quem é" quebravam diferente no celular depois da troca para lista | comparação de capturas | volta à mesma estrutura de flex do original |
| Os botões de zoom do mapa perdiam o estilo escuro | comparação de capturas | o CSS do Leaflet voltou a carregar antes do CSS do site |
| Ordem enviada sem um dos itens deixaria dois itens na mesma posição | revisão ao escrever `03-listas` | a API exige a lista completa e responde 409 |

## Fidelidade ao design (RNF16)

Além dos testes automáticos, o site novo foi comparado com o site da `main`
por captura da página inteira, no computador (1440px) e no celular
(390px), pixel a pixel. As únicas diferenças restantes são o quadro do vídeo
em reprodução, a foto da abertura no meio da troca e o endereço do rodapé,
que agora mostra "Nº 15" como o cartão do mapa, porque os dois leem o mesmo
endereço.
