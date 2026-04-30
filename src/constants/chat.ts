import { Timestamp } from 'firebase/firestore';

// ==================== Cloudinary Config ====================
export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
export const CLOUDINARY_VIDEO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
export const CLOUDINARY_RAW_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
export const CLOUDINARY_AUTO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

// ==================== Chat Constants ====================
export const MESSAGES_PER_PAGE = 50;
export const MAX_IMAGE_SIZE_MB = 10;
export const IMAGE_QUALITY = 0.7;
export const THUMBNAIL_SIZE = { width: 150, height: 150 };

// ==================== Helpers ====================
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatMessageTime(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Threshold to consider user offline if heartbeat missed (app crash/kill)
const ONLINE_TIMEOUT_MS = 90 * 1000; // 90 seconds

/**
 * Guard against stale online status.
 * If isOnline is true but lastSeen is older than 90s, consider user offline.
 */
export function isUserTrulyOnline(isOnline: boolean, lastSeen: Timestamp | null): boolean {
  if (!isOnline) return false;
  if (!lastSeen) return false;
  const elapsed = Date.now() - lastSeen.toMillis();
  return elapsed < ONLINE_TIMEOUT_MS;
}

export function formatLastSeen(timestamp: Timestamp | null, isOnline: boolean): string {
  if (isOnline) return 'trực tuyến';
  if (!timestamp) return 'truy cập gần đây';
  
  const now = Date.now();
  const diff = now - timestamp.toMillis();
  const minutes = Math.floor(diff / (60 * 1000));
  
  if (minutes < 1) return 'vừa truy cập';
  if (minutes < 60) return `truy cập ${minutes} phút trước`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `truy cập ${hours} giờ trước`;
  
  const date = timestamp.toDate();
  return `truy cập ${date.toLocaleDateString('vi-VN')}`;
}

export function formatChatListTime(timestamp: Timestamp | null): string {
  if (!timestamp || !timestamp.toDate) return '';
  try {
    const date = timestamp.toDate();
    const now = new Date();
  
    // Today
    if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
      return 'Hôm qua';
    }
  
    // Within last 7 days
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays < 7) {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    }
  
    // Older
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(2)}`;
  } catch {
    return '';
  }
}
