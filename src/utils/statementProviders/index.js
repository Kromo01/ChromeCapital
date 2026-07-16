// ---------------------------------------------------------------------------
// Statement provider registry — tries each provider's detector against the
// uploaded PDF's text and parses with whichever one matches. Vanguard's
// parser was built and verified against a real statement; the others are
// best-effort (see shared.parseGenericBrokerStatement) since we don't have
// real sample statements from them to test against.
// ---------------------------------------------------------------------------
import * as vanguard from "./vanguard.js";
import * as commsec from "./commsec.js";
import * as selfwealth from "./selfwealth.js";
import * as pearler from "./pearler.js";
import * as stake from "./stake.js";

export const PROVIDERS = [vanguard, commsec, selfwealth, pearler, stake];

// Detects which provider a statement is from and parses it. Returns
// { providerId, providerName, verified, ...fields } or null if no provider
// recognised the document.
export function parseInvestmentStatement(text) {
  for (const provider of PROVIDERS) {
    if (provider.detect(text)) {
      return {
        providerId: provider.id,
        providerName: provider.name,
        verified: provider.id === "vanguard",
        importedAt: Date.now(),
        ...provider.parse(text),
      };
    }
  }
  return null;
}
