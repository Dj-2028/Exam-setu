"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  firebaseSignOut,
  type User,
} from "@/lib/auth/firebase";

// ── Types ──

type AuthState = "loading" | "signedIn" | "signedOut";

interface AuthContextValue {
  user: User | null;
  role: string;
  state: AuthState;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    // If Firebase is not initialized (e.g. during SSR or missing env vars),
    // immediately set state to signedOut so the UI can render.
    if (!auth) {
      setState("signedOut");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        setUser(firebaseUser);
        setRole((idTokenResult.claims.role as string) || "");
        setToken(idTokenResult.token);
        setState("signedIn");
      } else {
        setUser(null);
        setRole("");
        setToken(null);
        setState("signedOut");
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, state, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
