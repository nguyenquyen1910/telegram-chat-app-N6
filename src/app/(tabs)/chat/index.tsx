import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
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
import { useAuth } from '@/context/AuthContext';
import { getOrCreateConversation } from '@/services/chatService';
import { getUserByPhone } from '@/services/userService';
import { useChatList } from '@/hooks/useChatList';
import { 
  SwipeableChatItem, 
  SearchBar, 
  FilterTabs 
} from '@/components/chat-list';

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const {
    chats,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    tabCounts,
  } = useChatList();

  // New chat modal states
  const [showNewChat, setShowNewChat] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [searching, setSearching] = useState(false);

  // Handlers for Swipeable Items
  const handleDelete = (convId: string) => {
    Alert.alert('Xoá', 'Tính năng đang phát triển');
  };

  const handleMute = (convId: string) => {
    Alert.alert('Tắt thông báo', 'Tính năng đang phát triển');
  };

  // Tạo cuộc trò chuyện mới
  const handleNewChat = async () => {
    if (!phoneInput.trim() || !currentUid) return;

    setSearching(true);
    try {
      const formattedPhone = phoneInput.trim();
      const foundUser = await getUserByPhone(formattedPhone);

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
        <SearchBar 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
        />

        {/* Tabs */}
        <FilterTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'all', label: 'Tất cả', count: tabCounts.all },
            { id: 'private', label: 'Cá nhân', count: tabCounts.private },
            { id: 'group', label: 'Nhóm', count: tabCounts.group },
          ]}
        />

        {/* Chat List */}
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={TelegramColors.primary} />
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={({ item }) => (
              <SwipeableChatItem
                chat={item}
                onPress={() => router.push(`/(tabs)/chat/${item.conversation.id}`)}
                onDelete={() => handleDelete(item.conversation.id)}
                onMute={() => handleMute(item.conversation.id)}
              />
            )}
            keyExtractor={(item) => item.conversation.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
                <TouchableOpacity style={styles.startChatBtn} onPress={() => setShowNewChat(true)}>
                  <Text style={styles.startChatText}>Bắt đầu trò chuyện</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Modal New Chat */}
      <Modal visible={showNewChat} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trò chuyện mới</Text>
              <TouchableOpacity onPress={() => { setShowNewChat(false); setPhoneInput(''); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nhập chính xác SĐT người nhận</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+84..."
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
                <Text style={styles.modalBtnText}>Tìm & Bắt đầu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 44, backgroundColor: '#F7F7F7',
    borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA',
  },
  headerBtn: { paddingVertical: 4, paddingHorizontal: 4, zIndex: 10 },
  editText: { color: TelegramColors.primary, fontSize: 17 },
  headerTitle: {
    fontSize: 17, fontWeight: '600', color: '#000000',
    position: 'absolute', left: 0, right: 0, textAlign: 'center',
  },
  list: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 18, color: '#666666', marginTop: 16 },
  startChatBtn: { marginTop: 20, backgroundColor: TelegramColors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  startChatText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  // Modal...
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  modalLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 17, marginBottom: 16 },
  modalBtn: { backgroundColor: TelegramColors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
