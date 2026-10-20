-- Admin features: review moderation, feedback inbox, admin logs, reports

-- 1. Review moderation flag
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- 2. Feedback inbox
CREATE TABLE IF NOT EXISTS feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users (id) ON DELETE SET NULL,
  message    text NOT NULL,
  page_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Admin action log
CREATE TABLE IF NOT EXISTS admin_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES users (id) ON DELETE SET NULL,
  admin_email text,
  action      text NOT NULL,
  target_type text,
  target_id   text,
  details     jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. User/content reports
CREATE TABLE IF NOT EXISTS reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid REFERENCES users (id) ON DELETE SET NULL,
  target_type  text NOT NULL CHECK (target_type IN ('service', 'user', 'review', 'message')),
  target_id    uuid NOT NULL,
  reason       text NOT NULL,
  details      text,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by  uuid REFERENCES users (id) ON DELETE SET NULL,
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
