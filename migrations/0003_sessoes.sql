-- Sessões no servidor (RNF02).
--
-- O token do cookie é um JWT: sozinho, valeria até expirar (8 h), mesmo
-- depois de "Sair". Agora cada login cria uma linha aqui, e o token leva o
-- id dela. Sem a linha, o token não vale, por melhor que seja a assinatura.
--
-- Sair apaga a linha daquela sessão. Trocar a senha apaga as outras
-- sessões da pessoa; receber uma senha temporária apaga todas.
CREATE TABLE sessoes (
  id          TEXT PRIMARY KEY,                -- 128 bits aleatórios, base64url
  usuario_id  INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em   TEXT NOT NULL
);

CREATE INDEX sessoes_usuario ON sessoes (usuario_id);
