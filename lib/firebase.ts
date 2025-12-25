
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase অ্যাপ ইনিশিয়ালাইজ করা
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore ইনিশিয়ালাইজ করা
const db = getFirestore(app);

// সমাধান: অ্যানালিটিক্স শুধুমাত্র ক্লায়েন্ট-সাইডে ইনিশিয়ালাইজ করা
let analytics;
if (typeof window !== "undefined") {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  analytics = getAnalytics(app);
}

export { app, db, analytics };
