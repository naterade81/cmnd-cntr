'use client';

import { useState, useEffect, useCallback } from 'react';
import PortfolioStats from '@/components/trade-desk/PortfolioStats';
import EquityChart from '@/components/trade-desk/EquityChart';
import PositionsTable from '@/components/trade-desk/PositionsTable';
import TradesTable from '@/components/trade-desk/TradesTable';
import AIActivityFeed from '@/components/trade-desk/AIActivityFeed';
import BotControls from '@/components/trade-desk/BotControls';
import RiskSettings from '@/components/trade-desk/RiskSettings';
import WatchlistPanel from '@/components/trade-desk/WatchlistPanel';
import type { TradeDeskData, RiskSettings as RiskSettingsType, Watchlist } from '@/types/trade-desk';

interface Props {
  initialData: TradeDeskData;
}

async function proxyFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/trade-desk/${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function TradeDesk({ initialData }: Props) {
  const [data, setData] = useState<TradeDeskData>(initialData);

  const refresh = useCallback(async () => {
    try {
      const [portfolio, history, trades, activity, status, watchlist, settings] = await Promise.all([
        proxyFetch('portfolio').catch(() => null),
        proxyFetch('portfolio/history').then((d) => (Array.isArray(d) ? d : d?.history || [])).catch(() => []),
        proxyFetch('trades').then((d) => (Array.isArray(d) ? d : d?.trades || [])).catch(() => []),
        proxyFetch('activity').then((d) => (Array.isArray(d) ? d : d?.activity || [])).catch(() => []),
        proxyFetch('status').catch(() => null),
        proxyFetch('watchlist').catch(() => null),
        proxyFetch('settings').catch(() => null),
      ]);
      setData({ portfolio, history, trades, activity, status, watchlist, settings });
    } catch {
      // Keep existing data on error
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleAnalyze = async (assetType: string) => {
    await proxyFetch('control/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_type: assetType }),
    });
    // Wait a moment then refresh to get new activity
    setTimeout(refresh, 3000);
  };

  const handlePause = async () => {
    await proxyFetch('control/pause', { method: 'POST' });
    await refresh();
  };

  const handleResume = async () => {
    await proxyFetch('control/resume', { method: 'POST' });
    await refresh();
  };

  const handleClosePosition = async (symbol: string) => {
    await proxyFetch(`control/close/${symbol}`, { method: 'POST' });
    await refresh();
  };

  const handleSaveSettings = async (settings: RiskSettingsType) => {
    await proxyFetch('settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    await refresh();
  };

  const handleSaveWatchlist = async (watchlist: Watchlist) => {
    await proxyFetch('watchlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(watchlist),
    });
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">Trade Desk</h2>
        <p className="text-text-muted text-sm font-body mt-1">
          Portfolio monitoring &amp; AI trading bot controls
        </p>
      </div>

      {/* Stat Cards */}
      <PortfolioStats portfolio={data.portfolio} status={data.status} />

      {/* Main 50/50 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column: Chart, Positions, Trades */}
        <div className="space-y-4 md:space-y-6">
          <EquityChart data={data.history} />
          <PositionsTable
            positions={data.portfolio?.positions || []}
            onClose={handleClosePosition}
          />
          <TradesTable trades={data.trades} />
        </div>

        {/* Right Column: Controls, Activity, Settings, Watchlist */}
        <div className="space-y-4 md:space-y-6">
          <BotControls
            status={data.status}
            onAnalyze={handleAnalyze}
            onPause={handlePause}
            onResume={handleResume}
          />
          <AIActivityFeed activity={data.activity} />
          <RiskSettings settings={data.settings} onSave={handleSaveSettings} />
          <WatchlistPanel watchlist={data.watchlist} onSave={handleSaveWatchlist} />
        </div>
      </div>
    </div>
  );
}
