import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { ChatWithUser } from '@/components/chat-list/ChatItem';

// Track conversation đang mở hiện tại
let currentOpenChatId: string | null = null;

export function setCurrentOpenChat(chatId: string | null) {
  currentOpenChatId = chatId;
}

// ============ Notification Context ============

interface NotificationData {
  senderName: string;
  senderAvatar?: string;
  messageText: string;
  chatId: string;
}

interface NotificationContextType {
  showNotification: (data: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export function useNotification() {
  return useContext(NotificationContext);
}

// ============ In-App Notification Banner ============

interface InAppBannerProps {
  notification: NotificationData | null;
  onPress: (chatId: string) => void;
  onDismiss: () => void;
}

function InAppBanner({ notification, onPress, onDismiss }: InAppBannerProps) {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (notification) {
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      // Auto-dismiss sau 4s
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }).start(onDismiss);
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-120);
    }
  }, [notification]);

  if (!notification) return null;

  const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        { paddingTop: STATUSBAR_HEIGHT + 8, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.bannerContent}
        activeOpacity={0.8}
        onPress={() => {
          onPress(notification.chatId);
          onDismiss();
        }}
      >
        {notification.senderAvatar ? (
          <Image source={{ uri: notification.senderAvatar }} style={styles.bannerAvatar} />
        ) : (
          <View style={styles.bannerAvatarPlaceholder}>
            <Ionicons name="person" size={18} color="#FFF" />
          </View>
        )}
        <View style={styles.bannerTextGroup}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {notification.senderName}
          </Text>
          <Text style={styles.bannerBody} numberOfLines={1}>
            {notification.messageText}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.bannerClose}>
          <Ionicons name="close" size={18} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============ Provider ============

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<NotificationData | null>(null);
  const router = useRouter();

  const showNotification = useCallback((data: NotificationData) => {
    setCurrent(data);
  }, []);

  const handlePress = useCallback((chatId: string) => {
    router.push({
      pathname: '/(tabs)/chat/[chatId]',
      params: { chatId },
    });
  }, [router]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <InAppBanner
        notification={current}
        onPress={handlePress}
        onDismiss={() => setCurrent(null)}
      />
    </NotificationContext.Provider>
  );
}

// ============ Listener Hook ============

export function useNotificationListener() {
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;
  const { showNotification } = useNotification();
  const prevChatsRef = useRef<Map<string, string>>(new Map());

  let chats: ChatWithUser[] = [];
  try {
    // Lazy import to avoid circular deps
    const { useSharedChatList } = require('@/context/ChatListContext');
    const chatList = useSharedChatList();
    chats = chatList.chats;
  } catch {
    // ChatListProvider chưa sẵn sàng
  }

  useEffect(() => {
    if (!currentUid || chats.length === 0) return;

    const prevMap = prevChatsRef.current;
    const newMap = new Map<string, string>();

    for (const chat of chats) {
      const conv = chat.conversation;
      const lastMsg = conv.lastMessage;
      if (!lastMsg) continue;

      const msgKey = `${lastMsg.senderId}_${lastMsg.timestamp?.toMillis?.() || 0}`;
      newMap.set(conv.id, msgKey);

      const prevKey = prevMap.get(conv.id);

      if (
        prevKey &&
        prevKey !== msgKey &&
        lastMsg.senderId !== currentUid
      ) {
        // Không hiện nếu đang ở chat đó
        if (currentOpenChatId === conv.id) continue;
        // Không hiện nếu bị mute
        if (conv.mutedBy?.[currentUid]) continue;

        const senderName = chat.otherUser?.displayName || 'Người dùng';
        const msgText = lastMsg.type === 'image' ? '📷 Hình ảnh' : lastMsg.text || 'Tin nhắn mới';

        showNotification({
          senderName,
          senderAvatar: chat.otherUser?.avatarUrl,
          messageText: msgText,
          chatId: conv.id,
        });
      }
    }

    prevChatsRef.current = newMap;
  }, [chats, currentUid, showNotification]);
}

// ============ Styles ============

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  bannerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  bannerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#50A8EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  bannerBody: {
    fontSize: 14,
    color: '#666',
    marginTop: 1,
  },
  bannerClose: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
