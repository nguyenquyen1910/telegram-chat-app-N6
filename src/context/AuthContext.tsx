import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthUser, onAuthStateChange, signOutUser, updateLastActive, refreshAuthUser } from '@/services/auth';
import { updateUserStatus } from '@/services/userService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerifying: boolean;
  setIsVerifying: (v: boolean) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateAvatarUrl: (url: string | null) => void;
  updatePhoneNumber: (phone: string) => void;
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
  updatePhoneNumber: () => {},
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

  // Set ONLINE when user first mounts (app just opened)
  useEffect(() => {
    if (user) {
      updateUserStatus(user.uid, true).catch(console.warn);
    }
  }, [user]);

  // Update online status when app becomes active or goes to background
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (user) {
        if (nextState === 'active') {
          // App came to foreground → set ONLINE
          updateUserStatus(user.uid, true).catch(console.warn);
          updateLastActive();
        } else if (appState.current === 'active' && nextState.match(/inactive|background/)) {
          // App going to background → set OFFLINE
          updateUserStatus(user.uid, false).catch(console.warn);
          updateLastActive();
        }
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user]);

  // Heartbeat: update every 50s while app is active (< 90s offline threshold)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      updateUserStatus(user.uid, true).catch(console.warn);
      updateLastActive();
    }, 50 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const logout = async () => {
    // Set OFFLINE before signing out
    if (user) {
      await updateUserStatus(user.uid, false).catch(console.warn);
    }
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

  // Cập nhật số điện thoại trong AuthContext ngay lập tức
  const updatePhoneNumber = (phone: string) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, phoneNumber: phone };
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
        updatePhoneNumber,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);