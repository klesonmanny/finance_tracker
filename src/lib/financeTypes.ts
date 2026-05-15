import type { TransactionType } from './financeDashboard';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  is_system: boolean;
}

export interface TransactionRecord {
  id: string;
  category_id: string | null;
  category_name: string;
  amount: number;
  transaction_type: TransactionType;
  transaction_date: string;
  description: string | null;
}

export interface BudgetRecord {
  id: string;
  category_id: string;
  category_name: string;
  period: 'weekly' | 'monthly';
  amount: number;
  start_date: string;
  end_date: string;
}

export interface SavingsGoalRecord {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
}

export interface TransactionInput {
  category_id: string;
  amount: number;
  transaction_type: TransactionType;
  transaction_date: string;
  description?: string;
}

export interface BudgetInput {
  category_id: string;
  period: 'weekly' | 'monthly';
  amount: number;
  start_date: string;
  end_date: string;
}

export interface SavingsGoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
}
