'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Target,
  CalendarDays,
  CalendarRange,
  Wallet,
  Link2,
  Settings,
  Briefcase,
  User,
  Menu,
  X,
  Users,
  Receipt,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/weekly', label: 'Weekly', icon: CalendarRange },
  { href: '/family', label: 'Family', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/efforts', label: 'Log Effort', icon: Clock },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/trade-desk', label: 'Trade Desk', icon: TrendingUp },
  { href: '/integrations', label: 'Integrations', icon: Link2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-card border border-surface-border text-text-primary md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop overlay (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-60 bg-surface-primary border-r border-surface-border flex flex-col z-50 transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Logo + close button */}
        <div className="px-5 py-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold tracking-wider">
              <span className="text-brand-purple">CMD</span>
              <span className="text-text-primary">CTRL</span>
            </h1>
            <p className="text-text-muted text-xs mt-1 font-body">Personal Dashboard</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-purple/15 text-brand-purple border border-brand-purple/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-card'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Category Filters */}
        <div className="px-3 py-4 border-t border-surface-border">
          <p className="text-text-muted text-xs uppercase tracking-wider px-3 mb-2 font-display">Quick Filters</p>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-brand-cyan hover:bg-surface-card w-full transition-colors">
            <Briefcase size={15} />
            Professional
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-brand-green hover:bg-surface-card w-full transition-colors">
            <User size={15} />
            Personal
          </button>
        </div>
      </aside>
    </>
  );
}
