import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TelegramColors } from '@/constants/colors';
import { formatMessageTime } from '@/constants/chat';
import { useAuth } from '@/context/AuthContext';
import { Conversation } from '@/types/chat';
import { subscribeToConversations, getOrCreateConversation } from '@/services/chatService';
import { getUserById, getUserByPhone } from '@/services/userService';

interface ChatWithUser {
  conversation: Conversation;
  otherUser: {
    uid: string;
    displayName: string;
    avatarUrl: string;
    isOnline: boolean;
  } | null;
}

interface ChatListItemProps {
  chat: ChatWithUser;
  onPress: () => void;
}

function ChatListItem({ chat, onPress }: ChatListItemProps) {
  const lastMsg = chat.conversation.lastMessage;
  const lastMsgText = lastMsg
    ? lastMsg.type === 'image'
      ? '📷 Ảnh'
      : lastMsg.text
    : 'Bắt đầu cuộc trò chuyện';
  const name = chat.otherUser?.displayName || 'User';
  const avatar = chat.otherUser?.avatarUrl;

  return (
    <TouchableOpacity onPress={onPress} style={styles.chatItem} activeOpacity={0.6}>
      {/* Avatar */}
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.chatAvatar} />
      ) : (
        <View style={styles.chatAvatarPlaceholder}>
          <Text style={styles.chatAvatarLetter}>{name.charAt(0)}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName} numberOfLines={1}>
            {name}
          </Text>
          {lastMsg?.timestamp && (
            <Text style={styles.chatTime}>
              {formatMessageTime(lastMsg.timestamp)}
            </Text>
          )}
        </View>

        <View style={styles.chatBottomRow}>
          <Text style={styles.chatLastMsg} numberOfLines={1}>
            {lastMsgText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchText, setSearchText] = useState('');

  // New chat modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [searching, setSearching] = useState(false);

  // Subscribe to real conversations
  useEffect(() => {
    if (!currentUid) {
      setLoadingChats(false);
      return;
    }

    const unsubscribe = subscribeToConversations(currentUid, async (conversations) => {
      // Lấy thông tin other user cho mỗi conversation
      const chatPromises = conversations.map(async (conv) => {
        const otherUid = conv.participants.find((uid) => uid !== currentUid);
        let otherUser = null;

        if (otherUid) {
          try {
            const userData = await getUserById(otherUid);
            if (userData) {
              otherUser = {
                uid: userData.uid,
                displayName: userData.displayName || userData.phoneNumber || 'User',
                avatarUrl: userData.avatarUrl || '',
                isOnline: userData.isOnline || false,
              };
            }
          } catch (e) {
            console.warn('Failed to load user:', otherUid);
          }
        }

        return { conversation: conv, otherUser } as ChatWithUser;
      });

      const results = await Promise.all(chatPromises);
      setChats(results);
      setLoadingChats(false);
    });

    return unsubscribe;
  }, [currentUid]);

  // Tạo cuộc trò chuyện mới bằng số điện thoại
  const handleNewChat = async () => {
    if (!phoneInput.trim() || !currentUid) return;

    setSearching(true);
    try {
      const foundUser = await getUserByPhone(phoneInput.trim());
      if (!foundUser) {
        Alert.alert('Không tìm thấy', 'Không tìm thấy người dùng với số điện thoại này.');
        setSearching(false);
        return;
      }

      if (foundUser.uid === currentUid) {
        Alert.alert('Lỗi', 'Bạn không thể chat với chính mình.');
        setSearching(false);
        return;
      }

      // Tạo hoặc lấy conversation có sẵn
      const convId = await getOrCreateConversation(currentUid, foundUser.uid);

      setShowNewChat(false);
      setPhoneInput('');
      setSearching(false);

      // Navigate vào chat detail
      router.push(`/(tabs)/chat/${convId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện.');
      setSearching(false);
    }
  };

  // Lọc chats theo search text
  const filteredChats = searchText
    ? chats.filter((c) =>
        c.otherUser?.displayName?.toLowerCase().includes(searchText.toLowerCase())
      )
    : chats;

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

          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowNewChat(true)}>
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
        {loadingChats ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={TelegramColors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={({ item }) => (
              <ChatListItem
                chat={item}
                onPress={() => router.push(`/(tabs)/chat/${item.conversation.id}`)}
              />
            )}
            keyExtractor={(item) => item.conversation.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
                <TouchableOpacity
                  style={styles.startChatBtn}
                  onPress={() => setShowNewChat(true)}
                >
                  <Text style={styles.startChatText}>Bắt đầu trò chuyện</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Modal tạo cuộc trò chuyện mới */}
      <Modal visible={showNewChat} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trò chuyện mới</Text>
              <TouchableOpacity onPress={() => { setShowNewChat(false); setPhoneInput(''); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nhập số điện thoại người nhận</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+84 xxx xxx xxxx"
              placeholderTextColor="#AEAEB2"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalBtn, (!phoneInput.trim() || searching) && styles.modalBtnDisabled]}
              onPress={handleNewChat}
              disabled={!phoneInput.trim() || searching}
            >
              {searching ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalBtnText}>Tìm & Bắt đầu chat</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  startChatBtn: {
    marginTop: 20,
    backgroundColor: TelegramColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startChatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // ======= Modal =======
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    color: '#000',
    marginBottom: 16,
  },
  modalBtn: {
    backgroundColor: TelegramColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
