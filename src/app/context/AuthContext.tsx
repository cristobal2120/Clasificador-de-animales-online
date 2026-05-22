import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import { logout as storeLogout } from "../store/authStore";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUserState(null);
          setLoading(false);
          return;
        }

        const ref = doc(db, "users", fbUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserState(snap.data() as User);
          setLoading(false);
          return;
        }

        const fallback: User = {
          id: fbUser.uid,
          username: fbUser.email?.split("@")[0] ?? "user",
          email: fbUser.email ?? "",
          avatar: "👤",
          createdAt: new Date().toISOString(),
          role: "user",
        };
        await setDoc(ref, fallback);
        setUserState(fallback);
        setLoading(false);
      } catch (e) {
        console.error("[Auth] onAuthStateChanged error", e);
        setUserState(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const setUser = (u: User | null) => setUserState(u);

  const logout = () => {
    void storeLogout();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
