import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Message } from '@/types/chat';
import { formatLastSeen } from '@/constants/chat';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversation';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import WallpaperPicker from '@/components/chat/WallpaperPicker';
import ChatOptionsMenu from '@/components/chat/ChatOptionsMenu';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const { conversation, otherUser } = useConversation(chatId || null, currentUid);
  const { messages, loading, sending, sendTextMessage, sendImageMessage, loadMore, hasMore } =
    useMessages(chatId || null, currentUid);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pendingImage, setPendingImage] = useState<{ uri: string; fileName: string } | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { currentWallpaper, setWallpaper } = useChatWallpaper();

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
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [replyingTo, sendTextMessage, otherUser, isOutgoing]
  );

  // Chọn ảnh từ thư viện — KHÔNG gửi ngay, chỉ set pending
  const handlePickImage = useCallback(async () => {
    try {
      const ImagePicker = await import('expo-image-picker');

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
        // Set pending image → MessageInput sẽ hiện preview
        setPendingImage({ uri: asset.uri, fileName });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh.');
    }
  }, []);

  // Gửi ảnh kèm caption từ MessageInput
  const handleSendImage = useCallback(
    async (uri: string, fileName: string, caption: string) => {
      setPendingImage(null);
      await sendImageMessage(uri, fileName, caption || undefined);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendImageMessage]
  );

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble
        message={item}
        isOutgoing={isOutgoing(item)}
        senderName={otherUser?.displayName}
        onReply={handleReply}
        onImagePress={(url) => console.log('Open image:', url)}
      />
    ),
    [isOutgoing, otherUser, handleReply]
  );

  // Tính background color từ wallpaper
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
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

        {/* Messages area with wallpaper background */}
        <View style={[styles.messagesArea, { backgroundColor: wallpaperBg }]}>
          {/* Gradient overlay for two-tone wallpapers */}
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
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.3}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        </View>

        {/* Input bar */}
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

      {/* Chat options menu */}
      <ChatOptionsMenu
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        onChangeWallpaper={() => setShowWallpaperPicker(true)}
      />

      {/* Wallpaper picker */}
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
});
