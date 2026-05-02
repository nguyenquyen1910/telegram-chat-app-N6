import { auth, db } from '@/config/firebase';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, getDocs, query, where, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ======= EMAIL OTP CONFIG =======
const EMAILJS_SERVICE_ID = 'service_qj13lp9';
const EMAILJS_TEMPLATE_ID = 'template_r740ehq';
const EMAILJS_PUBLIC_KEY = 'pwrgr3MCN3kKAiaGw';
// ==================================

// Fixed SMS OTP for emulator testing
const FIXED_SMS_OTP = '123456';

// Storage keys
const AUTH_STORAGE_KEY = '@telegram_auth_user';
const ACCOUNTS_STORAGE_KEY = '@telegram_auth_accounts';
const SESSION_KEY = '@telegram_last_active';
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthUser {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  createdAt?: unknown;
  lastSeen?: unknown;
}

type AuthStateListener = (user: AuthUser | null) => void;
const authStateListeners = new Set<AuthStateListener>();
let cachedAuthUser: AuthUser | null | undefined;

// OTP state
let currentOTP: string | null = null;
let currentEmail: string | null = null;
let currentPhone: string | null = null;
let otpExpiry: number | null = null;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Generate random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateAppUserId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const emitAuthState = (user: AuthUser | null) => {
  cachedAuthUser = user;
  authStateListeners.forEach((listener) => listener(user));
};

// Đọc lại user từ AsyncStorage và notify tất cả listeners (dùng sau khi upload avatar)
export const refreshAuthUser = async (): Promise<void> => {
  const user = await readStoredAuthUser();
  emitAuthState(user);
};

// MULTI-ACCOUNT UTILS
export const getSavedAccounts = async (): Promise<AuthUser[]> => {
  try {
    const stored = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as AuthUser[];
  } catch (e) {
    return [];
  }
};

const saveAccountToArray = async (user: AuthUser) => {
  const accounts = await getSavedAccounts();
  const index = accounts.findIndex(a => a.uid === user.uid);
  if (index !== -1) {
    accounts[index] = user;
  } else {
    accounts.push(user);
  }
  await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
};

export const switchActiveAccount = async (uid: string): Promise<AuthUser | null> => {
  const accounts = await getSavedAccounts();
  const target = accounts.find(a => a.uid === uid);
  if (target) {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
    await updateLastActive();
    emitAuthState(target);
    return target;
  }
  return null;
};

const readStoredAuthUser = async (): Promise<AuthUser | null> => {
  const stores = await AsyncStorage.multiGet([AUTH_STORAGE_KEY, SESSION_KEY]);
  const stored = stores[0][1];
  const lastActive = stores[1][1];

  if (!stored) {
    console.log('[AUTH] No stored session found');
    return null;
  }

  if (lastActive) {
    const elapsed = Date.now() - parseInt(lastActive, 10);
    if (elapsed > SESSION_TIMEOUT_MS) {
      console.log(`[AUTH] Session expired (${Math.round(elapsed / 1000)}s ago)`);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  const userData = JSON.parse(stored) as AuthUser;
  // Make sure it's in the accounts array
  await saveAccountToArray(userData);
  
  await AsyncStorage.setItem(SESSION_KEY, Date.now().toString());
  console.log('[AUTH] User restored in session:', userData.uid);
  return userData;
};

// ============ PHONE CHECK ============

// Check if phone number already exists in Firestore
export const checkPhoneExists = async (phoneNumber: string): Promise<boolean> => {
  if (!db) {
    console.warn('[DB] Firestore not initialized');
    return false;
  }
  try {
    // Ensure we have auth context for Firestore read
    if (auth) {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn('[AUTH] Anonymous sign-in for query failed:', e);
      }
    }

    console.log(`[DB] Checking phone: "${phoneNumber}"`);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    console.log(`[DB] Found ${snapshot.size} users with phone "${phoneNumber}"`);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = snapshot.docs[0].data();
      console.log(`[DB] User found: uid=${docSnap.id}, email=${data.email}`);
    }
    return !snapshot.empty;
  } catch (error) {
    console.error('[DB] Error checking phone:', error);
    return false;
  }
};

// Get user email by phone number from Firestore
export const getEmailByPhone = async (phoneNumber: string): Promise<string | null> => {
  if (!db) return null;
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const userData = snapshot.docs[0].data();
    return userData.email || null;
  } catch (error) {
    console.error('[DB] Error getting email:', error);
    return null;
  }
};

// ============ EMAIL OTP ============

// Send OTP to email via EmailJS REST API
export const sendEmailOTP = async (
  email: string,
  phoneNumber: string
): Promise<{ otp: string; emailSent: boolean }> => {
  const otp = generateOTP();
  currentOTP = otp;
  currentEmail = email;
  currentPhone = phoneNumber;
  otpExpiry = Date.now() + OTP_EXPIRY_MS;

  console.log(`[OTP] Code "${otp}" generated for email: ${email}`);

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'http://localhost',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          otp_code: otp,
          phone_number: phoneNumber,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EMAIL] Error ${response.status}: ${errorText}`);
      return { otp, emailSent: false };
    }

    console.log(`[EMAIL] OTP sent successfully to ${email}`);
    return { otp, emailSent: true };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send OTP:', error);
    return { otp, emailSent: false };
  }
};

// Verify Email OTP code (does NOT save user - used for both register & login)
export const verifyEmailOTP = async (code: string): Promise<boolean> => {
  if (!currentOTP || !otpExpiry) {
    throw new Error('No OTP sent. Please request a new code.');
  }
  if (Date.now() > otpExpiry) {
    currentOTP = null;
    otpExpiry = null;
    throw new Error('OTP expired. Please request a new code.');
  }
  if (code !== currentOTP) {
    throw new Error('Wrong OTP code');
  }
  // OTP correct - clear it
  currentOTP = null;
  otpExpiry = null;
  return true;
};

// Resend OTP to email
export const resendEmailOTP = async (): Promise<void> => {
  if (!currentEmail || !currentPhone) {
    throw new Error('No email found. Please start over.');
  }
  await sendEmailOTP(currentEmail, currentPhone);
};

// ============ SMS OTP (Fixed for emulator) ============

// Verify SMS OTP - fixed code "123456" for emulator
export const verifySmsOTP = async (code: string): Promise<boolean> => {
  if (code !== FIXED_SMS_OTP) {
    throw new Error('Wrong SMS code');
  }
  return true;
};

// ============ REGISTER & LOGIN ============

// Register: save new user to Firestore after all verifications
export const registerUser = async (
  phoneNumber: string,
  email: string,
  displayName: string = ''
): Promise<any> => {
  const uid = generateAppUserId();
  const userData = {
    uid,
    phoneNumber,
    email,
    displayName,
    createdAt: new Date().toISOString(),
  };

  // Keep Firebase anonymous auth only for Firestore access.
  // App identity must stay on our own uid to avoid cross-account collisions.
  if (auth) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('[AUTH] Firebase anonymous sign-in failed, using local auth');
    }
  }

  // Save to Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        phoneNumber,
        email,
        displayName,
        photoURL: '',
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      console.log(`[DB] User registered in Firestore: ${uid}`);
    } catch (e) {
      console.warn('[DB] Failed to save user to Firestore:', e);
    }
  }

  // Save to AsyncStorage for persistent login
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  await saveAccountToArray(userData as AuthUser);
  await updateLastActive();
  emitAuthState(userData as AuthUser);
  return userData;
};

// Login: update user status in Firestore
export const loginUser = async (phoneNumber: string): Promise<any> => {
  if (!db) throw new Error('Database not available');

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('User not found');
  }

  const userDoc = snapshot.docs[0];
  const rawUserData = userDoc.data() as Record<string, any>;
  const userData = {
    ...rawUserData,
    uid: userDoc.id,
  };

  // Update online status
  try {
    await setDoc(doc(db, 'users', userDoc.id), {
      isOnline: true,
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('[DB] Failed to update user status:', e);
  }

  if (rawUserData.uid !== userDoc.id) {
    try {
      await setDoc(
        doc(db, 'users', userDoc.id),
        { uid: userDoc.id },
        { merge: true }
      );
      console.log(`[DB] Normalized user uid field for phone ${phoneNumber}: ${userDoc.id}`);
    } catch (e) {
      console.warn('[DB] Failed to normalize user uid field:', e);
    }
  }

  // Try Firebase anonymous sign-in
  if (auth) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('[AUTH] Firebase sign-in failed');
    }
  }

  // Save to AsyncStorage
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  await saveAccountToArray(userData as AuthUser);
  await updateLastActive();
  console.log(`[AUTH] User logged in: ${userData.uid}`);
  emitAuthState(userData as AuthUser);
  return userData;
};

// ============ CHANGE PHONE NUMBER ============

/**
 * Cập nhật số điện thoại mới trong Firestore + AsyncStorage.
 * Gọi sau khi OTP đã được xác minh thành công.
 */
export const changePhoneNumber = async (
  uid: string,
  newPhone: string
): Promise<void> => {
  // 1. Cập nhật Firestore
  if (db) {
    try {
      await updateDoc(doc(db, 'users', uid), { phoneNumber: newPhone });
      console.log(`[DB] Phone updated for ${uid}: ${newPhone}`);
    } catch (e) {
      console.warn('[DB] Failed to update phone in Firestore:', e);
    }
  }

  // 2. Cập nhật AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const userData = JSON.parse(stored) as AuthUser;
      const updated = { ...userData, phoneNumber: newPhone };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      await saveAccountToArray(updated);
      emitAuthState(updated);
    }
  } catch (e) {
    console.warn('[AUTH] Failed to update phone in AsyncStorage:', e);
  }
};

/**
 * Cập nhật tên hiển thị trong Firestore + AsyncStorage.
 */
export const changeDisplayName = async (
  uid: string,
  newDisplayName: string
): Promise<void> => {
  if (db) {
    try {
      await updateDoc(doc(db, 'users', uid), { displayName: newDisplayName });
    } catch (e) {
      console.warn('[DB] Failed to update displayName in Firestore:', e);
    }
  }

  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const userData = JSON.parse(stored) as AuthUser;
      const updated = { ...userData, displayName: newDisplayName };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      await saveAccountToArray(updated);
      emitAuthState(updated);
    }
  } catch (e) {
    console.warn('[AUTH] Failed to update displayName in AsyncStorage:', e);
  }
};

// ============ LOGOUT & AUTH STATE ============

// Logout: Remove active user. If there are other accounts, switch to the first one. Otherwise completely sign out.
export const signOutUser = async (): Promise<boolean> => {
  const currentStore = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!currentStore) return false;
  
  const currentUser = JSON.parse(currentStore) as AuthUser;
  let accounts = await getSavedAccounts();
  accounts = accounts.filter(a => a.uid !== currentUser.uid);
  
  await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  
  if (accounts.length > 0) {
    // Has other accounts -> switch to the first one
    const nextAccount = accounts[0];
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAccount));
    emitAuthState(nextAccount);
    return true; // Still authenticated
  } else {
    // No more accounts -> full logout
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(SESSION_KEY);
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // Ignore
      }
    }
    emitAuthState(null);
    return false; // Logged out
  }
};

// Update last active timestamp (call this when app is active)
export const updateLastActive = async (): Promise<void> => {
  await AsyncStorage.setItem(SESSION_KEY, Date.now().toString());
};

// On auth state change - check session timeout
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  let isActive = true;
  authStateListeners.add(callback);

  if (cachedAuthUser !== undefined) {
    callback(cachedAuthUser);
  } else {
    readStoredAuthUser()
      .then((user) => {
        cachedAuthUser = user;
        if (isActive) {
          callback(user);
        }
      })
      .catch((error) => {
        console.warn('[AUTH] Failed to restore session:', error);
        cachedAuthUser = null;
        if (isActive) {
          callback(null);
        }
      });
  }

  const unsubscribeFirebase = auth
    ? onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          console.log('[AUTH] Firebase anonymous session active:', firebaseUser.uid);
        }
      })
    : () => {};

  return () => {
    isActive = false;
    authStateListeners.delete(callback);
    unsubscribeFirebase();
  };
};