import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  initializeNotifications,
  sendLocalNotification,
  scheduleTodayReminders,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  setBadgeCount,
  clearAllNotifications,
} from '../services/notifications';
import { supabase } from '../config/supabase';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Set up notifications when user logs in
  useEffect(() => {
    if (!user) return;

    const setup = async () => {
      // Initialize notifications and register for push
      await initializeNotifications();
    };

    setup();

    // Set up notification listeners
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    responseListener.current = addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
      // Handle navigation to event details here if needed
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  // Subscribe to real-time invitation notifications
  useEffect(() => {
    if (!user) return;

    // Listen for new invitations
    const invitationSubscription = supabase
      .channel('invitation-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_invitations',
          filter: `invitee_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New invitation received:', payload);
          
          // Fetch event details
          const { data: eventData } = await supabase
            .from('events')
            .select('*, creator:profiles!creator_id(username)')
            .eq('id', payload.new.event_id)
            .single();

          if (eventData) {
            sendLocalNotification(
              'New Invitation',
              `@${eventData.creator?.username} invited you to "${eventData.title}"`,
              { eventId: eventData.id, type: 'invitation' },
              'invitations'
            );
          }
        }
      )
      .subscribe();

    // Listen for event time changes (for events you're invited to)
    const eventUpdateSubscription = supabase
      .channel('event-update-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          // Check if date changed
          if (payload.old?.date !== payload.new?.date) {
            // Check if user is invited to this event
            const { data: invitation } = await supabase
              .from('event_invitations')
              .select('id')
              .eq('event_id', payload.new.id)
              .eq('invitee_id', user.id)
              .single();

            if (invitation) {
              const eventDate = new Date(payload.new.date);
              const timeStr = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
              
              sendLocalNotification(
                'Event Time Changed',
                `"${payload.new.title}" has been moved to ${dateStr} at ${timeStr}`,
                { eventId: payload.new.id, type: 'time_change' },
                'reminders'
              );
            }
          }
        }
      )
      .subscribe();

    // Listen for new friend alerts
    const alertSubscription = supabase
      .channel('alert-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_recipients',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New alert received:', payload);
          
          // Fetch alert details
          const { data: alertData } = await supabase
            .from('alerts')
            .select('*, sender:profiles!sender_id(username)')
            .eq('id', payload.new.alert_id)
            .single();

          if (alertData) {
            sendLocalNotification(
              'Friend Alert',
              `@${alertData.sender?.username}: ${alertData.message}`,
              { alertId: alertData.id, type: 'alert' },
              'alerts'
            );
          }
        }
      )
      .subscribe();

    return () => {
      invitationSubscription.unsubscribe();
      eventUpdateSubscription.unsubscribe();
      alertSubscription.unsubscribe();
    };
  }, [user]);

  // Schedule daily reminders for today's events
  const scheduleRemindersForToday = async (events) => {
    await scheduleTodayReminders(events);
  };

  return (
    <NotificationContext.Provider
      value={{
        scheduleRemindersForToday,
        sendLocalNotification,
        setBadgeCount,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

