export type TransactionType = 'income' | 'expense';

export interface DashboardTransaction {
  id?: string;
  name: string;
  category: string;
  amount: number;
  transactionType: TransactionType;
  date: string;
}

export interface DashboardBudget {
  id?: string;
  label: string;
  category: string;
  limit: number;
  startDate: string;
  endDate: string;
}

export interface DashboardTransactionView {
  id?: string;
  name: string;
  category: string;
  amount: number;
  transactionType: TransactionType;
  dateLabel: string;
}

export interface DashboardBudgetView {
  label: string;
  used: number;
  limit: number;
  percentUsed: number;
}

export interface DashboardSnapshot {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  budgetSummary: DashboardBudgetView[];
  recentTransactions: DashboardTransactionView[];
}

export function formatCurrency(value: number, minimumFractionDigits = 2, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

function getMonthBounds(referenceDate: Date) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

function isDateWithinRange(dateValue: string, start: Date, end: Date) {
  const current = new Date(`${dateValue}T12:00:00.000Z`);
  return current >= start && current <= end;
}

function sumTransactionAmount(transactions: DashboardTransaction[], transactionType: TransactionType, referenceDate?: Date) {
  const monthBounds = referenceDate ? getMonthBounds(referenceDate) : null;

  return transactions.reduce((total, transaction) => {
    const isMatchingType = transaction.transactionType === transactionType;
    const isMatchingMonth = monthBounds ? isDateWithinRange(transaction.date, monthBounds.start, monthBounds.end) : true;

    if (!isMatchingType || !isMatchingMonth) {
      return total;
    }

    return total + transaction.amount;
  }, 0);
}

export function calculateCurrentBalance(transactions: DashboardTransaction[], openingBalance = 0) {
  const incomeTotal = sumTransactionAmount(transactions, 'income');
  const expenseTotal = sumTransactionAmount(transactions, 'expense');

  return openingBalance + incomeTotal - expenseTotal;
}

export function calculateMonthlyIncome(transactions: DashboardTransaction[], referenceDate: Date) {
  return sumTransactionAmount(transactions, 'income', referenceDate);
}

export function calculateMonthlyExpenses(transactions: DashboardTransaction[], referenceDate: Date) {
  return sumTransactionAmount(transactions, 'expense', referenceDate);
}

export function calculateBudgetUsed(budget: DashboardBudget, transactions: DashboardTransaction[]) {
  return transactions.reduce((total, transaction) => {
    const isExpense = transaction.transactionType === 'expense';
    const matchesCategory = transaction.category === budget.category;
    const transactionDate = new Date(`${transaction.date}T12:00:00.000Z`);
    const budgetStart = new Date(`${budget.startDate}T12:00:00.000Z`);
    const budgetEnd = new Date(`${budget.endDate}T12:00:00.000Z`);
    const inBudgetRange = transactionDate >= budgetStart && transactionDate <= budgetEnd;

    if (!isExpense || !matchesCategory || !inBudgetRange) {
      return total;
    }

    return total + transaction.amount;
  }, 0);
}

function getRelativeDayLabel(dateValue: string, referenceDate: Date) {
  const currentDate = new Date(`${dateValue}T12:00:00.000Z`);
  const reference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const differenceInDays = Math.round((reference.getTime() - current.getTime()) / millisecondsPerDay);

  if (differenceInDays <= 0) {
    return 'Today';
  }

  if (differenceInDays === 1) {
    return 'Yesterday';
  }

  return `${differenceInDays} days ago`;
}

export function buildDashboardSnapshot({
  transactions,
  budgets,
  openingBalance = 0,
  referenceDate = new Date(),
}: {
  transactions: DashboardTransaction[];
  budgets: DashboardBudget[];
  openingBalance?: number;
  referenceDate?: Date;
}): DashboardSnapshot {
  const recentTransactions = [...transactions]
    .sort((left, right) => new Date(`${right.date}T12:00:00.000Z`).getTime() - new Date(`${left.date}T12:00:00.000Z`).getTime())
    .slice(0, 3)
    .map((transaction) => ({
      id: transaction.id,
      name: transaction.name,
      category: transaction.category,
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      dateLabel: getRelativeDayLabel(transaction.date, referenceDate),
    }));

  return {
    currentBalance: calculateCurrentBalance(transactions, openingBalance),
    monthlyIncome: calculateMonthlyIncome(transactions, referenceDate),
    monthlyExpenses: calculateMonthlyExpenses(transactions, referenceDate),
    budgetSummary: budgets.map((budget) => {
      const used = calculateBudgetUsed(budget, transactions);
      const percentUsed = budget.limit > 0 ? Math.min((used / budget.limit) * 100, 100) : 0;

      return {
        label: budget.label,
        used,
        limit: budget.limit,
        percentUsed,
      };
    }),
    recentTransactions,
  };
}
