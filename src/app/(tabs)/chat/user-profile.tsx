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
  Linking,
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
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatLastSeen } from '@/constants/chat';
import { Message, User } from '@/types/chat';
import { getUserById } from '@/services/userService';
import { getMediaMessages, getFileMessages, getLinkMessages } from '@/services/chatService';
import { getFileIcon } from '@/services/mediaService';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileInfo from '@/components/profile/ProfileInfo';
import MediaViewer from '@/components/chat/MediaViewer';

// ==================== Constants ====================
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_MAX = 260;
const HEADER_MIN = STATUSBAR_HEIGHT + 50;
const SCROLL_DIST = HEADER_MAX - HEADER_MIN;
const AVATAR_SIZE = 100;

const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_ITEM = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

type TabType = 'Media' | 'File' | 'Link';
const TABS: TabType[] = ['Media', 'File', 'Link'];

// ==================== Helpers ====================
function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(ts: Timestamp): string {
  try {
    const d = ts.toDate();
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear().toString().slice(2)} lúc ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch { return ''; }
}


function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function domainColor(domain: string): string {
  const c = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];
  let h = 0;
  for (let i = 0; i < domain.length; i++) h = domain.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

// ==================== Component ====================
export default function UserProfileScreen() {
  const router = useRouter();
  const { userId, conversationId } = useLocalSearchParams<{ userId: string; conversationId: string }>();
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

  // ==================== Tab Content ====================
  const renderMedia = () => {
    if (mediaMessages.length === 0) return <EmptyState icon="images-outline" text="Chưa có media nào" />;
    return (
      <View style={st.mediaGrid}>
        {mediaMessages.map((item) => {
          const isVideo = !!(item.imageUrl?.includes('/video/upload/') || /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(item.fileName || ''));
          const thumb = isVideo ? item.imageUrl!.replace('/upload/', '/upload/so_0,w_400,c_fill,f_jpg/') : item.imageUrl;
          return (
            <TouchableOpacity key={item.id} style={st.mediaItem} activeOpacity={0.8} onPress={() => openMedia(item.imageUrl || '')}>
              <Image source={{ uri: thumb }} style={st.mediaImage} resizeMode="cover" />
              {isVideo && <View style={st.videoIcon}><Ionicons name="play" size={18} color="#FFF" style={{ marginLeft: 2 }} /></View>}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFiles = () => {
    if (fileMessages.length === 0) return <EmptyState icon="document-outline" text="Chưa có file nào" />;
    return (
      <View>
        {fileMessages.map((item) => {
          const fileInfo = getFileIcon(item.fileName || '');
          return (
            <TouchableOpacity key={item.id} style={st.fileRow} activeOpacity={0.7} onPress={() => openFile(item.imageUrl || '', item.fileName || 'File')}>
              <View style={[st.fileIconBox, { backgroundColor: fileInfo.bg }]}>
                <Ionicons name={fileInfo.icon as any} size={24} color={fileInfo.color} />
              </View>
              <View style={st.fileInfo}>
                <Text style={st.fileName} numberOfLines={1}>{item.fileName || 'File'}</Text>
                <Text style={st.fileMeta}>{formatFileSize(item.fileSize || 0)}, {formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderLinks = () => {
    if (linkMessages.length === 0) return <EmptyState icon="link-outline" text="Chưa có link nào" />;
    return (
      <View>
        {linkMessages.map((item) => {
          const url = extractUrl(item.text || '');
          if (!url) return null;
          const domain = getDomain(url);
          const title = (item.text || '').replace(/https?:\/\/[^\s]+/gi, '').trim() || domain;
          return (
            <TouchableOpacity key={item.id} style={st.linkRow} activeOpacity={0.7} onPress={() => Linking.openURL(url).catch(() => {})}>
              <View style={[st.linkIcon, { backgroundColor: domainColor(domain) }]}>
                <Text style={st.linkInitial}>{domain.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={st.linkInfo}>
                <Text style={st.linkTitle} numberOfLines={2}>{title}</Text>
                <Text style={st.linkUrl} numberOfLines={1}>{url}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Display values
  const displayName = user?.displayName || 'User';
  const avatarUrl = user?.avatarUrl || '';
  const statusText = formatLastSeen(user?.lastSeen || null, user?.isOnline || false);

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
        <ProfileInfo phoneNumber={user?.phoneNumber || ''} bio={user?.bio || ''} />

        {/* Tab bar */}
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
            : activeTab === 'Media' ? renderMedia()
            : activeTab === 'File' ? renderFiles()
            : renderLinks()
          }
        </View>
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

// ==================== Empty State ====================
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={st.emptyWrap}>
      <Ionicons name={icon as any} size={48} color="#CCC" />
      <Text style={st.emptyText}>{text}</Text>
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

  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: GRID_GAP / 2 },
  mediaItem: { width: GRID_ITEM, height: GRID_ITEM, margin: GRID_GAP / 2, position: 'relative' as const },
  mediaImage: { width: '100%', height: '100%' },
  videoIcon: {
    position: 'absolute', bottom: 6, left: 6, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },

  fileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  fileIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },

  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '500', color: '#222', marginBottom: 3 },
  fileMeta: { fontSize: 13, color: '#999' },

  linkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  linkIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  linkInitial: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 15, fontWeight: '500', color: '#222', marginBottom: 3, lineHeight: 20 },
  linkUrl: { fontSize: 13, color: '#4CAF50' },

  emptyWrap: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: '#999', fontSize: 15, marginTop: 12 },
});
