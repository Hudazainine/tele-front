import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRA5jdavYpmfirguKwcuAQELcQWlsQ0OU",
  authDomain: "pfe26-a4dfd.firebaseapp.com",
  projectId: "pfe26-a4dfd",
  storageBucket: "pfe26-a4dfd.firebasestorage.app",
  messagingSenderId: "247514512359",
  appId: "1:247514512359:web:d1028eb7a7c941aa9fdb42",
  measurementId: "G-XFK73G8864",
};

// Initialize Firebase (safe for Next.js hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth export
export const auth = getAuth(app);
