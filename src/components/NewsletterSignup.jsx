import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Mail, ArrowRight, Check, Loader2 } from "lucide-react";
import { db, firebaseReady } from "../firebase.js";

export default function NewsletterSignup({
  id = "newsletter",
  eyebrow = "The Chrome Capital Letter",
  title = "Money lessons for your inbox, not your feed algorithm.",
  subtitle = "One email, every fortnight. Investing, tax, and property — explained in plain English, with zero jargon.",
}) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [honeypotName] = useState(() => `${id}-hp-${Math.random().toString(36).slice(2, 8)}`);
  const [status, setStatus] = useState("idle"); // idle | loading | error | success
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Hidden field only a bot would fill in — silently "succeed" without writing anything.
    if (honeypot) {
      setStatus("success");
      setMessage("You're on the list — check your inbox to confirm.");
      setEmail("");
      return;
    }

    const trimmed = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!valid) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    if (!firebaseReady) {
      setStatus("error");
      setMessage("Signups are temporarily unavailable. Please try again later.");
      return;
    }

    setStatus("loading");
    try {
      await setDoc(
        doc(db, "newsletterSubscribers", trimmed),
        {
          email: trimmed,
          source: id,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setStatus("success");
      setMessage("You're on the list — check your inbox to confirm.");
      setEmail("");
    } catch (err) {
      console.error("newsletter signup failed", err);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section id={id} className="scroll-mt-24">
      <div
        className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #111720 0%, #14100A 100%)",
          border: "1px solid #232C38",
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,169,79,0.14) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={14} style={{ color: "#D4A94F" }} />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-inkFaint">{eyebrow}</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl text-ink mb-3">{title}</h2>
          <p className="text-sm text-inkMuted mb-6 leading-relaxed">{subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-3">
            <label htmlFor={`${id}-email`} className="sr-only">
              Email address
            </label>
            <input
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 rounded-full px-5 py-3 text-sm bg-transparent outline-none"
              style={{ border: "1px solid #232C38", color: "#E9EDF2", background: "#0E141C" }}
              aria-invalid={status === "error"}
              aria-describedby={`${id}-status`}
              disabled={status === "loading"}
            />
            {/* Hidden from real users and positioned off-screen (not just opacity:0) so
                browser autofill/password managers don't mistake it for a real field —
                "company"-style names get targeted by autofill heuristics even when hidden. */}
            <input
              type="text"
              name={honeypotName}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] flex-shrink-0 disabled:opacity-70 disabled:hover:scale-100"
              style={{ background: "#D4A94F", color: "#161006" }}
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Subscribing…
                </>
              ) : (
                <>
                  Subscribe <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div id={`${id}-status`} aria-live="polite" className="mt-3 min-h-[1.25rem]">
            {status === "success" && (
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#4FB8A9" }}>
                <Check size={13} /> {message}
              </span>
            )}
            {status === "error" && (
              <span className="text-xs" style={{ color: "#C2562E" }}>
                {message}
              </span>
            )}
          </div>

          <p className="text-xs text-inkFaint mt-2">No spam. Unsubscribe anytime. General information only, never personal advice.</p>
        </div>
      </div>
    </section>
  );
}
