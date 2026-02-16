import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CalendarPicker } from './CalendarPicker';
import { TimePicker } from './TimePicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * AddEventModal Component
 * Event creation with calendar picker and friend selection
 */
export const AddEventModal = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [friends, setFriends] = useState([]);

  const { user } = useAuth();

  // Fetch friends when modal opens
  useEffect(() => {
    if (visible && user) {
      fetchFriends();
    }
  }, [visible, user]);

  const fetchFriends = async () => {
    if (!user) return;

    // Get accepted friendships where user is requester
    const { data: asRequester } = await supabase
      .from('friendships')
      .select(`
        addressee:profiles!addressee_id(id, username, email)
      `)
      .eq('requester_id', user.id)
      .eq('status', 'accepted');

    // Get accepted friendships where user is addressee
    const { data: asAddressee } = await supabase
      .from('friendships')
      .select(`
        requester:profiles!requester_id(id, username, email)
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'accepted');

    // Combine friends list
    const friendsList = [
      ...(asRequester || []).map((f) => f.addressee),
      ...(asAddressee || []).map((f) => f.requester),
    ];
    
    console.log('Friends found:', friendsList.length);
    setFriends(friendsList);
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedFriends([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    // Build date
    let eventDate;
    if (selectedDate) {
      eventDate = new Date(selectedDate);
      if (selectedTime) {
        eventDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
      } else {
        eventDate.setHours(12, 0, 0, 0);
      }
    } else {
      eventDate = new Date();
    }

    onSubmit({
      title: title.trim(),
      location: location.trim(),
      description: '',
      date: eventDate.toISOString(),
      friendIds: selectedFriends,
    });

    resetForm();
    onClose();
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const formatDate = (date) => {
    if (!date) return 'select date';
    const d = new Date(date);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (time) => {
    if (!time) return 'select time';
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

  const isValid = title.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modal}>
              <Text style={styles.header}>new event</Text>

              {/* Title */}
              <View style={styles.field}>
                <Text style={styles.label}>title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="_"
                  placeholderTextColor={COLORS.inkMuted}
                  autoFocus
                />
              </View>

              {/* Location */}
              <View style={styles.field}>
                <Text style={styles.label}>location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="_"
                  placeholderTextColor={COLORS.inkMuted}
                />
              </View>

              {/* Date & Time */}
              <View style={styles.row}>
                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>date</Text>
                  <Pressable
                    style={styles.pickerButton}
                    onPress={() => setShowCalendar(true)}
                  >
                    <Text style={[
                      styles.pickerText,
                      !selectedDate && styles.pickerPlaceholder
                    ]}>
                      {formatDate(selectedDate)}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.spacer} />

                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>time</Text>
                  <Pressable
                    style={styles.pickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={[
                      styles.pickerText,
                      !selectedTime && styles.pickerPlaceholder
                    ]}>
                      {formatTime(selectedTime)}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Friends Selection */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  invite friends {friends.length > 0 ? `(${friends.length})` : ''}
                </Text>
                {friends.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.friendsScroll}
                  >
                    {friends.map((friend) => {
                      const isSelected = selectedFriends.includes(friend.id);
                      return (
                        <Pressable
                          key={friend.id}
                          style={[
                            styles.friendChip,
                            isSelected && styles.friendChipSelected,
                          ]}
                          onPress={() => toggleFriend(friend.id)}
                        >
                          <Text
                            style={[
                              styles.friendChipText,
                              isSelected && styles.friendChipTextSelected,
                            ]}
                          >
                            @{friend.username}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={styles.noFriendsText}>add friends first</Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelText}>cancel</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    !isValid && styles.submitDisabled,
                    pressed && isValid && styles.buttonPressed,
                  ]}
                  onPress={handleSubmit}
                  disabled={!isValid}
                >
                  <Text style={[
                    styles.submitText,
                    !isValid && styles.submitTextDisabled,
                  ]}>
                    create
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>

      {/* Calendar Picker */}
      <CalendarPicker
        visible={showCalendar}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setShowCalendar(false)}
      />

      {/* Time Picker */}
      <TimePicker
        visible={showTimePicker}
        selectedTime={selectedTime}
        onSelect={setSelectedTime}
        onClose={() => setShowTimePicker(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 340,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  header: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginBottom: SPACING.xs,
  },
  input: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: SPACING.lg,
  },
  pickerButton: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: SPACING.sm,
  },
  pickerText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
  },
  pickerPlaceholder: {
    color: COLORS.inkMuted,
  },
  friendsScroll: {
    marginTop: SPACING.xs,
  },
  friendChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginRight: SPACING.xs,
  },
  friendChipSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  friendChipText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
  },
  friendChipTextSelected: {
    color: COLORS.surface,
  },
  noFriendsText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.ink,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: COLORS.line,
  },
  submitText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.surface,
    fontWeight: '500',
  },
  submitTextDisabled: {
    color: COLORS.inkMuted,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
