import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User } from '@/types/chat';

function getDb() {
  if (!db) throw new Error('Firestore not initialized. Check Firebase config.');
  return db;
}

export async function getUserById(uid: string): Promise<User | null> {
  const firestore = getDb();
  const docRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { uid: docSnap.id, ...docSnap.data() } as User;
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
      callback({ uid: docSnap.id, ...docSnap.data() } as User);
    }
  });
}

/**
 * Batch-fetch multiple user profiles efficiently in parallel.
 * Uses in-memory cache so repeated IDs don't cause extra DB reads.
 */
export async function getUsersByIds(uids: string[]): Promise<Map<string, User>> {
  const unique = [...new Set(uids.filter(Boolean))];
  const results = await Promise.all(unique.map(uid => getUserById(uid)));

  const map = new Map<string, User>();
  unique.forEach((uid, i) => {
    const user = results[i];
    if (user) map.set(uid, user);
  });
  return map;
}
