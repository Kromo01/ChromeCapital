import React, { useMemo } from "react";
import { Calculator, Info, TrendingUp, PiggyBank, ShieldAlert } from "lucide-react";
import { COLORS, fmtCurrency } from "../styles/tokens.js";
import { FieldLabel, CurrencyInput, SliderWithReadout, InflationBadge } from "../components/FormControls.jsx";
import SyncStatusBadge from "../components/SyncStatusBadge.jsx";
import { useSyncedState } from "../hooks/useSyncedState.js";

// ---------------------------------------------------------------------------
// Simplified AU resident income tax (2024–25 brackets, post Stage 3 cuts)
// plus a flat 2% Medicare levy. This ignores LITO, HECS/HELP repayments,
// the Medicare levy low-income threshold and surcharge — it's a general
// estimate for borrowing-power purposes, not a payslip calculator.
// ---------------------------------------------------------------------------
function estimateIncomeTax(gross) {
  let tax = 0;
  if (gross > 190000) tax = 51638 + 0.45 * (gross - 190000);
  else if (gross > 135000) tax = 31288 + 0.37 * (gross - 135000);
  else if (gross > 45000) tax = 4288 + 0.3 * (gross - 45000);
  else if (gross > 18200) tax = 0.16 * (gross - 18200);
  return tax;
}

function estimateNetAnnual(gross) {
  if (gross <= 0) return 0;
  const tax = estimateIncomeTax(gross);
  const medicare = gross * 0.02;
  return Math.max(0, gross - tax - medicare);
}

// Standard loan annuity formula solved for principal, given a fixed monthly
// repayment capacity, an assessment (buffered) monthly rate and term.
function maxLoanFromRepayment(monthlyRepayment, annualRatePct, termYears) {
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (monthlyRepayment <= 0) return 0;
  if (r === 0) return monthlyRepayment * n;
  return (monthlyRepayment * (1 - Math.pow(1 + r, -n))) / r;
}

const SERVICEABILITY_BUFFER = 3.0; // APRA-style buffer added to the actual rate for assessment
const LOAN_TERM_YEARS = 30;

const DEFAULT_INPUTS = {
  income: 75000,
  partnerIncome: 0,
  monthlyExpenses: 2200,
  monthlyDebts: 0,
  rate: 6.2,
  deposit: 60000,
};

export default function BorrowingPowerCalculator() {
  const [inputs, setInputs, cloudStatus] = useSyncedState("cc-first-home-inputs", DEFAULT_INPUTS);
  const { income, partnerIncome, monthlyExpenses, monthlyDebts, rate, deposit } = inputs;
  const setIncome = (v) => setInputs((p) => ({ ...p, income: v }));
  const setPartnerIncome = (v) => setInputs((p) => ({ ...p, partnerIncome: v }));
  const setMonthlyExpenses = (v) => setInputs((p) => ({ ...p, monthlyExpenses: v }));
  const setMonthlyDebts = (v) => setInputs((p) => ({ ...p, monthlyDebts: v }));
  const setRate = (v) => setInputs((p) => ({ ...p, rate: v }));
  const setDeposit = (v) => setInputs((p) => ({ ...p, deposit: v }));

  const result = useMemo(() => {
    const netAnnual = estimateNetAnnual(income) + estimateNetAnnual(partnerIncome);
    const netMonthly = netAnnual / 12;
    const surplus = netMonthly - monthlyExpenses - monthlyDebts;
    const assessmentRate = rate + SERVICEABILITY_BUFFER;
    const maxLoan = surplus > 0 ? maxLoanFromRepayment(surplus, assessmentRate, LOAN_TERM_YEARS) : 0;
    const estimatedPurchasePrice = maxLoan + Math.max(0, deposit);
    return { netAnnual, netMonthly, surplus, assessmentRate, maxLoan, estimatedPurchasePrice };
  }, [income, partnerIncome, monthlyExpenses, monthlyDebts, rate, deposit]);

  const hasSurplus = result.surplus > 0;

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: "rgba(212,169,79,0.12)", border: `1px solid ${COLORS.goldDim}` }}
        >
          <Calculator size={16} style={{ color: COLORS.gold }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
          Borrowing power calculator
        </h3>
        <SyncStatusBadge status={cloudStatus} />
      </div>
      <p className="text-xs mt-2 mb-6" style={{ color: COLORS.textMuted }}>
        A general estimate of what you might be able to borrow, based on income, expenses and a
        standard lender serviceability buffer. Not a pre-approval — every lender assesses this
        differently.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
        <div className="flex flex-col gap-5">
          <div>
            <FieldLabel hint="before tax">Your annual income</FieldLabel>
            <CurrencyInput value={income} onChange={setIncome} step={1000} />
          </div>
          <div>
            <FieldLabel hint="optional, before tax">Partner's annual income</FieldLabel>
            <CurrencyInput value={partnerIncome} onChange={setPartnerIncome} step={1000} />
          </div>
          <div>
            <FieldLabel hint="rent, bills, food, insurance etc.">Monthly living expenses</FieldLabel>
            <CurrencyInput value={monthlyExpenses} onChange={setMonthlyExpenses} step={50} />
          </div>
          <div>
            <FieldLabel hint="car loans, credit cards, HECS repayments">Existing monthly debt repayments</FieldLabel>
            <CurrencyInput value={monthlyDebts} onChange={setMonthlyDebts} step={25} />
          </div>
          <div>
            <FieldLabel hint="1.00% – 10.00%">Indicative interest rate</FieldLabel>
            <SliderWithReadout value={rate} onChange={setRate} min={1} max={10} step={0.05} decimals={2} suffix="%" />
          </div>
          <div>
            <FieldLabel hint="savings, FHSS release, gifts">Deposit you already have</FieldLabel>
            <CurrencyInput value={deposit} onChange={setDeposit} step={1000} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-6"
            style={{ background: "linear-gradient(135deg, #171F29 0%, #14100A 100%)", border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} style={{ color: COLORS.gold }} />
              <span className="text-xs uppercase tracking-wide font-medium" style={{ color: COLORS.textMuted }}>
                Estimated borrowing power
              </span>
              <InflationBadge>Estimate</InflationBadge>
            </div>
            <div className="font-display text-3xl md:text-4xl mt-2" style={{ color: COLORS.text }}>
              {hasSurplus ? fmtCurrency(result.maxLoan) : fmtCurrency(0)}
            </div>
            <div className="text-xs mt-2" style={{ color: COLORS.textFaint }}>
              Assessed at {result.assessmentRate.toFixed(2)}% over {LOAN_TERM_YEARS} years (your rate + a{" "}
              {SERVICEABILITY_BUFFER.toFixed(1)}pp lender buffer)
            </div>
          </div>

          <div className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.textMuted }}>Combined net income (monthly)</span>
              <span className="font-mono-fin" style={{ color: COLORS.text }}>{fmtCurrency(result.netMonthly)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.textMuted }}>Living expenses</span>
              <span className="font-mono-fin" style={{ color: COLORS.text }}>−{fmtCurrency(monthlyExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.textMuted }}>Existing debt repayments</span>
              <span className="font-mono-fin" style={{ color: COLORS.text }}>−{fmtCurrency(monthlyDebts)}</span>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-sm" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <span className="font-medium" style={{ color: COLORS.text }}>Monthly surplus</span>
              <span className="font-mono-fin font-medium" style={{ color: hasSurplus ? COLORS.gold : COLORS.ember }}>
                {fmtCurrency(result.surplus)}
              </span>
            </div>
          </div>

          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
            <PiggyBank size={20} style={{ color: COLORS.teal }} className="flex-shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-wide font-medium" style={{ color: COLORS.textMuted }}>
                Estimated purchase price
              </div>
              <div className="font-display text-xl" style={{ color: COLORS.text }}>
                {fmtCurrency(result.estimatedPurchasePrice)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.textFaint }}>
                Borrowing power + {fmtCurrency(deposit)} deposit
              </div>
            </div>
          </div>

          {!hasSurplus && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(194,86,46,0.10)", border: `1px solid ${COLORS.ember}66` }}>
              <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.ember }} />
              <div className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
                Your expenses and existing debts exceed your estimated take-home income, so there's no
                surplus left to service a loan in this scenario. Try lowering expenses/debts or adding a
                partner's income.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl p-4 mt-6 flex gap-2 text-xs" style={{ background: COLORS.surfaceRaised, color: COLORS.textFaint }}>
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          This is a general estimate only, not a loan pre-approval or personal advice. It assumes a{" "}
          {LOAN_TERM_YEARS}-year loan term, applies a {SERVICEABILITY_BUFFER.toFixed(1)} percentage point
          serviceability buffer on top of your indicative rate (similar to standard lender practice), and
          estimates take-home pay using simplified 2024–25 resident tax rates plus the 2% Medicare levy —
          it doesn't account for HECS/HELP indexation, the Medicare levy surcharge, other offsets, or any
          lender's specific credit policy. Real lenders will assess you differently.
        </span>
      </div>
    </div>
  );
}
