/**
 * useTimeline Hook
 * Provides a unified timeline of user's events and invitations
 * with real-time updates and CRUD operations
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useTimeline = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  /**
   * Fetch events created by the current user
   */
  const fetchMyEvents = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_invitations(
          id,
          status,
          invitee:profiles!invitee_id(id, username, email),
          inviter:profiles!inviter_id(id, username)
        )
      `)
      .eq('creator_id', user.id);

    if (error) {
      console.error('Fetch events error:', error);
    } else {
      setMyEvents(data || []);
    }
  }, [user]);

  /**
   * Fetch invitations sent to the current user
   */
  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('event_invitations')
      .select(`
        id,
        status,
        event:events(
          *,
          creator:profiles!creator_id(id, username),
          event_invitations(
            id,
            status,
            invitee:profiles!invitee_id(id, username, email),
            inviter:profiles!inviter_id(id, username)
          )
        ),
        inviter:profiles!inviter_id(id, username)
      `)
      .eq('invitee_id', user.id);

    if (error) {
      console.error('Fetch invitations error:', error);
    } else {
      setInvitations(data?.filter(inv => inv.event !== null) || []);
    }
  }, [user]);

  // Initial fetch and real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      await Promise.all([fetchMyEvents(), fetchInvitations()]);
      setLoading(false);
    };
    fetchAll();

    // Subscribe to real-time changes
    const eventsChannel = supabase
      .channel('timeline-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchMyEvents()
      )
      .subscribe();

    const invitationsChannel = supabase
      .channel('timeline-invitations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_invitations' },
        () => {
          fetchInvitations();
          fetchMyEvents();
        }
      )
      .subscribe();

    return () => {
      eventsChannel.unsubscribe();
      invitationsChannel.unsubscribe();
    };
  }, [user, fetchMyEvents, fetchInvitations]);

  /**
   * Build unified timeline from events and invitations
   */
  const timeline = useMemo(() => {
    const items = [];

    // Add owned events
    myEvents.forEach((event) => {
      items.push({
        id: `own-${event.id}`,
        event,
        isOwner: true,
        status: 'owner',
        inviterName: null,
        invitationId: null,
        participants: event.event_invitations || [],
      });
    });

    // Add invitations
    invitations.forEach((inv) => {
      if (inv.event) {
        items.push({
          id: `inv-${inv.id}`,
          event: inv.event,
          isOwner: false,
          status: inv.status,
          inviterName: inv.inviter?.username || inv.event.creator?.username,
          invitationId: inv.id,
          participants: inv.event.event_invitations || [],
        });
      }
    });

    // Sort chronologically
    items.sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

    return items;
  }, [myEvents, invitations]);

  /**
   * Create a new event with optional invitations
   */
  const addEvent = useCallback(async (eventData) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('events')
      .insert({
        creator_id: user.id,
        title: eventData.title,
        location: eventData.location || '',
        description: eventData.description || '',
        date: eventData.date,
      })
      .select()
      .single();

    if (error) {
      console.error('Add event error:', error);
      return null;
    }

    // Create invitations for selected friends
    if (eventData.friendIds?.length > 0) {
      const invites = eventData.friendIds.map((friendId) => ({
        event_id: data.id,
        inviter_id: user.id,
        invitee_id: friendId,
        status: 'pending',
      }));

      await supabase.from('event_invitations').insert(invites);
    }

    fetchMyEvents();
    return data;
  }, [user, fetchMyEvents]);

  /**
   * Delete an event (owner only)
   */
  const deleteEvent = useCallback(async (eventId) => {
    setMyEvents((prev) => prev.filter((e) => e.id !== eventId));

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Delete event error:', error);
      fetchMyEvents();
    }
  }, [fetchMyEvents]);

  /**
   * Update invitation status (accept/decline)
   */
  const updateInvitationStatus = useCallback(async (invitationId, newStatus) => {
    // Optimistic update
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === invitationId ? { ...inv, status: newStatus } : inv
      )
    );

    const { error } = await supabase
      .from('event_invitations')
      .update({ status: newStatus })
      .eq('id', invitationId);

    if (error) {
      console.error('Update status error:', error);
      fetchInvitations();
    }
  }, [fetchInvitations]);

  /**
   * Leave an event (delete invitation)
   */
  const leaveEvent = useCallback(async (invitationId) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

    const { error } = await supabase
      .from('event_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Leave event error:', error);
      fetchInvitations();
    }
  }, [fetchInvitations]);

  /**
   * Add invitees to an existing event
   */
  const addInvitees = useCallback(async (eventId, friendIds) => {
    if (!user || !friendIds?.length) return;

    const invites = friendIds.map((friendId) => ({
      event_id: eventId,
      inviter_id: user.id,
      invitee_id: friendId,
      status: 'pending',
    }));

    const { error } = await supabase
      .from('event_invitations')
      .insert(invites);

    if (error) {
      console.error('Add invitees error:', error);
    }

    fetchMyEvents();
    fetchInvitations();
  }, [user, fetchMyEvents, fetchInvitations]);

  /**
   * Update event details (owner only)
   * Resets all invitees to pending status
   */
  const updateEvent = useCallback(async (eventId, updates) => {
    if (!user) return;

    // Optimistic update
    setMyEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    );

    // Update event
    const { error: eventError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId);

    if (eventError) {
      console.error('Update event error:', eventError);
      fetchMyEvents();
      return;
    }

    // Reset all invitees to pending
    const { error: inviteError } = await supabase
      .from('event_invitations')
      .update({ status: 'pending' })
      .eq('event_id', eventId);

    if (inviteError) {
      console.error('Reset invitees error:', inviteError);
    }

    fetchMyEvents();
    fetchInvitations();
  }, [user, fetchMyEvents, fetchInvitations]);

  return {
    timeline,
    loading,
    addEvent,
    deleteEvent,
    updateInvitationStatus,
    updateEvent,
    leaveEvent,
    addInvitees,
    refresh: () => {
      fetchMyEvents();
      fetchInvitations();
    },
  };
};
