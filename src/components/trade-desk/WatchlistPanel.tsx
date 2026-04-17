'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Save, Plus, X } from 'lucide-react';
import type { Watchlist } from '@/types/trade-desk';

interface Props {
  watchlist: Watchlist | null;
  onSave: (watchlist: Watchlist) => Promise<void>;
}

export default function WatchlistPanel({ watchlist, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stocks, setStocks] = useState<string[]>(watchlist?.stocks || []);
  const [crypto, setCrypto] = useState<string[]>(watchlist?.crypto || []);
  const [newStock, setNewStock] = useState('');
  const [newCrypto, setNewCrypto] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ stocks, crypto });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const addStock = () => {
    const s = newStock.trim().toUpperCase();
    if (s && !stocks.includes(s)) {
      setStocks([...stocks, s]);
      setNewStock('');
    }
  };

  const addCrypto = () => {
    const c = newCrypto.trim().toUpperCase();
    if (c && !crypto.includes(c)) {
      setCrypto([...crypto, c]);
      setNewCrypto('');
    }
  };

  const startEdit = () => {
    setStocks(watchlist?.stocks || []);
    setCrypto(watchlist?.crypto || []);
    setEditing(true);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
          Watchlists
        </h3>
        {open ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-surface-border/50 pt-4">
          {!watchlist ? (
            <p className="text-text-muted text-sm font-body">No watchlist data available</p>
          ) : editing ? (
            <div className="space-y-4">
              {/* Stocks */}
              <div>
                <h4 className="text-text-muted text-xs font-display uppercase tracking-wider mb-2">Stocks</h4>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {stocks.map((s) => (
                    <span key={s} className="flex items-center gap-1 text-xs font-mono bg-brand-cyan/10 text-brand-cyan px-2 py-1 rounded">
                      {s}
                      <button onClick={() => setStocks(stocks.filter((x) => x !== s))} className="hover:text-white">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStock()}
                    placeholder="AAPL"
                    className="bg-surface-primary border border-surface-border rounded-lg px-2 py-1 text-xs font-mono text-text-primary w-24 focus:outline-none focus:border-brand-purple"
                  />
                  <button onClick={addStock} className="p-1 rounded text-text-muted hover:text-brand-cyan">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Crypto */}
              <div>
                <h4 className="text-text-muted text-xs font-display uppercase tracking-wider mb-2">Crypto</h4>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {crypto.map((c) => (
                    <span key={c} className="flex items-center gap-1 text-xs font-mono bg-[#fbbf24]/10 text-[#fbbf24] px-2 py-1 rounded">
                      {c}
                      <button onClick={() => setCrypto(crypto.filter((x) => x !== c))} className="hover:text-white">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newCrypto}
                    onChange={(e) => setNewCrypto(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCrypto()}
                    placeholder="BTC/USD"
                    className="bg-surface-primary border border-surface-border rounded-lg px-2 py-1 text-xs font-mono text-text-primary w-24 focus:outline-none focus:border-brand-purple"
                  />
                  <button onClick={addCrypto} className="p-1 rounded text-text-muted hover:text-[#fbbf24]">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-brand-purple text-white hover:bg-brand-purple/80 disabled:opacity-50"
                >
                  <Save size={12} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-display text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-text-muted text-xs font-display uppercase tracking-wider mb-1.5">Stocks</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(watchlist.stocks || []).map((s) => (
                      <span key={s} className="text-xs font-mono bg-brand-cyan/10 text-brand-cyan px-2 py-1 rounded">
                        {s}
                      </span>
                    ))}
                    {(!watchlist.stocks || watchlist.stocks.length === 0) && (
                      <span className="text-text-muted text-xs font-body">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-text-muted text-xs font-display uppercase tracking-wider mb-1.5">Crypto</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(watchlist.crypto || []).map((c) => (
                      <span key={c} className="text-xs font-mono bg-[#fbbf24]/10 text-[#fbbf24] px-2 py-1 rounded">
                        {c}
                      </span>
                    ))}
                    {(!watchlist.crypto || watchlist.crypto.length === 0) && (
                      <span className="text-text-muted text-xs font-body">None</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg text-xs font-display text-text-muted hover:text-text-primary hover:bg-surface-border/50 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
