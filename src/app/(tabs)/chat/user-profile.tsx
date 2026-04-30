import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedRef,
  interpolate,
  Extrapolation,
  scrollTo,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { formatLastSeen } from '@/constants/chat';
import { Message, User } from '@/types/chat';
import { getUserById } from '@/services/userService';
import { getMediaMessages, getFileMessages, getLinkMessages } from '@/services/chatService';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileInfo from '@/components/profile/ProfileInfo';
import MediaGrid from '@/components/profile/MediaGrid';
import FileList from '@/components/profile/FileList';
import LinkList from '@/components/profile/LinkList';
import MediaViewer from '@/components/chat/MediaViewer';

// ==================== Constants ====================
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_MAX = 260;
const HEADER_MIN = STATUSBAR_HEIGHT + 50;
const SCROLL_DIST = HEADER_MAX - HEADER_MIN;
const AVATAR_SIZE = 100;

type TabType = 'Media' | 'File' | 'Link';
const TABS: TabType[] = ['Media', 'File', 'Link'];

// ==================== Component ====================
export default function UserProfileScreen() {
  const router = useRouter();
  const { userId, conversationId, callDate, callType } = useLocalSearchParams<{ userId: string; conversationId: string; callDate?: string; callType?: string }>();
  const { user: currentUser } = useAuth();
  const currentUid = (currentUser as any)?.uid || null;

  // State
  const [activeTab, setActiveTab] = useState<TabType>('Media');
  const [user, setUser] = useState<User | null>(null);
  const [mediaMessages, setMediaMessages] = useState<Message[]>([]);
  const [fileMessages, setFileMessages] = useState<Message[]>([]);
  const [linkMessages, setLinkMessages] = useState<Message[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set());
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState<string | null>(null);

  // Scroll animation
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
    onEndDrag: (e) => {
      'worklet';
      const y = e.contentOffset.y;
      // Snap: in transition zone → collapse or expand
      if (y > 0 && y < SCROLL_DIST) {
        scrollTo(scrollRef, 0, y > SCROLL_DIST * 0.3 ? SCROLL_DIST : 0, true);
      }
    },
    onMomentumEnd: (e) => {
      'worklet';
      const y = e.contentOffset.y;
      if (y > 0 && y < SCROLL_DIST) {
        scrollTo(scrollRef, 0, y > SCROLL_DIST * 0.3 ? SCROLL_DIST : 0, true);
      }
    },
  });

  // Load user
  useEffect(() => {
    if (!userId) return;
    getUserById(userId).then(setUser).catch(() => {});
  }, [userId]);

  // Load tab data (lazy, cached)
  const loadTabData = useCallback(async (tab: TabType) => {
    if (!conversationId || !currentUid || loadedTabs.has(tab)) return;
    setLoadingTab(true);
    try {
      if (tab === 'Media') setMediaMessages(await getMediaMessages(conversationId, currentUid));
      else if (tab === 'File') setFileMessages(await getFileMessages(conversationId, currentUid));
      else setLinkMessages(await getLinkMessages(conversationId, currentUid));
      setLoadedTabs((prev) => new Set(prev).add(tab));
    } catch (e) { console.error(`Load ${tab}:`, e); }
    finally { setLoadingTab(false); }
  }, [conversationId, currentUid, loadedTabs]);

  useEffect(() => { loadTabData(activeTab); }, [activeTab, loadTabData]);

  // ==================== Animated Styles ====================
  // 2 states only: Default (scrollY=0) ↔ Collapsed (scrollY≥SCROLL_DIST)

  /** Header height: shrinks as user scrolls */
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, SCROLL_DIST], [HEADER_MAX, HEADER_MIN], Extrapolation.CLAMP),
  }));

  /** Avatar: shrink + fade */
  const avatarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_DIST * 0.4], [1, 0], Extrapolation.CLAMP),
    transform: [{
      scale: interpolate(scrollY.value, [0, SCROLL_DIST * 0.5], [1, 0.3], Extrapolation.CLAMP),
    }],
  }));

  /** Center name + status: fade out */
  const centerInfoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_DIST * 0.3], [1, 0], Extrapolation.CLAMP),
  }));

  /** Sticky bar: fade in */
  const stickyBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [SCROLL_DIST * 0.5, SCROLL_DIST * 0.8], [0, 1], Extrapolation.CLAMP),
  }));

  // ==================== Viewer Helpers ====================
  const openMedia = (url: string) => { setViewerFileName(null); setViewerUrl(url); };
  const openFile = (url: string, name: string) => { setViewerFileName(name); setViewerUrl(url); };
  const closeViewer = () => { setViewerUrl(null); setViewerFileName(null); };

  const viewerMediaType: 'image' | 'video' | 'file' = viewerFileName
    ? 'file'
    : (viewerUrl?.includes('/video/upload/') || /\.(mp4|mov|avi|mkv|webm|3gp)(\?|$)/i.test(viewerUrl || ''))
      ? 'video' : 'image';


  // Display values
  const displayName = user?.displayName || 'User';
  const avatarUrl = user?.avatarUrl || '';
  const statusText = formatLastSeen(user?.lastSeen || null, user?.isOnline || false);

  // Call history format
  let formattedCallDate = '';
  let formattedCallTime = '';
  if (callDate) {
    const d = new Date(callDate);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    formattedCallDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    formattedCallTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  // ==================== Render ====================
  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* SCROLL CONTENT */}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_MAX, paddingBottom: 40 }}
        bounces={false}
      >
        <ProfileActions onMessage={() => router.back()} onMute={() => {}} onCall={() => {}} onVideoCall={() => {}} />

        {/* Khối hiển thị lịch sử cuộc gọi (chỉ có khi đi từ tab Calls) */}
        {callDate && (
          <View style={st.callHistoryCard}>
            <Text style={st.callDateText}>{formattedCallDate}</Text>
            <View style={st.callTimeRow}>
              <Text style={st.callTimeText}>{formattedCallTime}</Text>
              <Text style={st.callTypeText}>{callType}</Text>
            </View>
          </View>
        )}

        <ProfileInfo phoneNumber={user?.phoneNumber || ''} bio={user?.bio || ''} />

        {/* Tab bar (Ẩn đi nếu đi từ màn hình cuộc gọi, giống như thiết kế Telegram) */}
        {!callDate && (
          <>
            <View style={st.tabBarWrap}>
              <View style={st.tabBar}>
                {TABS.map((tab) => (
                  <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[st.tabItem, activeTab === tab && st.tabItemActive]} activeOpacity={0.7}>
                    <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={st.tabContent}>
              {loadingTab
                ? <View style={st.loadingWrap}><ActivityIndicator size="large" color="#50A8EB" /></View>
                : activeTab === 'Media' ? <MediaGrid messages={mediaMessages} onImagePress={openMedia} />
                : activeTab === 'File' ? <FileList messages={fileMessages} onFilePress={openFile} />
                : <LinkList messages={linkMessages} />
              }
            </View>
          </>
        )}
      </Animated.ScrollView>

      {/* ANIMATED HEADER */}
      <Animated.View style={[st.header, headerStyle]} pointerEvents="box-none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} pointerEvents="none" />

        {/* Avatar — tap to view fullscreen */}
        <Animated.View style={[st.avatarWrap, avatarStyle]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => avatarUrl && openMedia(avatarUrl)}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={st.avatar} />
            ) : (
              <View style={st.avatarPlaceholder}>
                <Text style={st.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Center name + status */}
        <Animated.View style={[st.centerInfo, centerInfoStyle]} pointerEvents="none">
          <Text style={st.centerName}>{displayName}</Text>
          <Text style={st.centerStatus}>{statusText}</Text>
        </Animated.View>

        {/* Sticky bar (collapsed) */}
        <Animated.View style={[st.stickyBar, stickyBarStyle]} pointerEvents="none">
          <Text style={st.stickyName}>{displayName}</Text>
          <Text style={st.stickyStatus}>{statusText}</Text>
        </Animated.View>

        {/* Back button */}
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#010101" />
        </TouchableOpacity>
      </Animated.View>

      {/* MEDIA VIEWER */}
      <MediaViewer
        visible={!!viewerUrl}
        mediaUrl={viewerUrl || ''}
        mediaType={viewerMediaType}
        fileName={viewerFileName || undefined}
        onClose={closeViewer}
      />
    </View>
  );
}

// ==================== Styles ====================
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F0F6' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 10, overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute', top: STATUSBAR_HEIGHT + 8, left: 16,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },

  avatarWrap: { position: 'absolute', top: STATUSBAR_HEIGHT + 30, alignSelf: 'center' },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#54A5E8', alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 40, fontWeight: '600' },

  centerInfo: { position: 'absolute', bottom: 24, alignSelf: 'center', alignItems: 'center' },
  centerName: { color: '#010101', fontSize: 22, fontWeight: '600' },
  centerStatus: { color: '#8E8E93', fontSize: 14, marginTop: 2 },

  stickyBar: { position: 'absolute', top: STATUSBAR_HEIGHT + 8, left: 64, right: 16, justifyContent: 'center' },
  stickyName: { color: '#010101', fontSize: 18, fontWeight: '600' },
  stickyStatus: { color: '#8E8E93', fontSize: 13, marginTop: 1 },

  tabBarWrap: { backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 24, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  tabBar: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 20, padding: 3 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 17 },
  tabItemActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#888' },
  tabTextActive: { color: '#FFF', fontWeight: '600' },

  tabContent: { backgroundColor: '#FFF', minHeight: SCREEN_HEIGHT },
  loadingWrap: { paddingVertical: 64, alignItems: 'center' },

  callHistoryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  callDateText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  callTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callTimeText: {
    fontSize: 15,
    color: '#000',
  },
  callTypeText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
});
