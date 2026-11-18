import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// True only when the developer has supplied their own Firebase project values in .env.
export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

if (!isFirebaseConfigured) {
  console.warn(
    'ChitFlow: Firebase configuration is missing. Copy .env.example to .env and fill in your own Firebase project values.'
  );
}

// Placeholder values keep the app importable so it can show a setup screen instead of crashing.
const app = getApps().length
  ? getApps()[0]
  : initializeApp(isFirebaseConfigured ? firebaseConfig : { apiKey: 'not-configured', projectId: 'not-configured', appId: 'not-configured' });
export const db = getFirestore(app);
