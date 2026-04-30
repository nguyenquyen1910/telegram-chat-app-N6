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
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Message, Conversation, MessageType, ReplyTo } from '@/types/chat';

// Helper: kiểm tra Firestore đã được khởi tạo chưa
function getDb() {
  if (!db) throw new Error('Firestore not initialized. Check Firebase config.');
  return db;
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function timestampMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
}

async function commitBatchIfNeeded(
  batchRef: { current: ReturnType<typeof writeBatch> },
  writesRef: { current: number },
  force: boolean = false
) {
  if (!force && writesRef.current < 400) return;
  if (writesRef.current === 0) return;

  await batchRef.current.commit();
  batchRef.current = writeBatch(getDb());
  writesRef.current = 0;
}

async function mergePrivateConversations(
  sourceConvId: string,
  targetConvId: string,
  fromUid: string,
  toUid: string,
  sourceData: Conversation,
  targetData: Conversation
) {
  const firestore = getDb();
  const sourceMessagesRef = collection(firestore, 'conversations', sourceConvId, 'messages');
  const targetMessagesRef = collection(firestore, 'conversations', targetConvId, 'messages');
  const sourceMessagesSnap = await getDocs(sourceMessagesRef);
  const targetMessagesSnap = await getDocs(targetMessagesRef);
  const targetMessageIds = new Set(targetMessagesSnap.docs.map((docSnap) => docSnap.id));

  const batchRef = { current: writeBatch(firestore) };
  const writesRef = { current: 0 };

  for (const messageDoc of sourceMessagesSnap.docs) {
    const data = messageDoc.data();
    const normalizedSenderId = data.senderId === fromUid ? toUid : data.senderId;

    if (!targetMessageIds.has(messageDoc.id)) {
      const targetMessageRef = doc(targetMessagesRef, messageDoc.id);
      batchRef.current.set(targetMessageRef, {
        ...data,
        conversationId: targetConvId,
        senderId: normalizedSenderId,
      });
      writesRef.current++;
    }

    batchRef.current.delete(messageDoc.ref);
    writesRef.current++;
    await commitBatchIfNeeded(batchRef, writesRef);
  }

  const sourceUpdatedAt = timestampMillis(sourceData.updatedAt);
  const targetUpdatedAt = timestampMillis(targetData.updatedAt);
  const sourceLastMessageAt = timestampMillis(sourceData.lastMessage?.timestamp);
  const targetLastMessageAt = timestampMillis(targetData.lastMessage?.timestamp);

  const targetConvRef = doc(firestore, 'conversations', targetConvId);
  const sourceConvRef = doc(firestore, 'conversations', sourceConvId);

  const targetParticipants = Array.from(
    new Set([...(targetData.participants || []), ...(sourceData.participants || [])].map((uid) => uid === fromUid ? toUid : uid))
  );

  const updatePayload: Record<string, any> = {
    participants: targetParticipants,
  };

  if (sourceUpdatedAt > targetUpdatedAt) {
    updatePayload.updatedAt = sourceData.updatedAt;
  }

  if (sourceData.lastMessage && sourceLastMessageAt >= targetLastMessageAt) {
    updatePayload.lastMessage = {
      ...sourceData.lastMessage,
      senderId: sourceData.lastMessage.senderId === fromUid ? toUid : sourceData.lastMessage.senderId,
    };
  } else if (targetData.lastMessage?.senderId === fromUid) {
    updatePayload.lastMessage = {
      ...targetData.lastMessage,
      senderId: toUid,
    };
  }

  batchRef.current.update(targetConvRef, updatePayload);
  writesRef.current++;
  batchRef.current.delete(sourceConvRef);
  writesRef.current++;

  await commitBatchIfNeeded(batchRef, writesRef, true);
}

export async function migrateUserConversationReferences(
  fromUid: string,
  toUid: string
): Promise<{ conversationsUpdated: number; conversationsMerged: number; messagesUpdated: number }> {
  const firestore = getDb();

  if (!fromUid || !toUid || fromUid === toUid) {
    return { conversationsUpdated: 0, conversationsMerged: 0, messagesUpdated: 0 };
  }

  const convRef = collection(firestore, 'conversations');
  const convQuery = query(convRef, where('participants', 'array-contains', fromUid));
  const convSnap = await getDocs(convQuery);

  let conversationsUpdated = 0;
  let conversationsMerged = 0;
  let messagesUpdated = 0;

  const batchRef = { current: writeBatch(firestore) };
  const writesRef = { current: 0 };

  for (const convDoc of convSnap.docs) {
    const data = { id: convDoc.id, ...convDoc.data() } as Conversation;
    const nextParticipants = Array.from(
      new Set((data.participants || []).map((uid) => (uid === fromUid ? toUid : uid)))
    );

    if (data.type === 'private' && nextParticipants.length === 2) {
      const candidateQuery = query(
        convRef,
        where('participants', 'array-contains', toUid),
        where('type', '==', 'private')
      );
      const candidateSnap = await getDocs(candidateQuery);
      const duplicate = candidateSnap.docs.find((candidate) => {
        if (candidate.id === convDoc.id) return false;
        const participants = (candidate.data().participants || []) as string[];
        const normalized = Array.from(new Set(participants.map((uid) => (uid === fromUid ? toUid : uid))));
        return arraysEqual([...normalized].sort(), [...nextParticipants].sort());
      });

      if (duplicate) {
        await commitBatchIfNeeded(batchRef, writesRef, true);
        await mergePrivateConversations(
          convDoc.id,
          duplicate.id,
          fromUid,
          toUid,
          data,
          { id: duplicate.id, ...duplicate.data() } as Conversation
        );
        conversationsMerged++;
        continue;
      }
    }

    const updatePayload: Record<string, any> = {};
    if (!arraysEqual(data.participants || [], nextParticipants)) {
      updatePayload.participants = nextParticipants;
    }

    if (data.lastMessage?.senderId === fromUid) {
      updatePayload.lastMessage = {
        ...data.lastMessage,
        senderId: toUid,
      };
    }

    if (Object.keys(updatePayload).length > 0) {
      batchRef.current.update(convDoc.ref, updatePayload);
      writesRef.current++;
      conversationsUpdated++;
      await commitBatchIfNeeded(batchRef, writesRef);
    }

    const messagesRef = collection(firestore, 'conversations', convDoc.id, 'messages');
    const messagesQuery = query(messagesRef, where('senderId', '==', fromUid));
    const messagesSnap = await getDocs(messagesQuery);

    for (const messageDoc of messagesSnap.docs) {
      batchRef.current.update(messageDoc.ref, { senderId: toUid });
      writesRef.current++;
      messagesUpdated++;
      await commitBatchIfNeeded(batchRef, writesRef);
    }
  }

  await commitBatchIfNeeded(batchRef, writesRef, true);

  return {
    conversationsUpdated,
    conversationsMerged,
    messagesUpdated,
  };
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

  // Tăng unreadCount cho tất cả participants trừ người gửi
  const convSnap = await getDoc(convRef);
  const convData = convSnap.data();
  const participants: string[] = convData?.participants || [];
  const unreadUpdate: Record<string, any> = {};
  participants.forEach((uid) => {
    if (uid !== senderId) {
      unreadUpdate[`unreadCount.${uid}`] = increment(1);
    }
  });

  batch.update(convRef, {
    lastMessage: {
      text: type === 'image' ? (text ? `📷 ${text}` : '📷 Ảnh') : text,
      senderId,
      timestamp: serverTimestamp(),
      type,
    },
    updatedAt: serverTimestamp(),
    ...unreadUpdate,
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
  callback: (messages: Message[]) => void
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

// ==================== Unread ====================

export async function markConversationAsRead(
  conversationId: string,
  uid: string
): Promise<void> {
  const firestore = getDb();
  const convRef = doc(firestore, 'conversations', conversationId);
  await updateDoc(convRef, {
    [`unreadCount.${uid}`]: 0,
  });
}

// ==================== Conversations List ====================

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
  });
}
