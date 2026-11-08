/**
 * Entradas maliciosas usadas pela suíte de segurança. Clássicas de SQL
 * injection (OWASP Testing Guide, WSTG-INPV-05), adaptadas ao SQLite.
 */
export const SQL = [
  `' OR '1'='1`,
  `' OR 1=1 --`,
  `" OR ""="`,
  `admin'--`,
  `1; DROP TABLE usuarios; --`,
  `'; DROP TABLE servicos; --`,
  `' UNION SELECT id, email, senha_hash, salt, iteracoes FROM usuarios --`,
  `1 UNION ALL SELECT name FROM sqlite_master --`,
  `') OR ('1'='1`,
  `' AND (SELECT COUNT(*) FROM usuarios) > 0 --`,
  `'||(SELECT senha_hash FROM usuarios LIMIT 1)||'`,
  `\\'; DELETE FROM textos; --`,
  `1/**/OR/**/1=1`,
  `' OR sqlite_version() IS NOT NULL --`,
  `%27%20OR%201%3D1%20--`,
]

/** pedaços que só apareceriam numa resposta se o banco tivesse vazado */
export const VAZAMENTO = /senha_hash|"salt"|sqlite_master|SQLITE_|syntax error|no such (table|column)|D1_ERROR/i
