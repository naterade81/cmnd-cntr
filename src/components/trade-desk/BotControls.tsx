'use client';

import { useState } from 'react';
import { Play, Pause, BarChart3, Bitcoin } from 'lucide-react';
import type { BotStatus } from '@/types/trade-desk';

interface Props {
  status: BotStatus | null;
  onAnalyze: (assetType: string) => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
}

export default function BotControls({ status, onAnalyze, onPause, onResume }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const isRunning = status?.status === 'running';

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setLoadingAction(action);
    try {
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        Bot Controls
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleAction('stock', () => onAnalyze('stock'))}
          disabled={loadingAction !== null}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-display text-sm font-semibold
            bg-brand-purple text-white hover:bg-brand-purple/80 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BarChart3 size={16} />
          {loadingAction === 'stock' ? 'Analyzing...' : 'Run Stock Analysis'}
        </button>
        <button
          onClick={() => handleAction('crypto', () => onAnalyze('crypto'))}
          disabled={loadingAction !== null}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-display text-sm font-semibold
            bg-brand-purple text-white hover:bg-brand-purple/80 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Bitcoin size={16} />
          {loadingAction === 'crypto' ? 'Analyzing...' : 'Run Crypto Analysis'}
        </button>
        <button
          onClick={() => handleAction('toggle', isRunning ? onPause : onResume)}
          disabled={loadingAction !== null}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-display text-sm font-semibold
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRunning
                ? 'bg-surface-border text-text-primary hover:bg-surface-border/80'
                : 'bg-[#4ade80]/15 text-[#4ade80] hover:bg-[#4ade80]/25'
            }`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {loadingAction === 'toggle'
            ? (isRunning ? 'Pausing...' : 'Resuming...')
            : (isRunning ? 'Pause Bot' : 'Resume Bot')
          }
        </button>
      </div>
    </div>
  );
}
