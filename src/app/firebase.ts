import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // পরিবর্তন হয়েছে

// আপনার ফায়ারবেস কনসোল থেকে এই কনফিগারেশনটি কপি করে এখানে রিপ্লেস করুন
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // getDatabase এর বদলে getFirestore