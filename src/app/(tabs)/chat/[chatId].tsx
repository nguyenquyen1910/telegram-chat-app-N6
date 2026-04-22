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
import { MOCK_CURRENT_USER, formatLastSeen } from '@/constants/chat';
import { useMessages } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversation';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const { conversation, otherUser, currentUser } = useConversation(chatId || null);
  const { messages, loading, sending, sendTextMessage, sendImageMessage, loadMore, hasMore } =
    useMessages(chatId || null);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const isOutgoing = useCallback(
    (msg: Message) => msg.senderId === MOCK_CURRENT_USER.uid,
    []
  );

  const handleReply = useCallback((msg: Message) => {
    setReplyingTo(msg);
  }, []);

  const handleSendText = useCallback(
    async (text: string) => {
      const replyTo = replyingTo
        ? {
            messageId: replyingTo.id,
            text: replyingTo.type === 'image' ? '📷 Photo' : replyingTo.text,
            senderName: isOutgoing(replyingTo)
              ? currentUser.displayName
              : otherUser?.displayName || 'User',
          }
        : undefined;

      await sendTextMessage(text, replyTo);
      setReplyingTo(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [replyingTo, sendTextMessage, otherUser, currentUser, isOutgoing]
  );

  const handleSendImage = useCallback(async () => {
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
        await sendImageMessage(asset.uri, fileName);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh.');
    }
  }, [sendImageMessage]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#54A5E8" />
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
        />

        {/* Messages */}
        <View style={styles.messagesArea}>
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
          onSendImage={handleSendImage}
          replyingTo={replyingTo}
          replyingSenderName={
            replyingTo
              ? isOutgoing(replyingTo)
                ? currentUser.displayName
                : otherUser?.displayName
              : undefined
          }
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFF4',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#EFEFF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesArea: {
    flex: 1,
    backgroundColor: 'rgba(43, 120, 205, 0.08)',
  },
  messagesContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
