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

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * CalendarPicker Component
 * Minimal calendar for date selection
 */
export const CalendarPicker = ({ visible, selectedDate, onSelect, onClose }) => {
  const today = new Date();
  
  // Convert selectedDate to Date object if it's a string
  const getDateObject = (date) => {
    if (!date) return today;
    if (date instanceof Date) return date;
    return new Date(date);
  };
  
  const [viewDate, setViewDate] = useState(() => getDateObject(selectedDate));

  // Update viewDate when selectedDate changes
  React.useEffect(() => {
    if (visible && selectedDate) {
      setViewDate(getDateObject(selectedDate));
    }
  }, [visible, selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const selectDate = (day) => {
    const selected = new Date(year, month, day);
    onSelect(selected);
    onClose();
  };

  const isToday = (day) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const selected = getDateObject(selectedDate);
    return (
      selected.getDate() === day &&
      selected.getMonth() === month &&
      selected.getFullYear() === year
    );
  };

  const isPast = (day) => {
    const date = new Date(year, month, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={prevMonth} hitSlop={12}>
              <Text style={styles.navButton}>←</Text>
            </Pressable>
            <Text style={styles.monthYear}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={12}>
              <Text style={styles.navButton}>→</Text>
            </Pressable>
          </View>

          {/* Day labels */}
          <View style={styles.dayLabels}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {days.map((day, index) => (
              <View key={index} style={styles.cell}>
                {day && (
                  <Pressable
                    style={[
                      styles.dayButton,
                      isToday(day) && styles.today,
                      isSelected(day) && styles.selected,
                      isPast(day) && styles.past,
                    ]}
                    onPress={() => !isPast(day) && selectDate(day)}
                    disabled={isPast(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday(day) && styles.todayText,
                        isSelected(day) && styles.selectedText,
                        isPast(day) && styles.pastText,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* Quick select */}
          <View style={styles.quickSelect}>
            <Pressable
              style={styles.quickButton}
              onPress={() => selectDate(today.getDate())}
            >
              <Text style={styles.quickText}>today</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setViewDate(tomorrow);
                onSelect(tomorrow);
                onClose();
              }}
            >
              <Text style={styles.quickText}>tomorrow</Text>
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
    padding: SPACING.md,
    width: '100%',
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  navButton: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    paddingHorizontal: SPACING.sm,
  },
  monthYear: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.ink,
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  dayText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.ink,
  },
  today: {
    borderWidth: 1,
    borderColor: COLORS.ink,
  },
  todayText: {
    fontWeight: '600',
  },
  selected: {
    backgroundColor: COLORS.ink,
  },
  selectedText: {
    color: COLORS.surface,
  },
  past: {
    opacity: 0.3,
  },
  pastText: {
    color: COLORS.inkMuted,
  },
  quickSelect: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  quickButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  quickText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkLight,
  },
});

