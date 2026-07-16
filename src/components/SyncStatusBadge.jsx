import React from "react";
import { Link } from "react-router-dom";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { COLORS } from "../styles/tokens.js";
import { useAuth } from "../context/AuthContext.jsx";

// Small status pill used next to a tool's title to show whether its data is
// only saved in this browser (guest) or synced to the signed-in account.
export default function SyncStatusBadge({ status }) {
  const { user, firebaseReady } = useAuth();

  if (!firebaseReady) return null;

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 transition-colors hover:opacity-80"
        style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, color: COLORS.textFaint }}
      >
        <CloudOff size={12} /> Saved on this device — log in to sync
      </Link>
    );
  }

  if (status === "syncing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1" style={{ color: COLORS.textFaint }}>
        <RefreshCw size={12} className="animate-spin" /> Syncing…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1" style={{ color: COLORS.ember }}>
        <CloudOff size={12} /> Sync paused — check your connection
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1" style={{ color: COLORS.teal }}>
      <Cloud size={12} /> Synced to your account
    </span>
  );
}
