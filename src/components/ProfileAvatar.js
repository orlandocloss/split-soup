import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT, FONT_SIZES } from '../constants/theme';
import { useFriends } from '../hooks/useFriends';

/**
 * ProfileAvatar Component
 * Circular avatar with user initial and friend request badge
 */
export const ProfileAvatar = ({ username, onPress, size = 36 }) => {
  const { pendingCount } = useFriends();
  const initial = username ? username[0].toUpperCase() : '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {initial ? (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      ) : (
        <View style={[styles.empty, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2 }]} />
      )}
      
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lineDark,
  },
  pressed: {
    opacity: 0.7,
  },
  initial: {
    fontFamily: FONT.mono,
    fontWeight: '500',
    color: COLORS.ink,
  },
  empty: {
    backgroundColor: COLORS.lineDark,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.spark,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: '600',
  },
});
