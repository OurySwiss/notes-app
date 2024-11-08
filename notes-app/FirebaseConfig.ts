import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBFUQX8ka6yT4ccacvPbvJX_nB3rQBniHU",
  authDomain: "notes-app-ae9ba.firebaseapp.com",
  projectId: "notes-app-ae9ba",
  storageBucket: "notes-app-ae9ba.firebasestorage.app",
  messagingSenderId: "1091549250607",
  appId: "1:1091549250607:web:384fe64ca89ed5f173b2da",
  measurementId: "G-92NP8NEMT0"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);
