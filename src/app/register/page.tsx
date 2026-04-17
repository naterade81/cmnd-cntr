'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus } from 'lucide-react';

const AVATAR_COLORS = ['#AF00F1', '#00e5ff', '#4ade80', '#fbbf24', '#ff4444', '#D900FF', '#818cf8', '#f472b6'];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[1]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      return;
    }
    setValidToken(true);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, display_name: displayName, pin, avatar_color: avatarColor }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary p-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Invalid Invite</h1>
          <p className="text-text-muted font-body">This invite link is missing, expired, or already used.</p>
          <a href="/login" className="inline-block mt-4 text-brand-purple hover:text-brand-magenta text-sm font-body">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold tracking-wider">
            <span className="text-brand-purple">CMD</span>
            <span className="text-text-primary">CTRL</span>
          </h1>
          <p className="text-text-muted text-sm mt-2 font-body">Join the family</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-text-muted font-display uppercase tracking-wider mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted font-display uppercase tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Choose a username"
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted font-display uppercase tracking-wider mb-1.5">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4+ chars"
                className="w-full bg-surface-primary border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-display uppercase tracking-wider mb-1.5">Confirm</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Repeat PIN"
                className="w-full bg-surface-primary border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted font-display uppercase tracking-wider mb-1.5">Your Color</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${avatarColor === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-brand-red text-sm font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-purple hover:bg-brand-magenta disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors font-body"
          >
            <UserPlus size={16} />
            {loading ? 'Creating account...' : 'Join Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <p className="text-text-muted font-body">Loading...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
