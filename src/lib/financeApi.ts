import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type {
  BudgetInput,
  BudgetRecord,
  Category,
  SavingsGoalInput,
  SavingsGoalRecord,
  TransactionInput,
  TransactionRecord,
} from './financeTypes';
import type { TransactionType } from './financeDashboard';

type CategoryRelation = { id: string; name: string; type?: TransactionType } | { id: string; name: string; type?: TransactionType }[] | null;

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }

  return supabase;
}

async function requireUserId() {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('You must be signed in to manage finance data.');
  }

  return data.user.id;
}

function getRelation<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapCategory(row: { id: string; name: string; type: TransactionType; is_system: boolean }): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    is_system: row.is_system,
  };
}

function mapTransaction(row: {
  id: string;
  category_id: string | null;
  amount: number | string;
  transaction_type: TransactionType;
  transaction_date: string;
  description: string | null;
  category: CategoryRelation;
}): TransactionRecord {
  const category = getRelation(row.category);

  return {
    id: row.id,
    category_id: row.category_id,
    category_name: category?.name ?? 'Uncategorized',
    amount: Number(row.amount),
    transaction_type: row.transaction_type,
    transaction_date: row.transaction_date,
    description: row.description,
  };
}

function mapBudget(row: {
  id: string;
  category_id: string;
  period: 'weekly' | 'monthly';
  amount: number | string;
  start_date: string;
  end_date: string;
  category: CategoryRelation;
}): BudgetRecord {
  const category = getRelation(row.category);

  return {
    id: row.id,
    category_id: row.category_id,
    category_name: category?.name ?? 'Uncategorized',
    period: row.period,
    amount: Number(row.amount),
    start_date: row.start_date,
    end_date: row.end_date,
  };
}

function mapSavingsGoal(row: {
  id: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  target_date: string | null;
}): SavingsGoalRecord {
  return {
    id: row.id,
    name: row.name,
    target_amount: Number(row.target_amount),
    current_amount: Number(row.current_amount),
    target_date: row.target_date,
  };
}

export async function fetchCategories() {
  const client = requireClient();
  const { data, error } = await client.from('categories').select('id, name, type, is_system').order('name');

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapCategory);
}

export async function fetchTransactions() {
  const client = requireClient();
  const { data, error } = await client
    .from('transactions')
    .select('id, category_id, amount, transaction_type, transaction_date, description, category:categories ( id, name )')
    .order('transaction_date', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapTransaction(row as Parameters<typeof mapTransaction>[0]));
}

export async function createTransaction(input: TransactionInput) {
  const client = requireClient();
  const userId = await requireUserId();

  const { data, error } = await client
    .from('transactions')
    .insert({
      user_id: userId,
      category_id: input.category_id,
      amount: input.amount,
      transaction_type: input.transaction_type,
      transaction_date: input.transaction_date,
      description: input.description?.trim() || null,
    })
    .select('id, category_id, amount, transaction_type, transaction_date, description, category:categories ( id, name )')
    .single();

  if (error) {
    throw error;
  }

  return mapTransaction(data as Parameters<typeof mapTransaction>[0]);
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const client = requireClient();

  const { data, error } = await client
    .from('transactions')
    .update({
      category_id: input.category_id,
      amount: input.amount,
      transaction_type: input.transaction_type,
      transaction_date: input.transaction_date,
      description: input.description?.trim() || null,
    })
    .eq('id', id)
    .select('id, category_id, amount, transaction_type, transaction_date, description, category:categories ( id, name )')
    .single();

  if (error) {
    throw error;
  }

  return mapTransaction(data as Parameters<typeof mapTransaction>[0]);
}

export async function deleteTransaction(id: string) {
  const client = requireClient();
  const { error } = await client.from('transactions').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function fetchBudgets() {
  const client = requireClient();
  const { data, error } = await client
    .from('budgets')
    .select('id, category_id, period, amount, start_date, end_date, category:categories ( id, name )')
    .order('end_date', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapBudget(row as Parameters<typeof mapBudget>[0]));
}

export async function createBudget(input: BudgetInput) {
  const client = requireClient();
  const userId = await requireUserId();

  const { data, error } = await client
    .from('budgets')
    .insert({ user_id: userId, ...input })
    .select('id, category_id, period, amount, start_date, end_date, category:categories ( id, name )')
    .single();

  if (error) {
    throw error;
  }

  return mapBudget(data as Parameters<typeof mapBudget>[0]);
}

export async function updateBudget(id: string, input: BudgetInput) {
  const client = requireClient();

  const { data, error } = await client
    .from('budgets')
    .update(input)
    .eq('id', id)
    .select('id, category_id, period, amount, start_date, end_date, category:categories ( id, name )')
    .single();

  if (error) {
    throw error;
  }

  return mapBudget(data as Parameters<typeof mapBudget>[0]);
}

export async function deleteBudget(id: string) {
  const client = requireClient();
  const { error } = await client.from('budgets').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function fetchSavingsGoals() {
  const client = requireClient();
  const { data, error } = await client
    .from('savings_goals')
    .select('id, name, target_amount, current_amount, target_date')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSavingsGoal);
}

export async function createSavingsGoal(input: SavingsGoalInput) {
  const client = requireClient();
  const userId = await requireUserId();

  const { data, error } = await client
    .from('savings_goals')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      target_amount: input.target_amount,
      current_amount: input.current_amount ?? 0,
      target_date: input.target_date || null,
    })
    .select('id, name, target_amount, current_amount, target_date')
    .single();

  if (error) {
    throw error;
  }

  return mapSavingsGoal(data);
}

export async function updateSavingsGoal(id: string, input: SavingsGoalInput) {
  const client = requireClient();

  const { data, error } = await client
    .from('savings_goals')
    .update({
      name: input.name.trim(),
      target_amount: input.target_amount,
      current_amount: input.current_amount ?? 0,
      target_date: input.target_date || null,
    })
    .eq('id', id)
    .select('id, name, target_amount, current_amount, target_date')
    .single();

  if (error) {
    throw error;
  }

  return mapSavingsGoal(data);
}

export async function deleteSavingsGoal(id: string) {
  const client = requireClient();
  const { error } = await client.from('savings_goals').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export function subscribeTableChanges(tables: string[], onChange: () => void): RealtimeChannel | null {
  const client = requireClient();
  let channel = client.channel(`finance-${tables.join('-')}`);

  for (const table of tables) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
  }

  channel.subscribe();
  return channel;
}

export function unsubscribeTableChanges(channel: RealtimeChannel | null) {
  if (!channel || !supabase) {
    return;
  }

  void supabase.removeChannel(channel);
}
