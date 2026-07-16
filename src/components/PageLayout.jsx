import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import Footer from "./Footer.jsx";

export default function PageLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div style={{ background: "#0B0F14" }} className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
