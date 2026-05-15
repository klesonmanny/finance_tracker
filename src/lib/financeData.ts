import type { RealtimeChannel } from '@supabase/supabase-js';
import { fetchBudgets, fetchSavingsGoals, fetchTransactions, subscribeTableChanges, unsubscribeTableChanges } from './financeApi';
import type { SavingsGoalRecord } from './financeTypes';
import { buildDashboardSnapshot, type DashboardBudget, type DashboardTransaction } from './financeDashboard';

function mapToDashboardTransaction(
  transaction: Awaited<ReturnType<typeof fetchTransactions>>[number],
): DashboardTransaction {
  return {
    id: transaction.id,
    name: transaction.description?.trim() || transaction.category_name,
    category: transaction.category_name,
    amount: transaction.amount,
    transactionType: transaction.transaction_type,
    date: transaction.transaction_date,
  };
}

function mapToDashboardBudget(budget: Awaited<ReturnType<typeof fetchBudgets>>[number]): DashboardBudget {
  return {
    id: budget.id,
    label: budget.category_name,
    category: budget.category_name,
    limit: budget.amount,
    startDate: budget.start_date,
    endDate: budget.end_date,
  };
}

export async function fetchFinanceRecords() {
  const [transactions, budgets, goals] = await Promise.all([fetchTransactions(), fetchBudgets(), fetchSavingsGoals()]);

  return {
    transactions: transactions.map(mapToDashboardTransaction),
    budgets: budgets.map(mapToDashboardBudget),
    goals,
  };
}

export type { SavingsGoalRecord };

export function subscribeFinanceUpdates(onChange: () => void): RealtimeChannel | null {
  return subscribeTableChanges(['transactions', 'budgets', 'savings_goals'], onChange);
}

export function unsubscribeFinanceUpdates(channel: RealtimeChannel | null) {
  unsubscribeTableChanges(channel);
}

export { buildDashboardSnapshot };
