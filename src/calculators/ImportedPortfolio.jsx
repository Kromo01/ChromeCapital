import React from "react";
import { PieChart, X, ShieldAlert } from "lucide-react";
import { COLORS, fmtCurrency, investmentColor } from "../styles/tokens.js";

export default function ImportedPortfolio({ portfolio, onClear }) {
  if (!portfolio) return null;

  const totalValue = portfolio.closingValue ?? portfolio.holdings.reduce((t, h) => t + (h.value || 0), 0);

  return (
    <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <PieChart size={15} style={{ color: COLORS.gold }} />
          <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
            Your portfolio
          </h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs inline-flex items-center gap-1"
          style={{ color: COLORS.textFaint }}
        >
          <X size={12} /> Clear
        </button>
      </div>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
        From your {portfolio.providerName || "imported"} statement
        {portfolio.closingDate ? ` as at ${portfolio.closingDate}` : ""} — actual holdings, not a projection.
      </p>

      {portfolio.verified === false && (
        <div
          className="rounded-lg p-2.5 mb-3 flex items-start gap-2 text-xs"
          style={{ background: "rgba(194,86,46,0.10)", border: `1px solid ${COLORS.ember}66`, color: COLORS.textMuted }}
        >
          <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.ember }} />
          <span>{portfolio.providerName} figures below haven't been verified against a real statement — worth a quick sanity check.</span>
        </div>
      )}

      <div className="font-display text-2xl mb-4" style={{ color: COLORS.text }}>
        {totalValue != null ? fmtCurrency(totalValue) : "—"}
      </div>

      {portfolio.holdings.length > 0 && (
        <div className="fin-table overflow-x-auto mb-4">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse", minWidth: 420 }}>
            <thead>
              <tr>
                {["Code", "Product", "Qty", "Value", "%"].map((h, i) => (
                  <th
                    key={h}
                    className="text-xs font-medium uppercase tracking-wide py-1.5"
                    style={{ color: COLORS.textMuted, textAlign: i <= 1 ? "left" : "right", borderBottom: `1px solid ${COLORS.border}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((h, i) => (
                <tr key={h.code + i} style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                  <td className="py-1.5 font-medium" style={{ color: COLORS.text }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: investmentColor(i) }} />
                      {h.code}
                    </span>
                  </td>
                  <td className="py-1.5 max-w-[220px] truncate" title={h.name} style={{ color: COLORS.textMuted }}>
                    {h.name}
                  </td>
                  <td className="py-1.5 text-right font-mono-fin" style={{ color: COLORS.textMuted }}>
                    {h.quantity}
                  </td>
                  <td className="py-1.5 text-right font-mono-fin" style={{ color: COLORS.text }}>
                    {fmtCurrency(h.value)}
                  </td>
                  <td className="py-1.5 text-right font-mono-fin" style={{ color: COLORS.textFaint }}>
                    {totalValue ? `${((h.value / totalValue) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {portfolio.allocation.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide font-medium mb-2" style={{ color: COLORS.textMuted }}>
            Asset allocation
          </div>
          <div className="flex rounded-full overflow-hidden h-2.5 mb-2" style={{ background: COLORS.surfaceRaised }}>
            {portfolio.allocation.map((a, i) => (
              <div key={a.label} style={{ width: `${a.pct}%`, background: investmentColor(i) }} title={`${a.label}: ${a.pct}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {portfolio.allocation.map((a, i) => (
              <span key={a.label} className="inline-flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: investmentColor(i) }} />
                {a.label} — {a.pct}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
