import { auth, db } from '@/config/firebase';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, getDocs, query, where, collection, serverTimestamp, arrayUnion } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateUserConversationReferences } from '@/services/chatService';

// ======= EMAIL OTP CONFIG =======
const EMAILJS_SERVICE_ID = 'service_qj13lp9';
const EMAILJS_TEMPLATE_ID = 'template_r740ehq';
const EMAILJS_PUBLIC_KEY = 'pwrgr3MCN3kKAiaGw';
// ==================================

// Fixed SMS OTP for emulator testing
const FIXED_SMS_OTP = '123456';

// Storage keys
const AUTH_STORAGE_KEY = '@telegram_auth_user';
const SESSION_KEY = '@telegram_last_active';
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// OTP state
let currentOTP: string | null = null;
let currentEmail: string | null = null;
let currentPhone: string | null = null;
let otpExpiry: number | null = null;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface AppUser {
  uid: string;
  phoneNumber: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

const authStateListeners = new Set<(user: AppUser | null) => void>();

// Generate random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateAppUserId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeUser = (raw: any, fallbackUid?: string): AppUser | null => {
  if (!raw) return null;
  const uid = raw.uid || fallbackUid;
  if (!uid) return null;

  return {
    uid,
    phoneNumber: raw.phoneNumber || '',
    email: raw.email || '',
    displayName: raw.displayName || '',
    photoURL: raw.photoURL || raw.avatarUrl || '',
    avatarUrl: raw.avatarUrl || raw.photoURL || '',
    isOnline: typeof raw.isOnline === 'boolean' ? raw.isOnline : true,
  };
};

async function ensureFirebaseAuthUid(): Promise<string | null> {
  if (!auth) return null;

  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  try {
    const result = await signInAnonymously(auth);
    return result.user.uid;
  } catch (error) {
    console.warn('[AUTH] Anonymous sign-in failed:', error);
    return null;
  }
}

async function migrateLegacyUidIfNeeded(
  legacyUid: string | null,
  canonicalUid: string
): Promise<void> {
  if (!db || !legacyUid || legacyUid === canonicalUid) return;

  try {
    await setDoc(
      doc(db, 'users', canonicalUid),
      {
        uid: canonicalUid,
        legacyUids: arrayUnion(legacyUid),
      },
      { merge: true }
    );

    const result = await migrateUserConversationReferences(legacyUid, canonicalUid);
    console.log(
      `[AUTH] Migrated legacy uid ${legacyUid} -> ${canonicalUid} ` +
      `(conversations=${result.conversationsUpdated}, merged=${result.conversationsMerged}, messages=${result.messagesUpdated})`
    );
  } catch (error) {
    console.warn(`[AUTH] Failed to migrate legacy uid ${legacyUid} -> ${canonicalUid}:`, error);
  }
}

async function persistSessionUser(user: AppUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  await updateLastActive();
  for (const listener of authStateListeners) {
    listener(user);
  }
}

function emitSignedOut() {
  for (const listener of authStateListeners) {
    listener(null);
  }
}

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
      const data = snapshot.docs[0].data();
      console.log(`[DB] User found: uid=${data.uid}, email=${data.email}`);
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
  email: string
): Promise<AppUser> => {
  const canonicalUid = generateAppUserId();
  const legacyUid = await ensureFirebaseAuthUid();

  // Save to Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'users', canonicalUid), {
        uid: canonicalUid,
        phoneNumber,
        email,
        displayName: '',
        photoURL: '',
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        ...(legacyUid && legacyUid !== canonicalUid ? { legacyUids: [legacyUid] } : {}),
      });
      console.log(`[DB] User registered in Firestore: ${canonicalUid}`);
    } catch (e) {
      console.warn('[DB] Failed to save user to Firestore:', e);
    }
  }

  const userData: AppUser = {
    uid: canonicalUid,
    phoneNumber,
    email,
    displayName: '',
    photoURL: '',
    avatarUrl: '',
    isOnline: true,
  };

  await migrateLegacyUidIfNeeded(legacyUid, canonicalUid);

  // Save to AsyncStorage for persistent login
  await persistSessionUser(userData);
  return userData;
};

// Login: update user status in Firestore
export const loginUser = async (phoneNumber: string): Promise<AppUser> => {
  if (!db) throw new Error('Database not available');

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('User not found');
  }

  const userDoc = snapshot.docs[0];
  const canonicalUid = userDoc.id;
  const storedUser = normalizeUser(userDoc.data(), canonicalUid);
  if (!storedUser) {
    throw new Error('User data is invalid');
  }

  const legacyUid = await ensureFirebaseAuthUid();

  // Update online status
  try {
    await setDoc(doc(db, 'users', userDoc.id), {
      uid: canonicalUid,
      isOnline: true,
      lastSeen: serverTimestamp(),
      ...(legacyUid && legacyUid !== canonicalUid ? { legacyUids: arrayUnion(legacyUid) } : {}),
    }, { merge: true });
  } catch (e) {
    console.warn('[DB] Failed to update user status:', e);
  }

  await migrateLegacyUidIfNeeded(legacyUid, canonicalUid);

  const userData: AppUser = {
    ...storedUser,
    uid: canonicalUid,
    isOnline: true,
  };

  // Save to AsyncStorage
  await persistSessionUser(userData);
  console.log(`[AUTH] User logged in: ${userData.uid}`);
  return userData;
};

// ============ LOGOUT & AUTH STATE ============

// Logout
export const signOutUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  await AsyncStorage.removeItem(SESSION_KEY);
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore
    }
  }
  emitSignedOut();
};

// Update last active timestamp (call this when app is active)
export const updateLastActive = async (): Promise<void> => {
  await AsyncStorage.setItem(SESSION_KEY, Date.now().toString());
};

// On auth state change - check session timeout
export const onAuthStateChange = (callback: (user: AppUser | null) => void) => {
  authStateListeners.add(callback);

  const emitStoredUser = async () => {
    try {
      const stores = await AsyncStorage.multiGet([AUTH_STORAGE_KEY, SESSION_KEY]);
      const stored = stores[0][1];
      const lastActive = stores[1][1];

      if (!stored) {
        callback(null);
        return;
      }

      if (lastActive) {
        const elapsed = Date.now() - parseInt(lastActive, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          console.log(`[AUTH] Session expired (${Math.round(elapsed / 1000)}s ago)`);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          await AsyncStorage.removeItem(SESSION_KEY);
          callback(null);
          return;
        }
      }

      const storedUser = normalizeUser(JSON.parse(stored));
      if (!storedUser) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        callback(null);
        return;
      }

      await updateLastActive();
      console.log('[AUTH] Session restored');
      callback(storedUser);
      void migrateLegacyUidIfNeeded(auth?.currentUser?.uid ?? null, storedUser.uid);
    } catch {
      callback(null);
    }
  };

  void emitStoredUser();

  if (!auth) {
    return () => {
      authStateListeners.delete(callback);
    };
  }

  const firebaseAuth = auth;
  const unsubscribeFirebase = onAuthStateChanged(firebaseAuth, async () => {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      callback(null);
      return;
    }

    const storedUser = normalizeUser(JSON.parse(stored));
    if (!storedUser) {
      callback(null);
      return;
    }

    callback(storedUser);
    void migrateLegacyUidIfNeeded(firebaseAuth.currentUser?.uid ?? null, storedUser.uid);
  });

  return () => {
    authStateListeners.delete(callback);
    unsubscribeFirebase();
  };
};
