import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [persistenceReady, setPersistenceReady] = useState(false);

  // 1. Persistance
  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).then(() => {
      setPersistenceReady(true);
    });
  }, []);

  // 2. Écouteur d'état auth
  useEffect(() => {
    if (!persistenceReady) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserData(snap.data());
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [persistenceReady]);

  // 🔥 Nouvelle fonction pour mettre à jour userData localement
  const updateUserData = (newData) => {
    setUserData((prev) => ({ ...prev, ...newData }));
  };

  const register = async (name, email, password) => {
    // 1. Créer le compte Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // 2. Enregistrer dans Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        questionnaireComplete: false,
        createdAt: new Date(),
    });

    // 3. Envoyer au backend SQLite
    try {
        const response = await fetch("http://localhost:5000/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: cred.user.uid,
                name,
                email,
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Erreur backend");
        }
    } catch (error) {
        console.error("Erreur SQLite :", error);
        // Optionnel : ne pas bloquer l’inscription
    }

    // Mise à jour locale
    updateUserData({
        name,
        email,
        questionnaireComplete: false,
    });

    return cred.user;
};

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        register,
        login,
        logout,
        updateUserData,   // ← exposé
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
export const useAuth = () => useContext(AuthContext);