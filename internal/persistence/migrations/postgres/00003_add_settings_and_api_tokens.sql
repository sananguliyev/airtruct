CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS api_tokens (
    id bigserial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    token_hash text NOT NULL,
    scopes jsonb NOT NULL DEFAULT '[]',
    last_used_at timestamptz,
    created_at timestamptz NOT NULL
);
