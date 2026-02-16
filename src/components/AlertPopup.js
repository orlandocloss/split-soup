import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';

const PURPLE = '#9B5DE5';
const PURPLE_LIGHT = '#C77DFF';

/**
 * AlertPopup - Shows unread alerts that must be dismissed
 * Features subtle purple glow on each alert card border
 */
export const AlertPopup = ({ alerts, onDismiss, onDismissAll }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Subtle glow animation for alert card borders
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [alerts]);

  if (!alerts || alerts.length === 0) return null;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Animated glow for alert card shadows
  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  const borderOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(155, 93, 229, 0.4)', 'rgba(155, 93, 229, 0.8)'],
  });

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.popupCard}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {alerts.length === 1 ? 'new alert' : `${alerts.length} new alerts`}
              </Text>
            </View>

            <ScrollView 
              style={styles.alertsList}
              showsVerticalScrollIndicator={false}
            >
              {alerts.map((alertReceipt) => (
                <Animated.View 
                  key={alertReceipt.id} 
                  style={[
                    styles.alertCard,
                    {
                      borderLeftColor: borderOpacity,
                      shadowColor: PURPLE,
                      shadowOpacity: shadowOpacity,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <Text style={styles.senderName}>
                      @{alertReceipt.alert?.sender?.username}
                    </Text>
                    <Text style={styles.alertTime}>
                      {formatTime(alertReceipt.alert?.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.alertMessage}>
                    {alertReceipt.alert?.message}
                  </Text>
                  <Pressable 
                    style={styles.dismissBtn}
                    onPress={() => onDismiss(alertReceipt.id)}
                  >
                    <Text style={styles.dismissText}>got it</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>

            {alerts.length > 1 && (
              <Pressable style={styles.dismissAllBtn} onPress={onDismissAll}>
                <Text style={styles.dismissAllText}>dismiss all</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  popupCard: {
    width: '90%',
    minWidth: 300,
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  container: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  headerText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.ink,
  },
  alertsList: {
    maxHeight: 400,
  },
  alertCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    elevation: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  senderName: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.ink,
  },
  alertTime: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
  },
  alertMessage: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    lineHeight: 22,
  },
  dismissBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.ink,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.surface,
    fontWeight: '500',
  },
  dismissAllBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  dismissAllText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    textDecorationLine: 'underline',
  },
});
