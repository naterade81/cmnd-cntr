import { NextRequest, NextResponse } from 'next/server';
import { getBudgetSummary } from '@/lib/budget';
import {
  syncBudgetCategories,
  syncTransactions,
  syncDebts,
  syncSavingsGoals,
} from '@/lib/db';
import {
  loadBudgetPlan,
  loadDailyLogTransactions,
  loadDebtItems,
  loadSavingsGoals,
} from '@/lib/budget';
import type { TransactionRow } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);

    const [budgetPlan, dailyTxns, debts, savingsGoals] = await Promise.all([
      loadBudgetPlan(),
      loadDailyLogTransactions(),
      loadDebtItems(),
      loadSavingsGoals(),
    ]);

    syncBudgetCategories(userId, budgetPlan);
    const dailyRows: TransactionRow[] = dailyTxns.map((t) => ({ ...t, source: 'daily_log' as const }));
    syncTransactions(userId, dailyRows);
    syncDebts(userId, debts);
    syncSavingsGoals(userId, savingsGoals);

    const summary = await getBudgetSummary();
    return NextResponse.json(summary);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
