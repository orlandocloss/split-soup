/**
 * useAlerts Hook
 * Manages friend alerts/broadcasts with real-time updates
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const MAX_ALERT_LENGTH = 100;

export const useAlerts = () => {
  const [unreadAlerts, setUnreadAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  /**
   * Fetch unread alerts for current user
   */
  const fetchUnreadAlerts = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('alert_recipients')
      .select(`
        id,
        read_at,
        alert:alerts(
          id,
          message,
          created_at,
          sender:profiles!sender_id(id, username)
        )
      `)
      .eq('recipient_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch alerts error:', error);
    } else {
      // Filter out null alerts (orphaned records)
      setUnreadAlerts((data || []).filter(a => a.alert !== null));
    }
    setLoading(false);
  }, [user]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchUnreadAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('alerts-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_recipients',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => fetchUnreadAlerts()
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [user, fetchUnreadAlerts]);

  /**
   * Send an alert to selected friends
   */
  const sendAlert = useCallback(async (message, friendIds = []) => {
    if (!user || !message.trim()) {
      return { success: false, error: 'Invalid message' };
    }

    if (message.length > MAX_ALERT_LENGTH) {
      return { success: false, error: `Message must be ${MAX_ALERT_LENGTH} characters or less` };
    }

    if (friendIds.length === 0) {
      return { success: false, error: 'Select at least one friend' };
    }

    // Create alert
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .insert({ sender_id: user.id, message: message.trim() })
      .select()
      .single();

    if (alertError) {
      console.error('Create alert error:', alertError);
      return { success: false, error: 'Failed to send alert' };
    }

    // Add recipients
    const recipients = friendIds.map(friendId => ({
      alert_id: alertData.id,
      recipient_id: friendId,
    }));

    const { error: recipientError } = await supabase
      .from('alert_recipients')
      .insert(recipients);

    if (recipientError) {
      console.error('Add recipients error:', recipientError);
      return { success: false, error: 'Failed to notify friends' };
    }

    return { success: true, recipientCount: friendIds.length };
  }, [user]);

  /**
   * Mark a single alert as read
   */
  const markAsRead = useCallback(async (alertReceiptId) => {
    if (!user) return;

    const { error } = await supabase
      .from('alert_recipients')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertReceiptId);

    if (error) {
      console.error('Mark as read error:', error);
    } else {
      setUnreadAlerts(prev => prev.filter(a => a.id !== alertReceiptId));
    }
  }, [user]);

  /**
   * Mark all alerts as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user || unreadAlerts.length === 0) return;

    const ids = unreadAlerts.map(a => a.id);

    const { error } = await supabase
      .from('alert_recipients')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      console.error('Mark all as read error:', error);
    } else {
      setUnreadAlerts([]);
    }
  }, [user, unreadAlerts]);

  return {
    unreadAlerts,
    unreadCount: unreadAlerts.length,
    loading,
    sendAlert,
    markAsRead,
    markAllAsRead,
    maxLength: MAX_ALERT_LENGTH,
    refresh: fetchUnreadAlerts,
  };
};
