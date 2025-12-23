import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyD_-9XF6N6XHvN4Izf1jTw259hZCaKEwg0",
    authDomain: "nova-stream-dae14.firebaseapp.com",
    databaseURL: "https://nova-stream-dae14-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nova-stream-dae14",
    storageBucket: "nova-stream-dae14.firebasestorage.app",
    messagingSenderId: "724122550908",
    appId: "1:724122550908:web:57db597b5f5deae5643ff9",
    measurementId: "G-BGSP3M2XRQ"
};

// অ্যাপ ইনিশিয়ালাইজ (যাতে বারবার ক্র্যাশ না করে)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

// Analytics ফিক্স (শুধুমাত্র ব্রাউজারে রান করবে)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, analytics };
