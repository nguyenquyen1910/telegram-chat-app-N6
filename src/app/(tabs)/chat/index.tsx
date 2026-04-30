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
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { TelegramColors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateConversation, deleteConversation, createGroupConversation } from '@/services/chatService';
import { getUserByPhone } from '@/services/userService';
import { useSharedChatList } from '@/context/ChatListContext';
import { useMutedChats } from '@/hooks/useMutedChats';
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
    refreshing,
    refreshChats,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    tabCounts,
  } = useSharedChatList();

  const { isMuted, toggleMute } = useMutedChats();

  useFocusEffect(
    React.useCallback(() => {
      refreshChats().catch((error) => {
        console.warn('Failed to refresh chat list on focus:', error);
      });
    }, [refreshChats])
  );

  // Debug log kept here for local troubleshooting only.
  // React.useEffect(() => {
  //   const phone = (user as any)?.phoneNumber || 'N/A';
  //   console.log(`[ChatList] ===== ĐANG ĐĂNG NHẬP =====`);
  //   console.log(`[ChatList] UID: ${currentUid}`);
  //   console.log(`[ChatList] SĐT: ${phone}`);
  //   console.log(`[ChatList] Số cuộc trò chuyện: ${chats.length}`);
  //   console.log(`[ChatList] ================================`);
  // }, [user, currentUid, chats.length]);

  // New chat modal states
  const [showNewChat, setShowNewChat] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [searching, setSearching] = useState(false);

  // Group chat modal states
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupPhoneInput, setGroupPhoneInput] = useState('');
  const [groupMembers, setGroupMembers] = useState<{uid: string; phone: string}[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Handlers for Swipeable Items
  const handleDelete = (convId: string) => {
    const executeDelete = async () => {
      try {
        await deleteConversation(convId);
      } catch (error) {
        console.error('Delete error:', error);
        Alert.alert('Lỗi', 'Không thể xóa cuộc trò chuyện.');
      }
    };

    if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
      const confirmed = globalThis.confirm(
        'Bạn có chắc muốn xóa cuộc trò chuyện này? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.'
      );

      if (confirmed) {
        void executeDelete();
      }
      return;
    }

    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có chắc muốn xóa cuộc trò chuyện này? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void executeDelete();
          },
        },
      ]
    );
  };

  const handleMute = (convId: string) => {
    toggleMute(convId);
  };

  // Tạo cuộc trò chuyện mới (Private)
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

      const convId = await getOrCreateConversation(currentUid, foundUser.uid);
      await refreshChats();

      setShowNewChat(false);
      setPhoneInput('');
      setSearching(false);

      router.push(`/(tabs)/chat/${convId}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      const msg = error?.code === 'permission-denied'
        ? 'Lỗi quyền truy cập Firestore. Hãy kiểm tra Firestore Rules trên Firebase Console!'
        : 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
      setSearching(false);
    }
  };

  // Thêm thành viên vào nhóm
  const handleAddGroupMember = async () => {
    if (!groupPhoneInput.trim() || !currentUid) return;
    setAddingMember(true);
    try {
      const phone = groupPhoneInput.trim();
      
      // Check if already added
      if (groupMembers.some(m => m.phone === phone)) {
        Alert.alert('Đã thêm', 'Người dùng này đã có trong nhóm.');
        setAddingMember(false);
        return;
      }

      const foundUser = await getUserByPhone(phone);
      if (!foundUser) {
        Alert.alert('Không tìm thấy', 'Không tìm thấy người dùng với SĐT này.');
        setAddingMember(false);
        return;
      }
      if (foundUser.uid === currentUid) {
        Alert.alert('Lỗi', 'Bạn sẽ tự động được thêm vào nhóm.');
        setAddingMember(false);
        return;
      }

      setGroupMembers(prev => [...prev, { uid: foundUser.uid, phone }]);
      setGroupPhoneInput('');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tìm người dùng.');
    }
    setAddingMember(false);
  };

  // Tạo nhóm
  const handleCreateGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0 || !currentUid) return;
    setCreatingGroup(true);
    try {
      const allUids = [currentUid, ...groupMembers.map(m => m.uid)];
      const convId = await createGroupConversation(groupName.trim(), allUids);
      await refreshChats();
      
      setShowGroupChat(false);
      setGroupName('');
      setGroupMembers([]);
      setGroupPhoneInput('');
      setCreatingGroup(false);

      router.push(`/(tabs)/chat/${convId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Lỗi', 'Không thể tạo nhóm.');
      setCreatingGroup(false);
    }
  };

  // Remove member from group creation list
  const removeMember = (phone: string) => {
    setGroupMembers(prev => prev.filter(m => m.phone !== phone));
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
                currentUid={currentUid}
                onPress={() => router.push(`/(tabs)/chat/${item.conversation.id}`)}
                onDelete={() => handleDelete(item.conversation.id)}
                onMute={() => handleMute(item.conversation.id)}
                isMuted={isMuted(item.conversation.id)}
              />
            )}
            keyExtractor={(item) => item.conversation.id}
            style={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  refreshChats().catch((error) => {
                    console.warn('Failed to refresh chat list:', error);
                  });
                }}
                tintColor={TelegramColors.primary}
                colors={[TelegramColors.primary]}
              />
            }
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            removeClippedSubviews={true}
            windowSize={5}
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

      {/* =============== Modal: Chat mới (Private) =============== */}
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

            {/* Nút tạo nhóm */}
            <TouchableOpacity
              style={styles.groupLink}
              onPress={() => { setShowNewChat(false); setPhoneInput(''); setShowGroupChat(true); }}
            >
              <Ionicons name="people" size={20} color={TelegramColors.primary} />
              <Text style={styles.groupLinkText}>Tạo nhóm chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =============== Modal: Tạo nhóm =============== */}
      <Modal visible={showGroupChat} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo nhóm</Text>
              <TouchableOpacity onPress={() => { setShowGroupChat(false); setGroupName(''); setGroupMembers([]); setGroupPhoneInput(''); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Tên nhóm */}
            <Text style={styles.modalLabel}>Tên nhóm</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập tên nhóm..."
              placeholderTextColor="#AEAEB2"
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />

            {/* Thêm thành viên */}
            <Text style={styles.modalLabel}>Thêm thành viên (SĐT)</Text>
            <View style={styles.addMemberRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="+84..."
                placeholderTextColor="#AEAEB2"
                value={groupPhoneInput}
                onChangeText={setGroupPhoneInput}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.addBtn, (!groupPhoneInput.trim() || addingMember) && styles.modalBtnDisabled]}
                onPress={handleAddGroupMember}
                disabled={!groupPhoneInput.trim() || addingMember}
              >
                {addingMember ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Ionicons name="add" size={22} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Danh sách thành viên đã thêm */}
            {groupMembers.length > 0 && (
              <ScrollView style={styles.memberList} nestedScrollEnabled>
                {groupMembers.map((member) => (
                  <View key={member.phone} style={styles.memberItem}>
                    <Ionicons name="person" size={16} color="#54A5E8" />
                    <Text style={styles.memberPhone}>{member.phone}</Text>
                    <TouchableOpacity onPress={() => removeMember(member.phone)}>
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Nút tạo */}
            <TouchableOpacity
              style={[styles.modalBtn, { marginTop: 16 }, (!groupName.trim() || groupMembers.length === 0 || creatingGroup) && styles.modalBtnDisabled]}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || groupMembers.length === 0 || creatingGroup}
            >
              {creatingGroup ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalBtnText}>
                  Tạo nhóm ({groupMembers.length + 1} thành viên)
                </Text>
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
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  modalLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 17, marginBottom: 16 },
  modalBtn: { backgroundColor: TelegramColors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  // Group link
  groupLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 8 },
  groupLinkText: { color: TelegramColors.primary, fontSize: 16, fontWeight: '500', marginLeft: 8 },
  // Group modal
  addMemberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: TelegramColors.primary, borderRadius: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  memberList: { maxHeight: 120, marginBottom: 8 },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  memberPhone: { flex: 1, fontSize: 15, color: '#333', marginLeft: 8 },
});