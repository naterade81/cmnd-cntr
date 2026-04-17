'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold tracking-wider">
          <span className="text-brand-purple">CMD</span>
          <span className="text-text-primary">CTRL</span>
        </h1>
        <p className="text-text-muted text-sm mt-2 font-body">Family Dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-text-muted font-display uppercase tracking-wider mb-1.5">Username</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your username"
            className="w-full bg-surface-primary border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted font-display uppercase tracking-wider mb-1.5">PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter your PIN"
            className="w-full bg-surface-primary border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
            required
          />
        </div>

        {error && (
          <p className="text-brand-red text-sm font-body">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-purple hover:bg-brand-magenta disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors font-body"
        >
          <LogIn size={16} />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
