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

function mapUserDoc(docSnap: { id: string; data: () => unknown }): User {
  const data = docSnap.data() as Record<string, unknown>;
  return {
    ...data,
    uid: docSnap.id,
    avatarUrl: (data.photoURL || '') as string,
  } as User;
}

export async function getUserById(uid: string): Promise<User | null> {
  const firestore = getDb();
  const docRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return mapUserDoc(docSnap);
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
      callback(mapUserDoc(docSnap));
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
  return mapUserDoc(docSnap);
}
