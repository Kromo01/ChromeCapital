import React, { useRef, useState } from "react";
import { Upload, Check, X, FileText, ArrowRight, AlertTriangle } from "lucide-react";
import { COLORS, fmtCurrency } from "../styles/tokens.js";
import { parseBankStatementCsv, categorizeTransaction, cleanDescription } from "../utils/bankStatement.js";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const BUCKETS = [
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "debt", label: "Debt" },
  { key: "savings", label: "Savings" },
];

export default function BankStatementImport({ onImport, expenseCategories = [], savingsGoals = [], debts = [] }) {
  const fileInputRef = useRef(null);
  const [rows, setRows] = useState(null); // null = no file loaded yet
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState(null);
  const [importedCount, setImportedCount] = useState(null);

  const handleFile = (file) => {
    setParseError(null);
    setImportedCount(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBankStatementCsv(String(reader.result));
        if (parsed.length === 0) {
          setParseError("Couldn't find any transactions in that file — check it matches the expected format (date, amount, description, balance).");
          setRows(null);
          return;
        }
        const existing = { expenseCategories, savingsGoals, debts };
        const withGuesses = parsed.map((r) => {
          const guess = categorizeTransaction(r.description, r.amount, existing);
          return {
            id: uid(),
            date: r.date,
            amount: r.amount,
            description: cleanDescription(r.description),
            bucket: guess.bucket,
            category: guess.category,
            include: true,
          };
        });
        setRows(withGuesses);
      } catch (e) {
        setParseError("Couldn't read that file — make sure it's a plain CSV export from your bank.");
        setRows(null);
      }
    };
    reader.onerror = () => setParseError("Couldn't read that file.");
    reader.readAsText(file);
  };

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  };

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const toggleAll = (include) => {
    setRows((prev) => prev.map((r) => ({ ...r, include })));
  };

  const reset = () => {
    setRows(null);
    setFileName("");
    setParseError(null);
    setImportedCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selected = rows ? rows.filter((r) => r.include) : [];
  const counts = selected.reduce((acc, r) => {
    acc[r.bucket] = (acc[r.bucket] || 0) + 1;
    return acc;
  }, {});

  const handleImport = () => {
    onImport(selected);
    setImportedCount(selected.length);
    setRows(null);
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Upload size={15} style={{ color: COLORS.gold }} />
        <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
          Import a bank statement
        </h2>
      </div>
      <p className="text-xs mb-4" style={{ color: COLORS.textFaint }}>
        Upload a CSV export from your bank. We'll guess whether each line is income, an expense, a
        debt payment, or a savings transfer — review and adjust before anything gets added.
      </p>

      {!rows && (
        <div
          className="rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center"
          style={{ border: `1px dashed ${COLORS.border}`, background: COLORS.surfaceRaised }}
        >
          <FileText size={22} style={{ color: COLORS.textFaint }} />
          <div className="text-sm" style={{ color: COLORS.textMuted }}>
            {fileName ? `Loaded: ${fileName}` : "No file selected"}
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onFileChange} className="hidden" id="bank-csv-input" />
          <label
            htmlFor="bank-csv-input"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium cursor-pointer transition-transform hover:scale-[1.03]"
            style={{ background: COLORS.gold, color: "#161006" }}
          >
            <Upload size={14} /> Choose CSV file
          </label>
          {parseError && (
            <div className="flex items-start gap-2 text-xs mt-1 max-w-sm" style={{ color: COLORS.ember }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}
          {importedCount != null && (
            <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: COLORS.teal }}>
              <Check size={13} /> Imported {importedCount} transaction{importedCount === 1 ? "" : "s"}.
            </div>
          )}
        </div>
      )}

      {rows && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full px-2.5 py-1" style={{ background: "rgba(212,169,79,0.12)", color: COLORS.gold }}>
                {selected.length} selected
              </span>
              {BUCKETS.map((b) => (
                <span key={b.key} className="rounded-full px-2.5 py-1" style={{ background: COLORS.surfaceRaised, color: COLORS.textMuted }}>
                  {b.label}: {counts[b.key] || 0}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button type="button" onClick={() => toggleAll(true)} style={{ color: COLORS.textMuted }}>
                Select all
              </button>
              <button type="button" onClick={() => toggleAll(false)} style={{ color: COLORS.textMuted }}>
                Deselect all
              </button>
            </div>
          </div>

          <div className="fin-table overflow-x-auto" style={{ maxHeight: 420 }}>
            <table className="w-full text-xs" style={{ borderCollapse: "collapse", minWidth: 680 }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: COLORS.surface }}>
                  {["", "Date", "Description", "Amount", "Bucket", "Category"].map((h) => (
                    <th key={h} className="text-xs font-medium uppercase tracking-wide py-2 pr-2 text-left" style={{ color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="fin-row" style={{ borderBottom: `1px solid ${COLORS.borderSoft}`, opacity: r.include ? 1 : 0.4 }}>
                    <td className="py-1.5 pr-2">
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) => updateRow(r.id, "include", e.target.checked)}
                        aria-label={`Include ${r.description}`}
                      />
                    </td>
                    <td className="py-1.5 pr-2 font-mono-fin whitespace-nowrap" style={{ color: COLORS.textMuted }}>
                      {r.date}
                    </td>
                    <td className="py-1.5 pr-2 max-w-[220px] truncate" title={r.description} style={{ color: COLORS.text }}>
                      {r.description}
                    </td>
                    <td className="py-1.5 pr-2 font-mono-fin whitespace-nowrap" style={{ color: r.amount < 0 ? COLORS.ember : COLORS.teal }}>
                      {r.amount < 0 ? "−" : "+"}
                      {fmtCurrency(Math.abs(r.amount))}
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={r.bucket}
                        onChange={(e) => updateRow(r.id, "bucket", e.target.value)}
                        className="bg-transparent text-xs outline-none rounded-md py-1 px-1"
                        style={{ color: COLORS.text, border: `1px solid ${COLORS.border}` }}
                      >
                        {BUCKETS.map((b) => (
                          <option key={b.key} value={b.key} style={{ background: COLORS.surface }}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="text"
                        value={r.category}
                        onChange={(e) => updateRow(r.id, "category", e.target.value)}
                        className="bg-transparent text-xs outline-none rounded-md py-1 px-1.5 w-32"
                        style={{ color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] disabled:opacity-50"
              style={{ background: COLORS.gold, color: "#161006" }}
            >
              Import {selected.length} transaction{selected.length === 1 ? "" : "s"} <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
            >
              <X size={14} /> Cancel
            </button>
          </div>
          <p className="text-xs" style={{ color: COLORS.textFaint }}>
            Categories are a best guess from the description — fix anything that's wrong before importing.
            Expense rows will create new expense categories automatically if needed.
          </p>
        </div>
      )}
    </div>
  );
}
