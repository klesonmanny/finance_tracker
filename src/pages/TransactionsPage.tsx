import { FormEvent, useCallback, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { dangerButtonClassName, inputClassName, labelClassName, primaryButtonClassName, secondaryButtonClassName } from '../components/ui/formStyles';
import { PageError, PageHeader, PageLoading } from '../components/ui/PageStatus';
import { formatCurrency } from '../lib/financeDashboard';
import { createTransaction, deleteTransaction, fetchTransactions, updateTransaction } from '../lib/financeApi';
import type { TransactionInput, TransactionRecord } from '../lib/financeTypes';
import { formatDateInput, formatDisplayDate } from '../lib/dateUtils';
import type { TransactionType } from '../lib/financeDashboard';
import { useCategories } from '../hooks/useCategories';
import { useRealtimeResource } from '../hooks/useRealtimeResource';

const emptyForm = {
  transaction_type: 'expense' as TransactionType,
  category_id: '',
  amount: '',
  transaction_date: formatDateInput(new Date()),
  description: '',
};

export function TransactionsPage() {
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const loadTransactions = useCallback(() => fetchTransactions(), []);
  const { data: transactions, isLoading, error, reload } = useRealtimeResource('transactions', loadTransactions, [] as TransactionRecord[]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === form.transaction_type),
    [categories, form.transaction_type],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.transaction_type === filter);
  }, [transactions, filter]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(transaction: TransactionRecord) {
    setEditingId(transaction.id);
    setForm({
      transaction_type: transaction.transaction_type,
      category_id: transaction.category_id ?? '',
      amount: String(transaction.amount),
      transaction_date: transaction.transaction_date,
      description: transaction.description ?? '',
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
      setFormError('Enter a valid amount greater than zero.');
      return;
    }

    const payload: TransactionInput = {
      category_id: form.category_id,
      amount,
      transaction_type: form.transaction_type,
      transaction_date: form.transaction_date,
      description: form.description,
    };

    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }

      resetForm();
      await reload();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this transaction?')) {
      return;
    }

    try {
      await deleteTransaction(id);

      if (editingId === id) {
        resetForm();
      }

      await reload();
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Failed to delete transaction.');
    }
  }

  if (isLoading || categoriesLoading) {
    return <PageLoading message="Loading transactions..." />;
  }

  if (error || categoriesError) {
    return <PageError message={error ?? categoriesError ?? 'Failed to load transactions.'} />;
  }

  return (
    <AppShell>
      <section className="space-y-8">
        <PageHeader
          title="Transactions"
          description="Add, edit, and filter income and expense entries. Changes sync to your dashboard in real time."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
          <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit transaction' : 'Add transaction'}</h2>

            <label className={labelClassName}>
              <span>Type</span>
              <select
                className={inputClassName}
                value={form.transaction_type}
                onChange={(event) => {
                  const transaction_type = event.target.value as TransactionType;
                  setForm((current) => ({
                    ...current,
                    transaction_type,
                    category_id: categories.find((category) => category.id === current.category_id && category.type === transaction_type)
                      ? current.category_id
                      : '',
                  }));
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label className={labelClassName}>
              <span>Category</span>
              <select
                className={inputClassName}
                value={form.category_id}
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                required
              >
                <option value="">Select category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              <span>Amount</span>
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
              <span>Date</span>
              <input
                className={inputClassName}
                type="date"
                value={form.transaction_date}
                onChange={(event) => setForm((current) => ({ ...current, transaction_date: event.target.value }))}
                required
              />
            </label>

            <label className={labelClassName}>
              <span>Description</span>
              <input
                className={inputClassName}
                type="text"
                placeholder="Optional note"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            {formError ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button className={primaryButtonClassName} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add transaction'}
              </button>
              {editingId ? (
                <button className={secondaryButtonClassName} type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'income', 'expense'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={[
                    'rounded-2xl border px-4 py-2 text-sm font-medium capitalize transition',
                    filter === value
                      ? 'border-accent/40 bg-accent/15 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white',
                  ].join(' ')}
                  onClick={() => setFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  No transactions yet. Add your first entry using the form.
                </p>
              ) : (
                filteredTransactions.map((transaction) => (
                  <article
                    key={transaction.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description || transaction.category_name}</p>
                      <p className="text-sm text-slate-500">
                        {transaction.category_name} · {formatDisplayDate(transaction.transaction_date)} ·{' '}
                        <span className="capitalize">{transaction.transaction_type}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={transaction.transaction_type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}>
                        {transaction.transaction_type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <button type="button" className={secondaryButtonClassName} onClick={() => startEdit(transaction)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className={dangerButtonClassName} onClick={() => void handleDelete(transaction.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
