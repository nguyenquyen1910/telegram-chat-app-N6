import { auth } from '@/config/firebase';
import {
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  ApplicationVerifier,
} from 'firebase/auth';

// ======= MOCK MODE =======
// Set to true khi test trên emulator (reCAPTCHA không hoạt động trên emulator)
// Set to false khi test trên thiết bị thật
const MOCK_MODE = true;
const MOCK_OTP = '123456';
// ==========================

let confirmationResult: ConfirmationResult | null = null;
let mockPhoneNumber: string | null = null;

// Send OTP to phone number
export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier?: ApplicationVerifier
): Promise<void> => {
  if (MOCK_MODE) {
    console.log(`[MOCK] OTP "${MOCK_OTP}" sent to ${phoneNumber}`);
    mockPhoneNumber = phoneNumber;
    return;
  }

  if (!auth) throw new Error('Firebase not initialized');
  if (!recaptchaVerifier) throw new Error('reCAPTCHA verifier required');

  confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    recaptchaVerifier
  );
};

// Verify OTP code
export const verifyOTP = async (code: string): Promise<any> => {
  if (MOCK_MODE) {
    if (code === MOCK_OTP) {
      console.log(`[MOCK] OTP verified for ${mockPhoneNumber}`);
      // Return mock user object
      return { uid: `mock-${Date.now()}`, phoneNumber: mockPhoneNumber };
    }
    throw new Error('Wrong OTP code');
  }

  if (!confirmationResult) throw new Error('No OTP sent. Please resend.');
  const result = await confirmationResult.confirm(code);
  confirmationResult = null;
  return result.user;
};

// Logout
export const signOutUser = async (): Promise<void> => {
  if (!auth) return;
  await firebaseSignOut(auth);
};

// On auth state change
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (MOCK_MODE) {
    // In mock mode, always start as not authenticated
    callback(null);
    return () => {};
  }
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
