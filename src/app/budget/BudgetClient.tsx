'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingDown, TrendingUp, Wallet, CreditCard, PiggyBank, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from 'lucide-react';
import type { BudgetSummary } from '@/lib/budget';

interface Props {
  summary: BudgetSummary;
}

const COLORS = ['#AF00F1', '#00e5ff', '#4ade80', '#fbbf24', '#f72585', '#a78bfa', '#ff4444', '#38bdf8', '#fb923c', '#84cc16'];

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtExact(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export default function BudgetClient({ summary }: Props) {
  const netCashFlow = summary.totalIncome - summary.totalExpenses;
  const spendingPct = summary.totalBudgetedExpenses > 0
    ? Math.round((summary.totalExpenses / summary.totalBudgetedExpenses) * 100)
    : 0;

  // Pie chart data — top spending categories
  const pieData = summary.categorySpending
    .filter((c) => c.actual > 0)
    .slice(0, 8)
    .map((c) => ({ name: c.category, value: Math.round(c.actual) }));

  // Bar chart — budget vs actual (top categories)
  const barData = summary.categorySpending
    .filter((c) => c.budgeted > 0 || c.actual > 50)
    .slice(0, 10)
    .map((c) => ({ name: c.category.length > 12 ? c.category.slice(0, 12) + '...' : c.category, Budgeted: c.budgeted, Actual: Math.round(c.actual) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="font-display text-xl md:text-2xl font-bold text-text-primary">Budget — {summary.month} {summary.year}</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-text-muted font-body">
            <FileSpreadsheet size={14} className={summary.hasSpreadsheet ? 'text-brand-green' : 'text-text-muted'} />
            <span>Google Sheet: {summary.hasSpreadsheet ? 'connected' : 'not found'}</span>
          </div>
          <span className="text-xs font-mono text-text-muted">{summary.transactionCount} txns</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider font-display">Income</p>
              <p className="text-2xl font-display font-bold text-brand-green mt-2">{fmt(summary.totalIncome)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-brand-green/15">
              <TrendingUp size={20} className="text-brand-green" />
            </div>
          </div>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider font-display">Spent</p>
              <p className="text-2xl font-display font-bold text-brand-red mt-2">{fmt(summary.totalExpenses)}</p>
              <p className="text-text-muted text-xs mt-1 font-body">{spendingPct}% of budget</p>
            </div>
            <div className="p-2.5 rounded-lg bg-brand-red/15">
              <TrendingDown size={20} className="text-brand-red" />
            </div>
          </div>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider font-display">Net Cash Flow</p>
              <p className={`text-2xl font-display font-bold mt-2 ${netCashFlow >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                {fmt(netCashFlow)}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${netCashFlow >= 0 ? 'bg-brand-green/15' : 'bg-brand-red/15'}`}>
              <Wallet size={20} className={netCashFlow >= 0 ? 'text-brand-green' : 'text-brand-red'} />
            </div>
          </div>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider font-display">Total Debt</p>
              <p className="text-2xl font-display font-bold text-brand-amber mt-2">{fmt(summary.totalDebt)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-brand-amber/15">
              <CreditCard size={20} className="text-brand-amber" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Budget vs Actual */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
            Budget vs Actual
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', fontFamily: 'Exo 2', fontSize: '12px' }}
                  formatter={(value: number) => fmtExact(value)}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Exo 2' }} iconType="circle" iconSize={8} />
                <Bar dataKey="Budgeted" fill="#30363d" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Actual" fill="#AF00F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Breakdown Pie */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
            Spending Breakdown
          </h3>
          <div className="h-72 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    stroke="#0d1117"
                    strokeWidth={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', fontFamily: 'Exo 2', fontSize: '12px' }}
                    formatter={(value: number) => fmtExact(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-body text-text-primary truncate flex-1">{item.name}</span>
                  <span className="text-xs font-mono text-text-muted">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
        {/* Category Detail */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
            Category Detail
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {summary.categorySpending
              .filter((c) => c.budgeted > 0 || c.actual > 0)
              .map((cat) => {
                const pct = cat.budgeted > 0 ? Math.round((cat.actual / cat.budgeted) * 100) : 0;
                const over = cat.budgeted > 0 && cat.actual > cat.budgeted;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-body text-text-primary">{cat.category}</span>
                      <span className={`text-xs font-mono ${over ? 'text-brand-red' : 'text-text-muted'}`}>
                        {fmtExact(cat.actual)} / {fmt(cat.budgeted)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-primary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-brand-red' : 'bg-brand-purple'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Debt Tracker */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
            Debt Payoff
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {summary.debts.map((debt) => (
              <div key={debt.name} className="p-3 bg-surface-primary rounded-lg border border-surface-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-body font-medium text-text-primary">{debt.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    debt.priority.includes('URGENT') ? 'bg-brand-red/15 text-brand-red' :
                    debt.priority.includes('CRITICAL') ? 'bg-brand-amber/15 text-brand-amber' :
                    'bg-surface-card text-text-muted'
                  }`}>
                    {debt.priority}
                  </span>
                </div>
                <p className="text-xs text-text-muted font-body">{debt.details}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-lg font-display font-bold text-brand-amber">{fmt(debt.balance)}</span>
                  <span className="text-xs text-text-muted font-mono">
                    {fmt(debt.monthlyPayment)}/mo{debt.extraPayment > 0 ? ` + ${fmt(debt.extraPayment)} extra` : ''}
                  </span>
                </div>
                {debt.projectedPayoff && (
                  <p className="text-xs text-text-muted font-body mt-1">Payoff: {debt.projectedPayoff}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
            Recent Transactions
          </h3>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {summary.recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-card-hover transition-colors">
                <div className={`p-1 rounded ${txn.type === 'credit' ? 'bg-brand-green/15' : 'bg-brand-red/15'}`}>
                  {txn.type === 'credit'
                    ? <ArrowUpRight size={14} className="text-brand-green" />
                    : <ArrowDownRight size={14} className="text-brand-red" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body text-text-primary truncate">{txn.description}</p>
                  <p className="text-[10px] text-text-muted font-mono">{txn.date} · {txn.budgetCategory}</p>
                </div>
                <span className={`text-xs font-mono font-medium ${txn.type === 'credit' ? 'text-brand-green' : 'text-text-primary'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{fmtExact(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      {summary.savingsGoals.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
            Savings Goals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.savingsGoals.map((goal) => {
              const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
              return (
                <div key={goal.name} className="p-4 bg-surface-primary rounded-lg border border-surface-border">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank size={16} className="text-brand-cyan" />
                    <span className="text-sm font-body font-medium text-text-primary">{goal.name}</span>
                  </div>
                  <p className="text-xs text-text-muted font-body mb-3">{goal.description}</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-display font-bold text-text-primary">{fmt(goal.current)}</span>
                    <span className="text-xs text-text-muted font-mono">/ {fmt(goal.target)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-card rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-brand-cyan transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-text-muted font-mono">{pct}%</span>
                    {goal.targetDate && <span className="text-[10px] text-text-muted font-mono">Target: {goal.targetDate}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
