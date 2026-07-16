import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, User, X } from "lucide-react";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/invest", label: "Invest" },
  { to: "/first-home-buyers", label: "First Home Buyers" },
  { to: "/budget-dashboard", label: "Budget Dashboard" },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const accountRef = useRef(null);
  const { user, logOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const onClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [accountOpen]);

  const accountLabel = user?.displayName || user?.email || "";
  const accountInitial = accountLabel.trim().charAt(0).toUpperCase() || "?";

  const handleLogOut = async () => {
    setAccountOpen(false);
    await logOut();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors link-underline ${isActive ? "text-gold" : "text-inkMuted hover:text-ink"}`;

  return (
    <header
      className="sticky top-0 z-40 transition-colors"
      style={{
        background: scrolled ? "rgba(11,15,20,0.86)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid #232C38" : "1px solid transparent",
      }}
    >
      <div className="max-w-8xl mx-auto px-5 md:px-8 h-20 flex items-center justify-between">
        <NavLink to="/" className="flex-shrink-0" aria-label="Chrome Capital home">
          <Logo size={38} />
        </NavLink>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="#newsletter"
            className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.03]"
            style={{ background: "#D4A94F", color: "#161006" }}
          >
            Join the newsletter
          </a>

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={accountOpen}
                aria-label="Account menu"
                className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors"
                style={{ background: "rgba(212,169,79,0.14)", border: "1px solid #8A6C2E", color: "#D4A94F" }}
              >
                {accountInitial}
              </button>
              {accountOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden min-w-[200px] z-50"
                  style={{ background: "#171F29", border: "1px solid #232C38" }}
                >
                  <div className="px-3.5 py-3 text-xs truncate" style={{ color: "#8A96A6", borderBottom: "1px solid #232C38" }}>
                    Signed in as
                    <div className="text-sm mt-0.5 truncate" style={{ color: "#E9EDF2" }}>
                      {accountLabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogOut}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                    style={{ color: "#E9EDF2" }}
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-inkMuted hover:text-ink transition-colors"
            >
              <User size={15} /> Log in
            </NavLink>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-ink"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden px-5 pb-6 pt-2 flex flex-col gap-4"
          style={{ background: "#0B0F14", borderBottom: "1px solid #232C38" }}
        >
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `text-base font-medium py-1 ${isActive ? "text-gold" : "text-inkMuted"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <a
            href="#newsletter"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium mt-2"
            style={{ background: "#D4A94F", color: "#161006" }}
          >
            Join the newsletter
          </a>

          {user ? (
            <div className="pt-2" style={{ borderTop: "1px solid #232C38" }}>
              <div className="text-xs mb-2 truncate" style={{ color: "#8A96A6" }}>
                Signed in as <span style={{ color: "#E9EDF2" }}>{accountLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogOut();
                }}
                className="inline-flex items-center gap-1.5 text-base font-medium"
                style={{ color: "#E9EDF2" }}
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-base font-medium"
              style={{ color: "#E9EDF2" }}
            >
              <User size={16} /> Log in
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
