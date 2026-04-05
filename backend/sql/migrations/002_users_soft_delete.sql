-- Soft-remove users from the org (they no longer appear in team lists and cannot sign in).
-- Run after 001. From backend: npm run db:migrate

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted ON users (deleted) WHERE deleted IS TRUE;
