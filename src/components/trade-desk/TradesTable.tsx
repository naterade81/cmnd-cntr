'use client';

import type { Trade } from '@/types/trade-desk';

interface Props {
  trades: Trade[];
}

function formatDollars(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TradesTable({ trades }: Props) {
  const recent = trades.slice(0, 15);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        Recent Trades
      </h3>
      {recent.length === 0 ? (
        <p className="text-text-muted text-sm font-body">No recent trades</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider font-display border-b border-surface-border">
                <th className="text-left pb-3">Time</th>
                <th className="text-left pb-3">Action</th>
                <th className="text-left pb-3">Symbol</th>
                <th className="text-right pb-3">Qty</th>
                <th className="text-right pb-3">Price</th>
                <th className="text-right pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="font-body">
              {recent.map((trade) => {
                const isBuy = trade.side?.toLowerCase() === 'buy';
                const actionColor = isBuy ? '#4ade80' : '#ff4444';
                return (
                  <tr key={trade.id} className="border-b border-surface-border/50 last:border-0">
                    <td className="py-2.5 text-text-muted text-xs font-mono">
                      {formatTime(trade.submitted_at || trade.filled_at || '')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="text-xs font-display font-bold uppercase px-2 py-0.5 rounded"
                        style={{ color: actionColor, backgroundColor: `${actionColor}15` }}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="py-2.5 font-display font-semibold text-text-primary">
                      {trade.symbol}
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-muted">
                      {trade.qty}
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-primary">
                      {trade.filled_avg_price ? formatDollars(trade.filled_avg_price) : '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-mono ${
                        trade.status === 'filled' ? 'text-[#4ade80]'
                        : trade.status === 'canceled' ? 'text-text-muted'
                        : 'text-[#fbbf24]'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
