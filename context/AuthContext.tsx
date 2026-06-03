"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import api from "../lib/api";
import { login as authLogin, logout as authLogout } from "../lib/auth";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

/* ───────────────────────── TYPES ───────────────────────── */

interface AuthContextProps {
  token: string | null;
  role: string | null;
  username: string | null;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<string>;
  loginWithGoogle: () => Promise<string>;
  logout: () => void;
}

/* ───────────────────────── CONTEXT ───────────────────────── */

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

/* ───────────────────────── PROVIDER ───────────────────────── */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const googleProvider = new GoogleAuthProvider();

  /* ─── Restore session ─── */
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    const savedRole = localStorage.getItem("userRole");
    const savedUsername = localStorage.getItem("username");

    if (savedToken) setToken(savedToken);
    if (savedRole) setRole(savedRole);
    if (savedUsername) setUsername(savedUsername);

    setIsLoading(false);
  }, []);

  /* ───────────────────────── LOGIN CLASSIQUE ───────────────────────── */

  const login = async (u: string, p: string): Promise<string> => {
    await authLogin(u, p);

    const t = localStorage.getItem("accessToken");
    setToken(t);

    const res = await api.get("users/me/");
    const userRole = res.data.role;
    const userName = res.data.username;

    setRole(userRole);
    setUsername(userName);

    localStorage.setItem("userRole", userRole);
    localStorage.setItem("username", userName);

    return userRole;
  };

  /* ───────────────────────── GOOGLE LOGIN ───────────────────────── */

  const loginWithGoogle = async (): Promise<string> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 🔥 Firebase token
    const firebaseToken = await user.getIdToken();

    // 🔥 envoyer au backend
    const res = await api.post("auth/google/", {
      token: firebaseToken,
      email: user.email,
      name: user.displayName,
    });

    const accessToken = res.data.access;
    const userRole = res.data.role;
    const userName = res.data.username || user.displayName || "";

    // 🔥 save local
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("userRole", userRole);
    localStorage.setItem("username", userName);

    setToken(accessToken);
    setRole(userRole);
    setUsername(userName);

    return userRole;
  };

  /* ───────────────────────── LOGOUT ───────────────────────── */

  const logout = () => {
    authLogout();

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");

    setToken(null);
    setRole(null);
    setUsername(null);
  };

  /* ───────────────────────── PROVIDER ───────────────────────── */

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        username,
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ───────────────────────── HOOK ───────────────────────── */

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }

  return ctx;
};
