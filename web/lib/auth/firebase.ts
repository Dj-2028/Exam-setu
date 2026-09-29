/**
 * Firebase client configuration for the frontend.
 *
 * Guards against missing env vars during Next.js prerendering (SSR/SSG).
 * Firebase is only initialized in the browser when env vars are present.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
};

// Only initialize Firebase if we have an API key and we're in the browser
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (
  typeof window !== "undefined" &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== ""
) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

export { auth, signInWithEmailAndPassword, firebaseSignOut, onAuthStateChanged };
export type { User };
