// ---------------------------------------------------------------------------
// Stake — best-effort parser. Not verified against a real Stake statement,
// unlike Vanguard's — see parseGenericBrokerStatement.
// ---------------------------------------------------------------------------
import { parseGenericBrokerStatement } from "./shared.js";

export const id = "stake";
export const name = "Stake";

export function detect(text) {
  // "Stake" alone is too common a word to trust once — require the
  // capitalised brand name to appear more than once, the way a letterhead
  // and footer would repeat it.
  const brandMatches = text.match(/\bStake\b/g) || [];
  return brandMatches.length >= 2 && /(portfolio|holdings|valuation)/i.test(text);
}

export function parse(text) {
  return parseGenericBrokerStatement(text);
}
