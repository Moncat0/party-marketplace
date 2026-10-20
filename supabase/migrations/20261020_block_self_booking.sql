-- Tighten booking_requests INSERT policy to block self-booking
-- (provider booking their own service)

-- Drop the old permissive insert policy
DROP POLICY IF EXISTS "Planners can create booking requests" ON booking_requests;

-- Replace with one that also blocks the service owner
CREATE POLICY "Planners can create booking requests"
  ON booking_requests FOR INSERT
  WITH CHECK (
    auth.uid() = planner_id
    AND planner_id != (
      SELECT pp.user_id
      FROM services s
      JOIN provider_profiles pp ON pp.id = s.provider_profile_id
      WHERE s.id = service_id
    )
  );
