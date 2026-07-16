import React from "react";
import { NavLink } from "react-router-dom";
import { Instagram, Youtube, Music2 } from "lucide-react";
import Logo from "./Logo.jsx";

export default function Footer() {
  return (
    <footer style={{ background: "#0B0F14", borderTop: "1px solid #1B222C" }}>
      <div className="max-w-8xl mx-auto px-5 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10">
          <div>
            <Logo size={38} />
            <p className="text-sm mt-4 max-w-sm leading-relaxed text-inkMuted">
              Financial education for young Australians — investing, first-home buying, tax
              minimisation and inheritance planning, explained plainly.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a href="#" aria-label="Chrome Capital on Instagram" className="text-inkMuted hover:text-gold transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" aria-label="Chrome Capital on TikTok" className="text-inkMuted hover:text-gold transition-colors">
                <Music2 size={18} />
              </a>
              <a href="#" aria-label="Chrome Capital on YouTube" className="text-inkMuted hover:text-gold transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-inkFaint mb-4">Explore</div>
            <ul className="flex flex-col gap-3 text-sm text-inkMuted">
              <li><NavLink to="/" className="hover:text-gold transition-colors">Home</NavLink></li>
              <li><NavLink to="/invest" className="hover:text-gold transition-colors">Invest</NavLink></li>
              <li><NavLink to="/first-home-buyers" className="hover:text-gold transition-colors">First Home Buyers</NavLink></li>
              <li><NavLink to="/budget-dashboard" className="hover:text-gold transition-colors">Budget Dashboard</NavLink></li>
              <li><a href="#newsletter" className="hover:text-gold transition-colors">Newsletter</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-inkFaint mb-4">Chrome Capital</div>
            <p className="text-xs leading-relaxed text-inkFaint">
              Chrome Capital provides general financial education and information only. Nothing on
              this site is personal financial advice — it doesn't take into account your objectives,
              financial situation or needs. Consider seeking advice from a licensed professional
              before making financial decisions.
            </p>
          </div>
        </div>

        <div className="hairline-gold mt-12 mb-6" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-inkFaint">
          <span>© {new Date().getFullYear()} Chrome Capital. All rights reserved.</span>
          <span>Built for young Australians, from the ground up.</span>
        </div>
      </div>
    </footer>
  );
}
