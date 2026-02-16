-- =============================================
-- DATABASE CLEANUP FUNCTIONS
-- Automatically removes stale data to keep the database lean
-- =============================================

-- =============================================
-- 1. CLEANUP PAST EVENTS
-- Deletes events that occurred before today
-- (CASCADE will auto-delete related event_invitations)
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_past_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM events 
  WHERE date < CURRENT_DATE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. CLEANUP FULLY READ ALERTS
-- Deletes alerts where ALL recipients have read them
-- (CASCADE will auto-delete related alert_recipients)
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_read_alerts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM alerts
  WHERE id IN (
    SELECT a.id
    FROM alerts a
    WHERE NOT EXISTS (
      SELECT 1 FROM alert_recipients ar
      WHERE ar.alert_id = a.id
      AND ar.read_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM alert_recipients ar
      WHERE ar.alert_id = a.id
    )
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. CLEANUP OLD ALERTS
-- Deletes alerts older than 7 days (even if unread - they're stale)
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM alerts
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. CLEANUP DECLINED FRIENDSHIPS
-- Deletes friendships that were declined over 30 days ago
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_declined_friendships()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM friendships
  WHERE status = 'declined'
  AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. MASTER CLEANUP FUNCTION
-- Runs all cleanup tasks and returns summary
-- =============================================
CREATE OR REPLACE FUNCTION run_database_cleanup()
RETURNS TABLE(task TEXT, deleted_count INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT 'past_events'::TEXT, cleanup_past_events();
  RETURN QUERY SELECT 'read_alerts'::TEXT, cleanup_read_alerts();
  RETURN QUERY SELECT 'old_alerts'::TEXT, cleanup_old_alerts();
  RETURN QUERY SELECT 'declined_friendships'::TEXT, cleanup_declined_friendships();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. POLICIES FOR DELETION
-- =============================================

-- Allow senders to delete their own alerts
DROP POLICY IF EXISTS "alerts_delete_own" ON alerts;
CREATE POLICY "alerts_delete_own"
  ON alerts FOR DELETE 
  USING (auth.uid() = sender_id);

-- =============================================
-- WHAT'S AUTOMATICALLY CLEANED BY CASCADE:
-- =============================================
-- • event_invitations → deleted when event is deleted
-- • event_invitations → deleted when inviter/invitee profile is deleted
-- • alerts → deleted when sender profile is deleted
-- • alert_recipients → deleted when alert is deleted
-- • alert_recipients → deleted when recipient profile is deleted
-- • events → deleted when creator profile is deleted
-- • friendships → deleted when either user profile is deleted
-- =============================================

-- =============================================
-- USAGE:
-- Call cleanup on app start:
--   SELECT * FROM run_database_cleanup();
-- 
-- Or run individually:
--   SELECT cleanup_past_events();
--   SELECT cleanup_read_alerts();
--   SELECT cleanup_old_alerts();
--   SELECT cleanup_declined_friendships();
-- =============================================
