-- Stewer Gabriel · esquema do banco (Cloudflare D1, SQLite)
--
-- Tudo que o Stewer edita pelo painel mora aqui. O design (cores, layout,
-- animações) continua no código; o conteúdo vem do banco.
--
-- Fotos: cada linha de `midias` é uma foto. As que já vieram no site
-- apontam para um arquivo em /public (`caminho`); as que sobem pelo painel
-- guardam a imagem no próprio banco (`dados`), já reduzida no navegador.
-- Assim não depende de nenhum serviço pago de armazenamento.
--
-- Vídeos ficam no código (public/videosImgs): não cabem numa linha do D1.

PRAGMA foreign_keys = ON;

CREATE TABLE midias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  caminho     TEXT,                        -- arquivo estático, ex.: /portfolioImgs/corte1.jpeg
  dados       BLOB,                        -- imagem enviada pelo painel
  tipo        TEXT NOT NULL DEFAULT 'image/jpeg',
  alt         TEXT NOT NULL,
  largura     INTEGER NOT NULL CHECK (largura > 0),
  altura      INTEGER NOT NULL CHECK (altura > 0),
  bytes       INTEGER NOT NULL DEFAULT 0,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (caminho IS NOT NULL OR dados IS NOT NULL)
);

-- -------------------------------------------------------------- listas
-- Todas têm `ordem` (a ordem no site), `visivel` (esconder sem apagar) e
-- `versao` (trava contra duas pessoas salvando o mesmo item ao mesmo tempo).

-- fotos que se revezam na abertura
CREATE TABLE slides (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  foto_id        INTEGER NOT NULL REFERENCES midias(id) ON DELETE RESTRICT,
  foto_posicao   TEXT NOT NULL DEFAULT '50% 0%',
  visivel        INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem          INTEGER NOT NULL DEFAULT 0,
  versao         INTEGER NOT NULL DEFAULT 0,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- os números de "Quem é" (+800 clientes, 10+ anos)
CREATE TABLE numeros (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  valor          TEXT NOT NULL,
  legenda        TEXT NOT NULL,
  visivel        INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem          INTEGER NOT NULL DEFAULT 0,
  versao         INTEGER NOT NULL DEFAULT 0,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- cards da seção Serviços
CREATE TABLE servicos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo         TEXT NOT NULL,
  texto          TEXT NOT NULL,
  visivel        INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem          INTEGER NOT NULL DEFAULT 0,
  versao         INTEGER NOT NULL DEFAULT 0,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- o que entra na Consultoria
CREATE TABLE etapas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo         TEXT NOT NULL,
  texto          TEXT NOT NULL,
  visivel        INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem          INTEGER NOT NULL DEFAULT 0,
  versao         INTEGER NOT NULL DEFAULT 0,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- o que se aprende na seção Ensino
CREATE TABLE topicos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo         TEXT NOT NULL,
  texto          TEXT NOT NULL,
  visivel        INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem          INTEGER NOT NULL DEFAULT 0,
  versao         INTEGER NOT NULL DEFAULT 0,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- fotos dos bastidores das aulas
CREATE TABLE aulas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  foto_id        INTEGER NOT NULL REFERENCES midias(id) ON DELETE RESTRICT,
  foto_posicao   TEXT NOT NULL DEFAULT '50% 50%',
  visivel        INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem          INTEGER NOT NULL DEFAULT 0,
  versao         INTEGER NOT NULL DEFAULT 0,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- fotos do portfólio de cortes
CREATE TABLE cortes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  foto_id        INTEGER NOT NULL REFERENCES midias(id) ON DELETE RESTRICT,
  foto_posicao   TEXT NOT NULL DEFAULT '50% 50%',
  visivel        INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem          INTEGER NOT NULL DEFAULT 0,
  versao         INTEGER NOT NULL DEFAULT 0,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------- textos fixos
-- Textos e fotos fixos de cada seção, trocados pela aba "Textos do site".
-- A lista de chaves válidas mora em src/lib/textos.ts. Chave sem linha
-- aqui fica com o texto original do código. Em campo de foto, `valor` é o
-- id da foto em `midias`.
CREATE TABLE textos (
  chave          TEXT PRIMARY KEY,
  valor          TEXT NOT NULL,
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- contatos e mapa: whatsapp, instagram, mensagem, latitude, longitude
CREATE TABLE configuracoes (
  chave   TEXT PRIMARY KEY,
  valor   TEXT NOT NULL
);

-- ---------------------------------------------------------------- acesso

CREATE TABLE usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash    TEXT NOT NULL,              -- PBKDF2-SHA256, base64
  salt          TEXT NOT NULL,              -- base64
  iteracoes     INTEGER NOT NULL,
  -- senha temporária gerada por outra pessoa: obriga a trocar no próximo login
  trocar_senha  INTEGER NOT NULL DEFAULT 0 CHECK (trocar_senha IN (0, 1)),
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- freio contra senha errada no login
CREATE TABLE tentativas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  chave       TEXT NOT NULL COLLATE NOCASE,   -- 'login:<email>'
  ip          TEXT NOT NULL,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- quem fez o quê no painel, e quando
CREATE TABLE auditoria (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id    INTEGER,                    -- sem chave estrangeira: o registro fica mesmo se a pessoa sair
  usuario_nome  TEXT NOT NULL,
  acao          TEXT NOT NULL CHECK (acao IN ('criou', 'editou', 'apagou', 'reordenou', 'entrou', 'enviou', 'trocou')),
  area          TEXT NOT NULL,              -- servicos, cortes, fotos, textos, usuarios…
  alvo          TEXT NOT NULL DEFAULT '',   -- nome do que foi mexido, como aparece no painel
  detalhe       TEXT NOT NULL DEFAULT '',   -- campos alterados, em português
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_slides_ordem   ON slides (ordem);
CREATE INDEX idx_numeros_ordem  ON numeros (ordem);
CREATE INDEX idx_servicos_ordem ON servicos (ordem);
CREATE INDEX idx_etapas_ordem   ON etapas (ordem);
CREATE INDEX idx_topicos_ordem  ON topicos (ordem);
CREATE INDEX idx_aulas_ordem    ON aulas (ordem);
CREATE INDEX idx_cortes_ordem   ON cortes (ordem);
CREATE INDEX idx_tentativas     ON tentativas (chave, criado_em);
CREATE INDEX idx_auditoria_criado ON auditoria (criado_em DESC);
