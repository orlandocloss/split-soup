import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';

const MAX_LENGTH = 100;

/**
 * AlertButton - Button to compose and send alerts to selected friends
 */
export const AlertButton = ({ onSend }) => {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  const { user } = useAuth();

  // Fetch friends when modal opens
  useEffect(() => {
    if (showModal && user) {
      fetchFriends();
    }
  }, [showModal, user]);

  const fetchFriends = async () => {
    if (!user) return;

    const { data: asRequester } = await supabase
      .from('friendships')
      .select('addressee:profiles!addressee_id(id, username)')
      .eq('requester_id', user.id)
      .eq('status', 'accepted');

    const { data: asAddressee } = await supabase
      .from('friendships')
      .select('requester:profiles!requester_id(id, username)')
      .eq('addressee_id', user.id)
      .eq('status', 'accepted');

    const friendsList = [
      ...(asRequester || []).map(f => f.addressee),
      ...(asAddressee || []).map(f => f.requester),
    ].filter(Boolean);

    setFriends(friendsList);
    // Default: select all friends
    setSelectedFriends(friendsList.map(f => f.id));
    setSelectAll(true);
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => {
      const newSelection = prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId];
      
      setSelectAll(newSelection.length === friends.length);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFriends([]);
      setSelectAll(false);
    } else {
      setSelectedFriends(friends.map(f => f.id));
      setSelectAll(true);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || sending || selectedFriends.length === 0) return;

    setSending(true);
    const response = await onSend(message.trim(), selectedFriends);
    setSending(false);

    if (response.success) {
      Vibration.vibrate(100);
      setResult({ type: 'success', text: `sent to ${response.recipientCount} friend${response.recipientCount > 1 ? 's' : ''}` });
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
        setResult(null);
        setSelectedFriends([]);
      }, 1500);
    } else {
      setResult({ type: 'error', text: response.error });
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setMessage('');
    setResult(null);
  };

  const charsRemaining = MAX_LENGTH - message.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <>
      <Pressable 
        style={styles.alertButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.alertButtonText}>alert</Text>
      </Pressable>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
              <Text style={styles.header}>send alert</Text>

              <TextInput
                style={[
                  styles.input,
                  isOverLimit && styles.inputError,
                ]}
                value={message}
                onChangeText={setMessage}
                placeholder="what's happening?"
                placeholderTextColor={COLORS.inkMuted}
                multiline
                maxLength={MAX_LENGTH + 10}
                autoFocus
              />

              <View style={styles.charCount}>
                <Text style={[
                  styles.charCountText,
                  isOverLimit && styles.charCountError,
                  charsRemaining <= 20 && styles.charCountWarn,
                ]}>
                  {charsRemaining}
                </Text>
              </View>

              {/* Friend selection */}
              <View style={styles.friendsSection}>
                <View style={styles.friendsHeader}>
                  <Text style={styles.friendsLabel}>send to</Text>
                  <Pressable onPress={toggleSelectAll}>
                    <Text style={styles.selectAllText}>
                      {selectAll ? 'deselect all' : 'select all'}
                    </Text>
                  </Pressable>
                </View>

                {friends.length > 0 ? (
                  <View style={styles.friendsWrap}>
                    {friends.map(friend => {
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
                          <Text style={[
                            styles.friendChipText,
                            isSelected && styles.friendChipTextSelected,
                          ]}>
                            @{friend.username}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.noFriendsText}>no friends yet</Text>
                )}

                <Text style={styles.selectedCount}>
                  {selectedFriends.length} of {friends.length} selected
                </Text>
              </View>

              {result && (
                <View style={[
                  styles.resultBanner,
                  result.type === 'success' ? styles.successBanner : styles.errorBanner,
                ]}>
                  <Text style={styles.resultText}>{result.text}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>cancel</Text>
                </Pressable>
                <Pressable 
                  style={[
                    styles.sendBtn,
                    (!message.trim() || isOverLimit || sending || selectedFriends.length === 0) && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!message.trim() || isOverLimit || sending || selectedFriends.length === 0}
                >
                  <Text style={[
                    styles.sendText,
                    (!message.trim() || isOverLimit || sending || selectedFriends.length === 0) && styles.sendTextDisabled,
                  ]}>
                    {sending ? 'sending...' : 'send'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  alertButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertButtonText: {
    fontFamily: FONT.mono,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    minWidth: 300,
  },
  header: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  input: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  inputError: {
    borderColor: '#E63946',
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  },
  charCountText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
  },
  charCountWarn: {
    color: '#FF9500',
  },
  charCountError: {
    color: '#E63946',
    fontWeight: '600',
  },
  friendsSection: {
    marginTop: SPACING.md,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  friendsLabel: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  selectAllText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: '#FF9500',
  },
  friendsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xs,
  },
  friendChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginRight: 6,
    marginBottom: 6,
  },
  friendChipSelected: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  friendChipText: {
    fontFamily: FONT.mono,
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  friendChipTextSelected: {
    color: '#fff',
  },
  noFriendsText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    fontStyle: 'italic',
  },
  selectedCount: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginTop: SPACING.xs,
  },
  resultBanner: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.md,
  },
  successBanner: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
  },
  errorBanner: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
  },
  resultText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.ink,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  sendBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: '#FF9500',
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.line,
  },
  sendText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: '#fff',
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: COLORS.inkMuted,
  },
});
