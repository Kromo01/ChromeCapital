// ---------------------------------------------------------------------------
// Shared helpers for statement-provider parsers. Every parser works on the
// plain text layer of a PDF (see ../pdfText.js) and returns a best-effort
// object — fields that can't be found stay null/empty rather than guessed.
// ---------------------------------------------------------------------------

export function parseMoney(str) {
  if (!str) return null;
  const neg = /^\s*-/.test(str);
  const cleaned = str.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const val = parseFloat(cleaned);
  if (Number.isNaN(val)) return null;
  return neg ? -val : val;
}

// Finds "<label> ... $X,XXX.XX" and returns the number, or null if the label
// never appears next to a money-shaped value.
export function grabLabelMoney(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped + "\\s+(-?\\$?[\\d,]+\\.\\d{2})", "i");
  const m = text.match(re);
  return m ? parseMoney(m[1]) : null;
}

// Tries a list of common "total portfolio value" phrasings in order and
// returns the first that matches — statements word this differently
// provider to provider ("Total Portfolio Value", "Total Market Value", ...).
export function grabTotalValue(text, extraLabels = []) {
  const labels = [
    "Total portfolio value",
    "Total Portfolio Value",
    "Total market value",
    "Total Market Value",
    "Portfolio value",
    "Total value",
    "Total holdings value",
    "Closing balance",
    ...extraLabels,
  ];
  for (const label of labels) {
    const val = grabLabelMoney(text, label);
    if (val != null) return val;
  }
  return null;
}

// Generic ASX-style holdings row: CODE  Name...  quantity  price  value
// (with an optional trailing % or extra column, which we ignore). This is a
// best-effort shape shared across most Australian broker reports — some
// statements won't match it, in which case holdings just comes back empty
// rather than fabricated.
export function extractHoldingsTable(text) {
  const rowRegex =
    /\b([A-Z]{2,5})\s+([A-Za-z0-9()'’.,/&\- ]{3,80}?)\s+([\d,]+(?:\.\d+)?)\s+\$?([\d,]+\.\d{2,4})\s+\$?([\d,]+\.\d{2})\b/g;
  const holdings = [];
  const seen = new Set();
  let m;
  while ((m = rowRegex.exec(text)) !== null) {
    const code = m[1];
    // Skip obvious non-ticker matches (common words, section headings).
    if (["TOTAL", "CODE", "ASX", "GST", "ABN"].includes(code)) continue;
    const key = code + m[2].trim();
    if (seen.has(key)) continue;
    seen.add(key);
    holdings.push({
      code,
      name: m[2].trim(),
      quantity: parseFloat(m[3].replace(/,/g, "")),
      price: parseFloat(m[4].replace(/,/g, "")),
      value: parseMoney(m[5]),
    });
  }
  return holdings;
}

export function grabPeriodEnding(text) {
  const m =
    text.match(/(?:period ending|statement date|as at|as of)\s*:?\s*(\d{1,2}\s+\w+\s+\d{4})/i) ||
    text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  return m ? m[1] : null;
}

// Best-effort parser shared by providers we don't have a real sample
// statement for. Pulls a total portfolio value and a holdings table using
// patterns that are common across Australian broker reports, and leaves
// everything else null rather than guessing at wording we haven't verified.
// Confidence is lower than the Vanguard parser — treat missing fields as
// expected, not broken.
export function parseGenericBrokerStatement(text) {
  return {
    periodEnding: grabPeriodEnding(text),
    accountNumber: (text.match(/Account (?:number|no\.?)\s*:?\s*(\w[\w-]*)/i) || [])[1] || null,
    closingValue: grabTotalValue(text),
    cashBalance: grabLabelMoney(text, "Cash balance") ?? grabLabelMoney(text, "Available cash"),
    holdings: extractHoldingsTable(text),
    allocation: [],
    // These providers don't have a verified quarterly deposit/withdrawal
    // format the way Vanguard's statement does — left null rather than
    // extracted from an unverified pattern.
    openingValue: null,
    deposits: null,
    withdrawals: null,
  };
}
