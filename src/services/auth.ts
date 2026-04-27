import { auth, db } from '@/config/firebase';
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, getDocs, query, where, collection, serverTimestamp } from 'firebase/firestore';
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
const SESSION_KEY = '@telegram_last_active';
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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
): Promise<any> => {
  const uid = `user-${Date.now()}`;
  const userData = {
    uid,
    phoneNumber,
    email,
    createdAt: new Date().toISOString(),
  };

  // Try Firebase anonymous sign-in
  let finalUid = uid;
  if (auth) {
    try {
      const result = await signInAnonymously(auth);
      finalUid = result.user.uid;
      userData.uid = finalUid;
    } catch (e) {
      console.warn('[AUTH] Firebase anonymous sign-in failed, using local auth');
    }
  }

  // Save to Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'users', finalUid), {
        uid: finalUid,
        phoneNumber,
        email,
        displayName: '',
        photoURL: '',
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      console.log(`[DB] User registered in Firestore: ${finalUid}`);
    } catch (e) {
      console.warn('[DB] Failed to save user to Firestore:', e);
    }
  }

  // Save to AsyncStorage for persistent login
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  await updateLastActive();
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
  const userData = userDoc.data();

  // Update online status
  try {
    await setDoc(doc(db, 'users', userDoc.id), {
      isOnline: true,
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('[DB] Failed to update user status:', e);
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
  await updateLastActive();
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
};

// Update last active timestamp (call this when app is active)
export const updateLastActive = async (): Promise<void> => {
  await AsyncStorage.setItem(SESSION_KEY, Date.now().toString());
};

// On auth state change - check session timeout
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  AsyncStorage.multiGet([AUTH_STORAGE_KEY, SESSION_KEY]).then((stores) => {
    const stored = stores[0][1];
    const lastActive = stores[1][1];

    if (stored) {
      // Check session timeout
      if (lastActive) {
        const elapsed = Date.now() - parseInt(lastActive, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          // Session expired → clear and require re-login
          console.log(`[AUTH] Session expired (${Math.round(elapsed / 1000)}s ago)`);
          AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          AsyncStorage.removeItem(SESSION_KEY);
          callback(null);
          return;
        }
      }
      // Session valid → restore user
      const userData = JSON.parse(stored);
      // Update last active
      AsyncStorage.setItem(SESSION_KEY, Date.now().toString());
      console.log('[AUTH] Session restored');
      callback(userData as any);
    } else if (auth) {
      onAuthStateChanged(auth, callback);
    } else {
      callback(null);
    }
  }).catch(() => {
    callback(null);
  });

  if (auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      AsyncStorage.getItem(AUTH_STORAGE_KEY).then((stored) => {
        if (!stored) {
          callback(firebaseUser);
        }
      });
    });
  }

  return () => {};
};
