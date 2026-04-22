import { useState, useEffect } from 'react';
import { Conversation, User } from '@/types/chat';
import { getConversation, subscribeToConversation } from '@/services/chatService';
import { getUserById, subscribeToUserStatus } from '@/services/userService';
import { MOCK_CONVERSATION, MOCK_OTHER_USER, MOCK_CURRENT_USER } from '@/constants/chat';

interface UseConversationReturn {
  conversation: Conversation | null;
  otherUser: User | null;
  currentUser: User;
  loading: boolean;
  error: string | null;
}

/**
 * Hook lấy thông tin conversation và thông tin user đối phương
 */
export function useConversation(
  conversationId: string | null,
  useMock: boolean = false
): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    if (useMock) {
      setConversation(MOCK_CONVERSATION);
      setOtherUser(MOCK_OTHER_USER);
      setLoading(false);
      return;
    }

    let unsubConv: (() => void) | null = null;
    let unsubUser: (() => void) | null = null;

    async function load() {
      try {
        setLoading(true);

        // Lấy conversation
        const conv = await getConversation(conversationId!);
        if (!conv) {
          setError('Conversation not found');
          return;
        }
        setConversation(conv);

        // Tìm other participant
        const otherUid = conv.participants.find((uid) => uid !== MOCK_CURRENT_USER.uid);
        if (otherUid) {
          const user = await getUserById(otherUid);
          setOtherUser(user);

          // Listen thay đổi trạng thái user
          unsubUser = subscribeToUserStatus(otherUid, (updatedUser) => {
            setOtherUser(updatedUser);
          });
        }

        // Listen thay đổi conversation
        unsubConv = subscribeToConversation(conversationId!, (updatedConv) => {
          setConversation(updatedConv);
        });
      } catch (err) {
        setError('Failed to load conversation');
        console.error('Error loading conversation:', err);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      unsubConv?.();
      unsubUser?.();
    };
  }, [conversationId, useMock]);

  return {
    conversation,
    otherUser,
    currentUser: MOCK_CURRENT_USER,
    loading,
    error,
  };
}
