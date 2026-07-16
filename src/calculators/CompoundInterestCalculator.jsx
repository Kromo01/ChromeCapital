import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Landmark, Sparkles, Info, Wallet, Flame, Plus, X, Layers, Bookmark, Save, Trash2, ChevronDown, Upload } from "lucide-react";
import { COLORS, investmentColor, fmtCurrency, fmtCompact } from "../styles/tokens.js";
import { FieldLabel, CurrencyInput, SliderWithReadout, PillGroup, Checkbox, InflationBadge } from "../components/FormControls.jsx";
import SyncStatusBadge from "../components/SyncStatusBadge.jsx";
import { useSyncedState } from "../hooks/useSyncedState.js";
import StatementImport from "./StatementImport.jsx";
import ImportedPortfolio from "./ImportedPortfolio.jsx";

const SCENARIO_STORAGE_KEY = "cc-investment-scenarios";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEPOSIT_FREQUENCIES = [
  { key: "daily", label: "Daily", intervalDays: 1 },
  { key: "weekly", label: "Weekly", intervalDays: 7 },
  { key: "fortnightly", label: "Fortnightly", intervalDays: 14 },
  { key: "monthly", label: "Monthly", intervalDays: 365 / 12 },
  { key: "annually", label: "Annually", intervalDays: 365 },
];

const COMPOUND_FREQUENCIES = [
  { key: "monthly", label: "Monthly", intervalDays: 365 / 12 },
  { key: "annually", label: "Annually", intervalDays: 365 },
];

const BANK_RATE = 3.0;
const HISA_RATE = 5.0;
const BENCHMARK_COMPOUND_INTERVAL = 365 / 12; // banks/HISA assumed to compound monthly
const AVG_INFLATION = 2.5; // RBA long-run inflation target midpoint (2-3% band)

const makeInvestment = (n) => ({
  id: n,
  name: `Investment ${n}`,
  initial: n === 1 ? 5000 : 0,
  contribution: n === 1 ? 200 : 100,
  depositFreqKey: "monthly",
  rate: n === 1 ? 7.0 : 5.0,
  compoundFreqKey: "monthly",
  startDelayYears: 0,
  stopMode: "never", // 'never' | 'years' | 'value'
  stopAfterYears: 10,
  stopAtValue: 50000,
});

const STOP_MODES = [
  { key: "never", label: "Never" },
  { key: "years", label: "After years" },
  { key: "value", label: "At $ value" },
];

// ---------------------------------------------------------------------------
// Simulation engine
// ---------------------------------------------------------------------------
// Simulates a balance that accrues simple daily interest between compounding
// events, receives deposits from a prebuilt day->amount map, and rolls
// accrued interest into principal each time it compounds. Returns one
// snapshot per whole year (0..years). Used for the bank/HISA benchmarks,
// which just replay a fixed, already-realized cash flow.
function runEventSimulation({ depositMap, ratePct, compoundIntervalDays, compoundAnchorDay, totalDays, years }) {
  const dailyRate = ratePct / 100 / 365;

  const compoundDays = new Set();
  for (let k = 1; ; k++) {
    const d = compoundAnchorDay + Math.round(k * compoundIntervalDays);
    if (d > totalDays) break;
    compoundDays.add(d);
  }

  const snapshotDays = new Set();
  for (let y = 0; y <= years; y++) snapshotDays.add(y * 365);

  const allDays = Array.from(
    new Set([0, totalDays, compoundAnchorDay, ...depositMap.keys(), ...compoundDays, ...snapshotDays])
  ).sort((a, b) => a - b);

  let principal = 0;
  let accrued = 0;
  let cumulativeContributions = 0;
  let lastDay = 0;
  const snapshots = [];

  for (let i = 0; i < allDays.length; i++) {
    const d = allDays[i];
    const elapsed = d - lastDay;
    accrued += principal * dailyRate * elapsed;
    lastDay = d;

    if (depositMap.has(d)) {
      const amt = depositMap.get(d);
      principal += amt;
      cumulativeContributions += amt;
    }
    if (compoundDays.has(d)) {
      principal += accrued;
      accrued = 0;
    }
    if (snapshotDays.has(d)) {
      const total = principal + accrued;
      snapshots.push({
        year: Math.round(d / 365),
        contributions: cumulativeContributions,
        interest: total - cumulativeContributions,
        total,
      });
    }
  }

  return snapshots;
}

// Runs a single investment end-to-end: honours its start delay and, per
// stopMode, either never stops contributing, stops after a fixed number of
// years, or stops the first time its own balance (principal + accrued
// interest) reaches a target dollar value. Value-based stopping is checked
// at each scheduled contribution — once triggered it stays triggered, since
// balance never decreases in this model. Returns the yearly snapshots plus
// the *realized* deposit map (i.e. reflecting whichever deposits actually
// happened), so downstream bank/HISA comparisons replay exactly what occurred.
function simulateInvestment(inv, years) {
  const totalDays = Math.round(years * 365);
  const depositFreq = DEPOSIT_FREQUENCIES.find((f) => f.key === inv.depositFreqKey);
  const compoundFreq = COMPOUND_FREQUENCIES.find((f) => f.key === inv.compoundFreqKey);
  const startDay = Math.min(Math.round(inv.startDelayYears * 365), totalDays);

  const stopMode = inv.stopMode || "never";
  const timeStopDay =
    stopMode === "years" && inv.stopAfterYears > 0
      ? Math.min(startDay + Math.round(inv.stopAfterYears * 365), totalDays)
      : totalDays;
  const valueTarget = stopMode === "value" && inv.stopAtValue > 0 ? inv.stopAtValue : null;

  // Candidate deposit events (may be skipped later if a value target is hit).
  const depositsByDay = new Map();
  const pushEvent = (day, amount, kind) => {
    if (!depositsByDay.has(day)) depositsByDay.set(day, []);
    depositsByDay.get(day).push({ amount, kind });
  };
  if (startDay <= totalDays) {
    if (inv.initial > 0) pushEvent(startDay, inv.initial, "initial");
    if (inv.contribution > 0 && depositFreq.intervalDays > 0) {
      for (let k = 1; ; k++) {
        const d = startDay + Math.round(k * depositFreq.intervalDays);
        if (d > timeStopDay || d > totalDays) break;
        pushEvent(d, inv.contribution, "contribution");
      }
    }
  }

  const dailyRate = inv.rate / 100 / 365;
  const compoundDays = new Set();
  for (let k = 1; ; k++) {
    const d = startDay + Math.round(k * compoundFreq.intervalDays);
    if (d > totalDays) break;
    compoundDays.add(d);
  }
  const snapshotDays = new Set();
  for (let y = 0; y <= years; y++) snapshotDays.add(y * 365);

  const allDays = Array.from(
    new Set([0, totalDays, startDay, ...depositsByDay.keys(), ...compoundDays, ...snapshotDays])
  ).sort((a, b) => a - b);

  let principal = 0;
  let accrued = 0;
  let cumulativeContributions = 0;
  let lastDay = 0;
  let contributionsStopped = false;
  const realizedDepositMap = new Map();
  const snapshots = [];

  for (let i = 0; i < allDays.length; i++) {
    const d = allDays[i];
    const elapsed = d - lastDay;
    accrued += principal * dailyRate * elapsed;
    lastDay = d;

    if (depositsByDay.has(d)) {
      for (const ev of depositsByDay.get(d)) {
        if (ev.kind === "contribution") {
          if (contributionsStopped) continue;
          if (valueTarget != null && principal + accrued >= valueTarget) {
            contributionsStopped = true;
            continue;
          }
        }
        principal += ev.amount;
        cumulativeContributions += ev.amount;
        realizedDepositMap.set(d, (realizedDepositMap.get(d) || 0) + ev.amount);
      }
    }
    if (compoundDays.has(d)) {
      principal += accrued;
      accrued = 0;
    }
    if (snapshotDays.has(d)) {
      const total = principal + accrued;
      snapshots.push({
        year: Math.round(d / 365),
        contributions: cumulativeContributions,
        interest: total - cumulativeContributions,
        total,
      });
    }
  }

  return { snapshots, depositMap: realizedDepositMap };
}

// ---------------------------------------------------------------------------
// Small building blocks
// (FieldLabel, CurrencyInput, SliderWithReadout, PillGroup, Checkbox,
// InflationBadge now live in components/FormControls.jsx and are imported)
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div
      className="rounded-xl p-4 flex-1"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-xs uppercase tracking-wide font-medium" style={{ color: COLORS.textMuted }}>
          {label}
        </span>
      </div>
      <div className="font-display text-xl md:text-2xl" style={{ color: COLORS.text }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: COLORS.textFaint }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs font-mono-fin"
      style={{ background: "#0E141C", border: `1px solid ${COLORS.border}`, color: COLORS.text }}
    >
      <div className="mb-1 font-semibold" style={{ color: COLORS.textMuted }}>
        Year {label}
      </div>
      {payload
        .slice()
        .reverse()
        .map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span>{fmtCurrency(p.value)}</span>
          </div>
        ))}
    </div>
  );
}

function InvestmentCard({ investment, index, years, onChange, onRemove, canRemove }) {
  const accent = investmentColor(index);
  const startsAfterHorizon = years > 0 && investment.startDelayYears >= years;
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-4"
      style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={investment.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none"
          style={{ color: COLORS.text }}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 rounded-md p-1 transition-colors"
            style={{ color: COLORS.textFaint }}
            aria-label={`Remove ${investment.name}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Initial</FieldLabel>
          <CurrencyInput value={investment.initial} onChange={(v) => onChange("initial", v)} step={500} />
        </div>
        <div>
          <FieldLabel>Contribution</FieldLabel>
          <CurrencyInput value={investment.contribution} onChange={(v) => onChange("contribution", v)} step={10} />
        </div>
      </div>

      <div>
        <FieldLabel>Deposit frequency</FieldLabel>
        <PillGroup options={DEPOSIT_FREQUENCIES} value={investment.depositFreqKey} onChange={(v) => onChange("depositFreqKey", v)} />
      </div>

      <div>
        <FieldLabel>Compound frequency</FieldLabel>
        <PillGroup options={COMPOUND_FREQUENCIES} value={investment.compoundFreqKey} onChange={(v) => onChange("compoundFreqKey", v)} />
      </div>

      <div>
        <FieldLabel hint="0.00 – 10.00%">Annual interest rate</FieldLabel>
        <SliderWithReadout
          value={investment.rate}
          onChange={(v) => onChange("rate", v)}
          min={0}
          max={10}
          step={0.01}
          decimals={2}
          suffix="%"
        />
      </div>

      <div>
        <FieldLabel hint="0 = starts today">Delay start by</FieldLabel>
        <SliderWithReadout
          value={investment.startDelayYears}
          onChange={(v) => onChange("startDelayYears", v)}
          min={0}
          max={50}
          step={1}
          suffix="yrs"
        />
        {startsAfterHorizon && (
          <div className="text-xs mt-1.5" style={{ color: COLORS.ember }}>
            Starts after your time horizon ends — this investment won't contribute.
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Stop contributing</FieldLabel>
        <PillGroup options={STOP_MODES} value={investment.stopMode} onChange={(v) => onChange("stopMode", v)} />

        {investment.stopMode === "years" && (
          <div className="mt-2.5">
            <SliderWithReadout
              value={investment.stopAfterYears}
              onChange={(v) => onChange("stopAfterYears", v)}
              min={1}
              max={50}
              step={1}
              suffix="yrs"
            />
            <div className="text-xs mt-1.5" style={{ color: COLORS.textFaint }}>
              Contributions stop {investment.stopAfterYears} {investment.stopAfterYears === 1 ? "year" : "years"} after
              this investment starts.
            </div>
          </div>
        )}

        {investment.stopMode === "value" && (
          <div className="mt-2.5">
            <CurrencyInput value={investment.stopAtValue} onChange={(v) => onChange("stopAtValue", v)} step={1000} />
            <div className="text-xs mt-1.5" style={{ color: COLORS.textFaint }}>
              Contributions stop the first time this investment's balance reaches this amount.
            </div>
            {investment.initial > 0 && investment.stopAtValue > 0 && investment.initial >= investment.stopAtValue && (
              <div className="text-xs mt-1.5" style={{ color: COLORS.ember }}>
                Your initial investment already meets or exceeds this target — no contributions will be made.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const WORKING_STATE_KEY = "cc-investment-working-state";

export default function CompoundInterestCalculator() {
  const idCounter = useRef(1);

  // The live, editable working state — synced so it survives navigating away
  // and back, not just when explicitly saved as a named Scenario below.
  const [workingState, setWorkingState, workingCloudStatus] = useSyncedState(WORKING_STATE_KEY, {
    investments: [makeInvestment(1)],
    years: 20,
    todaysDollars: false,
  });
  const { investments, years, todaysDollars } = workingState;

  const setField = (field) => (valueOrUpdater) => {
    setWorkingState((prev) => ({
      ...prev,
      [field]: typeof valueOrUpdater === "function" ? valueOrUpdater(prev[field]) : valueOrUpdater,
    }));
  };
  const setInvestments = setField("investments");
  const setYears = setField("years");
  const setTodaysDollars = setField("todaysDollars");

  // Keeps the id counter ahead of whatever's loaded (local cache or cloud
  // pull) so a freshly-added investment never collides with an existing id.
  useEffect(() => {
    const maxId = investments.reduce((m, inv) => Math.max(m, inv.id), 0);
    idCounter.current = Math.max(idCounter.current, maxId);
  }, [investments]);

  // Real holdings pulled from an imported investment statement PDF (Vanguard,
  // CommSec, SelfWealth, Pearler, Stake) — kept separate from the
  // hypothetical scenario above, synced per-account.
  const [importedPortfolio, setImportedPortfolio] = useSyncedState("cc-imported-portfolio", null);

  const handleStatementImport = (parsed) => {
    setImportedPortfolio(parsed);
    if (parsed.applyToCalculator && parsed.closingValue != null) {
      setInvestments((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          initial: Math.round(parsed.closingValue),
          contribution: parsed.suggestedContribution ?? updated[0].contribution,
          depositFreqKey: "monthly",
        };
        return updated;
      });
    }
  };

  // -------------------------------------------------------------------
  // Scenarios: named, persisted snapshots of the working state above.
  // Stored as one blob (index + scenario data together) via useSyncedState,
  // which saves to localStorage for guests and syncs to Firestore once
  // signed in — so scenarios follow the account across devices.
  // -------------------------------------------------------------------
  const [scenarioStore, setScenarioStore, scenarioCloudStatus] = useSyncedState(SCENARIO_STORAGE_KEY, {
    index: [],
    scenarios: {},
  });
  const scenarios = scenarioStore.index;
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioBusy, setScenarioBusy] = useState(false);
  const [scenarioError, setScenarioError] = useState(null);
  const lastSavedSnapshotRef = useRef(null);

  const currentSnapshot = () => JSON.stringify({ investments, years, todaysDollars });
  const isDirty = activeScenarioId != null && lastSavedSnapshotRef.current !== null && currentSnapshot() !== lastSavedSnapshotRef.current;

  const saveScenario = async () => {
    const name = scenarioName.trim() || "Untitled scenario";
    setScenarioBusy(true);
    setScenarioError(null);
    try {
      const id = activeScenarioId || `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const savedAt = Date.now();
      const snapshot = { investments, years, todaysDollars };
      const payload = { name, data: snapshot, savedAt };

      const updatedIndex = [...scenarios.filter((s) => s.id !== id), { id, name, savedAt }].sort(
        (a, b) => b.savedAt - a.savedAt
      );
      setScenarioStore((prev) => ({
        index: updatedIndex,
        scenarios: { ...prev.scenarios, [id]: payload },
      }));

      lastSavedSnapshotRef.current = JSON.stringify(snapshot);
      setActiveScenarioId(id);
      setScenarioName(name);
    } catch (e) {
      setScenarioError("Couldn't save this scenario — please try again.");
    } finally {
      setScenarioBusy(false);
    }
  };

  const loadScenario = async (id) => {
    setScenarioBusy(true);
    setScenarioError(null);
    try {
      const parsed = scenarioStore.scenarios[id];
      if (!parsed) throw new Error("Scenario not found");

      setInvestments(parsed.data.investments);
      setYears(parsed.data.years);
      setTodaysDollars(parsed.data.todaysDollars);
      setActiveScenarioId(id);
      setScenarioName(parsed.name);
      lastSavedSnapshotRef.current = JSON.stringify(parsed.data);
    } catch (e) {
      setScenarioError("Couldn't load that scenario.");
    } finally {
      setScenarioBusy(false);
    }
  };

  const deleteScenario = async (id) => {
    setScenarioBusy(true);
    setScenarioError(null);
    setScenarioStore((prev) => {
      const { [id]: _removed, ...rest } = prev.scenarios;
      return { index: prev.index.filter((s) => s.id !== id), scenarios: rest };
    });
    if (activeScenarioId === id) {
      setActiveScenarioId(null);
      lastSavedSnapshotRef.current = null;
    }
    setScenarioBusy(false);
  };

  const startNewScenario = () => {
    idCounter.current += 1;
    setInvestments([makeInvestment(idCounter.current)]);
    setYears(20);
    setTodaysDollars(false);
    setActiveScenarioId(null);
    setScenarioName("");
    lastSavedSnapshotRef.current = null;
    setScenarioError(null);
  };

  const updateInvestment = (id, field, value) => {
    setInvestments((prev) => prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv)));
  };

  const addInvestment = () => {
    idCounter.current += 1;
    setInvestments((prev) => [...prev, makeInvestment(idCounter.current)]);
  };

  const removeInvestment = (id) => {
    setInvestments((prev) => (prev.length > 1 ? prev.filter((inv) => inv.id !== id) : prev));
  };

  const totalDays = Math.round(years * 365);

  // Simulate each investment independently at its own rate/compounding/timing.
  const perInvestmentData = useMemo(
    () => investments.map((inv) => ({ investment: inv, ...simulateInvestment(inv, years) })),
    [investments, years]
  );

  // Aggregate all investments into a single portfolio-level series, year by year.
  const portfolioData = useMemo(() => {
    const byYearMaps = perInvestmentData.map(({ snapshots }) => new Map(snapshots.map((s) => [s.year, s])));
    const rows = [];
    for (let y = 0; y <= years; y++) {
      let contributions = 0;
      let interest = 0;
      let total = 0;
      byYearMaps.forEach((map) => {
        const s = map.get(y);
        if (s) {
          contributions += s.contributions;
          interest += s.interest;
          total += s.total;
        }
      });
      rows.push({ year: y, contributions, interest, total });
    }
    return rows;
  }, [perInvestmentData, years]);

  // Merge every investment's actual deposit schedule into one combined cash
  // flow, so the bank/HISA comparison reflects exactly the same money on
  // exactly the same timing — just earning a flat benchmark rate instead.
  const combinedDepositMap = useMemo(() => {
    const map = new Map();
    perInvestmentData.forEach(({ depositMap }) => {
      depositMap.forEach((amt, day) => map.set(day, (map.get(day) || 0) + amt));
    });
    return map;
  }, [perInvestmentData]);

  const bankSnapshots = useMemo(
    () =>
      runEventSimulation({
        depositMap: combinedDepositMap,
        ratePct: BANK_RATE,
        compoundIntervalDays: BENCHMARK_COMPOUND_INTERVAL,
        compoundAnchorDay: 0,
        totalDays,
        years,
      }),
    [combinedDepositMap, totalDays, years]
  );

  const hisaSnapshots = useMemo(
    () =>
      runEventSimulation({
        depositMap: combinedDepositMap,
        ratePct: HISA_RATE,
        compoundIntervalDays: BENCHMARK_COMPOUND_INTERVAL,
        compoundAnchorDay: 0,
        totalDays,
        years,
      }),
    [combinedDepositMap, totalDays, years]
  );

  // Deflates a nominal-dollar snapshot series into today's purchasing power.
  const toRealSeries = (data) => {
    if (!todaysDollars) return data;
    return data.map((row) => {
      const factor = Math.pow(1 + AVG_INFLATION / 100, row.year);
      return {
        year: row.year,
        contributions: row.contributions / factor,
        interest: row.interest / factor,
        total: row.total / factor,
      };
    });
  };

  const displayPortfolioData = useMemo(() => toRealSeries(portfolioData), [portfolioData, todaysDollars]);
  const displayBankData = useMemo(() => toRealSeries(bankSnapshots), [bankSnapshots, todaysDollars]);
  const displayHisaData = useMemo(() => toRealSeries(hisaSnapshots), [hisaSnapshots, todaysDollars]);

  // Annotate each year with the marginal (that-year-only) interest and
  // contribution amounts — used by the new table column, the chart bars, and
  // the boiling point calculation.
  const chartData = useMemo(() => {
    return displayPortfolioData.map((row, i) => {
      if (i === 0) return { ...row, yearlyInterest: 0, yearlyContribution: row.contributions };
      const prev = displayPortfolioData[i - 1];
      return {
        ...row,
        yearlyInterest: row.interest - prev.interest,
        yearlyContribution: row.contributions - prev.contributions,
      };
    });
  }, [displayPortfolioData]);

  const comparisonData = useMemo(
    () =>
      displayPortfolioData.map((row, i) => ({
        year: row.year,
        invest: row.total,
        bank: displayBankData[i] ? displayBankData[i].total : null,
        hisa: displayHisaData[i] ? displayHisaData[i].total : null,
      })),
    [displayPortfolioData, displayBankData, displayHisaData]
  );

  // Per-investment final balances, for the at-a-glance summary row.
  const investmentFinals = useMemo(() => {
    const factor = todaysDollars ? Math.pow(1 + AVG_INFLATION / 100, years) : 1;
    return perInvestmentData.map(({ investment, snapshots }) => {
      const byYear = new Map(snapshots.map((s) => [s.year, s]));
      const final = byYear.get(years) || { contributions: 0, interest: 0, total: 0 };
      return {
        id: investment.id,
        name: investment.name,
        rate: investment.rate,
        total: final.total / factor,
      };
    });
  }, [perInvestmentData, years, todaysDollars]);

  const finalInvest = displayPortfolioData[displayPortfolioData.length - 1];
  const finalBank = displayBankData[displayBankData.length - 1];
  const finalHisa = displayHisaData[displayHisaData.length - 1];

  const extraVsBank = finalInvest.total - finalBank.total;
  const extraVsHisa = finalInvest.total - finalHisa.total;
  const totalContributed = finalInvest.contributions;

  // "Boiling point": the first year where interest earned during that year
  // exceeds the amount contributed (across the whole portfolio) that year.
  const boilingPoint = useMemo(() => {
    for (let i = 1; i < chartData.length; i++) {
      const row = chartData[i];
      if (row.yearlyInterest > row.yearlyContribution) {
        return { year: row.year, yearlyInterest: row.yearlyInterest, yearlyContribution: row.yearlyContribution, total: row.total };
      }
    }
    return null;
  }, [chartData]);

  return (
    <div>
      <div className="max-w-8xl mx-auto px-5 md:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Compact header + Scenarios dropdown (kept out of the vertical flow) */}
        {/* ---------------------------------------------------------------- */}
        <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: "rgba(212,169,79,0.12)", border: `1px solid ${COLORS.goldDim}` }}
            >
              <TrendingUp size={16} style={{ color: COLORS.gold }} />
            </div>
            <h1 className="font-display text-xl md:text-2xl" style={{ color: COLORS.text }}>
              Compound Interest Calculator
            </h1>
            <SyncStatusBadge status={workingCloudStatus} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
          <details className="relative">
            <summary
              className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-full px-3.5 py-2 text-xs font-medium"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
            >
              <Bookmark size={13} style={{ color: COLORS.gold }} />
              Scenarios
              <span style={{ color: COLORS.textFaint }}>
                {scenarios.length > 0 ? `(${scenarios.length})` : ""}
              </span>
              <ChevronDown size={13} className="transition-transform [details[open]_&]:rotate-180" />
            </summary>

            <div
              className="absolute right-0 mt-2 w-80 rounded-2xl p-4 z-30 flex flex-col gap-3"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
            >
              <p className="text-xs" style={{ color: COLORS.textFaint }}>
                Save your current setup, then build another to compare against it.
              </p>

              {scenarios.length === 0 ? (
                <div className="text-xs" style={{ color: COLORS.textFaint }}>
                  No saved scenarios yet.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {scenarios.map((s) => {
                    const active = s.id === activeScenarioId;
                    return (
                      <div
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => !scenarioBusy && loadScenario(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !scenarioBusy) loadScenario(s.id);
                        }}
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors"
                        style={{
                          background: active ? "rgba(212,169,79,0.12)" : COLORS.surfaceRaised,
                          border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
                        }}
                      >
                        <span className="text-sm truncate" style={{ color: active ? COLORS.gold : COLORS.text }}>
                          {s.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!scenarioBusy) deleteScenario(s.id);
                          }}
                          className="flex-shrink-0 rounded p-1"
                          style={{ color: COLORS.textFaint }}
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Scenario name"
                  className="rounded-lg px-3 py-2 text-sm bg-transparent outline-none"
                  style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveScenario}
                    disabled={scenarioBusy}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors"
                    style={{ background: COLORS.gold, color: "#161006", opacity: scenarioBusy ? 0.6 : 1 }}
                  >
                    <Save size={13} />
                    {activeScenarioId ? "Update" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={startNewScenario}
                    disabled={scenarioBusy}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors"
                    style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, opacity: scenarioBusy ? 0.6 : 1 }}
                  >
                    <Plus size={13} /> New
                  </button>
                </div>
                {isDirty && (
                  <div className="text-xs" style={{ color: COLORS.ember }}>
                    Unsaved changes to "{scenarioName || "this scenario"}"
                  </div>
                )}
                {scenarioError && (
                  <div className="text-xs" style={{ color: COLORS.ember }}>
                    {scenarioError}
                  </div>
                )}
              </div>
            </div>
          </details>

          <details className="relative">
            <summary
              className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-full px-3.5 py-2 text-xs font-medium"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
            >
              <Upload size={13} style={{ color: COLORS.gold }} />
              Import statement
              <ChevronDown size={13} className="transition-transform [details[open]_&]:rotate-180" />
            </summary>

            <div
              className="absolute right-0 mt-2 w-[22rem] max-h-[70vh] overflow-y-auto rounded-2xl p-4 z-30"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
            >
              <StatementImport onImport={handleStatementImport} />
            </div>
          </details>
          </div>
        </header>

        {/* -------------------------------------------------------------- */}
        {/* Single stacked column: investments, then settings, then the   */}
        {/* results/graph — in that order, top to bottom.                 */}
        {/* -------------------------------------------------------------- */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2">
              <Layers size={15} style={{ color: COLORS.gold }} />
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                Your investments
              </h2>
            </div>

            {investments.map((inv, i) => (
              <InvestmentCard
                key={inv.id}
                investment={inv}
                index={i}
                years={years}
                onChange={(field, value) => updateInvestment(inv.id, field, value)}
                onRemove={() => removeInvestment(inv.id)}
                canRemove={investments.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={addInvestment}
              className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors"
              style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textMuted }}
            >
              <Plus size={14} /> Add another investment
            </button>
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                Overall settings
              </h2>
              <button
                type="button"
                onClick={() => setTodaysDollars((v) => !v)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: todaysDollars ? COLORS.gold : "transparent",
                  color: todaysDollars ? "#161006" : COLORS.textMuted,
                  border: `1px solid ${todaysDollars ? COLORS.gold : COLORS.border}`,
                }}
                title={`Adjust all figures for inflation (${AVG_INFLATION.toFixed(2)}% p.a. average)`}
              >
                Today's Dollars
              </button>
            </div>
            <div>
              <FieldLabel hint="0 – 50 years">Time horizon</FieldLabel>
              <SliderWithReadout value={years} onChange={setYears} min={0} max={50} step={1} suffix="yrs" />
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            {/* Hero stat */}
            <div
              className="rounded-2xl p-5"
              style={{ background: `linear-gradient(135deg, ${COLORS.surface} 0%, #141B24 100%)`, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} style={{ color: COLORS.gold }} />
                <span className="text-xs uppercase tracking-wide font-medium" style={{ color: COLORS.textMuted }}>
                  Balance after {years} {years === 1 ? "year" : "years"}
                </span>
                {todaysDollars && <InflationBadge>Today's dollars</InflationBadge>}
              </div>
              <div className="font-display text-3xl md:text-4xl mb-3" style={{ color: COLORS.text }}>
                {fmtCurrency(finalInvest.total)}
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono-fin"
                  style={{ background: "rgba(107,118,132,0.15)", color: COLORS.text }}
                >
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS.slate }} />
                  Contributions {fmtCurrency(finalInvest.contributions)}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono-fin"
                  style={{ background: "rgba(212,169,79,0.15)", color: COLORS.text }}
                >
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS.gold }} />
                  Compound interest {fmtCurrency(finalInvest.interest)}
                </span>
              </div>
            </div>

            {/* Per-investment summary (only when there's more than one) */}
            {investmentFinals.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {investmentFinals.map((f, i) => (
                  <div
                    key={f.id}
                    className="rounded-xl p-4"
                    style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${investmentColor(i)}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: COLORS.textMuted }}>
                        {f.name}
                      </span>
                      <span className="text-xs font-mono-fin" style={{ color: COLORS.textFaint }}>
                        {f.rate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="font-display text-lg" style={{ color: COLORS.text }}>
                      {fmtCurrency(f.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Growth chart */}
            <div className="rounded-2xl p-4 flex flex-col" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  Investment Growth
                </h3>
                {todaysDollars && <InflationBadge>Today's dollars</InflationBadge>}
              </div>
              <div className="h-[320px] sm:h-[420px] lg:h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.goldBright} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={COLORS.gold} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="slateFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.slate} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={COLORS.slate} stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: COLORS.textFaint, fontSize: 11 }}
                      axisLine={{ stroke: COLORS.border }}
                      tickLine={false}
                      label={{ value: "Years", position: "insideBottom", offset: -2, fill: COLORS.textFaint, fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: COLORS.textFaint, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={fmtCompact}
                      width={64}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: COLORS.ember, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={fmtCompact}
                      width={64}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      yAxisId="right"
                      dataKey="yearlyInterest"
                      name="Yearly interest earned"
                      fill={COLORS.ember}
                      fillOpacity={0.38}
                      radius={[2, 2, 0, 0]}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="contributions"
                      name="Contributions"
                      stackId="1"
                      stroke={COLORS.slate}
                      strokeWidth={1.5}
                      fill="url(#slateFill)"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="interest"
                      name="Compound interest"
                      stackId="1"
                      stroke={COLORS.gold}
                      strokeWidth={1.5}
                      fill="url(#goldFill)"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="total"
                      name="Total balance"
                      stroke={COLORS.text}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: COLORS.text, stroke: COLORS.bg, strokeWidth: 2 }}
                    />
                    {boilingPoint && (
                      <ReferenceLine
                        yAxisId="left"
                        x={boilingPoint.year}
                        stroke={COLORS.ember}
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                        label={{ value: "Boiling point", position: "top", fill: COLORS.ember, fontSize: 11, fontWeight: 600 }}
                      />
                    )}
                    {boilingPoint && (
                      <ReferenceDot
                        yAxisId="left"
                        x={boilingPoint.year}
                        y={boilingPoint.total}
                        r={5}
                        fill={COLORS.ember}
                        stroke={COLORS.bg}
                        strokeWidth={2}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs">
                <span className="inline-flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
                  <span className="inline-block w-2.5 h-0.5" style={{ background: COLORS.text }} /> Total balance
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS.gold }} /> Compound interest
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS.slate }} /> Contributions
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
                  <span className="inline-block w-2.5 h-2 rounded-sm" style={{ background: COLORS.ember, opacity: 0.6 }} /> Yearly interest earned (right axis)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Below the fold: secondary detail, fine to scroll to.           */}
        {/* -------------------------------------------------------------- */}
        <div className="flex flex-col gap-6 mt-6">
          {boilingPoint ? (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: "rgba(194,86,46,0.10)", border: `1px solid ${COLORS.ember}66` }}
            >
              <Flame size={18} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.ember }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  Boiling point: Year {boilingPoint.year}
                </div>
                <div className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.textMuted }}>
                  In year {boilingPoint.year}, the compound interest earned that year —{" "}
                  <span className="font-mono-fin" style={{ color: COLORS.text }}>{fmtCurrency(boilingPoint.yearlyInterest)}</span>{" "}
                  — overtakes what you contributed that year —{" "}
                  <span className="font-mono-fin" style={{ color: COLORS.text }}>{fmtCurrency(boilingPoint.yearlyContribution)}</span>{" "}
                  — for the first time. Balance at that point:{" "}
                  <span className="font-mono-fin" style={{ color: COLORS.text }}>{fmtCurrency(boilingPoint.total)}</span>
                  . From here, compounding is doing more of the work than you are.
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}
            >
              <Flame size={18} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.textFaint }} />
              <div className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
                No boiling point within {years} {years === 1 ? "year" : "years"} at this rate — annual
                contributions still outweigh annual interest throughout. Try a longer time horizon, a
                higher rate, or a smaller regular contribution.
              </div>
            </div>
          )}

          <div className="rounded-lg p-3 flex gap-2 text-xs" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textFaint }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.textFaint }} />
            <span>
              Estimates only. Nominal figures — not adjusted for tax or fees, and only adjusted for
              inflation when Today's Dollars is ticked. See assumptions below.
            </span>
          </div>

          {importedPortfolio && (
            <ImportedPortfolio portfolio={importedPortfolio} onClear={() => setImportedPortfolio(null)} />
          )}

          {/* Table */}
            <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  Year-by-year breakdown
                </h3>
                {todaysDollars && <InflationBadge>Today's dollars</InflationBadge>}
              </div>
              <div className="fin-table overflow-auto" style={{ maxHeight: 360 }}>
                <table className="w-full text-sm font-mono-fin" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ position: "sticky", top: 0, background: COLORS.surface }}>
                      {["Year", "Contributions", "Yearly interest earned", "Interest earned", "Total balance"].map((h, i) => (
                        <th
                          key={h}
                          className="text-xs font-medium uppercase tracking-wide py-2"
                          style={{ color: COLORS.textMuted, textAlign: i === 0 ? "left" : "right", borderBottom: `1px solid ${COLORS.border}` }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={row.year} className="fin-row" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                        <td className="py-2" style={{ color: COLORS.textMuted }}>
                          {row.year}
                        </td>
                        <td className="py-2 text-right" style={{ color: COLORS.text }}>
                          {fmtCurrency(row.contributions)}
                        </td>
                        <td className="py-2 text-right" style={{ color: COLORS.ember }}>
                          {i === 0 ? "—" : fmtCurrency(row.yearlyInterest)}
                        </td>
                        <td className="py-2 text-right" style={{ color: COLORS.gold }}>
                          {fmtCurrency(row.interest)}
                        </td>
                        <td className="py-2 text-right font-medium" style={{ color: COLORS.text }}>
                          {fmtCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comparison */}
            <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  Investing vs. a bank account
                </h3>
                {todaysDollars && <InflationBadge>Today's dollars</InflationBadge>}
              </div>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Same contributions, same schedule — just compared at three different interest rates.
              </p>

              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: COLORS.textFaint, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} width={64} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="invest" name="Your investments" stroke={COLORS.gold} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="hisa" name={`High-interest savings (${HISA_RATE.toFixed(2)}%)`} stroke={COLORS.teal} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="bank" name={`Bank account (${BANK_RATE.toFixed(2)}%)`} stroke={COLORS.slate} strokeWidth={2} strokeDasharray="4 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 mb-5 text-xs">
                <span className="inline-flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
                  <span className="inline-block w-2.5 h-0.5" style={{ background: COLORS.gold }} /> Your investments
                </span>
                <span className="inline-flex items-center gap-1.5 ml-3" style={{ color: COLORS.textMuted }}>
                  <span className="inline-block w-2.5 h-0.5" style={{ background: COLORS.teal }} /> High-interest savings
                </span>
                <span className="inline-flex items-center gap-1.5 ml-3" style={{ color: COLORS.textMuted }}>
                  <span className="inline-block w-2.5 h-0.5" style={{ background: COLORS.slate }} /> Bank account
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard
                  icon={Landmark}
                  label="Bank account"
                  value={fmtCurrency(finalBank.total)}
                  sub={extraVsBank >= 0 ? `${fmtCurrency(extraVsBank)} less than investing` : `${fmtCurrency(-extraVsBank)} more than investing`}
                  accent={COLORS.slate}
                />
                <StatCard
                  icon={Wallet}
                  label="High-interest savings"
                  value={fmtCurrency(finalHisa.total)}
                  sub={extraVsHisa >= 0 ? `${fmtCurrency(extraVsHisa)} less than investing` : `${fmtCurrency(-extraVsHisa)} more than investing`}
                  accent={COLORS.teal}
                />
                <StatCard icon={TrendingUp} label="Your investments" value={fmtCurrency(finalInvest.total)} sub={`${fmtCurrency(totalContributed)} contributed`} accent={COLORS.gold} />
              </div>

              <div className="rounded-xl p-4 mt-4 flex flex-col md:flex-row gap-4" style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: COLORS.textMuted }}>
                    Extra vs. a bank account
                  </div>
                  <div className="font-display text-xl" style={{ color: COLORS.gold }}>
                    {fmtCurrency(extraVsBank)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: COLORS.textMuted }}>
                    Extra vs. high-interest savings
                  </div>
                  <div className="font-display text-xl" style={{ color: COLORS.gold }}>
                    {fmtCurrency(extraVsHisa)}
                  </div>
                </div>
              </div>
            </div>

            {/* Assumptions / disclaimer */}
            <div className="rounded-2xl p-5 text-xs leading-relaxed" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}>
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} style={{ color: COLORS.textFaint }} />
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  Assumptions
                </h3>
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Bank account comparison assumes a rate of {BANK_RATE.toFixed(2)}% p.a., compounding monthly.</li>
                <li>High-interest savings account comparison assumes {HISA_RATE.toFixed(2)}% p.a., compounding monthly.</li>
                <li>Each investment's initial deposit is invested on the day that investment starts (today, or after its delay).</li>
                <li>
                  Regular contributions are made at the end of each period — day, week, fortnight, month or
                  year — according to each investment's deposit frequency, until it stops (if you've set it
                  to stop) or the end of the time horizon.
                </li>
                <li>
                  When stopping by dollar value, contributions cease the first time that investment's own
                  balance (including compounded interest) reaches the target — the balance keeps compounding
                  afterwards, it just stops receiving new money.
                </li>
                <li>
                  The bank/HISA comparison replicates the exact combined timing of every dollar across all of
                  your investments — including delayed starts and contributions that stop early — but assumes
                  it all earned the flat benchmark rate instead.
                </li>
                <li>
                  The "boiling point" compares total portfolio interest earned in a given year against total
                  portfolio contributions in that same year, across all investments combined.
                </li>
                <li>
                  Figures are nominal — they don't account for taxes, fees or brokerage — and assume a
                  constant rate of return, which real investments don't provide.
                </li>
                <li>
                  "Today's Dollars" converts each year's nominal figures into today's purchasing power using
                  an assumed average inflation rate of {AVG_INFLATION.toFixed(2)}% p.a. — the midpoint of the
                  RBA's long-run 2–3% inflation target. Actual inflation varies year to year and is not
                  guaranteed to average {AVG_INFLATION.toFixed(2)}% going forward.
                </li>
                <li>This tool is general information only, not financial advice.</li>
              </ul>
            </div>
        </div>
      </div>
    </div>
  );
}
