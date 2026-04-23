import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatItemProps, Message } from '@/types/chat';
import Avatar from './Avatar';
import Badge from './Badge';
import { formatChatTime } from '@/constants/chat'; // We will add this later

function ChatItem({ item, onPress }: ChatItemProps) {
  const { conversation, otherUser, unreadCount } = item;
  const lastMsg = conversation.lastMessage;

  const title = useMemo(() => {
    if (conversation.type === 'group') return conversation.groupName || 'Group';
    return otherUser?.displayName || 'Unknown';
  }, [conversation, otherUser]);

  const avatarUrl = useMemo(() => {
    if (conversation.type === 'group') return conversation.groupAvatar;
    return otherUser?.avatarUrl;
  }, [conversation, otherUser]);

  const previewText = useMemo(() => {
    if (!lastMsg) return '';
    if (lastMsg.type === 'image') return '📷 Ảnh';
    if (lastMsg.type === 'file') return '📄 Báo cáo';
    if (lastMsg.type === 'reply') return lastMsg.text;
    
    // Nếu là group, thêm tên người gửi vào trước tin nhắn (optional, cần data thật)
    return lastMsg.text;
  }, [lastMsg]);

  // Is outgoing message
  const isMe = lastMsg?.senderId === 'user_me'; // In a real app, use currentUser object

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        name={title}
        imageUrl={avatarUrl}
        size="medium"
        isOnline={otherUser?.isOnline}
        showOnlineIndicator={conversation.type === 'private'}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.timeContainer}>
            {/* If pinned, show pin icon instead of or beside time */}
            {/* We can pass pinned state as props later */}
            <Text style={styles.timeText}>
              {lastMsg ? formatChatTime(lastMsg.timestamp) : ''}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          {isMe && (
            <Ionicons
              name="checkmark-done"
              size={16}
              color="#54A5E8"
              style={styles.statusIcon}
            />
          )}

          <Text style={styles.preview} numberOfLines={1}>
            {previewText}
          </Text>

          <Badge count={unreadCount} muted={false} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  preview: {
    flex: 1,
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 8,
  },
});

export default React.memo(ChatItem);
