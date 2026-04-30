import { Timestamp } from 'firebase/firestore';
import type { Message, MessageStatus } from '../types/chat';

interface GetComputedMessageStatusArgs {
  message: Message;
  currentUid: string | null;
  otherUid: string | null;
  lastReadBy: Record<string, Timestamp> | null;
}

interface ShouldMarkConversationReadArgs {
  chatId: string | null;
  currentUid: string | null;
  loading: boolean;
  messageCount: number;
}

export function getComputedMessageStatus({
  message,
  currentUid,
  otherUid,
  lastReadBy,
}: GetComputedMessageStatusArgs): MessageStatus {
  if (message.senderId !== currentUid) return message.status;
  if (message.status === 'sending') return 'sending';
  if (!otherUid || !lastReadBy?.[otherUid]) return 'sent';

  const messageMs = message.createdAt?.toMillis?.() || 0;
  const otherReadMs = lastReadBy[otherUid]?.toMillis?.() || 0;

  return otherReadMs >= messageMs ? 'read' : 'sent';
}

export function shouldMarkConversationRead({
  chatId,
  currentUid,
  loading,
  messageCount,
}: ShouldMarkConversationReadArgs): boolean {
  return Boolean(chatId && currentUid && !loading && messageCount > 0);
}
