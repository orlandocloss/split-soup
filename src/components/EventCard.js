import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Animated, Easing, Vibration, TextInput } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';
import { TimePicker } from './TimePicker';
import { CalendarPicker } from './CalendarPicker';

/**
 * EventCard Component
 * - Red: Static
 * - Orange: Subtle pulsing
 * - Green: Lightning bolt traveling around border
 */
export const EventCard = ({ 
  event, 
  isOwner,
  status,
  onDelete,
  onUpdateStatus,
  onAddInvitees,
  onUpdateEvent,
  inviterName,
  participants = [],
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cardSize, setCardSize] = useState({ width: 300, height: 80 });
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [localParticipants, setLocalParticipants] = useState(participants);
  
  // Edit states
  const [editTitle, setEditTitle] = useState(event.title);
  const [editLocation, setEditLocation] = useState(event.location || '');
  const [editDate, setEditDate] = useState(event.date);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const { user } = useAuth();

  // Sync local participants with prop
  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  // Reset edit states when modal opens
  useEffect(() => {
    if (showDetails) {
      setEditTitle(event.title);
      setEditLocation(event.location || '');
      setEditDate(event.date);
      setHasChanges(false);
    }
  }, [showDetails, event]);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const boltAnim = useRef(new Animated.Value(0)).current;
  const flickerAnim = useRef(new Animated.Value(1)).current;
  
  const isGreen = status === 'owner' || status === 'accepted';
  const isOrange = status === 'pending';
  const isRed = status === 'declined';

  // Count going (accepted + owner)
  const goingCount = localParticipants.filter(p => p.status === 'accepted').length + 1; // +1 for organizer

  // Get already invited user IDs (including the event creator)
  const invitedIds = [
    ...localParticipants.map(p => p.invitee?.id).filter(Boolean),
    event.creator_id, // Can't invite the creator
  ];

  // Fetch friends when modal opens
  useEffect(() => {
    if (showDetails && user) {
      fetchFriends();
    }
  }, [showDetails, user, invitedIds]);

  const fetchFriends = async () => {
    if (!user) return;

    console.log('Fetching friends for user:', user.id);

    const { data: asRequester, error: e1 } = await supabase
      .from('friendships')
      .select('addressee:profiles!addressee_id(id, username, email)')
      .eq('requester_id', user.id)
      .eq('status', 'accepted');

    const { data: asAddressee, error: e2 } = await supabase
      .from('friendships')
      .select('requester:profiles!requester_id(id, username, email)')
      .eq('addressee_id', user.id)
      .eq('status', 'accepted');

    if (e1) console.log('Error fetching friends (requester):', e1);
    if (e2) console.log('Error fetching friends (addressee):', e2);

    const friendsList = [
      ...(asRequester || []).map((f) => f.addressee),
      ...(asAddressee || []).map((f) => f.requester),
    ].filter(Boolean);
    
    console.log('Total friends found:', friendsList.length);
    console.log('Already invited IDs:', invitedIds);
    
    // Filter out already invited friends and current user
    const uninvitedFriends = friendsList.filter(f => 
      f && f.id && !invitedIds.includes(f.id) && f.id !== user.id
    );
    
    console.log('Uninvited friends:', uninvitedFriends.length);
    setFriends(uninvitedFriends);
  };

  useEffect(() => {
    let animations = [];

    if (isOrange) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );

      animations.push(pulse);
      pulse.start();
    }

    if (isGreen) {
      const bolt = Animated.loop(
        Animated.timing(boltAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );

      const flicker = Animated.loop(
        Animated.sequence([
          Animated.timing(flickerAnim, {
            toValue: 0.7,
            duration: 50,
            useNativeDriver: false,
          }),
          Animated.timing(flickerAnim, {
            toValue: 1,
            duration: 50,
            useNativeDriver: false,
          }),
          Animated.timing(flickerAnim, {
            toValue: 0.85,
            duration: 30,
            useNativeDriver: false,
          }),
          Animated.timing(flickerAnim, {
            toValue: 1,
            duration: 70,
            useNativeDriver: false,
          }),
          Animated.delay(200),
        ])
      );

      animations.push(bolt, flicker);
      bolt.start();
      flicker.start();
    }

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [status, pulseAnim, boltAnim, flickerAnim, isGreen, isOrange]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getColors = () => {
    switch (status) {
      case 'owner':
        return { main: '#00D26A', rgb: '0, 210, 106' };
      case 'pending':
        return { main: '#FF9500', rgb: '255, 149, 0' };
      case 'accepted':
        return { main: '#00D26A', rgb: '0, 210, 106' };
      case 'declined':
        return { main: '#E63946', rgb: '230, 57, 70' };
      default:
        return { main: '#00D26A', rgb: '0, 210, 106' };
    }
  };

  const colors = getColors();

  const { width, height } = cardSize;
  const perimeter = 2 * (width + height);
  const topRatio = width / perimeter;
  const rightRatio = height / perimeter;
  const bottomRatio = width / perimeter;

  // ORANGE - subtle pulsing
  const orangeBorderOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.9],
  });

  const orangeBgOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.2],
  });

  const orangeGlow = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  // Lightning bolt
  const BOLT_LENGTH = 250;

  const boltTopPos = boltAnim.interpolate({
    inputRange: [0, topRatio, 1],
    outputRange: [-BOLT_LENGTH, width, width],
    extrapolate: 'clamp',
  });

  const boltRightPos = boltAnim.interpolate({
    inputRange: [0, topRatio, topRatio + rightRatio, 1],
    outputRange: [-BOLT_LENGTH, -BOLT_LENGTH, height, height],
    extrapolate: 'clamp',
  });

  const boltBottomPos = boltAnim.interpolate({
    inputRange: [0, topRatio + rightRatio, topRatio + rightRatio + bottomRatio, 1],
    outputRange: [width + BOLT_LENGTH, width + BOLT_LENGTH, -BOLT_LENGTH, -BOLT_LENGTH],
    extrapolate: 'clamp',
  });

  const boltLeftPos = boltAnim.interpolate({
    inputRange: [0, topRatio + rightRatio + bottomRatio, 1],
    outputRange: [height + BOLT_LENGTH, height + BOLT_LENGTH, -BOLT_LENGTH],
    extrapolate: 'clamp',
  });

  const trail1Offset = BOLT_LENGTH * 0.5;
  const trail2Offset = BOLT_LENGTH * 0.9;

  const trail1TopPos = boltAnim.interpolate({
    inputRange: [0, topRatio, 1],
    outputRange: [-BOLT_LENGTH - trail1Offset, width - trail1Offset, width - trail1Offset],
    extrapolate: 'clamp',
  });

  const trail2TopPos = boltAnim.interpolate({
    inputRange: [0, topRatio, 1],
    outputRange: [-BOLT_LENGTH - trail2Offset, width - trail2Offset, width - trail2Offset],
    extrapolate: 'clamp',
  });

  const boltTopOpacity = boltAnim.interpolate({
    inputRange: [0, topRatio * 0.95, topRatio, topRatio + 0.02, 1],
    outputRange: [1, 1, 0.6, 0, 0],
    extrapolate: 'clamp',
  });

  const boltRightOpacity = boltAnim.interpolate({
    inputRange: [0, topRatio - 0.02, topRatio, topRatio + rightRatio * 0.95, topRatio + rightRatio, topRatio + rightRatio + 0.02, 1],
    outputRange: [0, 0, 1, 1, 0.6, 0, 0],
    extrapolate: 'clamp',
  });

  const boltBottomOpacity = boltAnim.interpolate({
    inputRange: [0, topRatio + rightRatio - 0.02, topRatio + rightRatio, topRatio + rightRatio + bottomRatio * 0.95, topRatio + rightRatio + bottomRatio, topRatio + rightRatio + bottomRatio + 0.02, 1],
    outputRange: [0, 0, 1, 1, 0.6, 0, 0],
    extrapolate: 'clamp',
  });

  const boltLeftOpacity = boltAnim.interpolate({
    inputRange: [0, 0.02, topRatio + rightRatio + bottomRatio - 0.02, topRatio + rightRatio + bottomRatio, 0.98, 1],
    outputRange: [0.6, 0, 0, 1, 1, 0.6],
    extrapolate: 'clamp',
  });

  const handlePress = () => setShowDetails(true);
  
  // Show confirmation before deleting
  const handleDeletePressed = () => {
    setShowConfirmDelete(true);
  };

  // Actually delete the event
  const confirmDelete = () => {
    Vibration.vibrate(100);
    setShowConfirmDelete(false);
    setShowDetails(false);
    onDelete?.(event.id);
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'accepted' && status !== 'accepted') {
      Vibration.vibrate(100);
    }
    onUpdateStatus?.(newStatus);
    setShowDetails(false);
  };

  const handleTimeChange = (newTime) => {
    const currentDate = new Date(editDate);
    currentDate.setHours(newTime.hour, newTime.minute, 0, 0);
    setEditDate(currentDate.toISOString());
    setHasChanges(true);
    setShowTimePicker(false);
  };

  const handleDateChange = (newDate) => {
    const currentDate = new Date(editDate);
    const selectedDate = new Date(newDate);
    selectedDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);
    setEditDate(selectedDate.toISOString());
    setHasChanges(true);
    setShowDatePicker(false);
  };

  const getCurrentTime = () => {
    const date = new Date(editDate);
    return { hour: date.getHours(), minute: date.getMinutes() };
  };

  const handleTitleChange = (text) => {
    setEditTitle(text);
    setHasChanges(text !== event.title || editLocation !== (event.location || '') || editDate !== event.date);
  };

  const handleLocationChange = (text) => {
    setEditLocation(text);
    setHasChanges(editTitle !== event.title || text !== (event.location || '') || editDate !== event.date);
  };

  // Show confirmation dialog before saving
  const handleSavePressed = () => {
    if (!hasChanges) return;
    // Check if there are participants to warn about
    const hasParticipants = localParticipants.length > 0;
    if (hasParticipants) {
      setShowConfirmSave(true);
    } else {
      // No participants, save directly
      confirmSaveChanges();
    }
  };

  // Actually save the changes
  const confirmSaveChanges = () => {
    Vibration.vibrate(100);
    onUpdateEvent?.({
      title: editTitle.trim(),
      location: editLocation.trim(),
      date: editDate,
    });
    setHasChanges(false);
    setShowConfirmSave(false);
    setShowDetails(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleInviteMore = async () => {
    if (selectedFriends.length > 0) {
      // Get friend details for immediate UI update
      const invitedFriendDetails = friends.filter(f => selectedFriends.includes(f.id));
      
      // Optimistically add to local participants
      const newParticipants = invitedFriendDetails.map(friend => ({
        id: `temp-${friend.id}`,
        status: 'pending',
        invitee: friend,
        inviter: { id: user.id, username: 'you' },
      }));
      
      setLocalParticipants(prev => [...prev, ...newParticipants]);
      
      // Remove invited friends from available list
      setFriends(prev => prev.filter(f => !selectedFriends.includes(f.id)));
      
      // Clear selection
      const friendsToInvite = [...selectedFriends];
      setSelectedFriends([]);
      
      // Send to server
      await onAddInvitees?.(friendsToInvite);
    }
  };

  const onLayout = (e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setCardSize({ width: w, height: h });
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.cardWrapper,
          pressed && styles.cardPressed,
        ]}
        onPress={handlePress}
      >
        {/* Outer glow for green */}
        {isGreen && (
          <Animated.View
            style={[
              styles.glowShadow,
              {
                shadowColor: colors.main,
                shadowOpacity: flickerAnim.interpolate({
                  inputRange: [0.7, 1],
                  outputRange: [0.4, 0.6],
                }),
              },
            ]}
          />
        )}

        {/* Outer glow for orange - subtle */}
        {isOrange && (
          <Animated.View
            style={[
              styles.glowShadow,
              {
                shadowColor: colors.main,
                shadowOpacity: orangeGlow,
              },
            ]}
          />
        )}

        <View 
          style={styles.cardContainer}
          onLayout={onLayout}
        >
          {/* RED: Static border */}
          {isRed && (
            <>
              <View style={[styles.staticBorder, { borderColor: `rgba(${colors.rgb}, 0.6)` }]} />
              <View style={[styles.bgTint, { backgroundColor: `rgba(${colors.rgb}, 0.15)` }]} />
            </>
          )}

          {/* ORANGE: Subtle pulsing border */}
          {isOrange && (
            <>
              <Animated.View 
                style={[
                  styles.subtleBorder, 
                  { 
                    borderColor: colors.main,
                    opacity: orangeBorderOpacity,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.bgTint, 
                  { 
                    backgroundColor: colors.main,
                    opacity: orangeBgOpacity,
                  }
                ]} 
              />
            </>
          )}

          {/* GREEN: Solid border + LIGHTNING */}
          {isGreen && (
            <>
              <View 
                style={[
                  styles.solidBorder, 
                  { borderColor: `rgba(${colors.rgb}, 0.6)` }
                ]} 
              />
              
              <View 
                style={[
                  styles.bgTint, 
                  { backgroundColor: `rgba(${colors.rgb}, 0.15)` }
                ]} 
              />
              
              {/* TOP EDGE LIGHTNING */}
              <Animated.View 
                style={[
                  styles.boltTrail2,
                  styles.boltHorizontalSmall,
                  { 
                    top: -1,
                    left: trail2TopPos,
                    backgroundColor: colors.main,
                    opacity: Animated.multiply(boltTopOpacity, Animated.multiply(flickerAnim, 0.3)),
                    shadowColor: colors.main,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.boltTrail1,
                  styles.boltHorizontalMed,
                  { 
                    top: -1,
                    left: trail1TopPos,
                    backgroundColor: colors.main,
                    opacity: Animated.multiply(boltTopOpacity, Animated.multiply(flickerAnim, 0.5)),
                    shadowColor: colors.main,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.boltOuter,
                  styles.boltHorizontal,
                  { 
                    top: -3,
                    left: boltTopPos,
                    backgroundColor: colors.main,
                    opacity: Animated.multiply(boltTopOpacity, flickerAnim),
                    shadowColor: colors.main,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.boltCore,
                  styles.boltHorizontalCore,
                  { 
                    top: -1,
                    left: boltTopPos,
                    backgroundColor: '#FFFFFF',
                    opacity: Animated.multiply(boltTopOpacity, flickerAnim),
                  }
                ]} 
              />

              {/* RIGHT EDGE LIGHTNING */}
              <Animated.View 
                style={[
                  styles.boltOuter,
                  styles.boltVertical,
                  { 
                    right: -3,
                    top: boltRightPos,
                    backgroundColor: colors.main,
                    opacity: Animated.multiply(boltRightOpacity, flickerAnim),
                    shadowColor: colors.main,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.boltCore,
                  styles.boltVerticalCore,
                  { 
                    right: -1,
                    top: boltRightPos,
                    backgroundColor: '#FFFFFF',
                    opacity: Animated.multiply(boltRightOpacity, flickerAnim),
                  }
                ]} 
              />

              {/* BOTTOM EDGE LIGHTNING */}
              <Animated.View 
                style={[
                  styles.boltOuter,
                  styles.boltHorizontal,
                  { 
                    bottom: -3,
                    left: boltBottomPos,
                    backgroundColor: colors.main,
                    opacity: Animated.multiply(boltBottomOpacity, flickerAnim),
                    shadowColor: colors.main,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.boltCore,
                  styles.boltHorizontalCore,
                  { 
                    bottom: -1,
                    left: boltBottomPos,
                    backgroundColor: '#FFFFFF',
                    opacity: Animated.multiply(boltBottomOpacity, flickerAnim),
                  }
                ]} 
              />

              {/* LEFT EDGE LIGHTNING */}
              <Animated.View 
                style={[
                  styles.boltOuter,
                  styles.boltVertical,
                  { 
                    left: -3,
                    top: boltLeftPos,
                    backgroundColor: colors.main,
                    opacity: Animated.multiply(boltLeftOpacity, flickerAnim),
                    shadowColor: colors.main,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.boltCore,
                  styles.boltVerticalCore,
                  { 
                    left: -1,
                    top: boltLeftPos,
                    backgroundColor: '#FFFFFF',
                    opacity: Animated.multiply(boltLeftOpacity, flickerAnim),
                  }
                ]} 
              />
            </>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.time}>{formatTime(event.date)}</Text>
            
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {event.title}
              </Text>
              {event.location ? (
                <Text style={styles.location} numberOfLines={1}>
                  {event.location}
                </Text>
              ) : null}
              {!isOwner && inviterName && (
                <Text style={styles.inviter}>@{inviterName}</Text>
              )}
              {isOwner && (
                <Text style={styles.ownerBadge}>your event</Text>
              )}
            </View>

            <Text style={styles.goingCount}>{goingCount}</Text>
          </View>
        </View>
      </Pressable>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowDetails(false)}
        >
          <Pressable style={styles.detailSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            
            <Text style={styles.detailTitle}>{event.title}</Text>
            {event.location && (
              <Text style={styles.detailLocation}>{event.location}</Text>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>organizer</Text>
              <View style={styles.organizerRow}>
                <View style={[styles.organizerAvatar, { backgroundColor: '#00D26A' }]}>
                  <Text style={styles.organizerInitial}>
                    {isOwner ? 'Y' : (inviterName?.[0]?.toUpperCase() || '?')}
                  </Text>
                </View>
                <Text style={styles.organizerName}>
                  {isOwner ? 'you' : `@${inviterName}`}
                </Text>
              </View>
            </View>

            {!isOwner && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>your response</Text>
                <View style={styles.statusButtons}>
                  <Pressable
                    style={[
                      styles.statusButton,
                      status === 'accepted' && styles.statusButtonGreen,
                    ]}
                    onPress={() => handleStatusChange('accepted')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      status === 'accepted' && styles.statusButtonTextActive,
                    ]}>going</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.statusButton,
                      status === 'pending' && styles.statusButtonOrange,
                    ]}
                    onPress={() => handleStatusChange('pending')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      status === 'pending' && styles.statusButtonTextActive,
                    ]}>pending</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.statusButton,
                      status === 'declined' && styles.statusButtonRed,
                    ]}
                    onPress={() => handleStatusChange('declined')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      status === 'declined' && styles.statusButtonTextActive,
                    ]}>not going</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {localParticipants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>invitees ({localParticipants.length})</Text>
                <ScrollView style={styles.participantsList} horizontal={false}>
                  {localParticipants.map((p) => {
                    // Check if inviter is different from event creator
                    const invitedByOther = p.inviter && p.inviter.id !== event.creator_id;
                    const invitedByMe = p.inviter && p.inviter.id === user?.id;
                    return (
                      <View key={p.id} style={styles.participantRow}>
                        <View style={[
                          styles.pDot, 
                          { backgroundColor: 
                            p.status === 'accepted' ? '#00D26A' : 
                            p.status === 'declined' ? '#E63946' : '#FF9500' 
                          }
                        ]} />
                        <View style={styles.pNameContainer}>
                          <Text style={[
                            styles.pName,
                            p.status === 'declined' && styles.declined
                          ]}>
                            @{p.invitee?.username}
                          </Text>
                          {invitedByOther && (
                            <Text style={styles.invitedBy}>
                              invited by {invitedByMe ? 'you' : `@${p.inviter.username}`}
                            </Text>
                          )}
                        </View>
                        <Text style={[
                          styles.pStatus,
                          { color: 
                            p.status === 'accepted' ? '#00D26A' : 
                            p.status === 'declined' ? '#E63946' : '#FF9500' 
                          }
                        ]}>
                          {p.status === 'accepted' ? 'going' : 
                           p.status === 'declined' ? 'not going' : 'pending'}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Invite more friends */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>invite more friends</Text>
              {friends.length > 0 ? (
                <>
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
                  {selectedFriends.length > 0 && (
                    <Pressable style={styles.inviteBtn} onPress={handleInviteMore}>
                      <Text style={styles.inviteBtnText}>
                        invite {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''}
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Text style={styles.noFriendsText}>
                  {localParticipants.length > 0 ? 'all friends already invited' : 'add friends first'}
                </Text>
              )}
            </View>

            {isOwner && (
              <>
                {/* Edit Title */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>title</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editTitle}
                    onChangeText={handleTitleChange}
                    placeholder="event title"
                    placeholderTextColor={COLORS.inkMuted}
                  />
                </View>

                {/* Edit Location */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>location</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editLocation}
                    onChangeText={handleLocationChange}
                    placeholder="optional"
                    placeholderTextColor={COLORS.inkMuted}
                  />
                </View>

                {/* Edit Date & Time */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>date & time</Text>
                  <View style={styles.dateTimeRow}>
                    <Pressable 
                      style={styles.dateTimeBtn}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dateTimeText}>{formatDate(editDate)}</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.dateTimeBtn}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.dateTimeText}>{formatTime(editDate)}</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Save Changes Button */}
                {hasChanges && (
                  <Pressable style={styles.saveBtn} onPress={handleSavePressed}>
                    <Text style={styles.saveBtnText}>save changes</Text>
                  </Pressable>
                )}

                <View style={styles.divider} />
                <Pressable style={styles.actionBtn} onPress={handleDeletePressed}>
                  <Text style={styles.deleteText}>delete event</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Time Picker Modal */}
      <TimePicker
        visible={showTimePicker}
        selectedTime={getCurrentTime()}
        onSelect={handleTimeChange}
        onClose={() => setShowTimePicker(false)}
      />

      {/* Date Picker Modal */}
      <CalendarPicker
        visible={showDatePicker}
        selectedDate={editDate}
        onSelect={handleDateChange}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Confirmation Modal for Saving Changes */}
      <Modal
        visible={showConfirmSave}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmSave(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>update event?</Text>
            <Text style={styles.confirmMessage}>
              changing event details will reset all {localParticipants.length} participant{localParticipants.length !== 1 ? 's' : ''} back to pending status.
            </Text>
            <Text style={styles.confirmSubMessage}>
              they will need to confirm their attendance again.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable 
                style={styles.confirmCancelBtn} 
                onPress={() => setShowConfirmSave(false)}
              >
                <Text style={styles.confirmCancelText}>cancel</Text>
              </Pressable>
              <Pressable 
                style={styles.confirmActionBtn} 
                onPress={confirmSaveChanges}
              >
                <Text style={styles.confirmActionText}>update anyway</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal for Deleting Event */}
      <Modal
        visible={showConfirmDelete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmDelete(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>delete event?</Text>
            <Text style={styles.confirmMessage}>
              this will permanently remove the event{localParticipants.length > 0 ? ` and notify ${localParticipants.length} participant${localParticipants.length !== 1 ? 's' : ''}` : ''}.
            </Text>
            <Text style={styles.confirmSubMessage}>
              this action cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable 
                style={styles.confirmCancelBtn} 
                onPress={() => setShowConfirmDelete(false)}
              >
                <Text style={styles.confirmCancelText}>cancel</Text>
              </Pressable>
              <Pressable 
                style={styles.confirmActionBtn} 
                onPress={confirmDelete}
              >
                <Text style={styles.confirmActionText}>delete anyway</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  glowShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    elevation: 15,
  },
  cardContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  staticBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
  },
  subtleBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
  },
  solidBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
  },
  boltOuter: {
    position: 'absolute',
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 1,
    elevation: 15,
  },
  boltCore: {
    position: 'absolute',
    borderRadius: 4,
  },
  boltTrail1: {
    position: 'absolute',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
    elevation: 8,
  },
  boltTrail2: {
    position: 'absolute',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  boltHorizontal: {
    width: 250,
    height: 8,
  },
  boltHorizontalCore: {
    width: 250,
    height: 4,
  },
  boltHorizontalMed: {
    width: 160,
    height: 5,
  },
  boltHorizontalSmall: {
    width: 100,
    height: 3,
  },
  boltVertical: {
    width: 8,
    height: 250,
  },
  boltVerticalCore: {
    width: 4,
    height: 250,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  time: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    marginRight: SPACING.lg,
    minWidth: 45,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    fontWeight: '500',
  },
  location: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  inviter: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkLight,
    marginTop: 2,
  },
  ownerBadge: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
    color: '#00D26A',
  },
  goingCount: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.ink,
    marginLeft: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.line,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  detailTitle: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.ink,
  },
  detailLocation: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    marginTop: SPACING.xs,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  organizerInitial: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.surface,
    fontWeight: '600',
  },
  organizerName: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statusButtonGreen: {
    backgroundColor: '#00D26A',
    borderColor: '#00D26A',
  },
  statusButtonOrange: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  statusButtonRed: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  statusButtonText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  participantsList: {
    maxHeight: 120,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  pDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  pNameContainer: {
    flex: 1,
  },
  pName: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.ink,
  },
  invitedBy: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkLight,
    marginTop: 1,
  },
  pStatus: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
  },
  declined: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  friendsScroll: {
    marginBottom: SPACING.sm,
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
  },
  inviteBtn: {
    backgroundColor: '#00D26A',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  inviteBtnText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: '#fff',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: SPACING.md,
  },
  actionBtn: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: '#E63946',
  },
  editInput: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateTimeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
  },
  dateTimeText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
  },
  saveBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#00D26A',
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: '#fff',
    fontWeight: '600',
  },
  // Confirmation Modal Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  confirmModal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: '#E63946',
  },
  confirmTitle: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#E63946',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  confirmMessage: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  confirmSubMessage: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  confirmCancelText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  confirmActionBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: '#E63946',
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  confirmActionText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: '#fff',
    fontWeight: '600',
  },
});
