import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Conversation } from '@/types/chat';
import {
  subscribeToConversations,
  getConversationsForUser,
  getUnreadCount,
} from '@/services/chatService';
import { getUserById } from '@/services/userService';
import { ChatWithUser } from '@/components/chat-list/ChatItem';
import { FilterTabType } from '@/components/chat-list/FilterTabs';
import { useAuth } from '@/context/AuthContext';

let cachedChats: ChatWithUser[] = [];
let hasHydratedChatList = false;

async function buildChatItems(
  conversations: Conversation[],
  currentUid: string
): Promise<ChatWithUser[]> {
  const sortedConversations = [...conversations].sort(
    (a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
  );

  return Promise.all(
    sortedConversations.map(async (conversation) => {
      const otherUid = conversation.participants.find(
        (participantUid) => participantUid !== currentUid
      );
      let otherUser = null;

      if (otherUid && conversation.type === 'private') {
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
        } catch (error) {
          console.warn('Failed to load user:', otherUid, error);
        }
      }

      let unreadCount = 0;
      try {
        unreadCount = await getUnreadCount(conversation.id, currentUid);
      } catch (error) {
        console.warn('Failed to load unread count:', conversation.id, error);
      }

      return { conversation, otherUser, unreadCount } as ChatWithUser;
    })
  );
}

export function useChatList() {
  const { user } = useAuth();
  const currentUid = (user as any)?.uid || null;

  const [chats, setChats] = useState<ChatWithUser[]>(() => cachedChats);
  const [loading, setLoading] = useState(() => !hasHydratedChatList);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const latestLoadIdRef = useRef(0);

  const applyConversations = useCallback(
    async (
      conversations: Conversation[],
      uid: string,
      mode: 'initial' | 'refresh' = 'initial'
    ) => {
      const shouldShowLoading = mode === 'initial' && !hasHydratedChatList && cachedChats.length === 0;
      const loadId = ++latestLoadIdRef.current;

      if (shouldShowLoading) {
        setLoading(true);
      }

      if (mode === 'refresh') {
        setRefreshing(true);
      }

      try {
        const resolvedChats = await buildChatItems(conversations, uid);
        if (loadId === latestLoadIdRef.current) {
          cachedChats = resolvedChats;
          hasHydratedChatList = true;
          setChats(resolvedChats);
        }
      } catch (error) {
        console.warn('Failed to resolve chat list:', error);
        if (loadId === latestLoadIdRef.current) {
          setChats([]);
        }
      } finally {
        if (loadId === latestLoadIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  const refreshChats = useCallback(async () => {
    if (!currentUid) {
      cachedChats = [];
      hasHydratedChatList = false;
      setChats([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      const conversations = await getConversationsForUser(currentUid);
      await applyConversations(conversations, currentUid, 'refresh');
    } catch (error) {
      setRefreshing(false);
      throw error;
    }
  }, [applyConversations, currentUid]);

  useEffect(() => {
    if (!currentUid) {
      cachedChats = [];
      hasHydratedChatList = false;
      setChats([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (cachedChats.length > 0) {
      setChats(cachedChats);
      setLoading(false);
    } else {
      setLoading(!hasHydratedChatList);
    }

    const unsubscribe = subscribeToConversations(currentUid, async (conversations) => {
      await applyConversations(conversations, currentUid);
    });

    return () => {
      unsubscribe?.();
    };
  }, [applyConversations, currentUid]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (activeTab === 'private' && chat.conversation.type !== 'private') return false;
      if (activeTab === 'group' && chat.conversation.type !== 'group') return false;

      if (searchQuery.trim()) {
        const name =
          chat.conversation.type === 'group'
            ? chat.conversation.groupName || ''
            : chat.otherUser?.displayName || '';

        if (!name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
          return false;
        }
      }

      return true;
    });
  }, [chats, activeTab, searchQuery]);

  const tabCounts = useMemo(() => {
    const all = chats.length;
    let privateCount = 0;
    let groupCount = 0;

    chats.forEach((chat) => {
      if (chat.conversation.type === 'private') privateCount++;
      if (chat.conversation.type === 'group') groupCount++;
    });

    return { all, private: privateCount, group: groupCount };
  }, [chats]);

  const totalUnreadCount = useMemo(() => {
    return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  }, [chats]);

  return {
    chats: filteredChats,
    loading,
    refreshing,
    refreshChats,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    tabCounts,
    totalUnreadCount,
  };
}
