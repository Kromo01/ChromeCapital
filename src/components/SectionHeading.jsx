import React from "react";

export default function SectionHeading({ eyebrow, title, subtitle, icon: Icon, align = "left" }) {
  const isCenter = align === "center";
  return (
    <div className={`max-w-2xl ${isCenter ? "mx-auto text-center" : ""} mb-10`}>
      {eyebrow && (
        <div className={`flex items-center gap-2 mb-3 ${isCenter ? "justify-center" : ""}`}>
          {Icon && <Icon size={14} style={{ color: "#D4A94F" }} />}
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-inkFaint">{eyebrow}</span>
        </div>
      )}
      <h2 className="font-display text-3xl md:text-4xl text-ink">{title}</h2>
      {subtitle && <p className="text-sm md:text-base text-inkMuted mt-4 leading-relaxed">{subtitle}</p>}
    </div>
  );
}
