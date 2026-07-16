import React from "react";
import { COLORS } from "../styles/tokens.js";

export function FieldLabel({ children, hint }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium tracking-wide uppercase" style={{ color: COLORS.textMuted }}>
        {children}
      </span>
      {hint && (
        <span className="text-xs" style={{ color: COLORS.textFaint }}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function CurrencyInput({ value, onChange, step = 50 }) {
  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <span className="pl-3 pr-1 text-sm" style={{ color: COLORS.textFaint }}>
        $
      </span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(isNaN(v) ? 0 : Math.max(0, v));
        }}
        className="w-full bg-transparent py-2.5 pr-3 outline-none text-sm font-mono-fin"
        style={{ color: COLORS.text }}
      />
    </div>
  );
}

export function SliderWithReadout({ value, onChange, min, max, step, suffix, decimals = 0 }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-gold flex-1"
        style={{ "--fill": `${pct}%` }}
      />
      <div
        className="flex items-center rounded-lg px-2 py-1.5 flex-shrink-0"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minWidth: "4.5rem" }}
      >
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            let v = parseFloat(e.target.value);
            if (isNaN(v)) v = min;
            v = Math.min(max, Math.max(min, v));
            onChange(Number(v.toFixed(decimals)));
          }}
          className="w-full bg-transparent text-right outline-none text-sm font-mono-fin"
          style={{ color: COLORS.text }}
        />
        <span className="ml-1 text-xs" style={{ color: COLORS.textMuted }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}

export function PillGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className="pill-btn px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: active ? COLORS.gold : "transparent",
              color: active ? "#161006" : COLORS.textMuted,
              border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, hint }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-3 w-full text-left">
      <span
        className="flex items-center justify-center flex-shrink-0 rounded-md mt-0.5 transition-colors"
        style={{
          width: 18,
          height: 18,
          background: checked ? COLORS.gold : COLORS.surface,
          border: `1px solid ${checked ? COLORS.gold : COLORS.border}`,
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M2 8.5L6 12.5L14 3.5" stroke="#161006" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium" style={{ color: COLORS.text }}>
          {label}
        </span>
        {hint && (
          <span className="block text-xs mt-0.5" style={{ color: COLORS.textFaint }}>
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

export function InflationBadge({ children = "Estimate" }) {
  return (
    <span
      className="text-xs rounded-full px-2 py-0.5 font-medium"
      style={{ background: "rgba(212,169,79,0.15)", color: COLORS.gold }}
    >
      {children}
    </span>
  );
}
