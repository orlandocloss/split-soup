-- Fix: Allow event owners to update invitations (e.g., reset to pending)
-- The existing policy only allows invitees to update their own status

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can update their own invitations" ON event_invitations;

-- Create new policy that allows:
-- 1. Invitees to update their own invitations (accept/decline)
-- 2. Event owners to update any invitation for their events (reset to pending)
CREATE POLICY "Users can update invitations"
  ON event_invitations FOR UPDATE
  USING (
    auth.uid() = invitee_id
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_invitations.event_id
      AND events.creator_id = auth.uid()
    )
  );

