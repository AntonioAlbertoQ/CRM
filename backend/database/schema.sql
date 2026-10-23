-- 1. Contas: a senha é armazenada somente como hash e salt, nunca em texto puro.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 2 AND 80),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessões: somente o hash do token do navegador fica persistido no SQL.
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices usados para localizar sessões por conta e limpar sessões vencidas.
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 4. Versão inicial do esquema para futuras migrações SQL.
PRAGMA user_version = 1;
