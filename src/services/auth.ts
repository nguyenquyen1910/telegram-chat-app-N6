import { auth } from '@/config/firebase';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';

let confirmationResult: ConfirmationResult | null = null;

// sent otp to phone number
export const sendOTP = async (phoneNumber: string): Promise<void> => {
  if (!auth) throw new Error('Firebase chưa được khởi tạo');

  // RecaptchaVerifier for web (Expo web) - on mobile will need expo-firebase-recaptcha
  const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });

  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

// verify OTP code
export const verifyOTP = async (code: string): Promise<User> => {
  if (!confirmationResult) throw new Error('Chưa gửi OTP. Vui lòng gửi lại.');

  const result = await confirmationResult.confirm(code);
  confirmationResult = null;
  return result.user;
};

// logout
export const signOutUser = async (): Promise<void> => {
  if (!auth) return;
  await firebaseSignOut(auth);
};

// on auth state change
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
