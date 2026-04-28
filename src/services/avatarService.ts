import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@telegram_auth_user';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

/**
 * Upload ảnh lên Cloudinary (miễn phí, không cần Firebase Storage).
 * @param uid     - ID người dùng (dùng để đặt tên ảnh)
 * @param fileUri - URI local của ảnh (từ expo-image-picker)
 * @returns       URL công khai của ảnh đã upload
 */
export async function uploadAvatar(uid: string, fileUri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Thiếu cấu hình Cloudinary. Hãy thêm EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME và EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET vào file .env'
    );
  }

  console.log('[uploadAvatar] Uploading to Cloudinary, uid:', uid);

  // 1. Tạo FormData để upload
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'image/jpeg',
    name: `avatar_${uid}.jpg`,
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'avatars');
  // KHÔNG set public_id cố định → Cloudinary tạo ID duy nhất mỗi lần upload
  // Điều này đảm bảo secure_url luôn trỏ đến ảnh MỚI (tránh Cloudinary trả file cũ)

  // 2. Upload lên Cloudinary
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  let downloadUrl: string;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('[uploadAvatar] Cloudinary error:', data.error);
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    // Dùng secure_url (https)
    downloadUrl = data.secure_url;
    // Thêm version để bust React Native image cache (tránh hiện ảnh cũ)
    downloadUrl = `${downloadUrl}?v=${Date.now()}`;
    console.log('[uploadAvatar] Cloudinary URL:', downloadUrl.slice(0, 80));
  } catch (e: any) {
    console.error('[uploadAvatar] Upload failed:', e);
    throw new Error(`Upload thất bại: ${e?.message || 'Lỗi không xác định'}`);
  }

  // 3. Cập nhật Firestore
  if (db) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        avatarUrl: downloadUrl,
        photoURL: downloadUrl,
      });
      console.log('[uploadAvatar] Firestore updated');
    } catch (e) {
      console.warn('[uploadAvatar] Firestore update failed (non-critical):', e);
    }
  }

  // 4. Cập nhật AsyncStorage để hiển thị ngay không cần reload
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const userData = JSON.parse(stored);
      userData.avatarUrl = downloadUrl;
      userData.photoURL = downloadUrl;
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      console.log('[uploadAvatar] AsyncStorage updated');
    }
  } catch (e) {
    console.warn('[uploadAvatar] AsyncStorage update failed:', e);
  }

  return downloadUrl;
}

/**
 * Xoá avatar của user (đặt lại về rỗng trong DB).
 * Ảnh trên Cloudinary vẫn còn nhưng không hiển thị nữa.
 */
export async function removeAvatar(uid: string): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, 'users', uid), { avatarUrl: '', photoURL: '' });
    } catch (e) {
      console.warn('[removeAvatar] Firestore update failed:', e);
    }
  }

  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const userData = JSON.parse(stored);
      userData.avatarUrl = '';
      userData.photoURL = '';
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    }
  } catch (e) {
    console.warn('[removeAvatar] AsyncStorage update failed:', e);
  }
}
