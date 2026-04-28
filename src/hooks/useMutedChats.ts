import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTED_CHATS_KEY = '@telegram_muted_chats';

export function useMutedChats() {
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(MUTED_CHATS_KEY).then((stored) => {
      if (stored) {
        try {
          setMutedIds(new Set(JSON.parse(stored)));
        } catch (e) {
          console.warn('Failed to parse muted chats');
        }
      }
    });
  }, []);

  const toggleMute = useCallback(async (convId: string) => {
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) {
        next.delete(convId);
      } else {
        next.add(convId);
      }
      AsyncStorage.setItem(MUTED_CHATS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isMuted = useCallback((convId: string) => {
    return mutedIds.has(convId);
  }, [mutedIds]);

  return { mutedIds, toggleMute, isMuted };
}
