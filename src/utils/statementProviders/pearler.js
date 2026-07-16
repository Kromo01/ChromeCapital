// ---------------------------------------------------------------------------
// Pearler — best-effort parser. Not verified against a real Pearler
// statement, unlike Vanguard's — see parseGenericBrokerStatement.
// ---------------------------------------------------------------------------
import { parseGenericBrokerStatement } from "./shared.js";

export const id = "pearler";
export const name = "Pearler";

export function detect(text) {
  return /pearler/i.test(text) && /(portfolio|holdings|valuation)/i.test(text);
}

export function parse(text) {
  return parseGenericBrokerStatement(text);
}
