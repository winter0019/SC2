
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBUMLkGc9n6x_V-L1I4-vRHy-XW06a0Tb0",
  authDomain: "thsc-bd84a.firebaseapp.com",
  projectId: "thsc-bd84a",
  storageBucket: "thsc-bd84a.firebasestorage.app",
  messagingSenderId: "73320504007",
  appId: "1:73320504007:web:9f7ff5794c23f0df2bfce2",
  measurementId: "G-LXG8HY9RZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
