import { auth, db } from '@/config/firebase';
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ======= EMAIL OTP CONFIG =======
// Dùng EmailJS để gửi OTP về email (miễn phí, không cần backend)
// Đăng ký tại https://www.emailjs.com/ để lấy các key bên dưới
const EMAILJS_SERVICE_ID = 'service_qj13lp9';
const EMAILJS_TEMPLATE_ID = 'template_r740ehq';
const EMAILJS_PUBLIC_KEY = 'pwrgr3MCN3kKAiaGw';
// ==================================

// Storage keys
const AUTH_STORAGE_KEY = '@telegram_auth_user';

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

  // Gửi email thật qua EmailJS API
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
      // Email failed but OTP is still valid - return it so UI can show it
      return { otp, emailSent: false };
    }

    console.log(`[EMAIL] OTP sent successfully to ${email}`);
    return { otp, emailSent: true };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send OTP:', error);
    // Email failed but OTP is still valid - return it so UI can show it
    return { otp, emailSent: false };
  }
};

// Verify OTP code
export const verifyEmailOTP = async (code: string): Promise<any> => {
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

  // OTP correct!
  const uid = `user-${Date.now()}`;
  const userData = {
    uid,
    phoneNumber: currentPhone,
    email: currentEmail,
    createdAt: new Date().toISOString(),
  };

  // Save to AsyncStorage for persistent login
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));

  // Clear OTP state
  currentOTP = null;
  otpExpiry = null;

  // Try Firebase anonymous sign-in for Firebase features
  let finalUid = uid;
  if (auth) {
    try {
      const result = await signInAnonymously(auth);
      finalUid = result.user.uid;
      // Update userData with Firebase UID
      userData.uid = finalUid;
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn('[AUTH] Firebase anonymous sign-in failed, using local auth');
    }
  }

  // Save user to Firestore database
  if (db) {
    try {
      await setDoc(doc(db, 'users', finalUid), {
        uid: finalUid,
        phoneNumber: currentPhone,
        email: currentEmail,
        displayName: '',
        photoURL: '',
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      console.log(`[DB] User saved to Firestore: ${finalUid}`);
    } catch (e) {
      console.warn('[DB] Failed to save user to Firestore:', e);
    }
  }

  return userData;
};

// Resend OTP to email
export const resendEmailOTP = async (): Promise<void> => {
  if (!currentEmail || !currentPhone) {
    throw new Error('No email found. Please start over.');
  }
  await sendEmailOTP(currentEmail, currentPhone);
};

// Logout
export const signOutUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore
    }
  }
};

// On auth state change - check AsyncStorage first
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  // Check AsyncStorage for saved user
  AsyncStorage.getItem(AUTH_STORAGE_KEY).then((stored) => {
    if (stored) {
      const userData = JSON.parse(stored);
      callback(userData as any);
    } else if (auth) {
      // Fallback to Firebase auth state
      onAuthStateChanged(auth, callback);
    } else {
      callback(null);
    }
  }).catch(() => {
    callback(null);
  });

  // Return unsubscribe
  if (auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      // Only update if we don't have local auth
      AsyncStorage.getItem(AUTH_STORAGE_KEY).then((stored) => {
        if (!stored) {
          callback(firebaseUser);
        }
      });
    });
  }

  return () => {};
};
