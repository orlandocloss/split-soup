/**
 * Notifications Service
 * Production-ready implementation using expo-notifications
 * 
 * Features:
 * - Push notification registration
 * - Local notifications for event reminders
 * - Real-time notification handling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Check if we're in Expo Go (limited notification support)
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Register for push notifications
 * Returns the Expo push token or null if not available
 */
export async function registerForPushNotifications() {
  // Push notifications require a physical device
  if (!Device.isDevice) {
    console.log('Notifications: Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notifications: Permission not granted');
    return null;
  }

  // Get push token
  try {
    // For Expo Go, we can only use local notifications
    if (isExpoGo) {
      console.log('Notifications: Running in Expo Go - local notifications only');
      return null;
    }

    // Get the project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.log('Notifications: No EAS project ID configured');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('Notifications: Push token registered');
    return token.data;
  } catch (error) {
    console.error('Notifications: Failed to get push token:', error);
    return null;
  }
}

/**
 * Set up Android notification channel
 * Required for Android 8.0+ (API level 26+)
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D26A',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Event Reminders',
      description: 'Reminders for upcoming events',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D26A',
    });

    await Notifications.setNotificationChannelAsync('invitations', {
      name: 'Invitations',
      description: 'New event invitations from friends',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#00D26A',
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Friend Alerts',
      description: 'Messages from your friends',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#00D26A',
    });
  }
}

/**
 * Schedule an event reminder notification
 * @param {Object} event - Event object with id, title, date
 * @param {number} hoursBeforeEvent - Hours before event to send reminder
 */
export async function scheduleEventReminder(event, hoursBeforeEvent = 2) {
  if (!event?.date || !event?.title) {
    console.log('Notifications: Invalid event data for reminder');
    return null;
  }

  const eventDate = new Date(event.date);
  const reminderDate = new Date(eventDate.getTime() - hoursBeforeEvent * 60 * 60 * 1000);

  // Don't schedule if reminder time has passed
  if (reminderDate <= new Date()) {
    console.log('Notifications: Reminder time has already passed');
    return null;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Event Reminder',
        body: `"${event.title}" starts in ${hoursBeforeEvent} hour${hoursBeforeEvent > 1 ? 's' : ''}`,
        data: { eventId: event.id, type: 'reminder' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: {
        type: 'date',
        date: reminderDate,
      },
    });

    console.log('Notifications: Scheduled reminder for', event.title);
    return identifier;
  } catch (error) {
    console.error('Notifications: Failed to schedule reminder:', error);
    return null;
  }
}

/**
 * Send a local notification immediately
 * @param {string} title - Notification title
 * @param {string} body - Notification body (no emojis for consistency)
 * @param {Object} data - Additional data payload
 * @param {string} channelId - Android notification channel
 */
export async function sendLocalNotification(title, body, data = {}, channelId = 'default') {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: null, // null = immediate
    });

    console.log('Notifications: Sent local notification -', title);
  } catch (error) {
    console.error('Notifications: Failed to send notification:', error);
  }
}

/**
 * Cancel all scheduled reminders for an event
 * @param {string} eventId - Event ID to cancel reminders for
 */
export async function cancelEventReminders(eventId) {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.eventId === eventId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log('Notifications: Cancelled reminder for event', eventId);
      }
    }
  } catch (error) {
    console.error('Notifications: Failed to cancel reminders:', error);
  }
}

/**
 * Schedule reminders for all of today's events
 * @param {Array} events - Array of event objects
 */
export async function scheduleTodayReminders(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate < tomorrow;
  });

  for (const event of todayEvents) {
    await scheduleEventReminder(event, 2); // 2 hour reminder
    await scheduleEventReminder(event, 0.5); // 30 minute reminder
  }

  console.log(`Notifications: Scheduled reminders for ${todayEvents.length} events today`);
}

/**
 * Get the badge count
 */
export async function getBadgeCount() {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

/**
 * Set the badge count
 * @param {number} count - Badge number to display
 */
export async function setBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Notifications: Failed to set badge:', error);
  }
}

/**
 * Clear all notifications and reset badge
 */
export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Notifications: Failed to clear notifications:', error);
  }
}

/**
 * Add listener for received notifications (when app is foregrounded)
 * @param {Function} callback - Function to call when notification is received
 * @returns {Object} Subscription object with remove() method
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for notification responses (user tapped notification)
 * @param {Function} callback - Function to call when notification is tapped
 * @returns {Object} Subscription object with remove() method
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Initialize notifications system
 * Call this on app startup
 */
export async function initializeNotifications() {
  await setupNotificationChannel();
  const token = await registerForPushNotifications();
  return token;
}
