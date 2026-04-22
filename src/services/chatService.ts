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
      text: type === 'image' ? '📷 Photo' : text,
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
