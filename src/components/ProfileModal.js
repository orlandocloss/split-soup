import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { supabase } from '../config/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';

/**
 * ProfileModal Component
 * Menu with Friends and Logout
 */
export const ProfileModal = ({ visible, onClose }) => {
  const [showFriends, setShowFriends] = useState(false);
  const { profile, signOut } = useAuth();
  const { pendingCount } = useFriends();

  const handleClose = () => {
    setShowFriends(false);
    onClose();
  };

  const handleLogout = async () => {
    await signOut();
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {showFriends ? (
            <FriendsView onBack={() => setShowFriends(false)} />
          ) : (
            <MenuView
              profile={profile}
              pendingCount={pendingCount}
              onFriends={() => setShowFriends(true)}
              onLogout={handleLogout}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/**
 * Menu View
 */
const MenuView = ({ profile, pendingCount, onFriends, onLogout }) => (
  <View>
    <Text style={styles.header}>@{profile?.username || 'user'}</Text>
    
    <Pressable style={styles.menuItem} onPress={onFriends}>
      <Text style={styles.menuText}>friends</Text>
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
      <Text style={styles.menuArrow}>→</Text>
    </Pressable>
    
    <View style={styles.divider} />
    
    <Pressable style={styles.menuItem} onPress={onLogout}>
      <Text style={[styles.menuText, styles.dangerText]}>logout</Text>
    </Pressable>
  </View>
);

/**
 * Friends View
 */
const FriendsView = ({ onBack }) => {
  const [tab, setTab] = useState('friends'); // friends | search | requests
  const { friends, pendingReceived, pendingCount } = useFriends();

  return (
    <View>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.backButton}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>friends</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => setTab('friends')}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            all ({friends.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
            requests {pendingCount > 0 && `(${pendingCount})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'search' && styles.tabActive]}
          onPress={() => setTab('search')}
        >
          <Text style={[styles.tabText, tab === 'search' && styles.tabTextActive]}>
            add
          </Text>
        </Pressable>
      </View>

      {tab === 'friends' && <FriendsListView friends={friends} />}
      {tab === 'requests' && <RequestsView requests={pendingReceived} />}
      {tab === 'search' && <SearchView />}
    </View>
  );
};

/**
 * Friends List
 */
const FriendsListView = ({ friends }) => (
  <FlatList
    data={friends}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View style={styles.userRow}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>
            {item.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
    )}
    ListEmptyComponent={
      <Text style={styles.emptyText}>no friends yet</Text>
    }
    style={styles.list}
  />
);

/**
 * Friend Requests
 */
const RequestsView = ({ requests }) => {
  const { acceptRequest, declineRequest } = useFriends();

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.requestRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {item.requester?.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{item.requester?.username}</Text>
          </View>
          <View style={styles.requestActions}>
            <Pressable
              style={styles.declineButton}
              onPress={() => declineRequest(item.id)}
            >
              <Text style={styles.declineText}>✕</Text>
            </Pressable>
            <Pressable
              style={styles.acceptButton}
              onPress={() => acceptRequest(item.id)}
            >
              <Text style={styles.acceptText}>✓</Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>no pending requests</Text>
      }
      style={styles.list}
    />
  );
};

/**
 * Search and Add Friends
 */
const SearchView = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const { user } = useAuth();
  const { sendRequest, pendingSent, friends, refresh } = useFriends();

  const handleSearch = async (text) => {
    setQuery(text);
    
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email')
      .neq('id', user.id)
      .or(`username.ilike.%${text}%,email.ilike.%${text}%`)
      .limit(10);

    if (error) {
      console.log('Search error:', error);
    }
    
    setResults(data || []);
    setLoading(false);
  };

  const handleAdd = async (userId) => {
    setSending(userId);
    
    const result = await sendRequest(userId);
    
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      // Refresh to update the UI
      refresh();
    }
    
    setSending(null);
  };

  const getStatus = (userId) => {
    if (friends.some((f) => f.id === userId)) return 'friends';
    if (pendingSent.some((p) => p.addressee?.id === userId)) return 'pending';
    return 'none';
  };

  return (
    <View>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={handleSearch}
        placeholder="search username"
        placeholderTextColor={COLORS.inkMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.ink} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const status = getStatus(item.id);
            const isSending = sending === item.id;
            
            return (
              <View style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>
                    {item.username?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>
                {status === 'none' && (
                  <Pressable
                    style={[styles.addButton, isSending && styles.addButtonDisabled]}
                    onPress={() => handleAdd(item.id)}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <ActivityIndicator color={COLORS.surface} size="small" />
                    ) : (
                      <Text style={styles.addText}>+</Text>
                    )}
                  </Pressable>
                )}
                {status === 'pending' && (
                  <Text style={styles.statusText}>sent</Text>
                )}
                {status === 'friends' && (
                  <Text style={styles.statusText}>✓</Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            query.length >= 2 ? (
              <Text style={styles.emptyText}>no users found</Text>
            ) : (
              <Text style={styles.emptyText}>type to search</Text>
            )
          }
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: SPACING.md,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minWidth: 260,
    maxHeight: 420,
  },
  header: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.ink,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.ink,
  },
  backButton: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
  },
  placeholder: {
    width: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  menuText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.ink,
    flex: 1,
  },
  menuArrow: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  dangerText: {
    color: COLORS.danger,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: SPACING.sm,
  },
  badge: {
    backgroundColor: COLORS.spark,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontFamily: FONT.mono,
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ink,
  },
  tabText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
  },
  tabTextActive: {
    color: COLORS.ink,
    fontWeight: '500',
  },
  searchInput: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  loader: {
    marginTop: SPACING.lg,
  },
  list: {
    maxHeight: 220,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  userInitial: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.ink,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.ink,
  },
  emptyText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.surface,
  },
  statusText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  declineButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.spark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  acceptText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.surface,
  },
});
