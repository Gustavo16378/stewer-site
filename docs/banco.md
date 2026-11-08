# Modelo do banco · Stewer Gabriel

Cloudflare D1 (SQLite). O esquema está em
[`migrations/0001_schema.sql`](../migrations/0001_schema.sql) e o conteúdo
inicial em [`migrations/0002_seed.sql`](../migrations/0002_seed.sql), gerado
por [`scripts/gerar-seed.ts`](../scripts/gerar-seed.ts).

## Diagrama entidade-relacionamento

### Conteúdo do site

```mermaid
erDiagram
  midias ||--o{ slides : "foto da abertura"
  midias ||--o{ aulas : "foto das aulas"
  midias ||--o{ cortes : "foto do portfólio"
  midias ||--o{ textos : "campo .foto (valor = id)"

  midias {
    int id PK
    text caminho "arquivo de public/ ou NULL"
    blob dados "foto enviada ou NULL"
    text tipo
    text alt
    int largura
    int altura
    int bytes
  }
  slides {
    int id PK
    int foto_id FK
    text foto_posicao
    int visivel
    int ordem
    int versao
  }
  aulas {
    int id PK
    int foto_id FK
    text foto_posicao
    int visivel
    int ordem
    int versao
  }
  cortes {
    int id PK
    int foto_id FK
    text foto_posicao
    int visivel
    int ordem
    int versao
  }
  numeros {
    int id PK
    text valor
    text legenda
    int visivel
    int ordem
    int versao
  }
  servicos {
    int id PK
    text titulo
    text texto
    int visivel
    int ordem
    int versao
  }
  etapas {
    int id PK
    text titulo
    text texto
    int visivel
    int ordem
    int versao
  }
  topicos {
    int id PK
    text titulo
    text texto
    int visivel
    int ordem
    int versao
  }
  textos {
    text chave PK
    text valor
  }
  configuracoes {
    text chave PK
    text valor
  }
```

`textos` aponta para `midias` só nas chaves que terminam em `.foto`, sem
chave estrangeira (o valor é texto). Por isso a API confere a foto antes de
gravar e conta esse uso antes de deixar apagar uma foto.

### Painel e operação

```mermaid
erDiagram
  usuarios ||--o{ auditoria : "fez"
  usuarios {
    int id PK
    text nome
    text email UK "sem diferenciar maiúsculas"
    text senha_hash
    text salt
    int iteracoes
    int trocar_senha
  }
  auditoria {
    int id PK
    int usuario_id "sem FK: o registro fica se a pessoa sair"
    text usuario_nome
    text acao
    text area
    text alvo
    text detalhe
    text criado_em
  }
  tentativas {
    int id PK
    text chave "login:email"
    text ip
    text criado_em
  }
```

## Tabelas

| tabela | o que guarda | aparece no site em |
|---|---|---|
| `midias` | toda foto, original ou enviada | onde for usada |
| `slides` | fotos que se revezam na abertura | topo |
| `numeros` | +800 clientes, 10+ anos… | Quem é |
| `servicos` | cards numerados | Serviços |
| `etapas` | itens da consultoria | Consultoria |
| `topicos` | o que se aprende | Ensino |
| `aulas` | galeria dos bastidores | Ensino |
| `cortes` | fotos do portfólio | Portfólio |
| `textos` | textos e fotos fixos trocados no painel | todas as seções |
| `configuracoes` | `whatsapp`, `instagram`, `mensagem`, `latitude`, `longitude` | botões, contato, mapa |
| `usuarios` | quem entra no painel | não aparece |
| `tentativas` | freio de login | não aparece |
| `auditoria` | quem fez o quê | não aparece |

## Regras que o próprio banco garante

Mesmo que a API tivesse um bug, o banco recusa:

- `visivel` e `trocar_senha` fora de 0 e 1 (CHECK);
- foto sem arquivo e sem bytes, ou com dimensão zero (CHECK);
- item de lista de foto sem foto (NOT NULL) ou apontando para foto que não
  existe (FOREIGN KEY);
- apagar uma foto em uso por uma lista (FOREIGN KEY com RESTRICT);
- e-mail repetido, sem diferenciar maiúsculas (UNIQUE com NOCASE);
- ação de auditoria fora da lista (CHECK).

## Migrations

| arquivo | o que faz |
|---|---|
| `0001_schema.sql` | cria todas as tabelas e índices |
| `0002_seed.sql` | conteúdo que já estava no site, gerado do código |

Regra de ouro (detalhada no [CONTRIBUTING](../CONTRIBUTING.md#banco)):
**migration nova nunca altera uma antiga** e é aplicada em produção antes do
código que depende dela entrar na `main`.

```bash
npm run db:local    # banco de desenvolvimento (.wrangler/)
npm run db:remoto   # produção
```

## Capacidade

O plano gratuito do D1 aceita 500 MB por banco. Quase todo o peso são as
fotos enviadas, cerca de 0,3 MB cada depois da redução: dá espaço para mais
de mil fotos. Texto quase não ocupa. As tentativas de login com mais de um
dia são apagadas a cada login, e a auditoria guarda um ano. O painel mostra
o uso em "Minha conta" e avisa no topo a partir de 70%.
