import { useState, useEffect, useMemo } from 'react';
import { subscribeToConversations } from '@/services/chatService';
import { getUserById } from '@/services/userService';
import { ChatWithUser } from '@/components/chat-list/ChatItem';
import { FilterTabType } from '@/components/chat-list/FilterTabs';
import { useAuth } from '@/context/AuthContext';

let cachedChats: ChatWithUser[] = [];
let hasLoadedChatList = false;

export function useChatList() {
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const [chats, setChats] = useState<ChatWithUser[]>(() => cachedChats);
  const [loading, setLoading] = useState(() => !hasLoadedChatList && cachedChats.length === 0);
  const [activeTab, setActiveTab] = useState<FilterTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Lắng nghe real-time conversations từ Firebase
  useEffect(() => {
    if (!currentUid) {
      cachedChats = [];
      hasLoadedChatList = false;
      setChats([]);
      setLoading(false);
      return;
    }

    setChats(cachedChats);
    setLoading(!hasLoadedChatList && cachedChats.length === 0);

    const unsubscribe = subscribeToConversations(currentUid, async (conversations) => {
      // Sort client-side — an toàn với null/undefined updatedAt (serverTimestamp pending)
      const sortedConvs = [...conversations].sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return timeB - timeA;
      });

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

        // Đọc unread count thực từ Firestore conversation data
        const unreadCount = conv.unreadCount?.[currentUid] || 0;

        return { conversation: conv, otherUser, unreadCount } as ChatWithUser;
      });

      const results = await Promise.all(chatPromises);
      cachedChats = results;
      hasLoadedChatList = true;
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

  // 4. Tính toán số lượng UNREAD cho từng Tab (giống Telegram)
  const unreadCounts = useMemo(() => {
    let all = 0;
    let privateCount = 0;
    let groupCount = 0;

    chats.forEach((c) => {
      const hasUnread = (c.unreadCount || 0) > 0;
      if (hasUnread) {
        all++;
        if (c.conversation.type === 'private') privateCount++;
        if (c.conversation.type === 'group') groupCount++;
      }
    });

    return { all, private: privateCount, group: groupCount };
  }, [chats]);

  // 5. Tổng số tab counts (tổng conversations, dùng cho FilterTabs label count)
  const tabCounts = useMemo(() => {
    const all = chats.length;
    let privateCount = 0;
    let groupCount = 0;
    chats.forEach((c) => {
      if (c.conversation.type === 'private') privateCount++;
      if (c.conversation.type === 'group') groupCount++;
    });
    return { all, private: privateCount, group: groupCount };
  }, [chats]);

  // 6. Tính tổng số tin nhắn chưa đọc (dùng cho badge bottom tab)
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
    unreadCounts,
    totalUnreadCount,
  };
}
