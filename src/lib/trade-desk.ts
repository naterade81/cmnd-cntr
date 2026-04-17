import type {
  Portfolio,
  PortfolioHistoryEntry,
  Trade,
  ActivityEntry,
  BotStatus,
  Watchlist,
  RiskSettings,
  TradeDeskData,
} from '@/types/trade-desk';

const API_URL = process.env.TRADE_DESK_API_URL || '';
const API_KEY = process.env.TRADE_DESK_API_KEY || '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (!API_URL || !API_KEY) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getPortfolio(): Promise<Portfolio | null> {
  return apiFetch<Portfolio>('/api/portfolio');
}

export async function getPortfolioHistory(): Promise<PortfolioHistoryEntry[]> {
  const data = await apiFetch<PortfolioHistoryEntry[] | { history: PortfolioHistoryEntry[] }>('/api/portfolio/history');
  if (!data) return [];
  return Array.isArray(data) ? data : data.history || [];
}

export async function getTrades(): Promise<Trade[]> {
  const data = await apiFetch<Trade[] | { trades: Trade[] }>('/api/trades');
  if (!data) return [];
  return Array.isArray(data) ? data : data.trades || [];
}

export async function getActivity(): Promise<ActivityEntry[]> {
  const data = await apiFetch<ActivityEntry[] | { activity: ActivityEntry[] }>('/api/activity');
  if (!data) return [];
  return Array.isArray(data) ? data : data.activity || [];
}

export async function getBotStatus(): Promise<BotStatus | null> {
  return apiFetch<BotStatus>('/api/status');
}

export async function getWatchlist(): Promise<Watchlist | null> {
  return apiFetch<Watchlist>('/api/watchlist');
}

export async function getRiskSettings(): Promise<RiskSettings | null> {
  return apiFetch<RiskSettings>('/api/settings');
}

export async function getAllTradeDeskData(): Promise<TradeDeskData> {
  const [portfolio, history, trades, activity, status, watchlist, settings] = await Promise.all([
    getPortfolio(),
    getPortfolioHistory(),
    getTrades(),
    getActivity(),
    getBotStatus(),
    getWatchlist(),
    getRiskSettings(),
  ]);

  return { portfolio, history, trades, activity, status, watchlist, settings };
}

// Proxy helper for client-side API route
export async function proxyRequest(path: string, method: string, body?: unknown): Promise<Response> {
  if (!API_URL || !API_KEY) {
    return new Response(JSON.stringify({ error: 'Trade Desk API not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to reach Trade Desk API' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
