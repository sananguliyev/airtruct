CREATE TABLE IF NOT EXISTS files (
    id integer PRIMARY KEY,
    parent_id integer,
    key text NOT NULL,
    content blob NOT NULL,
    size integer NOT NULL DEFAULT 0,
    is_current boolean NOT NULL DEFAULT true,
    created_at datetime NOT NULL,
    updated_at datetime
);
CREATE INDEX IF NOT EXISTS idx_files_key ON files(key);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
