import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-7fae2.firebaseapp.com",
  projectId: "reactchat-7fae2",
  storageBucket: "reactchat-7fae2.firebasestorage.app",
  messagingSenderId: "785488464228",
  appId: "1:785488464228:web:ad0850cc2d4675a7fed271",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
