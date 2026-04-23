import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ConversationFilter, ChatListItemData, User } from '@/types/chat';
import { MOCK_CHATS_LIST, MOCK_CURRENT_USER } from '@/constants/chat';
import { getUserById } from '@/services/userService';

export function useChatList(useMock: boolean = false) {
  const [chatList, setChatList] = useState<ChatListItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cache users to avoid repeated fetching
  const [userCache, setUserCache] = useState<Record<string, User>>({});

  useEffect(() => {
    if (useMock || !db) {
      setChatList(MOCK_CHATS_LIST);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', MOCK_CURRENT_USER.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const conversations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
        
        const result: ChatListItemData[] = [];
        
        for (const conv of conversations) {
          let otherUser: User | undefined;
          
          if (conv.type === 'private') {
            const otherUid = conv.participants.find((p: string) => p !== MOCK_CURRENT_USER.uid);
            if (otherUid) {
              if (userCache[otherUid]) {
                otherUser = userCache[otherUid];
              } else {
                const fetchedUser = await getUserById(otherUid);
                if (fetchedUser) {
                  otherUser = fetchedUser;
                  setUserCache((prev) => ({ ...prev, [otherUid]: fetchedUser }));
                }
              }
            }
          }
          
          const unreadCount = conv.unreadCount?.[MOCK_CURRENT_USER.uid] || 0;
          
          result.push({
            conversation: conv,
            otherUser,
            unreadCount
          });
        }
        
        setChatList(result);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching chat list:", err);
        setError(err.message);
        setLoading(false);
      }
    }, (err) => {
      console.error("Snapshot error:", err);
      // Fallback
      setChatList(MOCK_CHATS_LIST);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [useMock]);

  const filteredChatList = useMemo(() => {
    let result = chatList;

    if (filter !== 'all') {
      result = result.filter(item => item.conversation.type === filter);
    }

    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => {
        const title = item.conversation.type === 'group' 
          ? (item.conversation.groupName || '').toLowerCase()
          : (item.otherUser?.displayName || '').toLowerCase();
        
        const lastMsg = (item.conversation.lastMessage?.text || '').toLowerCase();
        return title.includes(lowerQuery) || lastMsg.includes(lowerQuery);
      });
    }

    return result;
  }, [chatList, filter, searchQuery]);

  // Derive counts
  const counts = useMemo(() => {
    return {
      all: chatList.length,
      private: chatList.filter((c) => c.conversation.type === 'private').length,
      group: chatList.filter((c) => c.conversation.type === 'group').length,
    };
  }, [chatList]);

  return {
    chatList: filteredChatList,
    loading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    counts,
  };
}
