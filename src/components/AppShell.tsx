'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import ClickUpAutoSync from './ClickUpAutoSync';
import { AuthProvider } from '@/lib/AuthContext';

const AUTH_PAGES = ['/login', '/register'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-60">
          <Header />
          <div className="p-4 pt-16 md:pt-4 md:p-6">{children}</div>
        </main>
        <ClickUpAutoSync />
      </div>
    </AuthProvider>
  );
}
