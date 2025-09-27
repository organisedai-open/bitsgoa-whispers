// Firebase initialization for the web app
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAG0yclocQgFFZtBGSHS3whx4MaY7om2Oc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bits-cloak.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bits-cloak",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bits-cloak.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "91495503277",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:91495503277:web:783fc9a7d71a11c6fcfd24",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0NN4BVTDR0",
};

export const app: FirebaseApp = initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);


