import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing event invitations
 */
export const useEventInvitations = () => {
  const [invitedEvents, setInvitedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch events user is invited to
  const fetchInvitedEvents = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('event_invitations')
      .select(`
        id,
        status,
        event:events(
          id,
          title,
          location,
          description,
          date,
          creator:profiles!creator_id(id, username)
        ),
        inviter:profiles!inviter_id(id, username)
      `)
      .eq('invitee_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Fetch invited events error:', error);
    } else {
      setInvitedEvents(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchInvitedEvents();

    // Real-time subscription
    const subscription = supabase
      .channel('event-invitations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_invitations',
          filter: `invitee_id=eq.${user.id}`,
        },
        () => fetchInvitedEvents()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user, fetchInvitedEvents]);

  // Respond to invitation
  const respond = useCallback(async (invitationId, accept) => {
    const { error } = await supabase
      .from('event_invitations')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', invitationId);

    if (error) {
      console.log('Respond error:', error);
    } else {
      fetchInvitedEvents();
    }
  }, [fetchInvitedEvents]);

  // Get pending count
  const pendingCount = invitedEvents.filter((e) => e.status === 'pending').length;

  return {
    invitedEvents,
    loading,
    respond,
    pendingCount,
    refresh: fetchInvitedEvents,
  };
};

