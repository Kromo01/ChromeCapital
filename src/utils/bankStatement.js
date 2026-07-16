// ---------------------------------------------------------------------------
// Bank statement CSV parsing + heuristic categorisation.
//
// Expected format (no header row), one transaction per line:
//   DD/MM/YYYY,"-123.45","Description text","+1234.56"
// i.e. date (unquoted), signed amount, description, running balance.
// This matches standard CommBank-style exports. Pure functions, no React.
// ---------------------------------------------------------------------------

function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function parseAuDate(str) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str || "");
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseAmount(str) {
  if (!str) return NaN;
  const cleaned = str.replace(/[^0-9.+-]/g, "");
  return parseFloat(cleaned);
}

// Parses raw CSV text into transaction rows. Skips blank/malformed lines.
export function parseBankStatementCsv(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (fields.length < 3) continue;
    const date = parseAuDate(fields[0]);
    const amount = parseAmount(fields[1]);
    const description = fields[2] || "";
    if (!date || Number.isNaN(amount)) continue;
    rows.push({ date, amount, description });
  }
  return rows;
}

// Each rule carries the default category name to use when nothing better
// exists yet, plus a set of keywords describing what that category *means* —
// used to match against categories the user already created, so we reuse
// "Health" instead of minting a redundant "Health & Personal Care".
const DEBT_RULES = [
  {
    test: /credit\s*card|afterpay|zip\s*?pay|hecs|help\s*debt|personal\s*loan|car\s*loan|\bloan\b|bnpl/i,
    category: "Debt",
    keywords: ["debt", "loan", "credit card"],
  },
];

const SAVINGS_RULES = [
  { test: /emergency\s*fund/i, category: "Emergency Fund", keywords: ["emergency fund", "emergency", "rainy day"] },
  { test: /holiday|travel/i, category: "Holiday Fund", keywords: ["holiday", "travel", "vacation"] },
  { test: /invest|shares|jkromeinvest|etf/i, category: "Shares", keywords: ["shares", "invest", "investing", "investment", "etf", "stocks"] },
  { test: /savings/i, category: "Savings", keywords: ["savings", "save"] },
  { test: /contribution/i, category: "Savings", keywords: ["savings", "save"] },
];

const EXPENSE_RULES = [
  { test: /rent\b/i, category: "Rent", keywords: ["rent", "housing"] },
  { test: /woolworths|coles|iga\b|aldi|provision|7-eleven|supermarket/i, category: "Groceries", keywords: ["groceries", "grocery", "supermarket", "food shop"] },
  { test: /chemist|pharmacy|clinic|medical|chem/i, category: "Health & Personal Care", keywords: ["health", "personal care", "medical", "pharmacy", "chemist"] },
  { test: /gym|fitness|goodlife|runna/i, category: "Health & Fitness", keywords: ["health", "fitness", "gym", "exercise"] },
  { test: /coffee|cafe|restaurant|square|\bsq ?\*|\bgyg\b|mcdonald|kfc|subway|domino|zambrero|grill'?d|nando|hungry\s*jack|guzman/i, category: "Dining & Entertainment", keywords: ["dining", "entertainment", "eating out", "restaurants", "takeaway", "food"] },
  { test: /bunnings|spotlight|whsmith|bookshop|qbd|kmart|target|big\s*w/i, category: "Shopping", keywords: ["shopping", "retail"] },
  { test: /netflix|spotify|stan\b|disney|prime\s*video|subscription/i, category: "Subscriptions", keywords: ["subscriptions", "subscription", "streaming"] },
  { test: /uber|myki|opal|translink|fuel|bp\b|caltex|petrol/i, category: "Transport", keywords: ["transport", "travel", "commute", "fuel", "petrol"] },
];

const OTHER_KEYWORDS = ["other", "misc", "miscellaneous", "general"];

// Prefers an existing category name over a rule's default: exact match first,
// then a keyword overlap (either name contains the other) so "Health" catches
// a rule tagged with the "health" keyword even though its default is
// "Health & Personal Care". Falls back to the rule's default if nothing fits.
function resolveCategory(existingNames, keywords, defaultName) {
  const exact = existingNames.find((n) => n.toLowerCase() === defaultName.toLowerCase());
  if (exact) return exact;
  for (const n of existingNames) {
    const lower = n.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw) || kw.includes(lower))) return n;
  }
  return defaultName;
}

// Classifies a single transaction into a bucket (income/expense/debt/savings)
// plus a category name. Debt/savings keyword matches take priority over the
// sign of the amount, since transfers can run either way; everything else
// falls back to sign (positive = income, negative = expense), with expenses
// further guessed by merchant keyword. `existing` lets already-created
// categories/goals win over minting new similarly-named ones.
export function categorizeTransaction(description, amount, existing = {}) {
  const desc = description || "";
  const expenseNames = (existing.expenseCategories || []).map((c) => (typeof c === "string" ? c : c.name));
  const savingsNames = (existing.savingsGoals || []).map((c) => (typeof c === "string" ? c : c.name));
  const debtNames = (existing.debts || []).map((c) => (typeof c === "string" ? c : c.name));

  for (const r of DEBT_RULES) {
    if (r.test.test(desc)) return { bucket: "debt", category: resolveCategory(debtNames, r.keywords, r.category) };
  }
  for (const r of SAVINGS_RULES) {
    if (r.test.test(desc)) return { bucket: "savings", category: resolveCategory(savingsNames, r.keywords, r.category) };
  }
  if (amount > 0) return { bucket: "income", category: "Income" };
  for (const r of EXPENSE_RULES) {
    if (r.test.test(desc)) return { bucket: "expense", category: resolveCategory(expenseNames, r.keywords, r.category) };
  }
  return { bucket: "expense", category: resolveCategory(expenseNames, OTHER_KEYWORDS, "Other") };
}

// Cleans a raw description down to a shorter, more readable label — strips
// card/value-date suffixes banks tack onto merchant lines.
export function cleanDescription(description) {
  if (!description) return "";
  return description
    .replace(/\s*Card\s*xx?\d+.*$/i, "")
    .replace(/\s*Value\s*Date:.*$/i, "")
    .trim();
}
