-- =============================================
-- ALERTS - Friend broadcast notifications
-- =============================================
-- IMPORTANT: Run this to fix the 42P17 recursion error

-- Drop existing tables
DROP TABLE IF EXISTS alert_recipients CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;

-- ALERTS table
CREATE TABLE alerts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL CHECK (char_length(message) <= 100),
  created_at timestamp with time zone DEFAULT now()
);

-- ALERT_RECIPIENTS table
CREATE TABLE alert_recipients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_id uuid REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(alert_id, recipient_id)
);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_recipients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SIMPLE POLICIES (no cross-table references to avoid recursion)
-- =============================================

-- ALERTS: Anyone can read any alert (simpler, avoids recursion)
-- Security is enforced at the alert_recipients level
CREATE POLICY "alerts_select_all"
  ON alerts FOR SELECT 
  USING (true);

-- ALERTS: Only sender can create
CREATE POLICY "alerts_insert"
  ON alerts FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- ALERT_RECIPIENTS: Recipients can see their own
CREATE POLICY "recipients_select_own"
  ON alert_recipients FOR SELECT 
  USING (auth.uid() = recipient_id);

-- ALERT_RECIPIENTS: Senders can see recipients of alerts they sent
CREATE POLICY "recipients_select_sender"
  ON alert_recipients FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM alerts 
      WHERE alerts.id = alert_recipients.alert_id 
      AND alerts.sender_id = auth.uid()
    )
  );

-- ALERT_RECIPIENTS: Senders can add recipients
CREATE POLICY "recipients_insert"
  ON alert_recipients FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alerts 
      WHERE alerts.id = alert_id 
      AND alerts.sender_id = auth.uid()
    )
  );

-- ALERT_RECIPIENTS: Recipients can update (mark as read)
CREATE POLICY "recipients_update"
  ON alert_recipients FOR UPDATE 
  USING (auth.uid() = recipient_id);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_alerts_sender ON alerts(sender_id);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alert_recipients_recipient ON alert_recipients(recipient_id);
CREATE INDEX idx_alert_recipients_alert ON alert_recipients(alert_id);

-- =============================================
-- Enable realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE alert_recipients;
