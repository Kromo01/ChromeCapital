import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { loadCloudBlob, saveCloudBlob, loadLocalBlob, saveLocalBlob } from "../data/cloudStore.js";

const SAVE_DEBOUNCE_MS = 700;

// Drop-in replacement for useState that persists to localStorage for guests,
// and to the signed-in user's Firestore document once they're logged in —
// so investment scenarios, budget data and first-home numbers follow the
// account across devices instead of living only in one browser.
//
// On login: if the account already has cloud data for this key, it replaces
// whatever's currently on screen (the account's saved data wins). If the
// account has nothing saved yet, whatever the guest had built locally gets
// pushed up so it isn't lost.
export function useSyncedState(storageKey, defaultValue) {
  const { user, firebaseReady } = useAuth();
  const [state, setState] = useState(() => loadLocalBlob(storageKey, defaultValue));
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("idle"); // idle | syncing | synced | error
  const saveTimer = useRef(null);
  const skipNextCloudPush = useRef(false);

  const uid = firebaseReady ? user?.uid : null;

  // Pull (or seed) cloud data whenever the signed-in user changes.
  useEffect(() => {
    if (!uid) {
      setCloudSynced(false);
      setCloudStatus("idle");
      return;
    }
    let cancelled = false;
    setCloudStatus("syncing");
    (async () => {
      try {
        const cloudValue = await loadCloudBlob(uid, storageKey);
        if (cancelled) return;
        if (cloudValue !== null && cloudValue !== undefined) {
          skipNextCloudPush.current = true;
          setState(cloudValue);
        } else {
          await saveCloudBlob(uid, storageKey, state);
        }
        setCloudSynced(true);
        setCloudStatus("synced");
      } catch {
        if (!cancelled) setCloudStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, storageKey]);

  // Persist on every change: always cache locally, and push to the cloud
  // once the initial pull/seed above has finished.
  useEffect(() => {
    saveLocalBlob(storageKey, state);

    if (!uid || !cloudSynced) return;
    if (skipNextCloudPush.current) {
      skipNextCloudPush.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setCloudStatus("syncing");
      saveCloudBlob(uid, storageKey, state)
        .then(() => setCloudStatus("synced"))
        .catch(() => setCloudStatus("error"));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, uid, cloudSynced, storageKey]);

  return [state, setState, cloudStatus];
}
