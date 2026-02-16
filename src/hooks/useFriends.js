import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing friendships
 */
export const useFriends = () => {
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch all friendships
  const fetchFriendships = useCallback(async () => {
    if (!user) return;

    try {
      // Get accepted friendships where user is requester
      const { data: asRequester } = await supabase
        .from('friendships')
        .select(`
          id,
          addressee:profiles!addressee_id(id, username, email)
        `)
        .eq('requester_id', user.id)
        .eq('status', 'accepted');

      // Get accepted friendships where user is addressee
      const { data: asAddressee } = await supabase
        .from('friendships')
        .select(`
          id,
          requester:profiles!requester_id(id, username, email)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'accepted');

      // Combine friends list
      const friendsList = [
        ...(asRequester || []).map((f) => f.addressee),
        ...(asAddressee || []).map((f) => f.requester),
      ];
      setFriends(friendsList);

      // Get pending requests received
      const { data: received } = await supabase
        .from('friendships')
        .select(`
          id,
          requester:profiles!requester_id(id, username, email),
          created_at
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      setPendingReceived(received || []);

      // Get pending requests sent
      const { data: sent } = await supabase
        .from('friendships')
        .select(`
          id,
          addressee:profiles!addressee_id(id, username, email),
          created_at
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      setPendingSent(sent || []);
    } catch (err) {
      console.log('Fetch friendships error:', err);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchFriendships();

    // Real-time subscription
    const subscription = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => fetchFriendships()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user, fetchFriendships]);

  // Send friend request
  const sendRequest = useCallback(async (addresseeId) => {
    if (!user) {
      console.log('No user');
      return { error: 'Not authenticated' };
    }

    if (addresseeId === user.id) {
      return { error: 'Cannot add yourself' };
    }

    console.log('Sending friend request to:', addresseeId);

    // Check if already friends (user is requester)
    const { data: existing1 } = await supabase
      .from('friendships')
      .select('id, status')
      .eq('requester_id', user.id)
      .eq('addressee_id', addresseeId)
      .maybeSingle();

    // Check if already friends (user is addressee)  
    const { data: existing2 } = await supabase
      .from('friendships')
      .select('id, status')
      .eq('requester_id', addresseeId)
      .eq('addressee_id', user.id)
      .maybeSingle();

    const existing = existing1 || existing2;

    if (existing) {
      console.log('Existing friendship:', existing);
      if (existing.status === 'accepted') {
        return { error: 'Already friends' };
      }
      return { error: 'Request already exists' };
    }

    // Send new request
    const { data, error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending',
    }).select();

    if (error) {
      console.log('Insert error:', error);
      return { error: error.message };
    }

    console.log('Request sent:', data);
    
    // Refresh the lists
    fetchFriendships();
    
    return { success: true };
  }, [user, fetchFriendships]);

  // Accept friend request
  const acceptRequest = useCallback(async (friendshipId) => {
    console.log('Accepting request:', friendshipId);
    
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) {
      console.log('Accept error:', error);
    } else {
      fetchFriendships();
    }
  }, [fetchFriendships]);

  // Decline friend request
  const declineRequest = useCallback(async (friendshipId) => {
    console.log('Declining request:', friendshipId);
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.log('Decline error:', error);
    } else {
      fetchFriendships();
    }
  }, [fetchFriendships]);

  // Remove friend
  const removeFriend = useCallback(async (friendId) => {
    if (!user) return;

    // Delete where user is requester
    await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', user.id)
      .eq('addressee_id', friendId);

    // Delete where user is addressee
    await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', friendId)
      .eq('addressee_id', user.id);

    fetchFriendships();
  }, [user, fetchFriendships]);

  return {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    pendingCount: pendingReceived.length,
    refresh: fetchFriendships,
  };
};
