import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVreUmig0_nGtVqUOgekfCgsyfT5mMwr0",
  authDomain: "nova-stream-dae14.firebaseapp.com",
  databaseURL: "https://nova-stream-dae14-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nova-stream-dae14",
  storageBucket: "nova-stream-dae14.firebasestorage.app",
  messagingSenderId: "724122550908",
  appId: "1:724122550908:web:7679e058cc116058643ff9",
  measurementId: "G-8KJZHFY0T1"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
