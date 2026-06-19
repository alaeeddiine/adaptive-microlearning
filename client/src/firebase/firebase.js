import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8Yz2PJvWDKALpV14-7zLr5W-OgQikojI",
  authDomain: "adaptive-microlearning.firebaseapp.com",
  projectId: "adaptive-microlearning",
  storageBucket: "adaptive-microlearning.firebasestorage.app",
  messagingSenderId: "301717409483",
  appId: "1:301717409483:web:79b4a956938e5425fc154e",
  measurementId: "G-FQR2NGNW5K"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
// On applique la persistance "session" uniquement
setPersistence(auth, browserSessionPersistence);

const db = getFirestore(app);

export { auth, db };