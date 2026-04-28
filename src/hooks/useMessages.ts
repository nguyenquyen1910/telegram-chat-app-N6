import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Image } from 'react-native';
import { Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { Message, ReplyTo, MessageType } from '@/types/chat';
import {
  getMessages,
  sendMessage,
  subscribeToNewMessages,
  subscribeToMessageChanges,
  revokeMessage as revokeMessageService,
  deleteMessageForMe as deleteMessageForMeService,
  toggleReaction as toggleReactionService,
  editMessage as editMessageService,
} from '@/services/chatService';
import { uploadImage, uploadFile } from '@/services/mediaService';
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
  sendFileMessage: (localUri: string, fileName: string, fileSize: number, mimeType: string) => Promise<void>;
  handleRevokeMessage: (messageId: string) => Promise<void>;
  handleDeleteForMe: (messageId: string) => Promise<void>;
  handleToggleReaction: (messageId: string, emoji: string) => Promise<void>;
  handleEditMessage: (messageId: string, newText: string) => Promise<void>;
}

/**
 * Hook quản lý messages real-time cho 1 conversation
 */
export function useMessages(
  conversationId: string | null,
  currentUid: string | null
): UseMessagesReturn {
  const [rawMessages, setRawMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const unsubscribeChangesRef = useRef<(() => void) | null>(null);

  // Filter messages: loại bỏ messages đã xoá cho user hiện tại
  const messages = useMemo(() => {
    if (!currentUid) return rawMessages;
    return rawMessages.filter((m) => {
      if (m.deletedFor && m.deletedFor.includes(currentUid)) return false;
      return true;
    });
  }, [rawMessages, currentUid]);

  // Load initial messages + subscribe
  useEffect(() => {
    if (!conversationId || !currentUid) return;

    async function loadInitialMessages() {
      try {
        setLoading(true);
        setError(null);

        const result = await getMessages(conversationId!, MESSAGES_PER_PAGE);
        setRawMessages(result.messages);
        lastDocRef.current = result.lastVisible;
        setHasMore(result.messages.length >= MESSAGES_PER_PAGE);

        // Subscribe for NEW messages only
        const afterTime = result.messages.length > 0
          ? result.messages[result.messages.length - 1].createdAt
          : Timestamp.now();

        unsubscribeRef.current = subscribeToNewMessages(
          conversationId!,
          afterTime,
          (newMessages) => {
            setRawMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const filtered = newMessages.filter((m) => !existingIds.has(m.id));
              return [...prev, ...filtered];
            });
          }
        );

        // Subscribe for ALL message modifications (reactions, revoke, edit, delete)
        unsubscribeChangesRef.current = subscribeToMessageChanges(
          conversationId!,
          (modifiedMessages) => {
            setRawMessages((prev) =>
              prev.map((m) => {
                const updated = modifiedMessages.find((mod) => mod.id === m.id);
                return updated ? updated : m;
              })
            );
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
      unsubscribeChangesRef.current?.();
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

      setRawMessages((prev) => {
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
        setRawMessages((prev) => [...prev, optimisticMsg]);

        await sendMessage(conversationId, currentUid, text.trim(), type, {
          replyTo,
        });

        // Remove optimistic message (real one will come from listener)
        setRawMessages((prev) => prev.filter((m) => m.id !== tempId));
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

        // Lấy kích thước ảnh local để giữ tỉ lệ khi hiển thị optimistic
        const localSize = await new Promise<{ width: number; height: number }>((resolve) => {
          Image.getSize(
            localUri,
            (w, h) => resolve({ width: w, height: h }),
            () => resolve({ width: 0, height: 0 })
          );
        });

        // Optimistic update với local URI + kích thước ảnh
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
          imageWidth: localSize.width,
          imageHeight: localSize.height,
          status: 'sending',
          createdAt: Timestamp.now(),
        };
        setRawMessages((prev) => [...prev, optimisticMsg]);

        // Upload ảnh lên Cloudinary
        const result = await uploadImage(localUri);

        // Gửi message với URL Cloudinary + caption
        await sendMessage(conversationId, currentUid, caption || '', 'image', {
          imageUrl: result.url,
          fileName,
          fileSize: result.size,
          imageWidth: result.width,
          imageHeight: result.height,
        });

        // Remove optimistic
        setRawMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (err) {
        setError('Failed to send image');
        console.error('Error sending image:', err);
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUid]
  );

  // Gửi file đính kèm
  const sendFileMessage = useCallback(
    async (localUri: string, fileName: string, fileSize: number, mimeType: string) => {
      if (!conversationId || !currentUid) return;

      try {
        setSending(true);

        const tempId = `temp_file_${Date.now()}`;
        const optimisticMsg: Message = {
          id: tempId,
          conversationId,
          senderId: currentUid,
          text: '',
          type: 'file',
          fileName,
          fileSize,
          status: 'sending',
          createdAt: Timestamp.now(),
        };
        setRawMessages((prev) => [...prev, optimisticMsg]);

        const result = await uploadFile(localUri, fileName, mimeType);
        await sendMessage(conversationId, currentUid, '', 'file', {
          imageUrl: result.url,
          fileName,
          fileSize: result.size,
        });

        setRawMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (err) {
        setError('Failed to send file');
        console.error('Error sending file:', err);
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUid]
  );

  // ==================== Message Actions ====================

  const handleRevokeMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      try {
        await revokeMessageService(conversationId, messageId);
        // Optimistic update
        setRawMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isRevoked: true, text: '', imageUrl: undefined, fileName: undefined }
              : m
          )
        );
      } catch (err) {
        console.error('Error revoking message:', err);
      }
    },
    [conversationId]
  );

  const handleDeleteForMe = useCallback(
    async (messageId: string) => {
      if (!conversationId || !currentUid) return;
      try {
        await deleteMessageForMeService(conversationId, messageId, currentUid);
        // Optimistic: remove from list
        setRawMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, deletedFor: [...(m.deletedFor || []), currentUid] }
              : m
          )
        );
      } catch (err) {
        console.error('Error deleting message:', err);
      }
    },
    [conversationId, currentUid]
  );

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId || !currentUid) return;
      try {
        await toggleReactionService(conversationId, messageId, currentUid, emoji);
      } catch (err) {
        console.error('Error toggling reaction:', err);
      }
    },
    [conversationId, currentUid]
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (!conversationId || !newText.trim()) return;
      try {
        await editMessageService(conversationId, messageId, newText.trim());
        // Optimistic update
        setRawMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, text: newText.trim(), isEdited: true } : m
          )
        );
      } catch (err) {
        console.error('Error editing message:', err);
      }
    },
    [conversationId]
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
    sendFileMessage,
    handleRevokeMessage,
    handleDeleteForMe,
    handleToggleReaction,
    handleEditMessage,
  };
}
