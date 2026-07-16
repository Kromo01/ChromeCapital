import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, firebaseReady } from "../firebase.js";

const AuthContext = createContext(null);

// Firebase's auth error codes, translated into copy a user can act on.
function friendlyAuthError(err) {
  const code = err?.code || "";
  const map = {
    "auth/email-already-in-use": "An account already exists with that email — try logging in instead.",
    "auth/invalid-email": "That doesn't look like a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup — allow popups for this site and try again.",
    "auth/network-request-failed": "Network error — check your connection and try again.",
    "auth/unauthorized-domain": "This domain isn't yet approved for sign-in — add it under Firebase Console → Authentication → Settings → Authorized domains.",
  };
  return map[code] || "Something went wrong — please try again.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const requireFirebase = () => {
    if (!firebaseReady) {
      throw new Error(
        "Accounts aren't set up yet — add your Firebase project config to .env, then restart the dev server."
      );
    }
  };

  const signUp = async (email, password, displayName) => {
    requireFirebase();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
      return cred.user;
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  const logIn = async (email, password) => {
    requireFirebase();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  const logInWithGoogle = async () => {
    requireFirebase();
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return cred.user;
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  const logOut = async () => {
    requireFirebase();
    await signOut(auth);
  };

  const resetPassword = async (email) => {
    requireFirebase();
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  const value = { user, authLoading, firebaseReady, signUp, logIn, logInWithGoogle, logOut, resetPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
