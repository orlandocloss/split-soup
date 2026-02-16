import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing invitations
 */
export const useInvitations = () => {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch received invitations
  const fetchReceived = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        event:events(*),
        inviter:profiles!inviter_id(id, name, email)
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReceived(data);
    }
  }, [user]);

  // Fetch sent invitations
  const fetchSent = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        event:events(*),
        invitee:profiles!invitee_id(id, name, email)
      `)
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSent(data);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      await Promise.all([fetchReceived(), fetchSent()]);
      setLoading(false);
    };
    fetch();

    // Real-time subscription
    const subscription = supabase
      .channel('invitations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
        },
        () => {
          fetchReceived();
          fetchSent();
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user, fetchReceived, fetchSent]);

  // Send invitation by email
  const invite = useCallback(async (eventId, email) => {
    if (!user) return { error: 'Not authenticated' };

    // Find user by email
    const { data: invitee, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (findError || !invitee) {
      return { error: 'User not found' };
    }

    if (invitee.id === user.id) {
      return { error: 'Cannot invite yourself' };
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('event_id', eventId)
      .eq('invitee_id', invitee.id)
      .single();

    if (existing) {
      return { error: 'Already invited' };
    }

    const { error } = await supabase.from('invitations').insert({
      event_id: eventId,
      inviter_id: user.id,
      invitee_id: invitee.id,
      status: 'pending',
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  }, [user]);

  // Respond to invitation
  const respond = useCallback(async (invitationId, accept) => {
    const { error } = await supabase
      .from('invitations')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', invitationId);

    if (error) {
      console.error('Error responding:', error);
    }
  }, []);

  return {
    received,
    sent,
    loading,
    invite,
    respond,
    pendingCount: received.length,
  };
};

