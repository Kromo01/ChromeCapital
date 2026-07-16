import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  Receipt,
  CreditCard,
  ListChecks,
  Plus,
  Trash2,
  Info,
  Layers,
  Gauge,
  Scale,
  PieChart as PieIcon,
} from "lucide-react";
import { COLORS, fmtCurrency } from "../styles/tokens.js";
import { FieldLabel, CurrencyInput } from "../components/FormControls.jsx";
import BankStatementImport from "./BankStatementImport.jsx";
import SyncStatusBadge from "../components/SyncStatusBadge.jsx";
import { useSyncedState } from "../hooks/useSyncedState.js";

const STORAGE_KEY = "cc-budget-dashboard-v1";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDaysIso = (isoDate, days) => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Blank by default — every visitor adds their own categories. Nothing here
// is pre-filled with anyone's real data. Start/end date default to a
// one-month window from today — purely informational, doesn't drive any
// calculation.
const DEFAULT_STATE = {
  startDate: todayIso(),
  endDate: plusDaysIso(todayIso(), 30),
  startBalance: 0,
  income: [],
  savings: [],
  bills: [],
  debts: [],
  expenseCategories: [],
  transactions: [],
};

const sum = (arr, key) => arr.reduce((t, x) => t + (Number(x[key]) || 0), 0);

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function NameInput({ value, onChange, placeholder = "Name" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm outline-none min-w-0"
      style={{ color: COLORS.text }}
    />
  );
}

function RowShell({ children, onRemove }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2.5 rounded-lg px-3 py-2.5"
      style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 rounded-md p-1.5 ml-auto"
        style={{ color: COLORS.textFaint }}
        aria-label="Remove"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function BudgetActualRow({ item, onChange, onRemove }) {
  return (
    <RowShell onRemove={onRemove}>
      <div className="min-w-[9rem] flex-1">
        <NameInput value={item.name} onChange={(v) => onChange("name", v)} />
      </div>
      <div className="w-28 flex-shrink-0">
        <CurrencyInput value={item.budget} onChange={(v) => onChange("budget", v)} step={10} />
      </div>
      <div className="w-28 flex-shrink-0">
        <CurrencyInput value={item.actual} onChange={(v) => onChange("actual", v)} step={10} />
      </div>
    </RowShell>
  );
}

function BillRow({ item, onChange, onRemove }) {
  return (
    <RowShell onRemove={onRemove}>
      <div className="min-w-[8rem] flex-1">
        <NameInput value={item.name} onChange={(v) => onChange("name", v)} />
      </div>
      <div className="w-16 flex-shrink-0">
        <input
          type="text"
          value={item.due}
          onChange={(e) => onChange("due", e.target.value)}
          placeholder="Due"
          className="w-full bg-transparent text-xs outline-none text-center rounded-md py-1.5"
          style={{ color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
        />
      </div>
      <div className="w-24 flex-shrink-0">
        <CurrencyInput value={item.budget} onChange={(v) => onChange("budget", v)} step={5} />
      </div>
      <div className="w-24 flex-shrink-0">
        <CurrencyInput value={item.actual} onChange={(v) => onChange("actual", v)} step={5} />
      </div>
    </RowShell>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors"
      style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textMuted }}
    >
      <Plus size={13} /> {label}
    </button>
  );
}

function SectionCard({ icon: Icon, title, hint, budgetTotal, actualTotal, children, footer, accent = COLORS.gold }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
            style={{ background: `${accent}22`, border: `1px solid ${accent}55` }}
          >
            <Icon size={13} style={{ color: accent }} />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
            {title}
          </h2>
        </div>
        {budgetTotal != null && (
          <div className="text-right">
            <div className="text-xs font-mono-fin" style={{ color: COLORS.textFaint }}>
              Budget {fmtCurrency(budgetTotal)}
            </div>
            <div className="text-xs font-mono-fin" style={{ color: COLORS.gold }}>
              Actual {fmtCurrency(actualTotal)}
            </div>
          </div>
        )}
      </div>
      {hint && (
        <p className="text-xs -mt-1" style={{ color: COLORS.textFaint }}>
          {hint}
        </p>
      )}
      <div className="flex flex-col gap-2">{children}</div>
      {footer}
    </div>
  );
}

// Column labels shown once above each Budget/Actual row group.
function ColumnLabels({ dueColumn = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-3">
      <div className="min-w-[9rem] flex-1" />
      {dueColumn && (
        <span className="w-16 flex-shrink-0 text-[10px] uppercase tracking-wide text-center" style={{ color: COLORS.textFaint }}>
          Due
        </span>
      )}
      <span className={`${dueColumn ? "w-24" : "w-28"} flex-shrink-0 text-[10px] uppercase tracking-wide text-center`} style={{ color: COLORS.textFaint }}>
        Budget
      </span>
      <span className={`${dueColumn ? "w-24" : "w-28"} flex-shrink-0 text-[10px] uppercase tracking-wide text-center`} style={{ color: COLORS.textFaint }}>
        Actual
      </span>
      <span className="w-[26px] flex-shrink-0" />
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs font-mono-fin"
      style={{ background: "#0E141C", border: `1px solid ${COLORS.border}`, color: COLORS.text }}
    >
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color || p.payload.fill }} />
        {p.name}: {fmtCurrency(p.value)}
      </div>
    </div>
  );
}

// Renders the enlarged, "popped out" wedge + center readout for whichever
// slice is currently hovered/active in the spending split donut.
function renderActiveSplitShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" className="font-display" style={{ fill: COLORS.text, fontSize: 24 }}>
        {fmtCurrency(value)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ fill: COLORS.textFaint, fontSize: 12 }}>
        {payload.name} · {(percent * 100).toFixed(0)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 11} outerRadius={outerRadius + 15} fill={fill} opacity={0.5} />
    </g>
  );
}

function SpendingSplitChart({ bills, savings, expenses, size = 300, showLegend = true }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const data = [
    { name: "Bills", value: bills, fill: COLORS.slate },
    { name: "Savings", value: savings, fill: COLORS.gold },
    { name: "Expenses", value: expenses, fill: COLORS.teal },
  ].filter((d) => d.value > 0);

  const total = data.reduce((t, d) => t + d.value, 0);

  if (total === 0) {
    return (
      <div className="text-xs px-1 py-8 text-center" style={{ color: COLORS.textFaint }}>
        Add some bills, savings or expenses to see how your money splits up.
      </div>
    );
  }

  const safeActiveIndex = Math.min(activeIndex, data.length - 1);

  return (
    <div className={showLegend ? "flex flex-col md:flex-row items-center gap-5" : "flex justify-center"}>
      <div style={{ height: size, width: size, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={size * 0.26}
              outerRadius={size * 0.367}
              paddingAngle={3}
              activeIndex={safeActiveIndex}
              activeShape={renderActiveSplitShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} stroke={COLORS.bg} strokeWidth={2} className="cursor-pointer" />
              ))}
            </Pie>
            <RTooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {showLegend && (
        <div className="flex-1 w-full flex flex-col gap-2">
          {data.map((d, i) => (
            <button
              type="button"
              key={d.name}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
              style={{
                background: i === safeActiveIndex ? COLORS.surfaceRaised : "transparent",
                border: `1px solid ${i === safeActiveIndex ? d.fill : "transparent"}`,
              }}
            >
              <span className="flex items-center gap-2 text-sm" style={{ color: COLORS.text }}>
                <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                {d.name}
              </span>
              <span className="flex items-center gap-3 text-sm font-mono-fin flex-shrink-0" style={{ color: COLORS.textMuted }}>
                {fmtCurrency(d.value)}
                <span style={{ color: COLORS.textFaint, minWidth: "2.5rem", textAlign: "right" }}>
                  {((d.value / total) * 100).toFixed(0)}%
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Radial gauge: how much of your available money (start balance + budgeted
// income) is still left to budget. Clamped 0-100% for the arc fill; the
// dollar figure itself is never clamped, and turns ember if you're over.
function LeftToBudgetGauge({ value, total }) {
  const isOver = value < 0;
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  const data = [{ value: isOver ? 0 : pct, fill: isOver ? COLORS.ember : COLORS.gold }];

  return (
    <div className="flex flex-col items-center">
      <div style={{ height: 160, width: 160 }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270} barSize={14}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: COLORS.surfaceRaised }} isAnimationActive={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <span className="font-display text-xl text-center leading-tight" style={{ color: isOver ? COLORS.ember : COLORS.text }}>
            {fmtCurrency(value)}
          </span>
        </div>
      </div>
      {isOver && (
        <span className="text-xs mt-1" style={{ color: COLORS.ember }}>
          Over budget
        </span>
      )}
    </div>
  );
}

// Horizontal budget-vs-actual comparison across every category at once.
function BudgetVsActualBars({ rows }) {
  const hasData = rows.some((r) => r.budget > 0 || r.actual > 0);
  if (!hasData) {
    return (
      <div className="text-xs px-1 py-8 text-center" style={{ color: COLORS.textFaint }}>
        Add some numbers below to compare budget vs actual.
      </div>
    );
  }
  return (
    <div style={{ height: 190 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} horizontal={false} />
          <XAxis type="number" tick={{ fill: COLORS.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCurrency(v)} />
          <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={62} />
          <RTooltip content={<ChartTooltip />} />
          <Bar dataKey="budget" name="Budget" fill={COLORS.slate} fillOpacity={0.4} radius={[0, 3, 3, 0]} barSize={8} />
          <Bar dataKey="actual" name="Actual" radius={[0, 3, 3, 0]} barSize={8}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function BudgetDashboardTool() {
  const [state, setState, cloudStatus] = useSyncedState(STORAGE_KEY, DEFAULT_STATE);
  const [selectedTxIds, setSelectedTxIds] = useState(() => new Set());

  const update = (section) => (id, field, value) => {
    setState((prev) => ({
      ...prev,
      [section]: prev[section].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const removeItem = (section) => (id) => {
    setState((prev) => ({ ...prev, [section]: prev[section].filter((item) => item.id !== id) }));
  };

  const addItem = (section, factory) => () => {
    setState((prev) => ({ ...prev, [section]: [...prev[section], factory()] }));
  };

  const addTransaction = () => {
    const firstCategory = state.expenseCategories[0];
    setState((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        {
          id: uid(),
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          categoryId: firstCategory ? firstCategory.id : "",
          notes: "",
        },
      ],
    }));
  };

  const updateTransaction = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  };

  const removeTransaction = (id) => {
    setState((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }));
    setSelectedTxIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleTxSelected = (id, checked) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllTxSelected = (checked) => {
    setSelectedTxIds(checked ? new Set(state.transactions.map((t) => t.id)) : new Set());
  };

  const deleteSelectedTransactions = () => {
    setState((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => !selectedTxIds.has(t.id)) }));
    setSelectedTxIds(new Set());
  };

  // Merges reviewed bank-statement rows into the budget. Income/savings/debt
  // rows with a matching name are combined into the existing line item;
  // expense rows land in the Expense Tracker against a matching (or newly
  // created) category, exactly as if logged by hand.
  const applyImportedRows = (rows) => {
    setState((prev) => {
      let income = [...prev.income];
      let savings = [...prev.savings];
      let debts = [...prev.debts];
      let expenseCategories = [...prev.expenseCategories];
      const transactions = [...prev.transactions];

      const mergeInto = (list, name, amt) => {
        const idx = list.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
        if (idx >= 0) {
          const next = [...list];
          next[idx] = { ...next[idx], budget: next[idx].budget + amt, actual: next[idx].actual + amt };
          return next;
        }
        return [...list, { id: uid(), name, budget: amt, actual: amt }];
      };

      rows.forEach((r) => {
        const amt = Math.abs(Number(r.amount) || 0);
        const name = r.category || r.description || "Imported";
        if (r.bucket === "income") {
          income = mergeInto(income, name, amt);
        } else if (r.bucket === "savings") {
          savings = mergeInto(savings, name, amt);
        } else if (r.bucket === "debt") {
          debts = mergeInto(debts, name, amt).map((d) => (d.due === undefined ? { ...d, due: "" } : d));
        } else {
          let cat = expenseCategories.find((c) => c.name.toLowerCase() === name.toLowerCase());
          if (!cat) {
            cat = { id: uid(), name, budget: 0 };
            expenseCategories = [...expenseCategories, cat];
          }
          transactions.push({ id: uid(), date: r.date, amount: amt, categoryId: cat.id, notes: r.description });
        }
      });

      return { ...prev, income, savings, debts, expenseCategories, transactions };
    });
  };

  // -------------------------------------------------------------------
  // Derived totals
  // -------------------------------------------------------------------
  const incomeBudget = sum(state.income, "budget");
  const incomeActual = sum(state.income, "actual");
  const savingsBudget = sum(state.savings, "budget");
  const savingsActual = sum(state.savings, "actual");
  const billsBudget = sum(state.bills, "budget");
  const billsActual = sum(state.bills, "actual");
  const debtBudget = sum(state.debts, "budget");
  const debtActual = sum(state.debts, "actual");
  const expenseBudget = sum(state.expenseCategories, "budget");

  const spentByCategory = useMemo(() => {
    const map = new Map();
    state.transactions.forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + (Number(t.amount) || 0));
    });
    return map;
  }, [state.transactions]);

  const expenseActual = sum(state.transactions, "amount");

  const leftToSpendBudget = state.startBalance + incomeBudget - savingsBudget - billsBudget - expenseBudget - debtBudget;
  const leftToSpendActual = state.startBalance + incomeActual - savingsActual - billsActual - expenseActual - debtActual;

  const expenseChartData = state.expenseCategories.map((c) => ({
    name: c.name,
    budget: c.budget,
    actual: spentByCategory.get(c.id) || 0,
  }));

  const cashFlowRows = [
    { label: "Start balance", budget: state.startBalance, actual: state.startBalance, sign: "+" },
    { label: "Income", budget: incomeBudget, actual: incomeActual, sign: "+" },
    { label: "Savings", budget: savingsBudget, actual: savingsActual, sign: "−" },
    { label: "Bills", budget: billsBudget, actual: billsActual, sign: "−" },
    { label: "Expenses", budget: expenseBudget, actual: expenseActual, sign: "−" },
    { label: "Debt", budget: debtBudget, actual: debtActual, sign: "−" },
  ];

  const periodDays = Math.round((new Date(state.endDate) - new Date(state.startDate)) / 86400000);

  return (
    <div>
      <div className="max-w-8xl mx-auto px-5 md:px-8">
        {/* Header */}
        <header className="mb-5 flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: "rgba(212,169,79,0.12)", border: `1px solid ${COLORS.goldDim}` }}
          >
            <Wallet size={16} style={{ color: COLORS.gold }} />
          </div>
          <h1 className="font-display text-2xl md:text-3xl" style={{ color: COLORS.text }}>
            Budget Dashboard
          </h1>
          <div className="ml-auto">
            <SyncStatusBadge status={cloudStatus} />
          </div>
        </header>

        {/* Overview: period + start balance, compact single row */}
        <div
          className="rounded-2xl px-5 py-4 mb-5 flex flex-wrap items-end gap-x-8 gap-y-3"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <div>
            <FieldLabel>Period</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={state.startDate}
                onChange={(e) => setState((p) => ({ ...p, startDate: e.target.value }))}
                className="bg-transparent text-sm outline-none rounded-lg px-2.5 py-2"
                style={{ color: COLORS.text, border: `1px solid ${COLORS.border}`, background: COLORS.surfaceRaised, colorScheme: "dark" }}
              />
              <span style={{ color: COLORS.textFaint }}>–</span>
              <input
                type="date"
                value={state.endDate}
                onChange={(e) => setState((p) => ({ ...p, endDate: e.target.value }))}
                className="bg-transparent text-sm outline-none rounded-lg px-2.5 py-2"
                style={{ color: COLORS.text, border: `1px solid ${COLORS.border}`, background: COLORS.surfaceRaised, colorScheme: "dark" }}
              />
            </div>
          </div>
          {Number.isFinite(periodDays) && (
            <span
              className="text-xs rounded-full px-2.5 py-1 font-mono-fin mb-0.5"
              style={{ background: COLORS.surfaceRaised, color: periodDays < 0 ? COLORS.ember : COLORS.textMuted }}
            >
              {periodDays < 0 ? "End date is before start date" : `${periodDays} day${periodDays === 1 ? "" : "s"}`}
            </span>
          )}
          <div className="w-40">
            <FieldLabel hint="cash on hand today">Start balance</FieldLabel>
            <CurrencyInput value={state.startBalance} onChange={(v) => setState((p) => ({ ...p, startBalance: v }))} step={50} />
          </div>
        </div>

        {/* Widget row: at-a-glance visuals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="rounded-2xl p-5 flex flex-col items-center" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.goldDim}` }}>
            <div className="flex items-center gap-2 mb-3 self-start">
              <Gauge size={15} style={{ color: COLORS.goldDim }} />
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                Left to budget
              </h2>
            </div>
            <LeftToBudgetGauge value={leftToSpendBudget} total={state.startBalance + incomeBudget} />
          </div>

          <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.chrome}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Scale size={15} style={{ color: COLORS.chrome }} />
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                Budget vs actual
              </h2>
            </div>
            <BudgetVsActualBars
              rows={[
                { name: "Income", budget: incomeBudget, actual: incomeActual, color: COLORS.chrome },
                { name: "Savings", budget: savingsBudget, actual: savingsActual, color: COLORS.gold },
                { name: "Bills", budget: billsBudget, actual: billsActual, color: COLORS.slate },
                { name: "Expenses", budget: expenseBudget, actual: expenseActual, color: COLORS.teal },
                { name: "Debt", budget: debtBudget, actual: debtActual, color: COLORS.ember },
              ]}
            />
          </div>

          <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.teal}` }}>
            <div className="flex items-center gap-2 mb-3">
              <PieIcon size={15} style={{ color: COLORS.teal }} />
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                Breakdown
              </h2>
            </div>
            <SpendingSplitChart bills={billsActual} savings={savingsActual} expenses={expenseActual} size={170} showLegend={false} />
          </div>
        </div>

        {/* Bank statement import */}
        <div className="mb-6">
          <BankStatementImport
            onImport={applyImportedRows}
            expenseCategories={state.expenseCategories}
            savingsGoals={state.savings}
            debts={state.debts}
          />
        </div>

        {/* Cash flow, Income, Savings, Bills, Debt — one responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-5">
          <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.goldDim}` }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                style={{ background: `${COLORS.goldDim}22`, border: `1px solid ${COLORS.goldDim}55` }}
              >
                <Layers size={13} style={{ color: COLORS.goldDim }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                Cash flow
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono-fin" style={{ borderCollapse: "collapse", minWidth: 260 }}>
                <thead>
                  <tr>
                    <th className="text-xs font-medium uppercase tracking-wide py-2 text-left" style={{ color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>
                      &nbsp;
                    </th>
                    <th className="text-xs font-medium uppercase tracking-wide py-2 text-right" style={{ color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>
                      Budget
                    </th>
                    <th className="text-xs font-medium uppercase tracking-wide py-2 text-right" style={{ color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>
                      Actual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowRows.map((r) => (
                    <tr key={r.label} style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                      <td className="py-1.5" style={{ color: COLORS.textMuted }}>
                        {r.sign} {r.label}
                      </td>
                      <td className="py-1.5 text-right" style={{ color: COLORS.text }}>
                        {fmtCurrency(r.budget)}
                      </td>
                      <td className="py-1.5 text-right" style={{ color: COLORS.text }}>
                        {fmtCurrency(r.actual)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 font-semibold" style={{ color: COLORS.text }}>
                      = Left
                    </td>
                    <td className="py-2 text-right font-semibold" style={{ color: COLORS.gold }}>
                      {fmtCurrency(leftToSpendBudget)}
                    </td>
                    <td className="py-2 text-right font-semibold" style={{ color: leftToSpendActual < 0 ? COLORS.ember : COLORS.gold }}>
                      {fmtCurrency(leftToSpendActual)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <SectionCard icon={TrendingUp} title="Income" budgetTotal={incomeBudget} actualTotal={incomeActual} accent={COLORS.chrome}>
            {state.income.length === 0 ? (
              <div className="text-xs px-1" style={{ color: COLORS.textFaint }}>
                No income sources yet — add your salary or any other income to get started.
              </div>
            ) : (
              <ColumnLabels />
            )}
            {state.income.map((item) => (
              <BudgetActualRow key={item.id} item={item} onChange={(f, v) => update("income")(item.id, f, v)} onRemove={() => removeItem("income")(item.id)} />
            ))}
            <AddButton label="Add income source" onClick={addItem("income", () => ({ id: uid(), name: "New income", budget: 0, actual: 0 }))} />
          </SectionCard>

          <SectionCard icon={PiggyBank} title="Savings" budgetTotal={savingsBudget} actualTotal={savingsActual} accent={COLORS.gold}>
            {state.savings.length === 0 ? (
              <div className="text-xs px-1" style={{ color: COLORS.textFaint }}>
                No savings goals yet — add one, whether that's shares, a first home, or an emergency fund.
              </div>
            ) : (
              <ColumnLabels />
            )}
            {state.savings.map((item) => (
              <BudgetActualRow key={item.id} item={item} onChange={(f, v) => update("savings")(item.id, f, v)} onRemove={() => removeItem("savings")(item.id)} />
            ))}
            <AddButton label="Add savings goal" onClick={addItem("savings", () => ({ id: uid(), name: "New goal", budget: 0, actual: 0 }))} />
          </SectionCard>

          <SectionCard icon={Receipt} title="Bills" budgetTotal={billsBudget} actualTotal={billsActual} accent={COLORS.slate}>
            {state.bills.length === 0 ? (
              <div className="text-xs px-1" style={{ color: COLORS.textFaint }}>
                No bills added yet — rent, subscriptions, gym, whatever's recurring.
              </div>
            ) : (
              <ColumnLabels dueColumn />
            )}
            {state.bills.map((item) => (
              <BillRow key={item.id} item={item} onChange={(f, v) => update("bills")(item.id, f, v)} onRemove={() => removeItem("bills")(item.id)} />
            ))}
            <AddButton label="Add bill" onClick={addItem("bills", () => ({ id: uid(), name: "New bill", due: "", budget: 0, actual: 0 }))} />
          </SectionCard>

          <SectionCard icon={CreditCard} title="Debt" budgetTotal={debtBudget} actualTotal={debtActual} accent={COLORS.ember}>
            {state.debts.length === 0 ? (
              <div className="text-xs px-1" style={{ color: COLORS.textFaint }}>
                No debt added — nice. Add one if that changes.
              </div>
            ) : (
              <ColumnLabels dueColumn />
            )}
            {state.debts.map((item) => (
              <BillRow key={item.id} item={item} onChange={(f, v) => update("debts")(item.id, f, v)} onRemove={() => removeItem("debts")(item.id)} />
            ))}
            <AddButton label="Add debt" onClick={addItem("debts", () => ({ id: uid(), name: "New debt", due: "", budget: 0, actual: 0 }))} />
          </SectionCard>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.teal}` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                style={{ background: `${COLORS.teal}22`, border: `1px solid ${COLORS.teal}55` }}
              >
                <ListChecks size={13} style={{ color: COLORS.teal }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
                Expenses by category
              </h2>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono-fin" style={{ color: COLORS.textFaint }}>
                Budget {fmtCurrency(expenseBudget)}
              </div>
              <div className="text-xs font-mono-fin" style={{ color: COLORS.gold }}>
                Actual {fmtCurrency(expenseActual)}
              </div>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: COLORS.textFaint }}>
            Set a budget per category — "Actual" fills in automatically from the Expense Tracker below.
          </p>

          <div className="flex flex-col gap-2 mb-5">
            {state.expenseCategories.length === 0 && (
              <div className="text-xs px-1" style={{ color: COLORS.textFaint }}>
                No categories yet — add groceries, transport, subscriptions, whatever you actually spend on.
              </div>
            )}
            {state.expenseCategories.map((c) => (
              <RowShell key={c.id} onRemove={() => removeItem("expenseCategories")(c.id)}>
                <div className="min-w-[9rem] flex-1">
                  <NameInput value={c.name} onChange={(v) => update("expenseCategories")(c.id, "name", v)} />
                </div>
                <div className="w-28 flex-shrink-0">
                  <CurrencyInput value={c.budget} onChange={(v) => update("expenseCategories")(c.id, "budget", v)} step={10} />
                </div>
                <div className="w-28 flex-shrink-0 text-sm font-mono-fin text-right pr-1" style={{ color: (spentByCategory.get(c.id) || 0) > c.budget ? COLORS.ember : COLORS.textMuted }}>
                  {fmtCurrency(spentByCategory.get(c.id) || 0)}
                </div>
              </RowShell>
            ))}
            <AddButton
              label="Add category"
              onClick={addItem("expenseCategories", () => ({ id: uid(), name: "New category", budget: 0 }))}
            />
          </div>

          {expenseChartData.length > 0 && (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: COLORS.textFaint, fontSize: 10 }} axisLine={{ stroke: COLORS.border }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: COLORS.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCurrency(v)} width={64} />
                  <RTooltip content={<ChartTooltip />} />
                  <Bar dataKey="budget" name="Budget" fill={COLORS.slate} fillOpacity={0.5} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill={COLORS.gold} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense tracker */}
        <div className="rounded-2xl p-5 mb-10" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={15} style={{ color: COLORS.gold }} />
            <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
              Expense tracker
            </h2>
          </div>
          <p className="text-xs mb-3" style={{ color: COLORS.textFaint }}>
            Log every purchase here — it flows straight into "Actual" spend above.
          </p>

          {state.transactions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: COLORS.textMuted }}>
                <input
                  type="checkbox"
                  checked={selectedTxIds.size > 0 && selectedTxIds.size === state.transactions.length}
                  ref={(el) => {
                    if (el) el.indeterminate = selectedTxIds.size > 0 && selectedTxIds.size < state.transactions.length;
                  }}
                  onChange={(e) => toggleAllTxSelected(e.target.checked)}
                />
                {selectedTxIds.size > 0 ? `${selectedTxIds.size} selected` : "Select all"}
              </label>
              {selectedTxIds.size > 0 && (
                <button
                  type="button"
                  onClick={deleteSelectedTransactions}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium"
                  style={{ border: `1px solid ${COLORS.ember}`, color: COLORS.ember }}
                >
                  <Trash2 size={12} /> Delete {selectedTxIds.size} selected
                </button>
              )}
            </div>
          )}

          <div className="fin-table overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 660 }}>
              <thead>
                <tr>
                  {["select", "Date", "Amount", "Category", "Notes", "actions"].map((h, i) => (
                    <th
                      key={h}
                      className="text-xs font-medium uppercase tracking-wide py-2 text-left"
                      style={{ color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}
                    >
                      {i === 0 || i === 5 ? "" : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-xs" style={{ color: COLORS.textFaint }}>
                      No transactions logged yet.
                    </td>
                  </tr>
                )}
                {state.transactions.map((t) => (
                  <tr key={t.id} className="fin-row" style={{ borderBottom: `1px solid ${COLORS.borderSoft}`, opacity: selectedTxIds.has(t.id) ? 0.7 : 1 }}>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.has(t.id)}
                        onChange={(e) => toggleTxSelected(t.id, e.target.checked)}
                        aria-label={`Select transaction ${t.notes || t.date}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="date"
                        value={t.date}
                        onChange={(e) => updateTransaction(t.id, "date", e.target.value)}
                        className="bg-transparent text-xs outline-none font-mono-fin"
                        style={{ color: COLORS.textMuted, colorScheme: "dark" }}
                      />
                    </td>
                    <td className="py-2 pr-2" style={{ width: 110 }}>
                      <CurrencyInput value={t.amount} onChange={(v) => updateTransaction(t.id, "amount", v)} step={5} />
                    </td>
                    <td className="py-2 pr-2" style={{ minWidth: 150 }}>
                      <select
                        value={t.categoryId}
                        onChange={(e) => updateTransaction(t.id, "categoryId", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none rounded-md py-1.5 px-1.5"
                        style={{ color: COLORS.text, border: `1px solid ${COLORS.border}` }}
                      >
                        {state.expenseCategories.map((c) => (
                          <option key={c.id} value={c.id} style={{ background: COLORS.surface }}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2" style={{ minWidth: 140 }}>
                      <input
                        type="text"
                        value={t.notes}
                        onChange={(e) => updateTransaction(t.id, "notes", e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-transparent text-xs outline-none"
                        style={{ color: COLORS.textMuted }}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeTransaction(t.id)}
                        className="rounded-md p-1"
                        style={{ color: COLORS.textFaint }}
                        aria-label="Remove transaction"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addTransaction}
            disabled={state.expenseCategories.length === 0}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-sm font-medium mt-4 transition-colors disabled:opacity-50"
            style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textMuted }}
          >
            <Plus size={14} /> Log a transaction
          </button>
          {state.expenseCategories.length === 0 && (
            <div className="text-xs mt-2" style={{ color: COLORS.textFaint }}>
              Add at least one expense category above before logging a transaction.
            </div>
          )}
        </div>

        {/* Assumptions */}
        <div className="rounded-2xl p-5 text-xs leading-relaxed mb-16" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: COLORS.textFaint }} />
            <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>
              How this works
            </h3>
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Your data is saved to this browser (local storage) by default. Log in and it also syncs to your
              account, so it follows you across devices.
            </li>
            <li>Income, Savings, Bills and Debt use manually entered Budget and Actual figures.</li>
            <li>Expense category "Actual" is calculated automatically from everything logged in the Expense Tracker.</li>
            <li>"Left to spend" = Start balance + Income − Savings − Bills − Expenses − Debt, shown for both Budget and Actual.</li>
            <li>This is a planning tool for general information only — not financial advice.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
