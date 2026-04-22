import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TelegramColors } from '@/constants/colors';
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

export default function ChatsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.editText}>Sửa</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Tin nhắn</Text>

          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="create-outline" size={28} color={TelegramColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
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

        {/* Chat List */}
        <FlatList
          data={MOCK_CHATS}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              onPress={() => router.push(`/(tabs)/chat/${item.id}`)}
            />
          )}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
            </View>
          }
        />
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
    height: 44,
    backgroundColor: '#F7F7F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  editText: {
    color: TelegramColors.primary,
    fontSize: 17,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 4,
  },
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  chatAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#54A5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatName: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    color: '#8E8E93',
    fontSize: 14,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  chatLastMsg: {
    color: '#8E8E93',
    fontSize: 15,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#54A5E8',
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
  },
});
