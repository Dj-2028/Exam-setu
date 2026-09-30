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
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();

  const [role, setRole] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchTokenAndRole() {
      if (!isLoaded) return;

      if (isSignedIn && clerkUser) {
        try {
          const jwtToken = await getToken();
          if (active) {
            setToken(jwtToken);
            // Check metadata claims, fallback to examiner
            const metaRole =
              (clerkUser.publicMetadata?.role as string) ||
              (clerkUser.unsafeMetadata?.role as string) ||
              "examiner";
            setRole(metaRole);
          }
        } catch {
          if (active) {
            setToken(null);
            setRole("examiner");
          }
        }
      } else {
        if (active) {
          setToken(null);
          setRole("");
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
