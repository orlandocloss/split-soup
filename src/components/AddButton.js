import React from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT, FONT_SIZES } from '../constants/theme';

/**
 * AddButton Component
 * Minimal circular add button
 */
export const AddButton = ({ onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.icon}>+</Text>
    </Pressable>
  );
};

const BUTTON_SIZE = 56;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignSelf: 'center',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: COLORS.inkLight,
  },
  icon: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xl,
    color: COLORS.background,
    marginTop: -2,
  },
});
