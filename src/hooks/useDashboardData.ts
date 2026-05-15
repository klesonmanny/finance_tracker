import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildDashboardSnapshot } from '../lib/financeDashboard';
import { fetchFinanceRecords, subscribeFinanceUpdates, unsubscribeFinanceUpdates } from '../lib/financeData';

export function useDashboardData() {
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof fetchFinanceRecords>>['transactions']>([]);
  const [budgets, setBudgets] = useState<Awaited<ReturnType<typeof fetchFinanceRecords>>['budgets']>([]);
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof fetchFinanceRecords>>['goals']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      const records = await fetchFinanceRecords();
      setTransactions(records.transactions);
      setBudgets(records.budgets);
      setGoals(records.goals);
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load finance data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      setIsLoading(true);
      await loadRecords();
    }

    void initialize();

    const channel = subscribeFinanceUpdates(() => {
      if (isMounted) {
        void loadRecords();
      }
    });

    return () => {
      isMounted = false;
      unsubscribeFinanceUpdates(channel);
    };
  }, [loadRecords]);

  const snapshot = useMemo(
    () =>
      buildDashboardSnapshot({
        transactions,
        budgets,
      }),
    [transactions, budgets],
  );

  return {
    snapshot,
    goals,
    isLoading,
    error,
    reload: loadRecords,
  };
}
