import { getBudgetSummary } from '@/lib/budget';
import BudgetClient from './BudgetClient';

export const dynamic = 'force-dynamic';

export default async function BudgetPage() {
  const summary = await getBudgetSummary();
  return <BudgetClient summary={summary} />;
}
