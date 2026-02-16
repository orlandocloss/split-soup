import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  EventCard,
  AddButton,
  AddEventModal,
  ProfileAvatar,
  ProfileModal,
  AlertButton,
  AlertPopup,
} from '../components';
import { useTimeline } from '../hooks/useTimeline';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { runDatabaseCleanup } from '../services/database';
import { COLORS, SPACING, FONT_SIZES, FONT } from '../constants/theme';

/**
 * HomeScreen Component
 * Events grouped by day
 */
export const HomeScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { 
    timeline, 
    loading, 
    addEvent, 
    deleteEvent, 
    updateInvitationStatus,
    updateEvent,
    leaveEvent,
    addInvitees,
  } = useTimeline();
  const { profile } = useAuth();
  const { scheduleRemindersForToday } = useNotifications();
  const { 
    unreadAlerts, 
    sendAlert, 
    markAsRead, 
    markAllAsRead,
  } = useAlerts();

  // Run database cleanup on mount (removes past events and read alerts)
  useEffect(() => {
    runDatabaseCleanup();
  }, []);

  // Schedule reminders for today's events
  useEffect(() => {
    if (!loading && timeline.length > 0) {
      const events = timeline
        .filter(item => item.status === 'accepted' || item.status === 'owner')
        .map(item => item.event);
      scheduleRemindersForToday(events);
    }
  }, [loading, timeline]);

  // Group events by day - always show today
  const sections = useMemo(() => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayKey = today.toISOString().split('T')[0];

    // Always create today section first
    const todayDayName = dayNames[today.getDay()];
    const todayDayNum = today.getDate();
    const todayMonthName = monthNames[today.getMonth()];
    groups[todayKey] = {
      title: `today · ${todayDayName} ${todayDayNum} ${todayMonthName}`,
      date: today,
      data: [],
      isToday: true,
    };

    timeline.forEach((item) => {
      const eventDate = new Date(item.event.date);
      eventDate.setHours(0, 0, 0, 0);
      const dateKey = eventDate.toISOString().split('T')[0];

      if (!groups[dateKey]) {
        const dayName = dayNames[eventDate.getDay()];
        const dayNum = eventDate.getDate();
        const monthName = monthNames[eventDate.getMonth()];
        
        let label;
        if (eventDate.getTime() === tomorrow.getTime()) {
          label = `tomorrow · ${dayName} ${dayNum} ${monthName}`;
        } else {
          label = `${dayName} · ${dayNum} ${monthName}`;
        }

        groups[dateKey] = {
          title: label,
          date: eventDate,
          data: [],
          isToday: false,
        };
      }
      groups[dateKey].data.push(item);
    });

    // Sort by date
    return Object.values(groups).sort((a, b) => a.date - b.date);
  }, [timeline]);

  const handleOpenModal = () => setIsModalVisible(true);
  const handleCloseModal = () => setIsModalVisible(false);

  const handleAddEvent = async (eventData) => {
    await addEvent(eventData);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.ink} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <AlertButton onSend={sendAlert} />
        <View style={styles.headerSpacer} />
        <ProfileAvatar
          username={profile?.username}
          onPress={() => setShowProfile(true)}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item.event}
            isOwner={item.isOwner}
            status={item.status}
            inviterName={item.inviterName}
            participants={item.participants}
            onDelete={deleteEvent}
            onUpdateStatus={(newStatus) => updateInvitationStatus(item.invitationId, newStatus)}
            onAddInvitees={(friendIds) => addInvitees(item.event.id, friendIds)}
            onUpdateEvent={(updates) => updateEvent(item.event.id, updates)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.data.length === 0 && section.isToday) {
            return (
              <View style={styles.emptyDayContainer}>
                <Text style={styles.emptyDayText}>no events today</Text>
              </View>
            );
          }
          return null;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      <AddButton onPress={handleOpenModal} />

      <AddEventModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleAddEvent}
      />

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Alert popup - must be dismissed before using app */}
      <AlertPopup
        alerts={unreadAlerts}
        onDismiss={markAsRead}
        onDismissAll={markAllAsRead}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerSpacer: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyDayContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  emptyDayText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    fontStyle: 'italic',
  },
  emptyText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.inkMuted,
  },
  emptySubtext: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    marginTop: SPACING.sm,
  },
});
