// Universal In-App React Query (TanStack Query) Inspector Adapter
// Supports live query & mutation inspection, actions (refetch, invalidate, reset, remove, simulate),
// cache management, and offline simulation.

import {useEffect, useState, useRef, useCallback} from 'react';

// In-memory registered QueryClient instance
let registeredQueryClient: any = null;

// Change listeners for QueryClient registration
const registrationListeners = new Set<() => void>();

export const connectQueryClient = (client: any) => {
  if (client) {
    registeredQueryClient = client;
    registrationListeners.forEach(cb => {
      try {
        cb();
      } catch {}
    });
  }
};

/**
 * Resolve the active TanStack QueryClient
 */
export const getResolvedQueryClient = (): any => {
  if (registeredQueryClient) return registeredQueryClient;

  try {
    const globalClient =
      (globalThis as any)?.__REACT_QUERY_CLIENT__ ||
      (global as any)?.__REACT_QUERY_CLIENT__;
    if (globalClient && typeof globalClient.getQueryCache === 'function') {
      return globalClient;
    }
  } catch {}

  return null;
};

/**
 * Access onlineManager safely from @tanstack/react-query
 */
export const getOnlineManager = (): any => {
  try {
    const tq = require('@tanstack/react-query');
    return tq?.onlineManager || null;
  } catch {
    return null;
  }
};

export type QueryStatusType =
  | 'fetching'
  | 'fresh'
  | 'stale'
  | 'inactive'
  | 'paused'
  | 'error';

/**
 * Converts a query object into a human-friendly status string
 */
export const getQueryStatus = (query: any): QueryStatusType => {
  if (!query) return 'inactive';
  if (typeof query.isDisabled === 'function' && query.isDisabled()) {
    return 'inactive';
  }
  if (query.state?.fetchStatus === 'fetching') {
    return 'fetching';
  }
  if (query.state?.status === 'error') {
    return 'error';
  }
  if (typeof query.getObserversCount === 'function' && !query.getObserversCount()) {
    return 'inactive';
  }
  if (query.state?.fetchStatus === 'paused') {
    return 'paused';
  }
  if (typeof query.isStale === 'function' && query.isStale()) {
    return 'stale';
  }
  return 'fresh';
};

export const getStatusRank = (q: any): number => {
  const status = getQueryStatus(q);
  switch (status) {
    case 'fetching':
      return 0;
    case 'fresh':
      return 1;
    case 'stale':
      return 2;
    case 'inactive':
      return 3;
    case 'paused':
      return 4;
    case 'error':
      return 0;
    default:
      return 5;
  }
};

export const formatQueryKey = (queryKey: any): string => {
  if (queryKey === undefined || queryKey === null) return '[]';
  try {
    return JSON.stringify(queryKey);
  } catch {
    return String(queryKey);
  }
};

export const formatRelativeTime = (timestamp: number): string => {
  if (!timestamp || timestamp <= 0) return 'never';
  const diff = Date.now() - timestamp;
  if (diff < 0) return 'just now';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Hook to track all queries from the QueryClient in real-time
 */
export function useAllQueries(clientProp?: any) {
  const [client, setClient] = useState<any>(() => clientProp || getResolvedQueryClient());
  const [queries, setQueries] = useState<any[]>([]);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (clientProp) {
      setClient(clientProp);
    } else {
      const onRegister = () => setClient(getResolvedQueryClient());
      registrationListeners.add(onRegister);
      return () => {
        registrationListeners.delete(onRegister);
      };
    }
  }, [clientProp]);

  const updateQueries = useCallback(() => {
    if (!client || typeof client.getQueryCache !== 'function') {
      setQueries([]);
      return;
    }
    const all = client.getQueryCache().getAll() || [];
    const sorted = [...all].sort((a: any, b: any) => {
      const rankA = getStatusRank(a);
      const rankB = getStatusRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (b.state?.dataUpdatedAt || 0) - (a.state?.dataUpdatedAt || 0);
    });
    setQueries(sorted);
  }, [client]);

  useEffect(() => {
    updateQueries();
    if (!client || typeof client.getQueryCache !== 'function') return;

    const unsubscribe = client.getQueryCache().subscribe((event: any) => {
      if (
        event?.type === 'added' ||
        event?.type === 'removed' ||
        event?.type === 'updated'
      ) {
        if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
        updateTimerRef.current = setTimeout(updateQueries, 16);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, [client, updateQueries]);

  return {client, queries, refresh: updateQueries};
}

/**
 * Hook to track all mutations from the QueryClient in real-time
 */
export function useAllMutations(clientProp?: any) {
  const [client, setClient] = useState<any>(() => clientProp || getResolvedQueryClient());
  const [mutations, setMutations] = useState<any[]>([]);
  const snapshotRef = useRef<string | null>(null);

  useEffect(() => {
    if (clientProp) {
      setClient(clientProp);
    } else {
      const onRegister = () => setClient(getResolvedQueryClient());
      registrationListeners.add(onRegister);
      return () => {
        registrationListeners.delete(onRegister);
      };
    }
  }, [clientProp]);

  const updateMutations = useCallback(() => {
    if (!client || typeof client.getMutationCache !== 'function') {
      setMutations([]);
      return;
    }
    const all = client.getMutationCache().getAll() || [];
    const snapshot = JSON.stringify(all.map((m: any) => m.state));
    if (snapshotRef.current !== snapshot) {
      snapshotRef.current = snapshot;
      setMutations([...all].reverse());
    }
  }, [client]);

  useEffect(() => {
    updateMutations();
    if (!client || typeof client.getMutationCache !== 'function') return;

    const unsubscribe = client.getMutationCache().subscribe(() => {
      setTimeout(updateMutations, 16);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [client, updateMutations]);

  return {client, mutations, refresh: updateMutations};
}

// ── Query & Cache Operations ──────────────────────────────────────────────────

export const refetchQuery = async (query: any) => {
  if (query && typeof query.fetch === 'function') {
    try {
      await query.fetch();
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

export const invalidateQuery = (client: any, query: any) => {
  if (client && typeof client.invalidateQueries === 'function' && query) {
    client.invalidateQueries(query);
    return true;
  }
  return false;
};

export const resetQuery = (client: any, query: any) => {
  if (client && typeof client.resetQueries === 'function' && query) {
    client.resetQueries({
      queryKey: query.queryKey,
      exact: true,
    });
    return true;
  }
  return false;
};

export const removeQuery = (client: any, query: any) => {
  if (client && typeof client.removeQueries === 'function' && query) {
    client.removeQueries(query);
    return true;
  }
  return false;
};

export const triggerQueryLoading = (query: any) => {
  if (!query) return;
  if (query.state?.data === undefined) {
    // Restore loading
    const previousState = query.state;
    const previousOptions = (query.state?.fetchMeta as any)?.__previousQueryOptions;
    query.cancel({silent: true});
    query.setState({
      ...previousState,
      fetchStatus: 'idle',
      fetchMeta: null,
    });
    if (previousOptions) {
      query.fetch(previousOptions);
    }
  } else {
    // Trigger simulated perpetual loading
    const previousOptions = query.options;
    query.fetch({
      ...previousOptions,
      queryFn: () => new Promise(() => {}),
      meta: {
        __previousQueryOptions: previousOptions,
      },
    });
  }
};

export const triggerQueryError = (client: any, query: any) => {
  if (!query) return;
  if (query.state?.status === 'error') {
    // Restore error
    resetQuery(client, query);
    refetchQuery(query);
  } else {
    // Simulate error
    const previousOptions = query.options;
    query.fetch({
      ...previousOptions,
      queryFn: () => Promise.reject(new Error('Simulated Debugger Error')),
      retry: false,
    });
  }
};

export const clearQueryCache = (client: any) => {
  if (client && typeof client.clear === 'function') {
    client.clear();
    return true;
  }
  return false;
};

export const invalidateAllQueries = (client: any) => {
  if (client && typeof client.invalidateQueries === 'function') {
    client.invalidateQueries();
    return true;
  }
  return false;
};

export const refetchAllActiveQueries = (client: any) => {
  if (client && typeof client.refetchQueries === 'function') {
    client.refetchQueries({type: 'active'});
    return true;
  }
  return false;
};

