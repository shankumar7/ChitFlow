import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7yjfht3yU8ZQS2Y_crw5vbTF5eIobBPw",
  authDomain: "notebook168.firebaseapp.com",
  projectId: "notebook168",
  storageBucket: "notebook168.firebasestorage.app",
  messagingSenderId: "965830928139",
  appId: "1:965830928139:web:1e35849e35b433bd10640e",
  measurementId: "G-1DP7QTLGGG"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
