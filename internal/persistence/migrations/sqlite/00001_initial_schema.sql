CREATE TABLE IF NOT EXISTS events (
    id integer PRIMARY KEY,
    stream_id integer,
    worker_stream_id integer NOT NULL,
    flow_id text,
    section text NOT NULL,
    component_label text,
    type text NOT NULL,
    content text NOT NULL,
    meta blob NOT NULL,
    created_at datetime
);
CREATE INDEX IF NOT EXISTS idx_events_stream_id ON events(stream_id);
CREATE INDEX IF NOT EXISTS idx_events_worker_stream_id ON events(worker_stream_id);
CREATE INDEX IF NOT EXISTS idx_events_flow_id ON events(flow_id);

CREATE TABLE IF NOT EXISTS streams (
    id integer PRIMARY KEY,
    parent_id integer,
    name text NOT NULL,
    input_label text,
    input_component text NOT NULL,
    input_config blob NOT NULL,
    output_label text,
    output_component text NOT NULL,
    output_config blob NOT NULL,
    buffer_id integer,
    is_current numeric DEFAULT true,
    status text NOT NULL,
    created_at datetime NOT NULL,
    updated_at datetime
);
CREATE INDEX IF NOT EXISTS idx_streams_parent_id ON streams(parent_id);

CREATE TABLE IF NOT EXISTS stream_processors (
    id integer PRIMARY KEY,
    stream_id integer NOT NULL,
    component text NOT NULL,
    label text,
    config blob,
    created_at datetime NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stream_processors_stream_id ON stream_processors(stream_id);

CREATE TABLE IF NOT EXISTS stream_caches (
    id integer PRIMARY KEY,
    stream_id integer NOT NULL,
    cache_id integer NOT NULL,
    created_at datetime NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stream_caches_stream_id ON stream_caches(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_caches_cache_id ON stream_caches(cache_id);

CREATE TABLE IF NOT EXISTS workers (
    id text PRIMARY KEY,
    address text,
    last_heartbeat datetime,
    status text
);

CREATE TABLE IF NOT EXISTS worker_streams (
    id integer PRIMARY KEY,
    worker_id text NOT NULL,
    stream_id integer NOT NULL,
    input_events integer NOT NULL DEFAULT 0,
    processor_errors integer NOT NULL DEFAULT 0,
    output_events integer NOT NULL DEFAULT 0,
    status text NOT NULL,
    lease_expires_at datetime,
    created_at datetime NOT NULL,
    updated_at datetime
);
CREATE INDEX IF NOT EXISTS idx_worker_streams_worker_id ON worker_streams(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_streams_stream_id ON worker_streams(stream_id);

CREATE TABLE IF NOT EXISTS secrets (
    key text PRIMARY KEY,
    encrypted_value text NOT NULL,
    created_at datetime
);

CREATE TABLE IF NOT EXISTS caches (
    id integer PRIMARY KEY,
    parent_id integer,
    label text NOT NULL,
    component text NOT NULL,
    config blob NOT NULL,
    is_current numeric DEFAULT true,
    created_at datetime NOT NULL,
    updated_at datetime
);
CREATE INDEX IF NOT EXISTS idx_caches_parent_id ON caches(parent_id);

CREATE TABLE IF NOT EXISTS buffers (
    id integer PRIMARY KEY,
    parent_id integer,
    label text NOT NULL,
    component text NOT NULL,
    config blob NOT NULL,
    is_current numeric DEFAULT true,
    created_at datetime NOT NULL,
    updated_at datetime
);
CREATE INDEX IF NOT EXISTS idx_buffers_parent_id ON buffers(parent_id);

CREATE TABLE IF NOT EXISTS rate_limits (
    id integer PRIMARY KEY,
    parent_id integer,
    label text NOT NULL,
    component text NOT NULL,
    config blob NOT NULL,
    is_current numeric DEFAULT true,
    created_at datetime NOT NULL,
    updated_at datetime
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_parent_id ON rate_limits(parent_id);

CREATE TABLE IF NOT EXISTS rate_limit_states (
    id integer PRIMARY KEY,
    rate_limit_label text NOT NULL,
    key text NOT NULL,
    tokens real NOT NULL,
    last_refill_at datetime NOT NULL,
    created_at datetime NOT NULL,
    updated_at datetime NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_label_key ON rate_limit_states(rate_limit_label, key);

CREATE TABLE IF NOT EXISTS stream_rate_limits (
    id integer PRIMARY KEY,
    stream_id integer NOT NULL,
    rate_limit_id integer NOT NULL,
    created_at datetime NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stream_rate_limits_stream_id ON stream_rate_limits(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_rate_limits_rate_limit_id ON stream_rate_limits(rate_limit_id);

CREATE TABLE IF NOT EXISTS stream_buffers (
    id integer PRIMARY KEY,
    stream_id integer NOT NULL,
    buffer_id integer NOT NULL,
    created_at datetime NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stream_buffers_stream_id ON stream_buffers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_buffers_buffer_id ON stream_buffers(buffer_id);
