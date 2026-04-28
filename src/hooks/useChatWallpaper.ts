import { useState, useCallback } from 'react';

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

export function useChatWallpaper() {
  const [currentWallpaperId, setCurrentWallpaperId] = useState('default');

  const currentWallpaper =
    WALLPAPER_OPTIONS.find((w) => w.id === currentWallpaperId) || WALLPAPER_OPTIONS[0];

  const setWallpaper = useCallback((id: string) => {
    setCurrentWallpaperId(id);
  }, []);

  return {
    currentWallpaper,
    setWallpaper,
    wallpaperOptions: WALLPAPER_OPTIONS,
  };
}
