"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  useUser,
  useAuth as useClerkAuth,
  useClerk,
} from "@clerk/nextjs";
import { api } from "@/lib/api/client";

// ── Types ──

export type AuthState = "loading" | "signedIn" | "signedOut";

export interface UserContextData {
  uid: string;
  id: string;
  email: string;
  name: string;
}

export interface AuthContextValue {
  user: UserContextData | null;
  role: string;
  state: AuthState;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setDevRole: (newRole: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();

  const [role, setRoleState] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const setDevRole = (newRole: string) => {
    try {
      localStorage.setItem("dev_role_override", newRole);
    } catch {
      // Ignore storage errors
    }
    setRoleState(newRole);
  };

  useEffect(() => {
    let active = true;

    async function fetchTokenAndRole() {
      if (!isLoaded) return;

      if (isSignedIn && clerkUser) {
        try {
          const jwtToken = await getToken();
          if (!active) return;
          setToken(jwtToken);

          // 1. Check local dev role override first
          const localOverride = typeof window !== "undefined" ? localStorage.getItem("dev_role_override") : null;
          if (localOverride && ["examiner", "controller", "admin"].includes(localOverride)) {
            setRoleState(localOverride);
            return;
          }

          // 2. Fetch backend profile from FastAPI /users/me
          try {
            const profile = await api.get<{ role: string }>("/users/me");
            if (active && profile?.role) {
              setRoleState(profile.role);
              return;
            }
          } catch {
            // If API fails or user not created yet, fallback
          }

          // 3. Fallback to Clerk metadata or default admin/examiner
          const metaRole =
            (clerkUser.publicMetadata?.role as string) ||
            (clerkUser.unsafeMetadata?.role as string) ||
            "admin"; // Default to admin for seamless navigation in dev
          
          if (active) {
            setRoleState(metaRole);
          }
        } catch {
          if (active) {
            setToken(null);
            setRoleState("admin");
          }
        }
      } else {
        if (active) {
          setToken(null);
          setRoleState("");
        }
      }
    }

    fetchTokenAndRole();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  const state: AuthState = !isLoaded
    ? "loading"
    : isSignedIn
    ? "signedIn"
    : "signedOut";

  const signIn = async (email: string, password: string) => {
    if (!clerk.client) {
      throw new Error("Clerk authentication is initializing.");
    }
    const result = await clerk.client.signIn.create({
      identifier: email,
      password,
    });
    if (result.status === "complete" && result.createdSessionId) {
      await clerk.setActive({ session: result.createdSessionId });
    } else {
      throw new Error(`Sign-in incomplete: status ${result.status}`);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem("dev_role_override");
    } catch {
      // Ignore
    }
    await clerk.signOut();
  };

  const user: UserContextData | null = clerkUser
    ? {
        uid: clerkUser.id,
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName || "",
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        state,
        token,
        signIn,
        signOut,
        setDevRole,
      }}
    >
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
