'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioHistoryEntry } from '@/types/trade-desk';

interface Props {
  data: PortfolioHistoryEntry[];
}

export default function EquityChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        Portfolio Equity
      </h3>
      <div className="h-64">
        {formatted.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm font-body">
            No history data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  fontFamily: 'Exo 2',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#e6edf3' }}
                formatter={(value: number) => [
                  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                  'Equity',
                ]}
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#4ade80"
                strokeWidth={2}
                dot={false}
                activeDot={{ fill: '#4ade80', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
