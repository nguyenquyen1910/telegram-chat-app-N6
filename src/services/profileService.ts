/**
 * profileService.ts
 * Quản lý toàn bộ dữ liệu profile người dùng (ngoài avatar).
 * Lưu đồng thời vào AsyncStorage (nhanh, offline) và Firestore (đồng bộ đa thiết bị).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Birthday {
  day: number;
  month: number;
  year: number;
}

export interface UserProfile {
  username?: string;
  bio?: string;
  birthday?: Birthday | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const cacheKey = (uid: string) => `@telegram_profile_${uid}`;

/** Đọc cache local */
async function readCache(uid: string): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Ghi cache local */
async function writeCache(uid: string, profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(profile));
  } catch (e) {
    console.warn('[profileService] AsyncStorage write failed:', e);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Đọc profile từ cache local.
 * Nhanh và hoạt động offline — dùng cho UI render ngay.
 */
export async function loadProfile(uid: string): Promise<UserProfile> {
  return readCache(uid);
}

/**
 * Lưu (merge) một phần hoặc toàn bộ profile.
 * - Cập nhật AsyncStorage ngay lập tức
 * - Đẩy lên Firestore (non-blocking với warn nếu lỗi)
 */
export async function saveProfile(uid: string, changes: Partial<UserProfile>): Promise<void> {
  // 1. Merge với cache hiện tại
  const current = await readCache(uid);
  const merged: UserProfile = { ...current, ...changes };

  // 2. Ghi cache local
  await writeCache(uid, merged);

  // 3. Đẩy lên Firestore
  if (db) {
    try {
      const firestoreData: Record<string, any> = {};
      if ('username' in changes) firestoreData.username = changes.username ?? '';
      if ('bio' in changes) firestoreData.bio = changes.bio ?? '';
      if ('birthday' in changes) {
        firestoreData.birthday = changes.birthday
          ? `${changes.birthday.year}-${String(changes.birthday.month).padStart(2, '0')}-${String(changes.birthday.day).padStart(2, '0')}`
          : '';
      }
      if (Object.keys(firestoreData).length > 0) {
        await updateDoc(doc(db, 'users', uid), firestoreData);
      }
    } catch (e) {
      console.warn('[profileService] Firestore update failed (non-critical):', e);
    }
  }
}

/**
 * Kiểm tra xem username đã tồn tại trong Firestore chưa (không tính uid hiện tại).
 */
export async function checkUsernameExists(username: string, currentUid?: string): Promise<boolean> {
  if (!db) return false;
  if (!username) return false;
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    // Nếu tìm thấy, kiểm tra xem có phải của chính user hiện tại không
    if (currentUid) {
      const isMine = snapshot.docs.every(doc => doc.id === currentUid);
      return !isMine;
    }
    
    return true; // Đã có người dùng (và không có currentUid để loại trừ)
  } catch (e) {
    console.error('[profileService] checkUsernameExists error:', e);
    return false;
  }
}

// ── Formatters ─────────────────────────────────────────────────────────────────

/** Hiển thị sinh nhật dạng "9 Th.7 2004" */
export function formatBirthday(b: Birthday): string {
  return `${b.day} Th.${b.month} ${b.year}`;
}
