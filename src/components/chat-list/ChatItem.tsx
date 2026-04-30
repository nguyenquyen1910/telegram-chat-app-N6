import React from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, Message } from '@/types/chat';
import { formatChatListTime } from '@/constants/chat';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

export interface ChatWithUser {
  conversation: Conversation;
  otherUser?: {
    uid: string;
    displayName: string;
    avatarUrl: string;
    isOnline: boolean;
  } | null;
  unreadCount?: number;
}

interface ChatItemProps {
  chat: ChatWithUser;
  currentUid?: string | null;
  onPress: () => void;
  isMuted?: boolean;
}

export const ChatItem = React.memo(({ chat, currentUid, onPress, isMuted = false }: ChatItemProps) => {
  const { conversation, otherUser, unreadCount = 0 } = chat;
  const isGroup = conversation.type === 'group';
  const hasUnread = unreadCount > 0 && !isMuted;

  // Determine avatar and name
  const name = isGroup 
    ? (conversation.groupName || 'Group Chat') 
    : (otherUser?.displayName || 'User');
  const avatarUrl = isGroup 
    ? conversation.groupAvatar 
    : otherUser?.avatarUrl;
  const isOnline = isGroup ? false : (otherUser?.isOnline || false);

  // Determine last message text and prefix icon
  const lastMsg = conversation.lastMessage;
  const isSentByMe = lastMsg?.senderId === currentUid;

  let lastMsgPrefix = null;
  let lastMsgText = 'Bắt đầu cuộc trò chuyện';

  if (lastMsg) {
    if (lastMsg.type === 'image') {
      lastMsgPrefix = <Ionicons name="image" size={15} color="#54A5E8" style={{ marginRight: 4 }} />;
      lastMsgText = 'Ảnh';
    } else if (lastMsg.type === 'voice') {
      lastMsgPrefix = <Ionicons name="mic" size={15} color="#54A5E8" style={{ marginRight: 4 }} />;
      lastMsgText = 'Tin nhắn thoại';
    } else if (lastMsg.type === 'text' || lastMsg.type === 'reply') {
      lastMsgText = lastMsg.text || '';
    }
  }

  return (
    <TouchableHighlight 
      onPress={onPress} 
      underlayColor="#E5E5EA"
      activeOpacity={1}
    >
      <View style={styles.container}>
        <Avatar uri={avatarUrl} name={name} isOnline={isOnline} />
        
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              {isGroup && (
                <Ionicons name="people" size={16} color="#8E8E93" style={styles.groupIcon} />
              )}
              <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
                {name}
              </Text>
              {isMuted && (
                <Ionicons name="volume-mute" size={16} color="#C7C7CC" style={styles.muteIcon} />
              )}
            </View>
            
            {lastMsg?.timestamp && (
              <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                {(() => { try { return formatChatListTime(lastMsg.timestamp); } catch { return ''; } })()}
              </Text>
            )}
          </View>
          
          <View style={styles.bottomRow}>
            <View style={styles.lastMsgContainer}>
              {isSentByMe && (
                <Ionicons 
                  name="checkmark-done" 
                  size={16} 
                  color="#54A5E8" 
                  style={{ marginRight: 4, marginTop: 1 }} 
                />
              )}
              {lastMsgPrefix}
              <Text style={[styles.lastMsg, hasUnread && styles.lastMsgUnread]} numberOfLines={2}>
                {lastMsgText}
              </Text>
            </View>
            
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Badge count={unreadCount} muted={isMuted} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  groupIcon: {
    marginRight: 4,
  },
  muteIcon: {
    marginLeft: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flexShrink: 1,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 14,
    color: '#8E8E93',
  },
  timeUnread: {
    color: '#54A5E8', // Telegram blue for unread
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lastMsgContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  lastMsg: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  lastMsgUnread: {
    color: '#000000',
    fontWeight: '500',
  },
  badgeContainer: {
    paddingTop: 2,
  },
});
