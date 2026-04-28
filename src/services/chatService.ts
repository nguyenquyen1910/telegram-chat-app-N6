import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Message, Conversation, MessageType, ReplyTo } from '@/types/chat';

// Helper: kiểm tra Firestore đã được khởi tạo chưa
function getDb() {
  if (!db) throw new Error('Firestore not initialized. Check Firebase config.');
  return db;
}

// ==================== Conversations ====================

export async function getOrCreateConversation(
  currentUid: string,
  otherUid: string
): Promise<string> {
  const firestore = getDb();
  const convRef = collection(firestore, 'conversations');

  const q = query(
    convRef,
    where('participants', 'array-contains', currentUid),
    where('type', '==', 'private')
  );

  const snapshot = await getDocs(q);
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Conversation;
    if (data.participants.includes(otherUid)) {
      return docSnap.id;
    }
  }

  const newConv = await addDoc(convRef, {
    participants: [currentUid, otherUid],
    lastMessage: null,
    updatedAt: serverTimestamp(),
    type: 'private',
  });

  return newConv.id;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const firestore = getDb();
  
  // Delete all messages in the subcollection first
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const messagesSnap = await getDocs(messagesRef);
  const batch = writeBatch(firestore);
  
  messagesSnap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  
  // Delete the conversation document
  const convRef = doc(firestore, 'conversations', conversationId);
  batch.delete(convRef);
  
  await batch.commit();
}

export async function createGroupConversation(
  groupName: string,
  participantUids: string[]
): Promise<string> {
  const firestore = getDb();
  const convRef = collection(firestore, 'conversations');

  const newConv = await addDoc(convRef, {
    participants: participantUids,
    lastMessage: null,
    updatedAt: serverTimestamp(),
    type: 'group',
    groupName,
    groupAvatar: '',
  });

  return newConv.id;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const firestore = getDb();
  const docRef = doc(firestore, 'conversations', conversationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Conversation;
}

export function subscribeToConversation(
  conversationId: string,
  callback: (conversation: Conversation) => void
) {
  const firestore = getDb();
  const docRef = doc(firestore, 'conversations', conversationId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Conversation);
    }
  });
}

// ==================== Messages ====================

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  type: MessageType = 'text',
  extra?: {
    imageUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileThumbnail?: string;
    replyTo?: ReplyTo;
  }
): Promise<string> {
  const firestore = getDb();
  const batch = writeBatch(firestore);

  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const messageRef = doc(messagesRef);

  const messageData: Record<string, any> = {
    conversationId,
    senderId,
    text,
    type,
    status: 'sent',
    createdAt: serverTimestamp(),
  };

  if (extra?.imageUrl) messageData.imageUrl = extra.imageUrl;
  if (extra?.fileName) messageData.fileName = extra.fileName;
  if (extra?.fileSize) messageData.fileSize = extra.fileSize;
  if (extra?.fileThumbnail) messageData.fileThumbnail = extra.fileThumbnail;
  if (extra?.replyTo) messageData.replyTo = extra.replyTo;

  batch.set(messageRef, messageData);

  const convRef = doc(firestore, 'conversations', conversationId);
  batch.update(convRef, {
    lastMessage: {
      text: type === 'image' ? (text ? `📷 ${text}` : '📷 Ảnh') : text,
      senderId,
      timestamp: serverTimestamp(),
      type,
    },
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return messageRef.id;
}

export async function getMessages(
  conversationId: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ messages: Message[]; lastVisible: QueryDocumentSnapshot | null }> {
  const firestore = getDb();
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');

  let q = query(messagesRef, orderBy('createdAt', 'desc'), limit(pageSize));

  if (lastDoc) {
    q = query(messagesRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
  }

  const snapshot = await getDocs(q);
  const messages: Message[] = snapshot.docs.map(
    (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Message)
  );

  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { messages: messages.reverse(), lastVisible };
}

export function subscribeToNewMessages(
  conversationId: string,
  afterTimestamp: Timestamp,
  callback: (messages: Message[]) => void,
  onModified?: (messages: Message[]) => void
) {
  const firestore = getDb();
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where('createdAt', '>', afterTimestamp),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const newMessages: Message[] = snapshot.docChanges()
      .filter((change) => change.type === 'added')
      .map((change) => ({ id: change.doc.id, ...change.doc.data() } as Message));

    if (newMessages.length > 0) {
      callback(newMessages);
    }

    // Handle modified messages (reactions, revoke, edit, delete)
    if (onModified) {
      const modifiedMessages: Message[] = snapshot.docChanges()
        .filter((change) => change.type === 'modified')
        .map((change) => ({ id: change.doc.id, ...change.doc.data() } as Message));

      if (modifiedMessages.length > 0) {
        onModified(modifiedMessages);
      }
    }
  });
}

/**
 * Subscribe to ALL message changes (modified/removed) in a conversation.
 * Captures reactions, revoke, edit, delete on any message regardless of age.
 */
export function subscribeToMessageChanges(
  conversationId: string,
  onModified: (messages: Message[]) => void,
  onRemoved?: (messageIds: string[]) => void
) {
  const firestore = getDb();
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const modified: Message[] = snapshot.docChanges()
      .filter((change) => change.type === 'modified')
      .map((change) => ({ id: change.doc.id, ...change.doc.data() } as Message));

    if (modified.length > 0) {
      onModified(modified);
    }

    if (onRemoved) {
      const removed = snapshot.docChanges()
        .filter((change) => change.type === 'removed')
        .map((change) => change.doc.id);
      if (removed.length > 0) {
        onRemoved(removed);
      }
    }
  });
}

export async function markMessagesAsRead(
  conversationId: string,
  messageIds: string[]
): Promise<void> {
  const firestore = getDb();
  const batch = writeBatch(firestore);

  for (const msgId of messageIds) {
    const msgRef = doc(firestore, 'conversations', conversationId, 'messages', msgId);
    batch.update(msgRef, { status: 'read' });
  }

  await batch.commit();
}

export async function getUnreadCount(conversationId: string, currentUid: string): Promise<number> {
  const firestore = getDb();
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  
  const q = query(
    messagesRef,
    where('status', 'in', ['sending', 'sent', 'delivered'])
  );

  const snapshot = await getDocs(q);
  // Count messages where sender is NOT the current user
  return snapshot.docs.filter(doc => doc.data().senderId !== currentUid).length;
}

export async function getMediaMessages(conversationId: string): Promise<Message[]> {
  const firestore = getDb();
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where('type', '==', 'image'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Message));
}

// ==================== Conversations List ====================

export async function getConversationsForUser(uid: string): Promise<Conversation[]> {
  const firestore = getDb();
  const convRef = collection(firestore, 'conversations');
  const q = query(convRef, where('participants', 'array-contains', uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Conversation)
  );
}

export function subscribeToConversations(
  uid: string,
  callback: (conversations: Conversation[]) => void
) {
  const firestore = getDb();
  const convRef = collection(firestore, 'conversations');
  const q = query(
    convRef,
    where('participants', 'array-contains', uid)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Conversation)
    );
    callback(conversations);
  }, (error) => {
    console.warn('[ChatService] subscribeToConversations error:', error.message);
    // Return empty list on error instead of crashing
    callback([]);
  });
}

// ==================== Read Status ====================

export async function markConversationAsRead(
  conversationId: string,
  uid: string
): Promise<void> {
  try {
    const firestore = getDb();
    const convRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`lastReadBy.${uid}`]: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[ChatService] markConversationAsRead error:', error);
  }
}

// ==================== Mute ====================

export async function toggleMuteConversation(
  conversationId: string,
  uid: string,
  muted: boolean
): Promise<void> {
  try {
    const firestore = getDb();
    const convRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`mutedBy.${uid}`]: muted,
    });
  } catch (error) {
    console.warn('[ChatService] toggleMuteConversation error:', error);
  }
}

// ==================== Message Actions ====================

/**
 * Thu hồi tin nhắn (cả 2 phía)
 * Không giới hạn thời gian
 */
export async function revokeMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  const firestore = getDb();
  const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, {
    isRevoked: true,
    text: '',
    imageUrl: deleteField(),
    fileName: deleteField(),
    fileSize: deleteField(),
    reactions: deleteField(),
  });

  // Cập nhật lastMessage nếu tin nhắn thu hồi là tin mới nhất
  const convRef = doc(firestore, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  if (convSnap.exists()) {
    const conv = convSnap.data();
    // Cập nhật lastMessage thành "Tin nhắn đã thu hồi"
    await updateDoc(convRef, {
      lastMessage: {
        ...conv.lastMessage,
        text: 'Tin nhắn đã thu hồi',
        type: 'text',
      },
    });
  }
}

/**
 * Xoá tin nhắn 1 phía (chỉ cho user hiện tại)
 */
export async function deleteMessageForMe(
  conversationId: string,
  messageId: string,
  uid: string
): Promise<void> {
  const firestore = getDb();
  const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, {
    deletedFor: arrayUnion(uid),
  });
}

/**
 * Toggle emoji reaction trên tin nhắn
 */
export async function toggleReaction(
  conversationId: string,
  messageId: string,
  uid: string,
  emoji: string
): Promise<void> {
  const firestore = getDb();
  const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  const msgSnap = await getDoc(msgRef);

  if (!msgSnap.exists()) return;

  const data = msgSnap.data();
  const reactions: { [key: string]: string[] } = data.reactions || {};
  const currentList = reactions[emoji] || [];

  if (currentList.includes(uid)) {
    // Bỏ reaction
    reactions[emoji] = currentList.filter((id) => id !== uid);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    // Thêm reaction (xoá reaction cũ của user nếu có)
    for (const key of Object.keys(reactions)) {
      reactions[key] = reactions[key].filter((id) => id !== uid);
      if (reactions[key].length === 0) {
        delete reactions[key];
      }
    }
    reactions[emoji] = [...(reactions[emoji] || []), uid];
  }

  await updateDoc(msgRef, { reactions });
}

/**
 * Sửa tin nhắn (chỉ text)
 */
export async function editMessage(
  conversationId: string,
  messageId: string,
  newText: string
): Promise<void> {
  const firestore = getDb();
  const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, {
    text: newText,
    isEdited: true,
  });
}
