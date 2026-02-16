import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { EventCard } from './EventCard';
import { COLORS, SPACING, FONT_SIZES, FONT } from '../constants/theme';

/**
 * EventList Component
 * Minimal scrollable list
 */
export const EventList = ({ events, onDeleteEvent, onShareEvent }) => {
  if (events.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EventCard
          event={item}
          onDelete={onDeleteEvent}
          onShare={onShareEvent}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>_</Text>
  </View>
);

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.inkMuted,
  },
});
