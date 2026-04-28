import { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { Message, ReplyTo, MessageType } from '@/types/chat';
import {
  getMessages,
  sendMessage,
  subscribeToNewMessages,
} from '@/services/chatService';
import { uploadImage } from '@/services/mediaService';
import { MESSAGES_PER_PAGE } from '@/constants/chat';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  sending: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendTextMessage: (text: string, replyTo?: ReplyTo) => Promise<void>;
  sendImageMessage: (localUri: string, fileName: string, caption?: string) => Promise<void>;
}

/**
 * Hook quản lý messages real-time cho 1 conversation
 * Sử dụng currentUid thật từ AuthContext
 */
export function useMessages(
  conversationId: string | null,
  currentUid: string | null
): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial messages
  useEffect(() => {
    if (!conversationId || !currentUid) return;

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
  }, [conversationId, currentUid]);

  // Load more (pagination - scroll lên)
  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loading || loadingMore) return;

    try {
      setLoadingMore(true);
      const result = await getMessages(
        conversationId,
        MESSAGES_PER_PAGE,
        lastDocRef.current ?? undefined
      );

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filtered = result.messages.filter((m) => !existingIds.has(m.id));
        return [...filtered, ...prev];
      });
      lastDocRef.current = result.lastVisible;
      setHasMore(result.messages.length >= MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, hasMore, loading, loadingMore]);

  // Gửi tin nhắn text
  const sendTextMessage = useCallback(
    async (text: string, replyTo?: ReplyTo) => {
      if (!conversationId || !currentUid || !text.trim()) return;

      const type: MessageType = replyTo ? 'reply' : 'text';

      try {
        setSending(true);

        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        const optimisticMsg: Message = {
          id: tempId,
          conversationId,
          senderId: currentUid,
          text: text.trim(),
          type,
          replyTo,
          status: 'sending',
          createdAt: Timestamp.now(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        await sendMessage(conversationId, currentUid, text.trim(), type, {
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
    [conversationId, currentUid]
  );

  // Gửi tin nhắn ảnh (với caption text tuỳ chọn)
  const sendImageMessage = useCallback(
    async (localUri: string, fileName: string, caption?: string) => {
      if (!conversationId || !currentUid) return;

      try {
        setSending(true);

        // Optimistic update với local URI
        const tempId = `temp_img_${Date.now()}`;
        const optimisticMsg: Message = {
          id: tempId,
          conversationId,
          senderId: currentUid,
          text: caption || '',
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

        // Gửi message với URL Cloudinary + caption
        await sendMessage(conversationId, currentUid, caption || '', 'image', {
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
    [conversationId, currentUid]
  );

  return {
    messages,
    loading,
    loadingMore,
    sending,
    error,
    hasMore,
    loadMore,
    sendTextMessage,
    sendImageMessage,
  };
}
