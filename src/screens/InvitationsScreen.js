import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useInvitations } from '../hooks/useInvitations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';

/**
 * InvitationsScreen Component
 * Shows pending invitations with accept/deny actions
 */
export const InvitationsScreen = ({ onBack }) => {
  const { received, respond, loading } = useInvitations();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderInvitation = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle}>{item.event?.title}</Text>
        <Text style={styles.meta}>
          from {item.inviter?.name || item.inviter?.email}
        </Text>
        <Text style={styles.date}>{formatDate(item.event?.date)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.declineButton,
            pressed && styles.pressed,
          ]}
          onPress={() => respond(item.id, false)}
        >
          <Text style={styles.declineText}>✕</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.acceptButton,
            pressed && styles.pressed,
          ]}
          onPress={() => respond(item.id, true)}
        >
          <Text style={styles.acceptText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.backButton}>←</Text>
        </Pressable>
        <Text style={styles.title}>invitations</Text>
        <View style={styles.placeholder} />
      </View>

      {received.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>_</Text>
          <Text style={styles.emptySubtext}>no pending invitations</Text>
        </View>
      ) : (
        <FlatList
          data={received}
          keyExtractor={(item) => item.id}
          renderItem={renderInvitation}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backButton: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xl,
    color: COLORS.ink,
  },
  title: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    fontWeight: '300',
    color: COLORS.ink,
    letterSpacing: 1,
  },
  placeholder: {
    width: 24,
  },
  list: {
    padding: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardContent: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    fontWeight: '500',
  },
  meta: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  date: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkLight,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  acceptButton: {
    backgroundColor: COLORS.spark,
  },
  declineText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.inkMuted,
  },
  acceptText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

