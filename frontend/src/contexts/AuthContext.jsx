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
const USER_FALLBACK_KEY = "learnsmart_user_fallback";
const ADMIN_EMAILS = new Set(["admin.2026@gmail.com"]);

function isAdminEmail(email) {
  return ADMIN_EMAILS.has((email || "").trim().toLowerCase());
}

function withResolvedRole(data, email) {
  if (isAdminEmail(email || data?.email)) {
    return {
      ...data,
      role: "admin",
      questionnaireComplete: true,
    };
  }

  return data;
}

function saveFallbackUserData(data) {
  try {
    sessionStorage.setItem(USER_FALLBACK_KEY, JSON.stringify(data));
  } catch {}
}

function loadFallbackUserData() {
  try {
    const raw = sessionStorage.getItem(USER_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearFallbackUserData() {
  try {
    sessionStorage.removeItem(USER_FALLBACK_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [persistenceReady, setPersistenceReady] = useState(false);

  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).then(() => {
      setPersistenceReady(true);
    });
  }, []);

  useEffect(() => {
    if (!persistenceReady) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserData(null);
        clearFallbackUserData();
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
          const fallback = loadFallbackUserData();
          setUserData(
            withResolvedRole(
              fallback || {
                uid: currentUser.uid,
                name: currentUser.displayName || "",
                email: currentUser.email || "",
                questionnaireComplete: false,
                ab_group: "A",
              },
              currentUser.email
            )
          );
          setLoading(false);
          return;
        }

        setUserData(withResolvedRole(snap.data(), currentUser.email));
        setLoading(false);
      },
      () => {
        const fallback = loadFallbackUserData();
        if (fallback) setUserData(withResolvedRole(fallback, currentUser.email));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [persistenceReady, currentUser]);

  const updateUserData = (newData) => {
    setUserData((prev) => ({ ...prev, ...newData }));
    saveFallbackUserData({ ...(userData || {}), ...newData });
  };

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const abGroup = Math.random() < 0.5 ? "A" : "B";
    const fallbackUser = {
      uid: cred.user.uid,
      name,
      email,
      questionnaireComplete: false,
      ab_group: abGroup,
    };
    const resolvedFallbackUser = withResolvedRole(fallbackUser, email);

    saveFallbackUserData(resolvedFallbackUser);
    setUserData(resolvedFallbackUser);

    try {
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        questionnaireComplete: false,
        createdAt: new Date(),
        ab_group: abGroup,
      });
    } catch (error) {
      console.warn("Firestore registration skipped:", error?.message || error);
    }

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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Erreur backend");
      }
    } catch (error) {
      console.error("Erreur SQLite :", error);
    }

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

    updateUserData({
      name,
      email,
      questionnaireComplete: !isAdminEmail(email) ? false : true,
      role: isAdminEmail(email) ? "admin" : undefined,
      ab_group: abGroup,
    });

    return cred.user;
  };

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = async () => {
    clearFallbackUserData();
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        loading,
        register,
        login,
        logout,
        updateUserData,
        isAdminEmail,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
export const useAuth = () => useContext(AuthContext);
