import React, { useRef, useState } from "react";
import { Upload, FileText, AlertTriangle, Check, X, ArrowRight, ShieldAlert } from "lucide-react";
import { COLORS, fmtCurrency } from "../styles/tokens.js";
import { FieldLabel, CurrencyInput, Checkbox } from "../components/FormControls.jsx";
import { extractPdfText } from "../utils/pdfText.js";
import { parseInvestmentStatement } from "../utils/statementProviders/index.js";

const SUPPORTED_NAMES = "Vanguard, CommSec, SelfWealth, Pearler or Stake";

export default function StatementImport({ onImport, onClose }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | reading | error | ready
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [updateCalculator, setUpdateCalculator] = useState(true);
  const [suggestedContribution, setSuggestedContribution] = useState(0);

  const handleFile = async (file) => {
    setFileName(file.name);
    setStatus("reading");
    setError(null);
    try {
      const text = await extractPdfText(file);
      const result = parseInvestmentStatement(text);
      if (!result) {
        setError(`Couldn't recognise this as a statement from a supported provider (${SUPPORTED_NAMES}).`);
        setStatus("error");
        return;
      }
      setParsed(result);
      const netDeposits = (result.deposits || 0) + (result.withdrawals || 0);
      const months = 3; // most of these are quarterly statements
      const suggestion = result.deposits != null ? Math.max(0, Math.round(netDeposits / months / 10) * 10) : 0;
      setSuggestedContribution(suggestion);
      setStatus("ready");
    } catch (e) {
      setError("Couldn't read that PDF — make sure it's an unmodified statement download.");
      setStatus("error");
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setParsed(null);
    setFileName("");
    setError(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleApply = () => {
    onImport({ ...parsed, applyToCalculator: updateCalculator, suggestedContribution });
    reset();
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: COLORS.textFaint }}>
        Upload a statement PDF from {SUPPORTED_NAMES} — we'll read your portfolio value and holdings straight out
        of it. Nothing is sent anywhere; the file is read in your browser.
      </p>

      {status !== "ready" && (
        <div
          className="rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 text-center"
          style={{ border: `1px dashed ${COLORS.border}`, background: COLORS.surfaceRaised }}
        >
          <FileText size={20} style={{ color: COLORS.textFaint }} />
          <div className="text-xs" style={{ color: COLORS.textMuted }}>
            {status === "reading" ? "Reading statement…" : fileName ? `Loaded: ${fileName}` : "No file selected"}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={onFileChange} className="hidden" id="statement-pdf-input" />
          <label
            htmlFor="statement-pdf-input"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium cursor-pointer transition-transform hover:scale-[1.03]"
            style={{ background: COLORS.gold, color: "#161006" }}
          >
            <Upload size={13} /> Choose statement PDF
          </label>
          {error && (
            <div className="flex items-start gap-2 text-xs mt-1 max-w-sm" style={{ color: COLORS.ember }}>
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {status === "ready" && parsed && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.teal }}>
            <Check size={13} /> Read a {parsed.providerName} statement
            {parsed.periodEnding ? ` for period ending ${parsed.periodEnding}` : ""}
          </div>

          {!parsed.verified && (
            <div
              className="rounded-lg p-2.5 flex items-start gap-2 text-xs"
              style={{ background: "rgba(194,86,46,0.10)", border: `1px solid ${COLORS.ember}66`, color: COLORS.textMuted }}
            >
              <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.ember }} />
              <span>
                {parsed.providerName} support hasn't been tested against a real statement yet — double-check the
                figures below match your actual statement before applying them.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {parsed.openingValue != null && (
              <div className="rounded-lg p-2.5" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
                <div style={{ color: COLORS.textFaint }}>Opening value</div>
                <div className="font-mono-fin mt-0.5" style={{ color: COLORS.text }}>{fmtCurrency(parsed.openingValue)}</div>
              </div>
            )}
            <div className="rounded-lg p-2.5" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
              <div style={{ color: COLORS.textFaint }}>{parsed.openingValue != null ? "Closing value" : "Portfolio value"}</div>
              <div className="font-mono-fin mt-0.5" style={{ color: COLORS.gold }}>
                {parsed.closingValue != null ? fmtCurrency(parsed.closingValue) : "—"}
              </div>
            </div>
            {parsed.deposits != null && (
              <div className="rounded-lg p-2.5" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
                <div style={{ color: COLORS.textFaint }}>Deposits</div>
                <div className="font-mono-fin mt-0.5" style={{ color: COLORS.teal }}>{fmtCurrency(parsed.deposits)}</div>
              </div>
            )}
            {parsed.withdrawals != null && (
              <div className="rounded-lg p-2.5" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
                <div style={{ color: COLORS.textFaint }}>Withdrawals</div>
                <div className="font-mono-fin mt-0.5" style={{ color: COLORS.ember }}>{fmtCurrency(Math.abs(parsed.withdrawals))}</div>
              </div>
            )}
          </div>

          {parsed.holdings.length > 0 ? (
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
              <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: COLORS.surfaceRaised }}>
                    <th className="text-left py-1.5 px-2.5 font-medium" style={{ color: COLORS.textMuted }}>Code</th>
                    <th className="text-right py-1.5 px-2.5 font-medium" style={{ color: COLORS.textMuted }}>Qty</th>
                    <th className="text-right py-1.5 px-2.5 font-medium" style={{ color: COLORS.textMuted }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.holdings.map((h) => (
                    <tr key={h.code} style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}>
                      <td className="py-1.5 px-2.5" style={{ color: COLORS.text }} title={h.name}>{h.code}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono-fin" style={{ color: COLORS.textMuted }}>{h.quantity}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono-fin" style={{ color: COLORS.text }}>{fmtCurrency(h.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs" style={{ color: COLORS.textFaint }}>
              No holdings table detected in this statement — you can still update the calculator's balance below.
            </div>
          )}

          <div className="rounded-lg p-3" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
            <Checkbox checked={updateCalculator} onChange={setUpdateCalculator} label="Update calculator with this statement" />
            {updateCalculator && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="text-xs" style={{ color: COLORS.textFaint }}>
                  Sets your first investment's balance to {parsed.closingValue != null ? fmtCurrency(parsed.closingValue) : "—"}
                  {parsed.deposits != null
                    ? ", and suggests a monthly contribution from this quarter's net deposits — adjust if you like."
                    : "."}
                </div>
                {parsed.deposits != null && (
                  <div>
                    <FieldLabel hint="editable">Suggested monthly contribution</FieldLabel>
                    <CurrencyInput value={suggestedContribution} onChange={setSuggestedContribution} step={10} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleApply}
              disabled={parsed.closingValue == null}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: COLORS.gold, color: "#161006" }}
            >
              Import <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
