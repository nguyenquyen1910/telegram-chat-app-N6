import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatLastSeen } from '@/constants/chat';
import { Message, User } from '@/types/chat';
import { getUserById } from '@/services/userService';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileInfo from '@/components/profile/ProfileInfo';

const TABS = ['Bài đăng', 'Media', 'Đã lưu', 'File', 'Link', 'GIF'];
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 2;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState('Media');
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getUserById(userId).then((u) => {
      setUser(u);
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, [userId]);

  // Media messages sẽ trống tạm thời (cần query riêng nếu muốn)
  const mediaMessages: Message[] = [];

  // Header component cho FlatList (profile info + tabs)
  const ListHeader = () => (
    <View>
      <ProfileHeader
        displayName={user?.displayName || 'User'}
        avatarUrl={user?.avatarUrl || ''}
        lastSeen={formatLastSeen(user?.lastSeen || null, user?.isOnline || false)}
        isOnline={user?.isOnline || false}
      />

      <ProfileActions
        onMessage={() => router.back()}
        onMute={() => console.log('Mute')}
        onCall={() => console.log('Call')}
        onVideoCall={() => console.log('Video call')}
      />

      <ProfileInfo phoneNumber={user?.phoneNumber || ''} bio={user?.bio || ''} />

      {/* Tab bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Render media grid item
  const renderMediaItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{ width: ITEM_SIZE, height: ITEM_SIZE, margin: ITEM_MARGIN / 2 }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  // Empty state cho các tab khác
  const EmptyTab = () => (
    <View style={styles.emptyTab}>
      <Text style={styles.emptyTabText}>
        {activeTab === 'Media' ? 'Chưa có media nào' : 'Chưa có nội dung'}
      </Text>
    </View>
  );

  // Data dựa trên active tab
  const listData = activeTab === 'Media' ? mediaMessages : [];

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Dùng 1 FlatList duy nhất thay vì ScrollView + FlatList lồng nhau */}
      <FlatList
        data={listData}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyTab}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1621',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_HEIGHT + 8,
    paddingBottom: 8,
    backgroundColor: '#17212B',
  },
  scroll: {
    flex: 1,
  },
  tabBarContainer: {
    marginTop: 8,
    backgroundColor: '#17212B',
    borderBottomWidth: 0.5,
    borderBottomColor: '#0E1621',
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#62AAEF',
  },
  tabText: {
    color: '#8E9BAA',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#62AAEF',
    fontWeight: '500',
  },
  emptyTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTabText: {
    color: '#8E9BAA',
    fontSize: 15,
  },
});
