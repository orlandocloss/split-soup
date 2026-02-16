import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing events with Supabase
 */
export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch user's events with invitation status
  const fetchEvents = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        invitations:event_invitations(
          id,
          status,
          invitee:profiles!invitee_id(id, username)
        )
      `)
      .eq('creator_id', user.id)
      .order('date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    fetchEvents();

    const subscription = supabase
      .channel('my-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `creator_id=eq.${user.id}`,
        },
        () => fetchEvents()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_invitations',
        },
        () => fetchEvents()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user, fetchEvents]);

  const addEvent = useCallback(async (event) => {
    if (!user) return null;

    const newEvent = {
      creator_id: user.id,
      title: event.title,
      location: event.location || '',
      description: event.description || '',
      date: event.date,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(newEvent)
      .select()
      .single();

    if (error) {
      console.error('Error adding event:', error);
      return null;
    }

    // Invite friends
    if (event.friendIds && event.friendIds.length > 0) {
      const invitations = event.friendIds.map((friendId) => ({
        event_id: data.id,
        inviter_id: user.id,
        invitee_id: friendId,
        status: 'pending',
      }));

      const { error: inviteError } = await supabase
        .from('event_invitations')
        .insert(invitations);

      if (inviteError) {
        console.error('Error inviting friends:', inviteError);
      }
    }

    // Immediately update local state
    setEvents((prev) => [...prev, { ...data, invitations: [] }].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    ));

    return data;
  }, [user]);

  const removeEvent = useCallback(async (eventId) => {
    // Immediately update local state (optimistic update)
    setEvents((prev) => prev.filter((e) => e.id !== eventId));

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error removing event:', error);
      // Revert on error by refetching
      fetchEvents();
    }
  }, [fetchEvents]);

  return {
    events,
    loading,
    addEvent,
    removeEvent,
    refresh: fetchEvents,
  };
};
