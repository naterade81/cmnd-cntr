'use client';

import { useState } from 'react';
import { Plus, Search, Bell, LogOut } from 'lucide-react';
import QuickAddModal from './QuickAddModal';
import { useAuth } from '@/lib/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const dateStrShort = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <header className="h-16 bg-surface-primary/80 backdrop-blur-md border-b border-surface-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
        <div className="pl-10 md:pl-0">
          <p className="text-text-muted text-sm font-body hidden md:block">{dateStr}</p>
          <p className="text-text-muted text-xs font-body md:hidden">{dateStrShort}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Search - icon on mobile, full input on desktop */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors md:hidden"
          >
            <Search size={18} />
          </button>
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-surface-card border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 w-64 font-body"
            />
          </div>

          <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors relative">
            <Bell size={18} />
          </button>

          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-2 px-3 py-2 md:px-4 bg-brand-purple hover:bg-brand-magenta text-white rounded-lg text-sm font-medium transition-colors font-body"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {/* User avatar & logout */}
          {user && (
            <div className="flex items-center gap-2 ml-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-display"
                style={{ backgroundColor: user.avatar_color }}
              >
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-text-primary text-sm font-body hidden lg:inline">{user.display_name}</span>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-text-muted hover:text-brand-red hover:bg-surface-card transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-surface-primary border-b border-surface-border md:hidden">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
            />
          </div>
        </div>
      )}

      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} />}
    </>
  );
}
