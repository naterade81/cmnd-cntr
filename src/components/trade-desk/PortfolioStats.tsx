'use client';

import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import type { Portfolio, BotStatus } from '@/types/trade-desk';

interface Props {
  portfolio: Portfolio | null;
  status: BotStatus | null;
}

function formatDollars(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(2)}%`;
}

export default function PortfolioStats({ portfolio, status }: Props) {
  const equity = portfolio?.equity ?? 0;
  const dailyPl = portfolio?.daily_pl ?? 0;
  const dailyPlPct = portfolio?.daily_pl_percent ?? 0;
  const cash = portfolio?.cash ?? 0;
  const totalPl = portfolio?.total_pl ?? 0;
  const totalPlPct = portfolio?.total_pl_percent ?? 0;

  const equityColor = totalPl >= 0 ? '#4ade80' : '#ff4444';
  const plColor = dailyPl >= 0 ? '#4ade80' : '#ff4444';

  const statusText = status?.status ?? 'unknown';
  const statusColor = statusText === 'running' ? '#4ade80'
    : statusText === 'paused' ? '#fbbf24'
    : '#ff4444';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        label="EQUITY"
        value={formatDollars(equity)}
        icon={totalPl >= 0 ? TrendingUp : TrendingDown}
        color={equityColor}
        subtitle={`${formatPercent(totalPlPct)} all-time`}
      />
      <StatCard
        label="TODAY'S P&L"
        value={formatDollars(dailyPl)}
        icon={dailyPl >= 0 ? TrendingUp : TrendingDown}
        color={plColor}
        subtitle={formatPercent(dailyPlPct)}
      />
      <StatCard
        label="CASH"
        value={formatDollars(cash)}
        icon={DollarSign}
        color="#00e5ff"
      />
      <StatCard
        label="BOT STATUS"
        value={statusText.toUpperCase()}
        icon={Activity}
        color={statusColor}
        subtitle={status?.uptime ? `Uptime: ${status.uptime}` : undefined}
      />
    </div>
  );
}
