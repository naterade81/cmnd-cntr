export interface Position {
  symbol: string;
  qty: number;
  side: string;
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  current_price: number;
  avg_entry_price: number;
  asset_type?: string;
}

export interface Portfolio {
  equity: number;
  cash: number;
  buying_power: number;
  portfolio_value: number;
  positions: Position[];
  daily_pl?: number;
  daily_pl_percent?: number;
  total_pl?: number;
  total_pl_percent?: number;
}

export interface PortfolioHistoryEntry {
  date: string;
  equity: number;
  profit_loss?: number;
  profit_loss_pct?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: string;
  qty: number;
  filled_avg_price?: number;
  status: string;
  submitted_at: string;
  filled_at?: string;
  type?: string;
  asset_type?: string;
}

export interface ActivityDecision {
  action: string;
  symbol: string;
  reasoning: string;
  confidence?: number;
}

export interface ActivityEntry {
  id?: string;
  timestamp: string;
  asset_type: string;
  decisions: ActivityDecision[];
  market_outlook?: string;
  analysis_summary?: string;
  symbols_analyzed?: string[];
}

export interface BotStatus {
  status: string;
  uptime?: string;
  last_analysis?: string;
  version?: string;
  paper_trading?: boolean;
}

export interface WatchlistItem {
  symbol: string;
}

export interface Watchlist {
  stocks: string[];
  crypto: string[];
}

export interface RiskSettings {
  max_position_size?: number;
  max_portfolio_risk?: number;
  stop_loss_percent?: number;
  take_profit_percent?: number;
  max_positions?: number;
  min_confidence?: number;
  [key: string]: number | string | boolean | undefined;
}

export interface TradeDeskData {
  portfolio: Portfolio | null;
  history: PortfolioHistoryEntry[];
  trades: Trade[];
  activity: ActivityEntry[];
  status: BotStatus | null;
  watchlist: Watchlist | null;
  settings: RiskSettings | null;
}
