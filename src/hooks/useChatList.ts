import { useState, useEffect, useMemo } from 'react';
import { Conversation } from '@/types/chat';
import { subscribeToConversations, getMessages } from '@/services/chatService';
import { getUserById } from '@/services/userService';
import { ChatWithUser } from '@/components/chat-list/ChatItem';
import { FilterTabType } from '@/components/chat-list/FilterTabs';
import { useAuth } from '@/context/AuthContext';

export function useChatList() {
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Lắng nghe real-time conversations từ Firebase
  useEffect(() => {
    if (!currentUid) {
      setChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToConversations(currentUid, async (conversations) => {
      // Sort client-side thay vì orderBy để tránh lỗi composite index
      const sortedConvs = [...conversations].sort((a, b) => 
        b.updatedAt.toMillis() - a.updatedAt.toMillis()
      );

      // 2. Fetch thông tin user đối phương cho mỗi hội thoại
      const chatPromises = sortedConvs.map(async (conv) => {
        const otherUid = conv.participants.find((uid) => uid !== currentUid);
        let otherUser = null;

        if (otherUid && conv.type === 'private') {
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

        // TODO: Tính unread count thực tế bằng query
        // Tạm thời để 0 hoặc giả lập nếu cần
        let unreadCount = 0; 
        
        return { conversation: conv, otherUser, unreadCount } as ChatWithUser;
      });

      const results = await Promise.all(chatPromises);
      setChats(results);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUid]);

  // 3. Filter theo Tab và Search
  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      // Filter tab
      if (activeTab === 'private' && chat.conversation.type !== 'private') return false;
      if (activeTab === 'group' && chat.conversation.type !== 'group') return false;

      // Filter search
      if (searchQuery.trim()) {
        const name = chat.conversation.type === 'group' 
          ? chat.conversation.groupName || '' 
          : chat.otherUser?.displayName || '';
        if (!name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
          return false;
        }
      }

      return true;
    });
  }, [chats, activeTab, searchQuery]);

  // 4. Tính toán số lượng cho từng Tab
  const tabCounts = useMemo(() => {
    const all = chats.length;
    let privateCount = 0;
    let groupCount = 0;
    
    chats.forEach(c => {
      if (c.conversation.type === 'private') privateCount++;
      if (c.conversation.type === 'group') groupCount++;
    });

    return { all, private: privateCount, group: groupCount };
  }, [chats]);

  // 5. Tính tổng số tin nhắn chưa đọc
  const totalUnreadCount = useMemo(() => {
    return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  }, [chats]);

  return {
    chats: filteredChats,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    tabCounts,
    totalUnreadCount,
  };
}
