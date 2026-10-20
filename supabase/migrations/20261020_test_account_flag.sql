-- Add test account flag and admin flag to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_test_account boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN users.is_test_account IS 'When true, exclude from public search, stats, and analytics';
COMMENT ON COLUMN users.is_admin IS 'When true, user has access to /admin panel';
