import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { Message } from '@/types/chat';
import { formatLastSeen } from '@/constants/chat';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversation';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { markConversationAsRead, toggleMuteConversation } from '@/services/chatService';
import { setCurrentOpenChat } from '@/hooks/useNotificationListener';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import WallpaperPicker from '@/components/chat/WallpaperPicker';
import ChatOptionsMenu from '@/components/chat/ChatOptionsMenu';
import ChatSearchBar from '@/components/chat/ChatSearchBar';

// Separator key cho "Tin nhắn chưa đọc"
const UNREAD_SEPARATOR_ID = '__unread_separator__';

interface ListItem {
  id: string;
  type: 'message' | 'unread-separator';
  message?: Message;
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const { conversation, otherUser, lastReadBy } = useConversation(chatId || null, currentUid);
  const { messages, loading, loadingMore, sending, sendTextMessage, sendImageMessage, loadMore, hasMore } =
    useMessages(chatId || null, currentUid);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pendingImage, setPendingImage] = useState<{ uri: string; fileName: string } | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [initialLastRead, setInitialLastRead] = useState<Timestamp | null>(null);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrolledToInitial = useRef(false);

  const { currentWallpaper, setWallpaper } = useChatWallpaper(chatId || null);

  // Track current chat để notification biết bỏ qua
  useEffect(() => {
    setCurrentOpenChat(chatId || null);
    return () => setCurrentOpenChat(null);
  }, [chatId]);

  // Mute state
  const isMuted = useMemo(() => {
    if (!conversation || !currentUid) return false;
    return conversation.mutedBy?.[currentUid] || false;
  }, [conversation, currentUid]);

  const handleToggleMute = useCallback(async () => {
    if (!chatId || !currentUid) return;
    await toggleMuteConversation(chatId, currentUid, !isMuted);
  }, [chatId, currentUid, isMuted]);

  // Lưu lastReadBy[currentUid] lần đầu khi mở chat (để biết tin nhắn nào chưa đọc)
  useEffect(() => {
    if (lastReadBy && currentUid && initialLastRead === null) {
      const myLastRead = lastReadBy[currentUid] || undefined;
      if (myLastRead) {
        setInitialLastRead(myLastRead);
      } else {
        // Chưa từng đọc → dùng epoch 0 để TẤT CẢ tin nhắn đều là "chưa đọc"
        // Nhưng nếu không muốn hiện separator khi chưa có lần đọc trước → scroll to end
        setInitialLastRead(Timestamp.fromMillis(0));
      }
    }
  }, [lastReadBy, currentUid, initialLastRead]);

  // Mark conversation as read khi mở chat
  useEffect(() => {
    if (chatId && currentUid && !loading && messages.length > 0 && !hasMarkedRead) {
      markConversationAsRead(chatId, currentUid);
      setHasMarkedRead(true);
    }
  }, [chatId, currentUid, loading, messages.length, hasMarkedRead]);

  // Tìm otherUid
  const otherUid = useMemo(() => {
    if (!conversation || !currentUid) return null;
    return conversation.participants.find((uid) => uid !== currentUid) || null;
  }, [conversation, currentUid]);

  // Tính toán read status cho outgoing messages dựa trên lastReadBy[otherUid]
  const getComputedStatus = useCallback(
    (msg: Message): Message['status'] => {
      // Chỉ tính cho outgoing messages
      if (msg.senderId !== currentUid) return msg.status;
      if (msg.status === 'sending') return 'sending';

      // So sánh lastReadBy[otherUid] với message.createdAt
      if (otherUid && lastReadBy && lastReadBy[otherUid]) {
        const otherReadAt = lastReadBy[otherUid];
        const msgTime = msg.createdAt;
        if (msgTime && otherReadAt) {
          const msgMs = msgTime.toMillis?.() || 0;
          const readMs = otherReadAt.toMillis?.() || 0;
          if (readMs >= msgMs) return 'read';
        }
      }
      return 'sent';
    },
    [currentUid, otherUid, lastReadBy]
  );

  // Build danh sách items: messages + unread separator
  const listItems: ListItem[] = useMemo(() => {
    if (messages.length === 0) return [];

    const items: ListItem[] = [];
    let separatorInserted = false;
    const readMs = initialLastRead?.toMillis?.() || 0;

    for (const msg of messages) {
      // Chèn separator trước tin nhắn chưa đọc đầu tiên từ người khác
      if (
        !separatorInserted &&
        msg.senderId !== currentUid &&
        initialLastRead !== null &&
        readMs > 0
      ) {
        const msgMs = msg.createdAt?.toMillis?.() || 0;
        if (msgMs > readMs) {
          items.push({ id: UNREAD_SEPARATOR_ID, type: 'unread-separator' });
          separatorInserted = true;
        }
      }

      items.push({
        id: msg.id,
        type: 'message',
        message: { ...msg, status: getComputedStatus(msg) },
      });
    }

    return items;
  }, [messages, currentUid, initialLastRead, getComputedStatus]);

  // Dữ liệu đảo ngược cho inverted FlatList (mới nhất ở đầu)
  const invertedItems = useMemo(() => [...listItems].reverse(), [listItems]);

  // Scroll đến unread separator 1 lần duy nhất sau khi load
  useEffect(() => {
    if (scrolledToInitial.current || invertedItems.length === 0) return;
    scrolledToInitial.current = true;

    const unreadIndex = invertedItems.findIndex(item => item.id === UNREAD_SEPARATOR_ID);
    if (unreadIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: unreadIndex,
          animated: false,
          viewPosition: 0.9,
        });
      }, 300);
    }
    // Không có separator → FlatList inverted tự hiện cuối (index 0 = tin mới nhất)
  }, [invertedItems]);

  const isOutgoing = useCallback(
    (msg: Message) => msg.senderId === currentUid,
    [currentUid]
  );

  const handleReply = useCallback((msg: Message) => {
    setReplyingTo(msg);
  }, []);

  const handleSendText = useCallback(
    async (text: string) => {
      const replyTo = replyingTo
        ? {
            messageId: replyingTo.id,
            text: replyingTo.type === 'image' ? '📷 Ảnh' : replyingTo.text,
            senderName: isOutgoing(replyingTo)
              ? 'Bạn'
              : otherUser?.displayName || 'User',
          }
        : undefined;

      await sendTextMessage(text, replyTo);
      setReplyingTo(null);

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    },
    [replyingTo, sendTextMessage, otherUser, isOutgoing]
  );

  const handlePickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `IMG_${Date.now()}.jpg`;
        setPendingImage({ uri: asset.uri, fileName });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh.');
    }
  }, []);

  const handleSendImage = useCallback(
    async (uri: string, fileName: string, caption: string) => {
      setPendingImage(null);
      await sendImageMessage(uri, fileName, caption || undefined);

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    },
    [sendImageMessage]
  );

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.text?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const highlightedMessageId = useMemo(() => {
    if (searchResults.length === 0) return null;
    const safeIndex = Math.min(searchResultIndex, searchResults.length - 1);
    return searchResults[safeIndex]?.msg.id || null;
  }, [searchResults, searchResultIndex]);

  // Scroll đến kết quả search trong inverted list
  useEffect(() => {
    if (!highlightedMessageId || invertedItems.length === 0) return;
    const idx = invertedItems.findIndex(
      (item) => item.id === highlightedMessageId
    );
    if (idx >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.5,
        });
      }, 150);
    }
  }, [highlightedMessageId, invertedItems]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchResultIndex(0);
  }, []);

  const handleSearchNext = useCallback(() => {
    setSearchResultIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
  }, [searchResults.length]);

  const handleSearchPrev = useCallback(() => {
    setSearchResultIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'unread-separator') {
        return (
          <View style={styles.unreadSeparator}>
            <View style={styles.unreadLine} />
            <Text style={styles.unreadText}>Tin nhắn chưa đọc</Text>
            <View style={styles.unreadLine} />
          </View>
        );
      }

      if (!item.message) return null;

      return (
        <MessageBubble
          message={item.message}
          isOutgoing={isOutgoing(item.message)}
          senderName={otherUser?.displayName}
          isHighlighted={item.id === highlightedMessageId}
          onReply={handleReply}
          onImagePress={(url) => console.log('Open image:', url)}
        />
      );
    },
    [isOutgoing, otherUser, handleReply, highlightedMessageId]
  );

  const wallpaperBg = currentWallpaper.colors[0];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#50A8EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {showSearch ? (
          <ChatSearchBar
            totalResults={searchResults.length}
            currentIndex={searchResultIndex}
            onSearch={handleSearch}
            onNext={handleSearchNext}
            onPrev={handleSearchPrev}
            onClose={() => {
              setShowSearch(false);
              setSearchQuery('');
              setSearchResultIndex(0);
            }}
          />
        ) : (
          <ChatHeader
            userName={otherUser?.displayName || 'User'}
            userAvatar={otherUser?.avatarUrl || ''}
            lastSeen={formatLastSeen(otherUser?.lastSeen || null, otherUser?.isOnline || false)}
            isOnline={otherUser?.isOnline || false}
            onBackPress={() => router.back()}
            onProfilePress={() =>
              router.push({
                pathname: '/(tabs)/chat/user-profile',
                params: { userId: otherUser?.uid || '' },
              })
            }
            onCallPress={() => Alert.alert('Cuộc gọi', 'Tính năng đang phát triển')}
            onMenuPress={() => setShowOptionsMenu(true)}
          />
        )}

        <View style={[styles.messagesArea, { backgroundColor: wallpaperBg }]}>
          {currentWallpaper.type === 'gradient' && currentWallpaper.colors.length >= 2 && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: currentWallpaper.colors[1],
                  opacity: 0.4,
                },
              ]}
            />
          )}

          <FlatList
            ref={flatListRef}
            data={invertedItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#50A8EB" />
                </View>
              ) : null
            }
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            }}
          />
        </View>

        <MessageInput
          onSendText={handleSendText}
          onPickImage={handlePickImage}
          onSendImage={handleSendImage}
          pendingImage={pendingImage}
          onCancelImage={() => setPendingImage(null)}
          replyingTo={replyingTo}
          replyingSenderName={
            replyingTo
              ? isOutgoing(replyingTo)
                ? 'Bạn'
                : otherUser?.displayName
              : undefined
          }
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>

      <ChatOptionsMenu
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        onChangeWallpaper={() => setShowWallpaperPicker(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onSearch={() => setShowSearch(true)}
        onAddContact={() => {
          Alert.alert('Thêm vào danh bạ', 'Tính năng đang phát triển');
        }}
      />

      <WallpaperPicker
        visible={showWallpaperPicker}
        onClose={() => setShowWallpaperPicker(false)}
        currentWallpaperId={currentWallpaper.id}
        onSelect={setWallpaper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F3',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F6F8F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  // ======= Unread Separator =======
  unreadSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  unreadLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#50A8EB',
    opacity: 0.4,
  },
  unreadText: {
    color: '#50A8EB',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  // ======= Loading More =======
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
