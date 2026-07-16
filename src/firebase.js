import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True once real Firebase config has been dropped into .env — lets the rest of
// the app fail soft (fall back to local-only storage) instead of crashing when
// someone runs the dev server before setting up a Firebase project.
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = firebaseReady ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
// Firestore's default streaming transport (WebChannel/gRPC-Web) hangs indefinitely
// behind some proxies and sandboxed dev environments — long-polling is the
// documented workaround and works everywhere the default transport does.
export const db = app ? initializeFirestore(app, { experimentalForceLongPolling: true }) : null;
export const googleProvider = new GoogleAuthProvider();
