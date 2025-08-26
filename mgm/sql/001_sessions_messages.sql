BEGIN;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  alias TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content JSONB NOT NULL,
  model TEXT,
  provider TEXT,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  embed_tokens INT DEFAULT 0,
  cost_usd NUMERIC(12,6) DEFAULT 0,
  latency_ms INT DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_alias ON sessions(alias);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at);

COMMIT;
