import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";

// Each signed-in user gets one Firestore document per data key, at
// users/{uid}/data/{key} — e.g. "investments", "budget", "firstHome".
function docRef(uid, key) {
  return doc(db, "users", uid, "data", key);
}

export async function loadCloudBlob(uid, key) {
  const snap = await getDoc(docRef(uid, key));
  return snap.exists() ? snap.data().value : null;
}

export async function saveCloudBlob(uid, key, value) {
  await setDoc(docRef(uid, key), { value, updatedAt: Date.now() });
}

export function loadLocalBlob(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveLocalBlob(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded cases — safe to ignore.
  }
}
