import { FormEvent, useCallback, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { dangerButtonClassName, inputClassName, labelClassName, primaryButtonClassName, secondaryButtonClassName } from '../components/ui/formStyles';
import { PageError, PageHeader, PageLoading } from '../components/ui/PageStatus';
import { calculateBudgetUsed, formatCurrency } from '../lib/financeDashboard';
import { createBudget, deleteBudget, fetchBudgets, fetchTransactions, updateBudget } from '../lib/financeApi';
import type { BudgetInput, BudgetRecord } from '../lib/financeTypes';
import { formatDisplayDate, getMonthDateRange } from '../lib/dateUtils';
import { useCategories } from '../hooks/useCategories';
import { useRealtimeResource } from '../hooks/useRealtimeResource';

const { start: defaultStart, end: defaultEnd } = getMonthDateRange();

const emptyForm = {
  category_id: '',
  period: 'monthly' as 'weekly' | 'monthly',
  amount: '',
  start_date: defaultStart,
  end_date: defaultEnd,
};

interface BudgetsData {
  budgets: BudgetRecord[];
  transactions: Awaited<ReturnType<typeof fetchTransactions>>;
}

export function BudgetsPage() {
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const loadBudgets = useCallback(async (): Promise<BudgetsData> => {
    const [budgets, transactions] = await Promise.all([fetchBudgets(), fetchTransactions()]);
    return { budgets, transactions };
  }, []);

  const { data, isLoading, error, reload } = useRealtimeResource('budgets,transactions', loadBudgets, {
    budgets: [],
    transactions: [],
  });

  const expenseCategories = useMemo(() => categories.filter((category) => category.type === 'expense'), [categories]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const budgetViews = useMemo(() => {
    const ledger = data.transactions.map((transaction) => ({
      name: transaction.description ?? transaction.category_name,
      category: transaction.category_name,
      amount: transaction.amount,
      transactionType: transaction.transaction_type,
      date: transaction.transaction_date,
    }));

    return data.budgets.map((budget) => {
      const used = calculateBudgetUsed(
        {
          label: budget.category_name,
          category: budget.category_name,
          limit: budget.amount,
          startDate: budget.start_date,
          endDate: budget.end_date,
        },
        ledger,
      );
      const percentUsed = budget.amount > 0 ? Math.min((used / budget.amount) * 100, 100) : 0;

      return { budget, used, percentUsed };
    });
  }, [data.budgets, data.transactions]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(budget: BudgetRecord) {
    setEditingId(budget.id);
    setForm({
      category_id: budget.category_id,
      period: budget.period,
      amount: String(budget.amount),
      start_date: budget.start_date,
      end_date: budget.end_date,
    });
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const amount = Number(form.amount);

    if (!form.category_id) {
      setFormError('Choose a category.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a valid budget amount.');
      return;
    }

    if (form.end_date < form.start_date) {
      setFormError('End date must be on or after the start date.');
      return;
    }

    const payload: BudgetInput = {
      category_id: form.category_id,
      period: form.period,
      amount,
      start_date: form.start_date,
      end_date: form.end_date,
    };

    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateBudget(editingId, payload);
      } else {
        await createBudget(payload);
      }

      resetForm();
      await reload();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this budget?')) {
      return;
    }

    try {
      await deleteBudget(id);

      if (editingId === id) {
        resetForm();
      }

      await reload();
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Failed to delete budget.');
    }
  }

  if (isLoading || categoriesLoading) {
    return <PageLoading message="Loading budgets..." />;
  }

  if (error || categoriesError) {
    return <PageError message={error ?? categoriesError ?? 'Failed to load budgets.'} />;
  }

  return (
    <AppShell>
      <section className="space-y-8">
        <PageHeader
          title="Budgets"
          description="Set category limits and track how much you have spent in each period."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
          <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit budget' : 'Add budget'}</h2>

            <label className={labelClassName}>
              <span>Category</span>
              <select
                className={inputClassName}
                value={form.category_id}
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                required
              >
                <option value="">Select category</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              <span>Period</span>
              <select
                className={inputClassName}
                value={form.period}
                onChange={(event) =>
                  setForm((current) => ({ ...current, period: event.target.value as 'weekly' | 'monthly' }))
                }
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>

            <label className={labelClassName}>
              <span>Limit</span>
              <input
                className={inputClassName}
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
              />
            </label>

            <label className={labelClassName}>
              <span>Start date</span>
              <input
                className={inputClassName}
                type="date"
                value={form.start_date}
                onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                required
              />
            </label>

            <label className={labelClassName}>
              <span>End date</span>
              <input
                className={inputClassName}
                type="date"
                value={form.end_date}
                onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
                required
              />
            </label>

            {formError ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button className={primaryButtonClassName} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add budget'}
              </button>
              {editingId ? (
                <button className={secondaryButtonClassName} type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            {budgetViews.length === 0 ? (
              <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                No budgets yet. Create a limit for a category to start tracking spending.
              </p>
            ) : (
              budgetViews.map(({ budget, used, percentUsed }) => (
                <article key={budget.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{budget.category_name}</p>
                      <p className="text-sm text-slate-500">
                        {budget.period} · {formatDisplayDate(budget.start_date)} – {formatDisplayDate(budget.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className={secondaryButtonClassName} onClick={() => startEdit(budget)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className={dangerButtonClassName} onClick={() => void handleDelete(budget.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      {formatCurrency(used, 0, 0)} / {formatCurrency(budget.amount, 0, 0)}
                    </span>
                    <span>{percentUsed.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-accent to-emerald-500" style={{ width: `${percentUsed}%` }} />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
