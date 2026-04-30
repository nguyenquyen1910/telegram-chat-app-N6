import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthUser, onAuthStateChange, signOutUser, updateLastActive, refreshAuthUser } from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerifying: boolean;
  setIsVerifying: (v: boolean) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateAvatarUrl: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isVerifying: false,
  setIsVerifying: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateAvatarUrl: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      console.log('[AuthContext] Auth state changed:', firebaseUser ? `uid=${(firebaseUser as any).uid}` : 'null');
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // Update lastActive when app becomes active or goes to background
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (user) {
        if (nextState === 'active') {
          // App came to foreground → update lastActive
          updateLastActive();
        } else if (appState.current === 'active' && nextState.match(/inactive|background/)) {
          // App going to background → save lastActive timestamp
          updateLastActive();
        }
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user]);

  // Periodic update every 60s while app is active
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      updateLastActive();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  const refreshUser = async () => {
    await refreshAuthUser();
  };

  // Cập nhật avatarUrl trong AuthContext ngay lập tức (không cần đọc lại AsyncStorage)
  const updateAvatarUrl = (url: string | null) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, avatarUrl: url ?? '', photoURL: url ?? '' };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isVerifying,
        setIsVerifying,
        logout,
        refreshUser,
        updateAvatarUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);