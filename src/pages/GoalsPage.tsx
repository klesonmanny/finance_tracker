import { FormEvent, useCallback, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { dangerButtonClassName, inputClassName, labelClassName, primaryButtonClassName, secondaryButtonClassName } from '../components/ui/formStyles';
import { PageError, PageHeader, PageLoading } from '../components/ui/PageStatus';
import { formatCurrency } from '../lib/financeDashboard';
import { createSavingsGoal, deleteSavingsGoal, fetchSavingsGoals, updateSavingsGoal } from '../lib/financeApi';
import type { SavingsGoalInput, SavingsGoalRecord } from '../lib/financeTypes';
import { formatDisplayDate } from '../lib/dateUtils';
import { useRealtimeResource } from '../hooks/useRealtimeResource';

const emptyForm = {
  name: '',
  target_amount: '',
  current_amount: '',
  target_date: '',
};

export function GoalsPage() {
  const loadGoals = useCallback(() => fetchSavingsGoals(), []);
  const { data: goals, isLoading, error, reload } = useRealtimeResource('savings_goals', loadGoals, [] as SavingsGoalRecord[]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(goal: SavingsGoalRecord) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      target_date: goal.target_date ?? '',
    });
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const target_amount = Number(form.target_amount);
    const current_amount = Number(form.current_amount || 0);

    if (!form.name.trim()) {
      setFormError('Enter a goal name.');
      return;
    }

    if (!Number.isFinite(target_amount) || target_amount <= 0) {
      setFormError('Enter a valid target amount.');
      return;
    }

    if (!Number.isFinite(current_amount) || current_amount < 0) {
      setFormError('Current amount cannot be negative.');
      return;
    }

    const payload: SavingsGoalInput = {
      name: form.name,
      target_amount,
      current_amount,
      target_date: form.target_date || null,
    };

    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateSavingsGoal(editingId, payload);
      } else {
        await createSavingsGoal(payload);
      }

      resetForm();
      await reload();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save goal.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this savings goal?')) {
      return;
    }

    try {
      await deleteSavingsGoal(id);

      if (editingId === id) {
        resetForm();
      }

      await reload();
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Failed to delete goal.');
    }
  }

  async function handleQuickAdd(goal: SavingsGoalRecord, increment: number) {
    try {
      await updateSavingsGoal(goal.id, {
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount + increment,
        target_date: goal.target_date,
      });
      await reload();
    } catch (quickAddError) {
      setFormError(quickAddError instanceof Error ? quickAddError.message : 'Failed to update savings.');
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading savings goals..." />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <AppShell>
      <section className="space-y-8">
        <PageHeader title="Savings goals" description="Track progress toward your targets and update saved amounts anytime." />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
          <form className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit goal' : 'Add goal'}</h2>

            <label className={labelClassName}>
              <span>Goal name</span>
              <input
                className={inputClassName}
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label className={labelClassName}>
              <span>Target amount</span>
              <input
                className={inputClassName}
                type="number"
                min="0.01"
                step="0.01"
                value={form.target_amount}
                onChange={(event) => setForm((current) => ({ ...current, target_amount: event.target.value }))}
                required
              />
            </label>

            <label className={labelClassName}>
              <span>Current amount</span>
              <input
                className={inputClassName}
                type="number"
                min="0"
                step="0.01"
                value={form.current_amount}
                onChange={(event) => setForm((current) => ({ ...current, current_amount: event.target.value }))}
              />
            </label>

            <label className={labelClassName}>
              <span>Target date</span>
              <input
                className={inputClassName}
                type="date"
                value={form.target_date}
                onChange={(event) => setForm((current) => ({ ...current, target_date: event.target.value }))}
              />
            </label>

            {formError ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{formError}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button className={primaryButtonClassName} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add goal'}
              </button>
              {editingId ? (
                <button className={secondaryButtonClassName} type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="space-y-3">
            {goals.length === 0 ? (
              <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No savings goals yet. Create one to start tracking progress.
              </p>
            ) : (
              goals.map((goal) => {
                const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;

                return (
                  <article key={goal.id} className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{goal.name}</p>
                        <p className="text-sm text-slate-400">
                          {formatCurrency(goal.current_amount, 0, 0)} of {formatCurrency(goal.target_amount, 0, 0)}
                          {goal.target_date ? ` · due ${formatDisplayDate(goal.target_date)}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className={secondaryButtonClassName} onClick={() => void handleQuickAdd(goal, 50)}>
                          <Plus className="mr-1 inline h-4 w-4" />
                          $50
                        </button>
                        <button type="button" className={secondaryButtonClassName} onClick={() => startEdit(goal)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className={dangerButtonClassName} onClick={() => void handleDelete(goal.id)} aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-accent to-emerald-300" style={{ width: `${progress}%` }} />
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
