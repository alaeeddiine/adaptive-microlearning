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
import { doc, onSnapshot, setDoc } from "firebase/firestore";
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
      } else {
        setCurrentUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [persistenceReady]);

  useEffect(() => {
    if (!persistenceReady || !currentUser) return;

    const ref = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          await signOut(auth).catch(() => {});
          setCurrentUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }

        setUserData(snap.data());
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [persistenceReady, currentUser]);

  // 🔥 Nouvelle fonction pour mettre à jour userData localement
  const updateUserData = (newData) => {
    setUserData((prev) => ({ ...prev, ...newData }));
  };

  const register = async (name, email, password) => {
    // 1. Créer le compte Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // 2. Assigner un groupe A/B avant toute utilisation
    const abGroup = Math.random() < 0.5 ? "A" : "B";

    // 3. Enregistrer dans Firestore (avec ab_group)
    await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        questionnaireComplete: false,
        createdAt: new Date(),
        ab_group: abGroup,
    });

    // 4. Envoyer au backend SQLite (avec ab_group)
    try {
        const response = await fetch("http://localhost:5000/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: cred.user.uid,
                name,
                email,
                ab_group: abGroup,
            }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Erreur backend");
        }
    } catch (error) {
        console.error("Erreur SQLite :", error);
    }

    // 5. Notification de bienvenue
    try {
        await fetch("http://localhost:5000/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: cred.user.uid,
                message: "🎉 Bienvenue sur LearnSmart ! Nous sommes ravis de vous compter parmi nous.",
                type: "welcome",
            }),
        });
    } catch (error) {
        console.error("Erreur notification de bienvenue :", error);
    }

    // 6. Mise à jour locale du contexte
    updateUserData({
        name,
        email,
        questionnaireComplete: false,
        ab_group: abGroup,
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
