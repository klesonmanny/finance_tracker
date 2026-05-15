import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { DashboardBudget, DashboardTransaction, TransactionType } from './financeDashboard';

type CategoryRelation = { name: string } | { name: string }[] | null;

interface TransactionRow {
  id: string;
  amount: number | string;
  transaction_type: TransactionType;
  transaction_date: string;
  description: string | null;
  category: CategoryRelation;
}

interface BudgetRow {
  id: string;
  amount: number | string;
  start_date: string;
  end_date: string;
  category: CategoryRelation;
}

function getCategoryName(category: CategoryRelation) {
  if (!category) {
    return 'Uncategorized';
  }

  if (Array.isArray(category)) {
    return category[0]?.name ?? 'Uncategorized';
  }

  return category.name;
}

function mapTransaction(row: TransactionRow): DashboardTransaction {
  const categoryName = getCategoryName(row.category);

  return {
    id: row.id,
    name: row.description?.trim() || categoryName,
    category: categoryName,
    amount: Number(row.amount),
    transactionType: row.transaction_type,
    date: row.transaction_date,
  };
}

function mapBudget(row: BudgetRow): DashboardBudget {
  const categoryName = getCategoryName(row.category);

  return {
    id: row.id,
    label: categoryName,
    category: categoryName,
    limit: Number(row.amount),
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

export async function fetchFinanceRecords() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }

  const [transactionsResult, budgetsResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, transaction_type, transaction_date, description, category:categories ( name )')
      .order('transaction_date', { ascending: false }),
    supabase
      .from('budgets')
      .select('id, amount, start_date, end_date, category:categories ( name )')
      .order('end_date', { ascending: false }),
  ]);

  if (transactionsResult.error) {
    throw transactionsResult.error;
  }

  if (budgetsResult.error) {
    throw budgetsResult.error;
  }

  return {
    transactions: (transactionsResult.data ?? []).map((row) => mapTransaction(row as TransactionRow)),
    budgets: (budgetsResult.data ?? []).map((row) => mapBudget(row as BudgetRow)),
  };
}

export function subscribeFinanceUpdates(onChange: () => void): RealtimeChannel | null {
  if (!supabase) {
    return null;
  }

  const channel = supabase
    .channel('finance-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, onChange)
    .subscribe();

  return channel;
}

export function unsubscribeFinanceUpdates(channel: RealtimeChannel | null) {
  if (!channel || !supabase) {
    return;
  }

  void supabase.removeChannel(channel);
}
