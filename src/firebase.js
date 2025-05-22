import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfQWiUkijiocbDFZ5z1YgIJ65ToL92yGM",
  authDomain: "project-cost-tracker-ecd7a.firebaseapp.com",
  projectId: "project-cost-tracker-ecd7a",
  storageBucket: "project-cost-tracker-ecd7a.firebasestorage.app",
  messagingSenderId: "417546942454",
  appId: "1:417546942454:web:4da01aaad381d9757439d7",
  measurementId: "G-ERNQRQP94L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };