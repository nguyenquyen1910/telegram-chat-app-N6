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
  Keyboard,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
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
import AttachmentPicker from '@/components/chat/AttachmentPicker';
import MediaViewer from '@/components/chat/MediaViewer';
import MessageActionMenu from '@/components/chat/MessageActionMenu';
import DateSeparator from '@/components/chat/DateSeparator';

// Separator key cho "Tin nhắn chưa đọc"
const UNREAD_SEPARATOR_ID = '__unread_separator__';

interface ListItem {
  id: string;
  type: 'message' | 'unread-separator' | 'date-separator';
  message?: Message;
  dateStr?: string;
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const { conversation, otherUser, lastReadBy } = useConversation(chatId || null, currentUid);
  const { messages, loading, loadingMore, sending, sendTextMessage, sendImageMessage, sendFileMessage, loadMore, hasMore, handleRevokeMessage, handleDeleteForMe, handleToggleReaction, handleEditMessage } =
    useMessages(chatId || null, currentUid);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pendingImage, setPendingImage] = useState<{ uri: string; fileName: string } | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [mediaViewerUrl, setMediaViewerUrl] = useState<string | null>(null);
  const [mediaViewerFileName, setMediaViewerFileName] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
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

  // Keyboard listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  // Build danh sách items: messages + unread separator + date separator
  const listItems: ListItem[] = useMemo(() => {
    if (messages.length === 0) return [];

    const items: ListItem[] = [];
    let separatorInserted = false;
    const readMs = initialLastRead?.toMillis?.() || 0;
    let lastDateStr = '';

    for (const msg of messages) {
      // 1. Chèn date separator nếu khác ngày
      let msgDateStr = '';
      if (msg.createdAt) {
        const d = msg.createdAt.toDate();
        msgDateStr = `${d.getDate()} tháng ${d.getMonth() + 1}`;
      }

      if (msgDateStr && msgDateStr !== lastDateStr) {
        items.push({
          id: `date_${msgDateStr}_${msg.id}`,
          type: 'date-separator',
          dateStr: msgDateStr,
        });
        lastDateStr = msgDateStr;
      }

      // 2. Chèn separator trước tin nhắn chưa đọc đầu tiên từ người khác
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

      // 3. Chèn tin nhắn
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

  // Message action handlers
  const handleCopy = useCallback((text: string) => {
    Clipboard.setStringAsync(text);
  }, []);

  const handleEdit = useCallback((msg: Message) => {
    setEditingMessage(msg);
    setReplyingTo(null);
  }, []);

  const handleRevoke = useCallback((messageId: string) => {
    Alert.alert('Thu hồi tin nhắn', 'Tin nhắn sẽ bị thu hồi cho cả 2 bên?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Thu hồi', style: 'destructive', onPress: () => handleRevokeMessage(messageId) },
    ]);
  }, [handleRevokeMessage]);

  const handleDelete = useCallback((messageId: string) => {
    Alert.alert('Xoá tin nhắn', 'Tin nhắn chỉ bị xoá ở phía bạn.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => handleDeleteForMe(messageId) },
    ]);
  }, [handleDeleteForMe]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    handleToggleReaction(messageId, emoji);
  }, [handleToggleReaction]);

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

  const handlePickImage = useCallback((uri: string, fileName: string) => {
    setPendingImage({ uri, fileName });
  }, []);

  const handlePickFile = useCallback(async (uri: string, fileName: string, fileSize: number, mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      // Ảnh thì dùng flow gửi ảnh
      setPendingImage({ uri, fileName });
    } else {
      // File thường: upload lên Cloudinary rồi gửi message
      await sendFileMessage(uri, fileName, fileSize, mimeType);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [sendFileMessage]);

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

      if (item.type === 'date-separator' && item.dateStr) {
        return <DateSeparator date={item.dateStr} />;
      }

      if (!item.message) return null;

      return (
        <MessageBubble
          message={item.message}
          isOutgoing={isOutgoing(item.message)}
          senderName={otherUser?.displayName}
          isHighlighted={item.id === highlightedMessageId}
          currentUid={currentUid || undefined}
          onLongPress={(msg) => setSelectedMessage(msg)}
          onImagePress={(url) => setMediaViewerUrl(url)}
          onFilePress={(url, name) => {
            setMediaViewerUrl(url);
            setMediaViewerFileName(name);
          }}
        />
      );
    },
    [isOutgoing, otherUser, highlightedMessageId, currentUid]
  );

  // Detect media type for viewer
  const mediaViewerType: 'image' | 'video' | 'file' = mediaViewerUrl
    ? (mediaViewerFileName
      ? 'file'
      : mediaViewerUrl.includes('/video/upload/') || /\.(mp4|mov|avi|mkv|webm|3gp)(\?|$)/i.test(mediaViewerUrl)
        ? 'video' : 'image')
    : 'image';

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
        behavior={Platform.OS === 'ios' ? 'padding' : (isKeyboardVisible ? 'padding' : undefined)}
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
                params: { userId: otherUser?.uid || '', conversationId: chatId || '' },
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
          onAttach={() => setShowAttachmentPicker(true)}
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
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={(messageId, newText) => {
            handleEditMessage(messageId, newText);
            setEditingMessage(null);
          }}
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

      <AttachmentPicker
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onPickImage={handlePickImage}
        onPickFile={handlePickFile}
      />

      <MediaViewer
        visible={!!mediaViewerUrl}
        mediaUrl={mediaViewerUrl || ''}
        mediaType={mediaViewerType}
        fileName={mediaViewerFileName || undefined}
        onClose={() => {
          setMediaViewerUrl(null);
          setMediaViewerFileName(null);
        }}
      />

      <MessageActionMenu
        visible={!!selectedMessage}
        message={selectedMessage}
        isOutgoing={selectedMessage ? isOutgoing(selectedMessage) : false}
        onClose={() => setSelectedMessage(null)}
        onReply={(msg) => {
          setSelectedMessage(null);
          handleReply(msg);
        }}
        onCopy={handleCopy}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRevoke={handleRevoke}
        onReaction={handleReaction}
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
