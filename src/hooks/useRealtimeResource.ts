import { useCallback, useEffect, useState } from 'react';
import { subscribeTableChanges, unsubscribeTableChanges } from '../lib/financeApi';

export function useRealtimeResource<T>(tableKey: string, loader: () => Promise<T>, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await loader());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    let isMounted = true;
    const tables = tableKey.split(',').map((table) => table.trim()).filter(Boolean);

    async function initialize() {
      setIsLoading(true);
      await load();
    }

    void initialize();

    const channel = subscribeTableChanges(tables, () => {
      if (isMounted) {
        void load();
      }
    });

    return () => {
      isMounted = false;
      unsubscribeTableChanges(channel);
    };
  }, [tableKey, load]);

  return { data, isLoading, error, reload: load };
}
