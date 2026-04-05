-- Run once on existing databases (after initial schema).
-- From backend: npm run db:migrate

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_primary_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE financial_records ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Primary admin = earliest user with admin role (one-time backfill if none flagged yet).
UPDATE users u
SET is_primary_admin = TRUE
WHERE u.id = (SELECT id FROM users WHERE role = 'admin'::user_role ORDER BY id ASC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM users WHERE is_primary_admin = TRUE);
