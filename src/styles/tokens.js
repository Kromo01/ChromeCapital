// ---------------------------------------------------------------------------
// Shared design tokens — dark, old-money luxury palette.
// Gold is the primary accent (wealth, warmth); chrome is a secondary metallic
// accent used sparingly (dividers, the logo mark) to nod to the brand name
// without tipping the whole site into a sleek/automotive look.
// ---------------------------------------------------------------------------
export const COLORS = {
  bg: "#0B0F14",
  surface: "#111720",
  surfaceRaised: "#171F29",
  border: "#232C38",
  borderSoft: "#1B222C",
  text: "#E9EDF2",
  textMuted: "#8A96A6",
  textFaint: "#576174",
  gold: "#D4A94F",
  goldBright: "#F0C868",
  goldDim: "#8A6C2E",
  chrome: "#B8C4D0",
  chromeDim: "#5B6672",
  slate: "#6B7684",
  teal: "#4FB8A9",
  ember: "#C2562E",
};

export const INVESTMENT_PALETTE = ["#7C93D8", "#B98AD6", "#7FB88F", "#C9A66B", "#C98AA0", "#6FA8B5"];
export const investmentColor = (i) => INVESTMENT_PALETTE[i % INVESTMENT_PALETTE.length];

export const fmtCurrency = (v, decimals = 0) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);

export const fmtCompact = (v) =>
  new Intl.NumberFormat("en-AU", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 1,
  }).format(v);
