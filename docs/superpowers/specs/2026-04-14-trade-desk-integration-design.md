# Trade Desk Dashboard Integration — Design Spec

## Overview

Add a Trade Desk page to the CMDCTRL personal dashboard that displays real-time portfolio data, AI analysis activity, and provides full control over the autonomous trading bot. Requires two changes:

1. **alpaca-trader**: Add a FastAPI server alongside the existing APScheduler worker to expose a REST API
2. **personal-dashboard**: Add a `/trade-desk` route with portfolio stats, positions, AI activity feed, and bot controls

Additionally, deploy the CMDCTRL dashboard to Railway at `dashboard.triptych.co`.

## Architecture

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  CMDCTRL Dashboard          │         │  Trading Bot                 │
│  (personal-dashboard)       │         │  (alpaca-trader)             │
│  Railway + dashboard.       │  HTTP   │  Railway worker              │
│  triptych.co                │────────▶│                              │
│                             │  X-API  │  ┌──────────┐ ┌──────────┐  │
│  Next.js 15 / React 19     │  -Key   │  │ FastAPI   │ │APScheduler│  │
│  SQLite / Tailwind          │         │  │ (port     │ │(existing) │  │
│  Recharts                   │         │  │  8000)    │ │           │  │
│                             │         │  └─────┬────┘ └─────┬─────┘  │
└─────────────────────────────┘         │        │            │        │
                                        │        ▼            ▼        │
                                        │  ┌─────────────────────┐     │
                                        │  │ Shared components:  │     │
                                        │  │ tracker, risk mgr,  │     │
                                        │  │ executor, brain,    │     │
                                        │  │ activity log        │     │
                                        │  └──────────┬──────────┘     │
                                        │             │                │
                                        │             ▼                │
                                        │     Alpaca API + Claude API  │
                                        └──────────────────────────────┘
```

## Part 1: Trading Bot API (alpaca-trader)

### Dependencies

Add to `requirements.txt`:
- `fastapi>=0.115.0`
- `uvicorn>=0.34.0`

### New Files

- `src/api.py` — all FastAPI endpoints
- `src/activity_log.py` — in-memory ring buffer for Claude's analysis results

### Startup Change (src/main.py)

Start uvicorn in a background thread before starting the scheduler:

```python
import threading
import uvicorn

def start_api(app, port=8000):
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

# In main():
api_thread = threading.Thread(target=start_api, args=(app,), daemon=True)
api_thread.start()
scheduler.start()  # blocks as before
```

### Activity Log (src/activity_log.py)

An in-memory list capped at 50 entries. Each entry stores:
- `timestamp` — when the analysis ran
- `asset_type` — "stock" or "crypto"
- `decisions` — Claude's full JSON response
- `trades_executed` — which decisions were actually executed vs rejected
- `portfolio_state` — snapshot of portfolio at time of analysis

The stock and crypto analyzers append to this log after each cycle. The log resets on restart (acceptable — trade history is in Alpaca, this is just for the activity feed).

### API Endpoints

**Authentication:** All endpoints require header `X-API-Key` matching env var `TRADE_DESK_API_KEY`. Returns 401 if missing/wrong.

#### Read Endpoints

**GET /api/portfolio**
Returns current portfolio state from Alpaca:
```json
{
  "equity": 2583.41,
  "cash": 1842.11,
  "daily_pnl": 12.50,
  "daily_pnl_pct": 0.0049,
  "positions": [
    {
      "symbol": "NVDA",
      "qty": 2.0,
      "avg_entry_price": 132.50,
      "current_price": 138.20,
      "unrealized_pl": 11.40,
      "pnl_pct": 0.043,
      "market_value": 276.40,
      "asset_class": "us_equity"
    }
  ],
  "open_position_count": 1,
  "stock_exposure_pct": 0.107,
  "crypto_exposure_pct": 0.0,
  "cash_pct": 0.713
}
```

**GET /api/portfolio/history**
Returns daily portfolio equity snapshots from Alpaca (for the equity chart):
```json
{
  "history": [
    {"timestamp": "2026-04-01", "equity": 2500.00},
    {"timestamp": "2026-04-02", "equity": 2512.30},
    {"timestamp": "2026-04-14", "equity": 2583.41}
  ]
}
```
Uses Alpaca's portfolio history endpoint. Returns up to 30 days.

**GET /api/trades**
Returns recent order history from Alpaca (last 50 orders):
```json
{
  "trades": [
    {
      "id": "order-123",
      "symbol": "NVDA",
      "side": "buy",
      "qty": "2",
      "filled_avg_price": "132.50",
      "status": "filled",
      "submitted_at": "2026-04-14T14:00:00Z",
      "filled_at": "2026-04-14T14:00:01Z"
    }
  ]
}
```

**GET /api/activity**
Returns the in-memory activity log (last 50 Claude analysis cycles):
```json
{
  "entries": [
    {
      "timestamp": "2026-04-14T14:00:00Z",
      "asset_type": "stock",
      "decisions": [...],
      "market_outlook": "Bullish tech rotation",
      "trades_executed": ["BUY NVDA $250"],
      "trades_rejected": ["BUY AAPL — max positions reached"]
    }
  ]
}
```

**GET /api/status**
Returns bot operational state:
```json
{
  "running": true,
  "paused": false,
  "circuit_breaker": null,
  "last_stock_analysis": "2026-04-14T14:00:00Z",
  "last_crypto_analysis": "2026-04-14T12:00:00Z",
  "next_stock_analysis": "2026-04-15T14:00:00Z",
  "next_crypto_analysis": "2026-04-14T18:00:00Z",
  "uptime_seconds": 86400
}
```

**GET /api/watchlist**
Returns current watchlists from config:
```json
{
  "stocks": ["AAPL", "NVDA", ...],
  "crypto": ["BTC/USD", "ETH/USD", ...]
}
```

**GET /api/settings**
Returns current risk parameters:
```json
{
  "max_stock_position_pct": 0.12,
  "max_crypto_position_pct": 0.08,
  "max_open_positions": 5,
  "stock_stop_loss_pct": 0.07,
  "crypto_stop_loss_pct": 0.10,
  "min_cash_reserve_pct": 0.20,
  "max_stock_allocation_pct": 0.60,
  "max_crypto_allocation_pct": 0.40
}
```

#### Control Endpoints

**POST /api/control/pause**
Sets a `paused` flag that analyzers check before running. Portfolio monitor (stop-losses) continues.

**POST /api/control/resume**
Clears the `paused` flag.

**POST /api/control/analyze**
Body: `{"asset_type": "stock"}` or `{"asset_type": "crypto"}`
Triggers an immediate analysis cycle in a background thread. Returns 202 Accepted.

**POST /api/control/close/{symbol}**
Closes the position for the given symbol immediately. Returns the order result.

**PUT /api/watchlist**
Body: `{"stocks": [...], "crypto": [...]}`
Updates the in-memory watchlists. Persists until restart.

**PUT /api/settings**
Body: `{"max_stock_position_pct": 0.15, ...}` (partial update)
Updates risk parameters in-memory. Persists until restart.

### Dockerfile Change

Expose port 8000:
```dockerfile
EXPOSE 8000
```

Railway auto-detects the exposed port.

## Part 2: CMDCTRL Trade Desk Page (personal-dashboard)

### New Files

```
src/app/trade-desk/page.tsx              # Server component — fetches initial data
src/components/trade-desk/
  TradeDesk.tsx                           # Main client component — layout, polling
  PortfolioStats.tsx                      # 4 stat cards (equity, P&L, cash, status)
  EquityChart.tsx                         # Recharts line chart
  PositionsTable.tsx                      # Positions with close button per row
  TradesTable.tsx                         # Recent trade history
  AIActivityFeed.tsx                      # Claude's analysis log with reasoning
  BotControls.tsx                         # Pause/resume/analyze buttons
  RiskSettings.tsx                        # Editable risk parameters (collapsible)
  WatchlistPanel.tsx                      # Editable watchlists (collapsible)
src/lib/trade-desk.ts                    # API client — all fetch calls to trading bot
```

### Modified Files

- `src/components/Sidebar.tsx` — add "Trade Desk" nav item with icon (TrendingUp from Lucide)
- `src/types/index.ts` — add Trade Desk type definitions

### API Client (src/lib/trade-desk.ts)

Server-side functions that call the trading bot API. Reads `TRADE_DESK_API_URL` and `TRADE_DESK_API_KEY` from environment.

```typescript
export async function getPortfolio(): Promise<Portfolio> { ... }
export async function getTrades(): Promise<Trade[]> { ... }
export async function getActivity(): Promise<ActivityEntry[]> { ... }
export async function getBotStatus(): Promise<BotStatus> { ... }
export async function getWatchlist(): Promise<Watchlist> { ... }
export async function getRiskSettings(): Promise<RiskSettings> { ... }
export async function pauseBot(): Promise<void> { ... }
export async function resumeBot(): Promise<void> { ... }
export async function runAnalysis(assetType: 'stock' | 'crypto'): Promise<void> { ... }
export async function closePosition(symbol: string): Promise<void> { ... }
export async function updateWatchlist(watchlist: Watchlist): Promise<void> { ... }
export async function updateRiskSettings(settings: Partial<RiskSettings>): Promise<void> { ... }
```

### Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Equity]    [Today P&L]    [Cash]    [Bot Status]       │  ← StatCards
├────────────────────────────┬─────────────────────────────┤
│                            │                             │
│  EQUITY CHART              │  CONTROLS                   │
│  (Recharts line)           │  [Run Stock] [Run Crypto]   │
│                            │  [Pause Bot]                │
│                            │                             │
│  POSITIONS TABLE           │  AI ACTIVITY FEED           │
│  Symbol | Price | P&L | ✕  │  ┌─────────────────────┐   │
│  NVDA     $138   +4.3%  ✕  │  │ BUY NVDA            │   │
│  BTC/USD  $62k   -1.9%  ✕  │  │ "Breaking above     │   │
│                            │  │  50d MA on volume"   │   │
│  RECENT TRADES             │  │ 2h ago               │   │
│  BUY NVDA   $250  10:02am │  ├─────────────────────┤   │
│  SELL AMD   $280  9:45am  │  │ HOLD — No action     │   │
│                            │  │ "Overbought, wait"   │   │
│                            │  │ 8h ago               │   │
│                            │  └─────────────────────┘   │
│                            │                             │
│                            │  RISK SETTINGS ▼            │
│                            │  WATCHLIST ▼                │
├────────────────────────────┴─────────────────────────────┤
│  50/50 split, left = portfolio, right = AI + controls    │
└──────────────────────────────────────────────────────────┘
```

### Data Fetching Pattern

- `page.tsx` (server component) fetches initial data from trading bot API
- Passes all data as props to `TradeDesk.tsx` (client component)
- Client component polls `/api/trade-desk/refresh` every 60 seconds for updates
- Control actions call Next.js API routes which proxy to the trading bot

### Next.js API Proxy Routes

To keep the trading bot API key server-side, CMDCTRL proxies control actions through its own API routes:

```
src/app/api/trade-desk/
  portfolio/route.ts        # GET — proxy to bot /api/portfolio
  trades/route.ts           # GET — proxy to bot /api/trades
  activity/route.ts         # GET — proxy to bot /api/activity
  status/route.ts           # GET — proxy to bot /api/status
  control/route.ts          # POST — proxy pause/resume/analyze/close
  watchlist/route.ts        # GET/PUT — proxy watchlist read/update
  settings/route.ts         # GET/PUT — proxy risk settings read/update
```

All routes require CMDCTRL authentication (existing `requireAuth()` guard).

### Visual Style

Follows existing CMDCTRL patterns exactly:
- Dark theme: `surface-bg`, `surface-card`, `surface-border`
- StatCard component reuse
- Recharts with dark theme overrides (already in globals.css)
- Green (#4ade80) for profit, Red (#ff4444) for loss
- Purple (#AF00F1) for primary actions
- Cyan (#00e5ff) for AI-related elements
- Font: Chakra Petch headings, Exo 2 body, IBM Plex Mono for prices/numbers

## Part 3: Railway Deployment for CMDCTRL

### Setup
1. Create new Railway project from `personal-dashboard` GitHub repo
2. Railway auto-detects Next.js and builds
3. Add a Railway volume mounted at `/data` for SQLite persistence
4. Add custom domain `dashboard.triptych.co`
5. Add CNAME record: `dashboard.triptych.co` → Railway-provided target

### Environment Variables
```
TRADE_DESK_API_URL=<trading bot Railway URL>
TRADE_DESK_API_KEY=<shared secret — generate a random string>
CLICKUP_TOKEN=<optional, for ClickUp sync in prod>
NODE_ENV=production
```

### Trading Bot Environment Variable Addition
Add to the existing alpaca-trader Railway service:
```
TRADE_DESK_API_KEY=<same shared secret as above>
```

## Estimated Work

- **Trading bot API**: ~8-10 files (api.py, activity_log.py, main.py changes, tests)
- **CMDCTRL Trade Desk page**: ~12-14 files (page, 8 components, API client, proxy routes, types, sidebar update)
- **Railway deployment**: Configuration only, no code changes

## Cost Impact

- No additional Railway services (API added to existing bot)
- CMDCTRL on Railway: ~$5/mo
- **New total: ~$12-15/mo** (bot $5 + CMDCTRL $5 + Claude Haiku ~$2-5)
