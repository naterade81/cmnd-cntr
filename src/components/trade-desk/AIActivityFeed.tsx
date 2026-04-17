'use client';

import type { ActivityEntry } from '@/types/trade-desk';

interface Props {
  activity: ActivityEntry[];
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

export default function AIActivityFeed({ activity }: Props) {
  const entries = activity.slice(0, 50);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        AI Activity
      </h3>
      {entries.length === 0 ? (
        <p className="text-text-muted text-sm font-body">No activity yet</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {entries.map((entry, i) => (
            <div
              key={entry.id || i}
              className="border border-surface-border/50 rounded-lg p-3 hover:border-surface-border-bright transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-text-muted">
                  {formatTime(entry.timestamp)}
                </span>
                <span
                  className={`text-xs font-display font-bold uppercase px-2 py-0.5 rounded ${
                    entry.asset_type === 'crypto'
                      ? 'text-[#fbbf24] bg-[#fbbf24]/10'
                      : 'text-brand-cyan bg-brand-cyan/10'
                  }`}
                >
                  {entry.asset_type}
                </span>
              </div>

              {entry.market_outlook && (
                <p className="text-text-muted text-xs font-body mb-2 italic">
                  {entry.market_outlook}
                </p>
              )}

              {entry.analysis_summary && (
                <p className="text-text-muted text-xs font-body mb-2">
                  {entry.analysis_summary}
                </p>
              )}

              {entry.decisions && entry.decisions.length > 0 && (
                <div className="space-y-1.5">
                  {entry.decisions.map((dec, j) => {
                    const actionColor = dec.action?.toLowerCase() === 'buy' ? '#4ade80'
                      : dec.action?.toLowerCase() === 'sell' ? '#ff4444'
                      : '#8b949e';
                    return (
                      <div key={j} className="flex items-start gap-2">
                        <span
                          className="text-[10px] font-display font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                          style={{ color: actionColor, backgroundColor: `${actionColor}15` }}
                        >
                          {dec.action}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-display font-semibold text-text-primary">
                            {dec.symbol}
                          </span>
                          {dec.reasoning && (
                            <p className="text-text-muted text-[11px] font-body leading-tight mt-0.5">
                              {dec.reasoning}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
