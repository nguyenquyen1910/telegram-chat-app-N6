import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TelegramColors } from '@/constants/colors';
<<<<<<< Updated upstream
=======
import { MOCK_OTHER_USER, MOCK_MESSAGES, formatMessageTime } from '@/constants/chat';

const MOCK_CHATS = [
  {
    id: 'conv_1',
    user: MOCK_OTHER_USER,
    lastMessage: MOCK_MESSAGES[MOCK_MESSAGES.length - 1],
    unreadCount: 0,
  },
];

interface ChatListItemProps {
  chat: (typeof MOCK_CHATS)[0];
  onPress: () => void;
}

function ChatListItem({ chat, onPress }: ChatListItemProps) {
  const lastMsgText =
    chat.lastMessage.type === 'image' ? '📷 Ảnh' : chat.lastMessage.text;

  return (
    <TouchableOpacity onPress={onPress} style={styles.chatItem} activeOpacity={0.6}>
      {/* Avatar */}
      {chat.user.avatarUrl ? (
        <Image source={{ uri: chat.user.avatarUrl }} style={styles.chatAvatar} />
      ) : (
        <View style={styles.chatAvatarPlaceholder}>
          <Text style={styles.chatAvatarLetter}>
            {chat.user.displayName.charAt(0)}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName} numberOfLines={1}>
            {chat.user.displayName}
          </Text>
          <Text style={styles.chatTime}>
            {formatMessageTime(chat.lastMessage.createdAt)}
          </Text>
        </View>

        <View style={styles.chatBottomRow}>
          {chat.lastMessage.senderId === 'user_me' && (
            <Ionicons
              name="checkmark-done"
              size={16}
              color="#21C004"
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.chatLastMsg} numberOfLines={1}>
            {lastMsgText}
          </Text>

          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
>>>>>>> Stashed changes

export default function ChatsScreen() {
  const [searchText, setSearchText] = useState('');

  const handleEditPress = () => {
    console.log('Edit button pressed');
  };

  const handleComposePress = () => {
    console.log('Compose button pressed');
  };

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

        <View style={styles.header}>
<<<<<<< Updated upstream
          <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
=======
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.editText}>Sửa</Text>
>>>>>>> Stashed changes
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Tin nhắn</Text>

          <TouchableOpacity onPress={handleComposePress} style={styles.composeButton}>
            <Ionicons name="create-outline" size={28} color={TelegramColors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm"
              placeholderTextColor="#8E8E93"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Nội dung chat sẽ được thêm ở đây</Text>
            <Text style={styles.emptySubtext}>Team sẽ code tiếp phần danh sách chat</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#F7F7F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    height: 44,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  editText: {
    color: TelegramColors.primary,
    fontSize: 17,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  composeButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 4,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});
