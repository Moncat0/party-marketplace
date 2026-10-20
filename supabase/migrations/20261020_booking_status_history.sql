-- Status history for booking_requests
CREATE TABLE IF NOT EXISTS booking_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES booking_requests (id) ON DELETE CASCADE,
  from_status     text,
  to_status       text NOT NULL,
  changed_by_id   uuid REFERENCES users (id) ON DELETE SET NULL,
  changed_by_role text CHECK (changed_by_role IN ('admin', 'provider', 'planner')),
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_status_history_booking_id_idx
  ON booking_status_history (booking_id, created_at DESC);

ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

-- Admins manage via service role (no RLS policy needed for reads here)
-- Providers and planners cannot read each other's history directly
