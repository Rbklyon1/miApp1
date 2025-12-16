import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; 
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjlEwXsjwyF4X8Wxr0BNEOFi2XVwPSjdo",
  authDomain: "workstation-l0ko.firebaseapp.com",
  projectId: "workstation-l0ko",
  storageBucket: "workstation-l0ko.firebasestorage.app",
  messagingSenderId: "582346338085",
  appId: "1:582346338085:web:eea44487fda8ae4632b4cc",
  measurementId: "G-P5CZ6H1V7X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
