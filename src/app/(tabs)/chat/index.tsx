import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TelegramColors } from '@/constants/colors';
import { SearchBar, FilterTabs, SwipeableChatItem as ChatItem } from '@/components/chat-list';
import { useChatList } from '@/hooks/useChatList';
import { ChatListItemData } from '@/types/chat';

export default function ChatsScreen() {
  const router = useRouter();
  
  // Dùng mock data để hoàn thiện UI trước, sau tích hợp Firebase thật
  const { 
    chatList, loading, filter, setFilter, 
    searchQuery, setSearchQuery, counts,
  } = useChatList(true); 

  const renderItem = useCallback(({ item }: { item: ChatListItemData }) => {
    return (
      <ChatItem 
        item={item} 
        onPress={() => router.push(`/(tabs)/chat/${item.conversation.id}`)}
      />
    );
  }, [router]);

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
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Tabs */}
        <FilterTabs 
          activeTab={filter}
          onTabChange={setFilter}
          counts={counts}
        />

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={TelegramColors.primary} />
          </View>
        ) : (
          <FlatList
            data={chatList}
            renderItem={renderItem}
            keyExtractor={(item) => item.conversation.id}
            style={styles.list}
            contentContainerStyle={chatList.length === 0 && styles.listEmpty}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
              </View>
            }
            removeClippedSubviews={true}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: '#F7F7F7',
  },
  headerBtn: { paddingVertical: 4, paddingHorizontal: 4, zIndex: 10 },
  editText: { color: TelegramColors.primary, fontSize: 17 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  list: { flex: 1, backgroundColor: '#FFFFFF' },
  listEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 18, color: '#666666', marginTop: 16 },
});
