import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface WallpaperOption {
  id: string;
  name: string;
  colors: string[];
  type: 'solid' | 'gradient';
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  {
    id: 'default',
    name: 'Mặc định',
    colors: ['#C8DBBE'],
    type: 'solid',
  },
  {
    id: 'sky_blue',
    name: 'Xanh trời',
    colors: ['#DCEEFB', '#B8DCF8'],
    type: 'gradient',
  },
  {
    id: 'lavender',
    name: 'Tím nhạt',
    colors: ['#E8DEF8', '#D0BCFF'],
    type: 'gradient',
  },
  {
    id: 'peach',
    name: 'Đào',
    colors: ['#FFDECF', '#FFB4A2'],
    type: 'gradient',
  },
  {
    id: 'mint',
    name: 'Bạc hà',
    colors: ['#D0F0E0', '#A8E6CF'],
    type: 'gradient',
  },
  {
    id: 'warm_sand',
    name: 'Cát ấm',
    colors: ['#F5E6D3', '#E8D5B7'],
    type: 'gradient',
  },
  {
    id: 'night',
    name: 'Ban đêm',
    colors: ['#1A1A2E', '#16213E'],
    type: 'gradient',
  },
  {
    id: 'rose',
    name: 'Hồng',
    colors: ['#FFE4EC', '#FFB3C6'],
    type: 'gradient',
  },
  {
    id: 'ocean',
    name: 'Đại dương',
    colors: ['#B8E4F0', '#7EC8E3'],
    type: 'gradient',
  },
];

/**
 * Hook quản lý wallpaper cho cuộc hội thoại
 * Lưu trên Firestore tại conversations/{id}.wallpaperId
 * Khi user A đổi wallpaper, user B cũng thấy real-time
 */
export function useChatWallpaper(conversationId?: string | null) {
  const [currentWallpaperId, setCurrentWallpaperId] = useState('default');

  // Subscribe real-time wallpaper từ Firestore
  useEffect(() => {
    if (!conversationId || !db) return;

    const convRef = doc(db, 'conversations', conversationId);

    const unsubscribe = onSnapshot(convRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.wallpaperId) {
        setCurrentWallpaperId(data.wallpaperId);
      }
    }, (error) => {
      console.warn('[Wallpaper] Subscription error:', error.message);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const currentWallpaper =
    WALLPAPER_OPTIONS.find((w) => w.id === currentWallpaperId) || WALLPAPER_OPTIONS[0];

  // Lưu wallpaper lên Firestore → cả 2 user đều thấy
  const setWallpaper = useCallback(async (id: string) => {
    setCurrentWallpaperId(id); // Optimistic update

    if (!conversationId || !db) return;

    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, { wallpaperId: id });
    } catch (error) {
      console.warn('[Wallpaper] Failed to save:', error);
    }
  }, [conversationId]);

  return {
    currentWallpaper,
    setWallpaper,
    wallpaperOptions: WALLPAPER_OPTIONS,
  };
}
