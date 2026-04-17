'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Position } from '@/types/trade-desk';

interface Props {
  positions: Position[];
  onClose: (symbol: string) => Promise<void>;
}

function formatDollars(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export default function PositionsTable({ positions, onClose }: Props) {
  const [closing, setClosing] = useState<string | null>(null);

  const handleClose = async (symbol: string) => {
    setClosing(symbol);
    try {
      await onClose(symbol);
    } finally {
      setClosing(null);
    }
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        Open Positions
      </h3>
      {positions.length === 0 ? (
        <p className="text-text-muted text-sm font-body">No open positions</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider font-display border-b border-surface-border">
                <th className="text-left pb-3">Symbol</th>
                <th className="text-right pb-3">Entry</th>
                <th className="text-right pb-3">Current</th>
                <th className="text-right pb-3">P&L %</th>
                <th className="text-right pb-3">Value</th>
                <th className="text-right pb-3"></th>
              </tr>
            </thead>
            <tbody className="font-body">
              {positions.map((pos) => {
                const plPct = pos.unrealized_plpc * 100;
                const plColor = plPct >= 0 ? '#4ade80' : '#ff4444';
                return (
                  <tr key={pos.symbol} className="border-b border-surface-border/50 last:border-0">
                    <td className="py-3 font-display font-semibold text-text-primary">
                      {pos.symbol}
                    </td>
                    <td className="py-3 text-right font-mono text-text-muted">
                      {formatDollars(pos.avg_entry_price)}
                    </td>
                    <td className="py-3 text-right font-mono text-text-primary">
                      {formatDollars(pos.current_price)}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold" style={{ color: plColor }}>
                      {plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%
                    </td>
                    <td className="py-3 text-right font-mono text-text-primary">
                      {formatDollars(pos.market_value)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleClose(pos.symbol)}
                        disabled={closing === pos.symbol}
                        className="p-1.5 rounded-lg text-text-muted hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors disabled:opacity-50"
                        title={`Close ${pos.symbol}`}
                      >
                        <X size={14} />
                      </button>
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
