import { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { Message, ReplyTo, MessageType } from '@/types/chat';
import {
  getMessages,
  sendMessage,
  subscribeToNewMessages,
  markMessagesAsRead,
} from '@/services/chatService';
import { uploadImage } from '@/services/mediaService';
import { MESSAGES_PER_PAGE, MOCK_MESSAGES, MOCK_CURRENT_USER } from '@/constants/chat';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendTextMessage: (text: string, replyTo?: ReplyTo) => Promise<void>;
  sendImageMessage: (localUri: string, fileName: string) => Promise<void>;
}

/**
 * Hook quản lý messages real-time cho 1 conversation
 * Hỗ trợ: pagination, real-time updates, gửi text/image, optimistic update
 */
export function useMessages(
  conversationId: string | null,
  useMock: boolean = false
): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;

    if (useMock) {
      // Dùng mock data
      setMessages(MOCK_MESSAGES);
      setLoading(false);
      setHasMore(false);
      return;
    }

    async function loadInitialMessages() {
      try {
        setLoading(true);
        setError(null);

        const result = await getMessages(conversationId!, MESSAGES_PER_PAGE);
        setMessages(result.messages);
        lastDocRef.current = result.lastVisible;
        setHasMore(result.messages.length >= MESSAGES_PER_PAGE);

        // Subscribe real-time listener cho tin nhắn mới
        const afterTime = result.messages.length > 0
          ? result.messages[result.messages.length - 1].createdAt
          : Timestamp.now();

        unsubscribeRef.current = subscribeToNewMessages(
          conversationId!,
          afterTime,
          (newMessages) => {
            setMessages((prev) => {
              // Lọc bỏ messages trùng (optimistic update)
              const existingIds = new Set(prev.map((m) => m.id));
              const filtered = newMessages.filter((m) => !existingIds.has(m.id));
              return [...prev, ...filtered];
            });
          }
        );
      } catch (err) {
        setError('Failed to load messages');
        console.error('Error loading messages:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialMessages();

    return () => {
      unsubscribeRef.current?.();
    };
  }, [conversationId, useMock]);

  // Load more (pagination - scroll lên)
  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loading || useMock) return;

    try {
      const result = await getMessages(
        conversationId,
        MESSAGES_PER_PAGE,
        lastDocRef.current ?? undefined
      );

      setMessages((prev) => [...result.messages, ...prev]);
      lastDocRef.current = result.lastVisible;
      setHasMore(result.messages.length >= MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Error loading more messages:', err);
    }
  }, [conversationId, hasMore, loading, useMock]);

  // Gửi tin nhắn text
  const sendTextMessage = useCallback(
    async (text: string, replyTo?: ReplyTo) => {
      if (!conversationId || !text.trim()) return;

      const type: MessageType = replyTo ? 'reply' : 'text';

      if (useMock) {
        // Optimistic update cho mock
        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: MOCK_CURRENT_USER.uid,
          text: text.trim(),
          type,
          replyTo,
          status: 'sent',
          createdAt: Timestamp.now(),
        };
        setMessages((prev) => [...prev, newMsg]);
        return;
      }

      try {
        setSending(true);

        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        const optimisticMsg: Message = {
          id: tempId,
          conversationId,
          senderId: MOCK_CURRENT_USER.uid,
          text: text.trim(),
          type,
          replyTo,
          status: 'sending',
          createdAt: Timestamp.now(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        await sendMessage(conversationId, MOCK_CURRENT_USER.uid, text.trim(), type, {
          replyTo,
        });

        // Remove optimistic message (real one will come from listener)
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (err) {
        setError('Failed to send message');
        console.error('Error sending message:', err);
      } finally {
        setSending(false);
      }
    },
    [conversationId, useMock]
  );

  // Gửi tin nhắn ảnh
  const sendImageMessage = useCallback(
    async (localUri: string, fileName: string) => {
      if (!conversationId) return;

      if (useMock) {
        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: MOCK_CURRENT_USER.uid,
          text: '',
          type: 'image',
          imageUrl: localUri,
          fileName,
          fileSize: 2500000,
          status: 'sent',
          createdAt: Timestamp.now(),
        };
        setMessages((prev) => [...prev, newMsg]);
        return;
      }

      try {
        setSending(true);

        // Optimistic update với local URI
        const tempId = `temp_img_${Date.now()}`;
        const optimisticMsg: Message = {
          id: tempId,
          conversationId,
          senderId: MOCK_CURRENT_USER.uid,
          text: '',
          type: 'image',
          imageUrl: localUri,
          fileName,
          fileSize: 0,
          status: 'sending',
          createdAt: Timestamp.now(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        // Upload ảnh lên Cloudinary
        const result = await uploadImage(localUri);

        // Gửi message với URL Cloudinary
        await sendMessage(conversationId, MOCK_CURRENT_USER.uid, '', 'image', {
          imageUrl: result.url,
          fileName,
          fileSize: result.size,
        });

        // Remove optimistic
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (err) {
        setError('Failed to send image');
        console.error('Error sending image:', err);
      } finally {
        setSending(false);
      }
    },
    [conversationId, useMock]
  );

  return {
    messages,
    loading,
    sending,
    error,
    hasMore,
    loadMore,
    sendTextMessage,
    sendImageMessage,
  };
}
