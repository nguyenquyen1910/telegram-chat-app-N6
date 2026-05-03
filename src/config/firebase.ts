import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// check Firebase config
const hasValidConfig = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('your_');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;

if (hasValidConfig) {
  try {
    // Kiểm tra xem app đã khởi tạo trước đó chưa (hot reload / re-render)
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // initializeAuth chỉ gọi được 1 lần, lần sau phải dùng getAuth
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch (authError) {
      // Auth đã khởi tạo trước đó → lấy instance có sẵn
      auth = getAuth(app);
    }

    // getFirestore và getStorage là idempotent (gọi bao nhiêu lần cũng OK)
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);

    console.log('[Firebase] Initialized successfully. Project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
} else {
  console.warn(
    'Firebase: No valid config found. Running in mock mode.\n' +
    'To connect Firebase, create a .env file with your credentials (see .env.example).'
  );
}

export { auth, db, storage, functions };
export default app;
