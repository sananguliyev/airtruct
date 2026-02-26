CREATE TABLE IF NOT EXISTS files (
    id bigserial PRIMARY KEY,
    parent_id bigint,
    key text NOT NULL,
    content bytea NOT NULL,
    size bigint NOT NULL DEFAULT 0,
    is_current boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_files_key ON files(key);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
