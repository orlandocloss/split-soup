import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';

/**
 * TimePicker Component
 * Simple time selection
 */
export const TimePicker = ({ visible, selectedTime, onSelect, onClose }) => {
  const [hour, setHour] = useState(selectedTime?.hour || 12);
  const [minute, setMinute] = useState(selectedTime?.minute || 0);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleConfirm = () => {
    onSelect({ hour, minute });
    onClose();
  };

  const formatHour = (h) => h.toString().padStart(2, '0');
  const formatMinute = (m) => m.toString().padStart(2, '0');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.header}>select time</Text>

          <View style={styles.pickerRow}>
            {/* Hours */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>hour</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <Pressable
                    key={h}
                    style={[styles.option, hour === h && styles.optionSelected]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.optionText, hour === h && styles.optionTextSelected]}>
                      {formatHour(h)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.separator}>:</Text>

            {/* Minutes */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>min</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.option, minute === m && styles.optionSelected]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.optionText, minute === m && styles.optionTextSelected]}>
                      {formatMinute(m)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewText}>
              {formatHour(hour)}:{formatMinute(minute)}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmText}>set</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 280,
  },
  header: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    alignItems: 'center',
  },
  columnLabel: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginBottom: SPACING.xs,
  },
  scroll: {
    maxHeight: 150,
  },
  option: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  optionSelected: {
    backgroundColor: COLORS.ink,
  },
  optionText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
  },
  optionTextSelected: {
    color: COLORS.surface,
  },
  separator: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xl,
    color: COLORS.ink,
    marginHorizontal: SPACING.md,
  },
  preview: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  previewText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xl,
    fontWeight: '500',
    color: COLORS.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.ink,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.surface,
    fontWeight: '500',
  },
});

