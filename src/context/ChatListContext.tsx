import React, { createContext, useContext } from 'react';
import { useChatList } from '@/hooks/useChatList';

const ChatListContext = createContext<ReturnType<typeof useChatList> | null>(null);

export function ChatListProvider({ children }: { children: React.ReactNode }) {
  const chatList = useChatList();
  
  return (
    <ChatListContext.Provider value={chatList}>
      {children}
    </ChatListContext.Provider>
  );
}

export function useSharedChatList() {
  const context = useContext(ChatListContext);
  if (!context) {
    throw new Error('useSharedChatList must be used within a ChatListProvider');
  }
  return context;
}
