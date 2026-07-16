// ---------------------------------------------------------------------------
// Vanguard Personal Investor quarterly statement — patterns verified against
// a real statement PDF, including the exact "Portfolio opening/closing
// value", deposits/withdrawals and ETF holdings table wording Vanguard uses.
// ---------------------------------------------------------------------------
import { parseMoney, grabLabelMoney } from "./shared.js";

export const id = "vanguard";
export const name = "Vanguard";

export function detect(text) {
  return /vanguard/i.test(text) && /portfolio (opening|closing) value/i.test(text);
}

export function parse(text) {
  const periodEnding = (text.match(/Period ending\s+(\d{1,2}\s+\w+\s+\d{4})/i) || [])[1] || null;
  const accountNumber = (text.match(/Account number:\s*(\d+)/i) || [])[1] || null;

  const openMatch = text.match(/Portfolio opening value as at\s+(\d{1,2}\s+\w+\s+\d{4})\s+\$?(-?[\d,]+\.\d{2})/i);
  const closeMatch = text.match(/Portfolio closing value as at\s+(\d{1,2}\s+\w+\s+\d{4})\s+\$?(-?[\d,]+\.\d{2})/i);

  const summary = {
    periodEnding,
    accountNumber,
    openingDate: openMatch ? openMatch[1] : null,
    openingValue: openMatch ? parseMoney(openMatch[2]) : null,
    closingDate: closeMatch ? closeMatch[1] : null,
    closingValue: closeMatch ? parseMoney(closeMatch[2]) : null,
    deposits: grabLabelMoney(text, "Deposits into Vanguard Cash Account"),
    withdrawals: grabLabelMoney(text, "Withdrawals from Vanguard Cash Account"),
    changeInValue: grabLabelMoney(text, "Change in investment value"),
    income: grabLabelMoney(text, "Income from your investments"),
    directFees: grabLabelMoney(text, "Direct fees and costs"),
    returnAfterFees: grabLabelMoney(text, "Return after withholding tax and fees"),
    cashBalance: grabLabelMoney(text, "Total Vanguard Cash Account"),
    totalFeesPaid: grabLabelMoney(text, "Total fees and costs you paid"),
  };

  // Holdings table: CODE  Product name (ending in ETF/Index/Fund/Shares)  qty  price  dd-Mon-yy  value
  const etfRegex =
    /\b([A-Z]{2,6})\s+([A-Za-z0-9()'’.,/&\- ]+?(?:ETF|Index|Fund|Shares))\s+([\d,]+\.\d{2})\s+([\d.]+)\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4})\s+([\d,]+\.\d{2})/g;
  const holdings = [];
  let m;
  while ((m = etfRegex.exec(text)) !== null) {
    holdings.push({
      code: m[1],
      name: m[2].trim(),
      quantity: parseFloat(m[3].replace(/,/g, "")),
      price: parseFloat(m[4]),
      priceDate: m[5],
      value: parseMoney(m[6]),
    });
  }

  // Asset allocation %, scoped to the "asset allocation" section only so we
  // don't pick up unrelated "X.XX%" figures elsewhere in the document.
  const allocation = [];
  const allocSection = text.match(/asset allocation[\s\S]*?(?=Note:|$)/i);
  if (allocSection) {
    const allocRegex = /([A-Za-z][A-Za-z ]+?)\s+(\d{1,3}\.\d{2})%/g;
    while ((m = allocRegex.exec(allocSection[0])) !== null) {
      allocation.push({ label: m[1].trim(), pct: parseFloat(m[2]) });
    }
  }

  return { ...summary, holdings, allocation };
}
