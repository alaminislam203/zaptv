import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyD_-9XF6N6XHvN4Izf1jTw259hZCaKEwg0",
    authDomain: "nova-stream-dae14.firebaseapp.com",
    databaseURL: "https://nova-stream-dae14-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nova-stream-dae14",
    storageBucket: "nova-stream-dae14.appspot.com",
    messagingSenderId: "724122550908",
    appId: "1:724122550908:web:57db597b5f5deae5643ff9",
    measurementId: "G-BGSP3M2XRQ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the necessary Firebase services
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics (Fixed Logic)
let analytics: any;

if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { analytics };
