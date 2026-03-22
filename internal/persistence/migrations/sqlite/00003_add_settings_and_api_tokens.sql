CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at datetime
);

CREATE TABLE IF NOT EXISTS api_tokens (
    id integer PRIMARY KEY,
    name text NOT NULL UNIQUE,
    token_hash text NOT NULL,
    scopes text NOT NULL DEFAULT '[]',
    last_used_at datetime,
    created_at datetime NOT NULL
);
