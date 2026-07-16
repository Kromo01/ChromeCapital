// ---------------------------------------------------------------------------
// SelfWealth — best-effort parser. Not verified against a real SelfWealth
// statement, unlike Vanguard's — see parseGenericBrokerStatement.
// ---------------------------------------------------------------------------
import { parseGenericBrokerStatement } from "./shared.js";

export const id = "selfwealth";
export const name = "SelfWealth";

export function detect(text) {
  return /selfwealth/i.test(text) && /(portfolio|holdings|valuation)/i.test(text);
}

export function parse(text) {
  return parseGenericBrokerStatement(text);
}
