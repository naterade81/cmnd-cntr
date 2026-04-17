import { redirect } from 'next/navigation';
import { getAuthFromCookies } from '@/lib/auth';
import { getAllTradeDeskData } from '@/lib/trade-desk';
import TradeDesk from './TradeDesk';

export const dynamic = 'force-dynamic';

export default async function TradeDeskPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/login');

  try {
    const data = await getAllTradeDeskData();
    return <TradeDesk initialData={data} />;
  } catch {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            Trade Desk Unavailable
          </h2>
          <p className="text-text-muted font-body text-sm">
            Unable to connect to the trading bot API. Please check your configuration and try again.
          </p>
        </div>
      </div>
    );
  }
}
