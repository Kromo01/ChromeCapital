// ---------------------------------------------------------------------------
// CommSec (Commonwealth Bank) — best-effort parser. Not verified against a
// real CommSec statement, unlike Vanguard's — see parseGenericBrokerStatement.
// ---------------------------------------------------------------------------
import { parseGenericBrokerStatement } from "./shared.js";

export const id = "commsec";
export const name = "CommSec";

export function detect(text) {
  return /commsec/i.test(text) && /(portfolio|holdings|valuation)/i.test(text);
}

export function parse(text) {
  return parseGenericBrokerStatement(text);
}
