import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthUser, onAuthStateChange, signOutUser, updateLastActive, refreshAuthUser, getSavedAccounts, switchActiveAccount } from '@/services/auth';
import { updateUserStatus } from '@/services/userService';

interface AuthContextType {
  user: AuthUser | null;
  accounts: AuthUser[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerifying: boolean;
  setIsVerifying: (v: boolean) => void;
  isAddingAccount: boolean;
  setAddingAccount: (v: boolean) => void;
  logout: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  updateAvatarUrl: (url: string | null) => void;
  updatePhoneNumber: (phone: string) => void;
  switchAccount: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accounts: [],
  isLoading: true,
  isAuthenticated: false,
  isVerifying: false,
  setIsVerifying: () => {},
  isAddingAccount: false,
  setAddingAccount: () => {},
  logout: async () => false,
  refreshUser: async () => {},
  updateAvatarUrl: () => {},
  updatePhoneNumber: () => {},
  switchAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAddingAccount, setAddingAccount] = useState(false);
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

  // Reload accounts list whenever current user changes
  useEffect(() => {
    getSavedAccounts().then(setAccounts).catch(console.warn);
  }, [user]);

  const logout = async (): Promise<boolean> => {
    // Set OFFLINE before signing out
    if (user) {
      await updateUserStatus(user.uid, false).catch(console.warn);
    }
    const hasOtherAccount = await signOutUser();
    if (!hasOtherAccount) {
      setUser(null);
    }
    return hasOtherAccount;
  };

  const refreshUser = async () => {
    await refreshAuthUser();
  };

  const updateAvatarUrl = (url: string | null) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, avatarUrl: url ?? '', photoURL: url ?? '' };
    });
  };

  const updatePhoneNumber = (phone: string) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, phoneNumber: phone };
    });
  };

  const switchAccount = async (uid: string) => {
    if (user?.uid === uid) return;
    await switchActiveAccount(uid);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accounts,
        isLoading,
        isAuthenticated: !!user,
        isVerifying,
        setIsVerifying,
        isAddingAccount,
        setAddingAccount,
        logout,
        refreshUser,
        updateAvatarUrl,
        updatePhoneNumber,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);