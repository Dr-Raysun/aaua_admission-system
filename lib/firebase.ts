// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfkWA3YrwQmZjekkhJ1bcwhGBNBZywupk",
  authDomain: "aaua-admission.firebaseapp.com",
  projectId: "aaua-admission",
  storageBucket: "aaua-admission.firebasestorage.app",
  messagingSenderId: "405316103274",
  appId: "1:405316103274:web:40e483cff342fc01f56e13",
  measurementId: "G-RLDER9FE21",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
