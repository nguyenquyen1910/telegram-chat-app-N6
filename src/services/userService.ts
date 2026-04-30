import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User } from '@/types/chat';

function getDb() {
  if (!db) throw new Error('Firestore not initialized. Check Firebase config.');
  return db;
}

function normalizeUser(docId: string, raw: any): User {
  return {
    uid: docId,
    displayName: raw.displayName || '',
    phoneNumber: raw.phoneNumber || '',
    avatarUrl: raw.avatarUrl || raw.photoURL || '',
    photoURL: raw.photoURL || raw.avatarUrl || '',
    bio: raw.bio || '',
    lastSeen: raw.lastSeen || null,
    isOnline: !!raw.isOnline,
    createdAt: raw.createdAt,
    legacyUids: Array.isArray(raw.legacyUids) ? raw.legacyUids : [],
  } as User;
}

export async function getUserById(uid: string): Promise<User | null> {
  const firestore = getDb();
  const docRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return normalizeUser(docSnap.id, docSnap.data());
  }

  const usersRef = collection(firestore, 'users');
  const legacyQuery = query(usersRef, where('legacyUids', 'array-contains', uid), limit(1));
  const legacySnap = await getDocs(legacyQuery);
  if (legacySnap.empty) return null;

  const legacyDoc = legacySnap.docs[0];
  return normalizeUser(legacyDoc.id, legacyDoc.data());
}

export async function createOrUpdateUser(user: Partial<User> & { uid: string }): Promise<void> {
  const firestore = getDb();
  const docRef = doc(firestore, 'users', user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, { ...user, lastSeen: serverTimestamp() });
  } else {
    await setDoc(docRef, {
      ...user,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
    });
  }
}

export async function updateUserStatus(uid: string, isOnline: boolean): Promise<void> {
  const firestore = getDb();
  const docRef = doc(firestore, 'users', uid);
  await updateDoc(docRef, {
    isOnline,
    lastSeen: serverTimestamp(),
  });
}

export function subscribeToUserStatus(
  uid: string,
  callback: (user: User) => void
) {
  const firestore = getDb();
  const docRef = doc(firestore, 'users', uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(normalizeUser(docSnap.id, docSnap.data()));
    }
  });
}

export async function getUserByPhone(phoneNumber: string): Promise<User | null> {
  const firestore = getDb();
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('phoneNumber', '==', phoneNumber), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return normalizeUser(docSnap.id, docSnap.data());
}
